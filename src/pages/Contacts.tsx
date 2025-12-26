import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Loader2, Users, User, Phone, Mail, Clock, RefreshCw, Filter,
  UserX, UserCheck, Search, MessageSquare, PhoneCall, Eye, Globe
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import ContactDetail from "@/components/ContactDetail";

interface Contact {
  id: string;
  name: string | null;
  phone_number: string;
  email: string | null;
  opted_out: boolean | null;
  opted_out_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  notes: string | null;
  tags: string[] | null;
  preferred_language: string | null;
}

// Language labels for display
const LANGUAGE_LABELS: Record<string, string> = {
  hebrew: "עברית",
  english: "EN",
  arabic: "العربية",
  russian: "RU",
  spanish: "ES",
  french: "FR",
  german: "DE",
  portuguese: "PT",
  italian: "IT",
  dutch: "NL",
  polish: "PL",
  turkish: "TR",
  chinese: "中文",
  japanese: "日本語",
  korean: "한국어",
  hindi: "हिन्दी",
  thai: "ไทย",
  vietnamese: "VI",
};

interface ContactStats {
  total: number;
  active: number;
  optedOut: number;
}

export default function Contacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<ContactStats>({ total: 0, active: 0, optedOut: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "opted_out">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isInitialLoad = useRef(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const fetchContacts = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // First get the business
      const { data: business, error: bizError } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_user_id", user.id)
        .maybeSingle();

      if (bizError) {
        console.error("Error fetching business:", bizError);
        return;
      }

      if (!business) {
        setIsLoading(false);
        return;
      }

      setBusinessId(business.id);

      // Fetch contacts
      let query = supabase
        .from("contacts")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });

      if (filter === "active") {
        query = query.or("opted_out.is.null,opted_out.eq.false");
      } else if (filter === "opted_out") {
        query = query.eq("opted_out", true);
      }

      const { data: contactsData, error: contactsError } = await query.limit(100);

      if (contactsError) {
        console.error("Error fetching contacts:", contactsError);
        return;
      }

      setContacts(contactsData || []);

      // Fetch stats
      const { data: allContacts } = await supabase
        .from("contacts")
        .select("opted_out")
        .eq("business_id", business.id);

      if (allContacts) {
        const optedOutCount = allContacts.filter(c => c.opted_out === true).length;
        setStats({
          total: allContacts.length,
          active: allContacts.length - optedOutCount,
          optedOut: optedOutCount,
        });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, filter]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Real-time subscription for contacts
  useEffect(() => {
    if (!businessId) return;

    const channel = supabase
      .channel('contacts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contacts',
          filter: `business_id=eq.${businessId}`
        },
        () => {
          if (!isInitialLoad.current) {
            toast.info("New contact", {
              description: "A new contact has been added",
              icon: <Users className="h-4 w-4 text-purple-400" />
            });
          }
          fetchContacts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contacts',
          filter: `business_id=eq.${businessId}`
        },
        () => {
          fetchContacts();
        }
      )
      .subscribe();

    setTimeout(() => {
      isInitialLoad.current = false;
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, fetchContacts]);

  const toggleOptOut = async (contactId: string, currentOptOut: boolean | null) => {
    try {
      const newOptOut = !currentOptOut;
      const { error } = await supabase
        .from("contacts")
        .update({ 
          opted_out: newOptOut,
          opted_out_at: newOptOut ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq("id", contactId);

      if (error) {
        console.error("Error updating contact:", error);
        toast.error("Failed to update opt-out status");
        return;
      }

      toast.success(newOptOut ? "Contact opted out" : "Contact opted back in");
      fetchContacts();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update contact");
    }
  };

  const openEditDialog = (contact: Contact) => {
    setEditingContact(contact);
    setEditName(contact.name || "");
    setEditEmail(contact.email || "");
  };

  const saveContactDetails = async () => {
    if (!editingContact) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("contacts")
        .update({ 
          name: editName || null,
          email: editEmail || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", editingContact.id);

      if (error) {
        console.error("Error updating contact:", error);
        toast.error("Failed to update contact");
        return;
      }

      toast.success("Contact updated");
      setEditingContact(null);
      fetchContacts();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update contact");
    } finally {
      setIsSaving(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    return phone;
  };

  // Filter contacts by search query
  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      contact.phone_number.toLowerCase().includes(query) ||
      (contact.name && contact.name.toLowerCase().includes(query)) ||
      (contact.email && contact.email.toLowerCase().includes(query))
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  // Show contact detail view if a contact is selected
  if (selectedContact && businessId) {
    return (
      <ContactDetail 
        contact={selectedContact}
        businessId={businessId}
        onBack={() => setSelectedContact(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Contacts</h1>
          <p className="text-gray-400">View and manage your business contacts</p>
        </div>
        <Button 
          onClick={fetchContacts} 
          variant="outline" 
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Users className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-gray-400">Total Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.active}</p>
                <p className="text-sm text-gray-400">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <UserX className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.optedOut}</p>
                <p className="text-sm text-gray-400">Opted Out</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-36 bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all" className="text-white hover:bg-gray-700">All Contacts</SelectItem>
              <SelectItem value="active" className="text-white hover:bg-gray-700">Active</SelectItem>
              <SelectItem value="opted_out" className="text-white hover:bg-gray-700">Opted Out</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Contacts List */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">All Contacts</CardTitle>
          <CardDescription className="text-gray-400">
            {filteredContacts.length} contacts found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No contacts found</p>
              <p className="text-sm">Contacts will appear here when customers interact with your business</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredContacts.map((contact) => (
                <div 
                  key={contact.id} 
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg transition-colors gap-4 ${
                    contact.opted_out 
                      ? "bg-red-500/10 border border-red-500/20" 
                      : "bg-gray-700/30 hover:bg-gray-700/50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      contact.opted_out 
                        ? "bg-red-500/20" 
                        : "bg-purple-500/20"
                    }`}>
                      <User className={`h-5 w-5 ${
                        contact.opted_out 
                          ? "text-red-400" 
                          : "text-purple-400"
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white">
                          {contact.name || "Unknown"}
                        </span>
                        {contact.opted_out && (
                          <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                            <UserX className="h-3 w-3 mr-1" />
                            Opted Out
                          </Badge>
                        )}
                        {contact.preferred_language && (
                          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                            <Globe className="h-3 w-3 mr-1" />
                            {LANGUAGE_LABELS[contact.preferred_language] || contact.preferred_language}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-gray-400 mt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="h-3 w-3" />
                          {formatPhoneNumber(contact.phone_number)}
                        </span>
                        {contact.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Added {contact.created_at 
                          ? formatDistanceToNow(new Date(contact.created_at), { addSuffix: true })
                          : "unknown"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-11 sm:ml-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                      onClick={() => setSelectedContact(contact)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-gray-400 hover:text-white hover:bg-gray-600"
                      onClick={() => openEditDialog(contact)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`h-8 ${
                        contact.opted_out
                          ? "text-green-400 hover:text-green-300 hover:bg-green-500/20"
                          : "text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      }`}
                      onClick={() => toggleOptOut(contact.id, contact.opted_out)}
                    >
                      {contact.opted_out ? (
                        <>
                          <UserCheck className="h-4 w-4 mr-1" />
                          Opt In
                        </>
                      ) : (
                        <>
                          <UserX className="h-4 w-4 mr-1" />
                          Opt Out
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Contact Dialog */}
      <Dialog open={!!editingContact} onOpenChange={(open) => !open && setEditingContact(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update contact information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Phone Number</Label>
              <Input
                value={editingContact?.phone_number || ""}
                disabled
                className="bg-gray-700 border-gray-600 text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Contact name"
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Email</Label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Contact email"
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={() => setEditingContact(null)}
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={saveContactDetails}
                disabled={isSaving}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
