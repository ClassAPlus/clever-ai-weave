import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Bell, User, Clock, RefreshCw, Filter,
  CheckCircle, AlertTriangle, MessageSquare, Archive, Inbox
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Inquiry {
  id: string;
  summary: string;
  priority: string | null;
  status: string | null;
  owner_notified: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  contact: {
    id: string;
    name: string | null;
    phone_number: string;
  } | null;
}

interface InquiryStats {
  total: number;
  new: number;
  inProgress: number;
  resolved: number;
  highPriority: number;
}

export default function Inquiries() {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [stats, setStats] = useState<InquiryStats>({ 
    total: 0, new: 0, inProgress: 0, resolved: 0, highPriority: 0 
  });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "in_progress" | "resolved">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "normal" | "low">("all");
  const [businessId, setBusinessId] = useState<string | null>(null);

  const fetchInquiries = useCallback(async () => {
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

      // Fetch inquiries with contact info
      let query = supabase
        .from("inquiries")
        .select(`
          id,
          summary,
          priority,
          status,
          owner_notified,
          created_at,
          updated_at,
          contact:contacts(id, name, phone_number)
        `)
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (priorityFilter !== "all") {
        query = query.eq("priority", priorityFilter);
      }

      const { data: inquiriesData, error: inqError } = await query.limit(50);

      if (inqError) {
        console.error("Error fetching inquiries:", inqError);
        return;
      }

      setInquiries(inquiriesData || []);

      // Fetch stats
      const { data: allInquiries } = await supabase
        .from("inquiries")
        .select("status, priority")
        .eq("business_id", business.id);

      if (allInquiries) {
        setStats({
          total: allInquiries.length,
          new: allInquiries.filter(i => i.status === "new").length,
          inProgress: allInquiries.filter(i => i.status === "in_progress").length,
          resolved: allInquiries.filter(i => i.status === "resolved").length,
          highPriority: allInquiries.filter(i => i.priority === "high").length,
        });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const updateInquiryStatus = async (inquiryId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("inquiries")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", inquiryId);

      if (error) {
        console.error("Error updating inquiry:", error);
        toast.error("Failed to update inquiry");
        return;
      }

      toast.success(`Inquiry marked as ${newStatus.replace("_", " ")}`);
      fetchInquiries();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update inquiry");
    }
  };

  const updateInquiryPriority = async (inquiryId: string, newPriority: string) => {
    try {
      const { error } = await supabase
        .from("inquiries")
        .update({ priority: newPriority, updated_at: new Date().toISOString() })
        .eq("id", inquiryId);

      if (error) {
        console.error("Error updating inquiry:", error);
        toast.error("Failed to update priority");
        return;
      }

      toast.success(`Priority set to ${newPriority}`);
      fetchInquiries();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update priority");
    }
  };

  const formatPhoneNumber = (phone: string) => {
    return phone;
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "in_progress":
        return (
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case "resolved":
        return (
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Resolved
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
            <Inbox className="h-3 w-3 mr-1" />
            New
          </Badge>
        );
    }
  };

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case "high":
        return (
          <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
            <AlertTriangle className="h-3 w-3 mr-1" />
            High
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">
            Low
          </Badge>
        );
      default:
        return (
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
            Normal
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Inquiries</h1>
          <p className="text-gray-400">View and manage customer inquiries</p>
        </div>
        <Button 
          onClick={fetchInquiries} 
          variant="outline" 
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Bell className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-gray-400">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Inbox className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.new}</p>
                <p className="text-sm text-gray-400">New</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Clock className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
                <p className="text-sm text-gray-400">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.resolved}</p>
                <p className="text-sm text-gray-400">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.highPriority}</p>
                <p className="text-sm text-gray-400">High Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-gray-400" />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-36 bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all" className="text-white hover:bg-gray-700">All Status</SelectItem>
            <SelectItem value="new" className="text-white hover:bg-gray-700">New</SelectItem>
            <SelectItem value="in_progress" className="text-white hover:bg-gray-700">In Progress</SelectItem>
            <SelectItem value="resolved" className="text-white hover:bg-gray-700">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as typeof priorityFilter)}>
          <SelectTrigger className="w-36 bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all" className="text-white hover:bg-gray-700">All Priority</SelectItem>
            <SelectItem value="high" className="text-white hover:bg-gray-700">High</SelectItem>
            <SelectItem value="normal" className="text-white hover:bg-gray-700">Normal</SelectItem>
            <SelectItem value="low" className="text-white hover:bg-gray-700">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Inquiries List */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Customer Inquiries</CardTitle>
          <CardDescription className="text-gray-400">
            {inquiries.length} inquiries found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inquiries.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No inquiries yet</p>
              <p className="text-sm">Customer inquiries will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inquiries.map((inquiry) => (
                <div 
                  key={inquiry.id} 
                  className={`flex flex-col p-4 rounded-lg transition-colors gap-3 ${
                    inquiry.priority === "high" 
                      ? "bg-red-500/10 border border-red-500/20" 
                      : "bg-gray-700/30 hover:bg-gray-700/50"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-2 rounded-full ${
                        inquiry.status === "new" 
                          ? "bg-yellow-500/20" 
                          : inquiry.status === "resolved"
                          ? "bg-green-500/20"
                          : "bg-blue-500/20"
                      }`}>
                        <Bell className={`h-5 w-5 ${
                          inquiry.status === "new" 
                            ? "text-yellow-400" 
                            : inquiry.status === "resolved"
                            ? "text-green-400"
                            : "text-blue-400"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-white">
                            {inquiry.contact?.name || formatPhoneNumber(inquiry.contact?.phone_number || "Unknown")}
                          </span>
                          {inquiry.contact?.name && (
                            <span className="text-sm text-gray-400 font-mono">
                              {formatPhoneNumber(inquiry.contact.phone_number)}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-300 text-sm mb-2">{inquiry.summary}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Clock className="h-3 w-3" />
                          {inquiry.created_at 
                            ? formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true })
                            : "Unknown"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-11 sm:ml-0">
                      {getPriorityBadge(inquiry.priority)}
                      {getStatusBadge(inquiry.status)}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-11 sm:ml-11 pt-2 border-t border-gray-700/50">
                    <span className="text-xs text-gray-500 mr-2">Actions:</span>
                    {inquiry.status === "new" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                        onClick={() => updateInquiryStatus(inquiry.id, "in_progress")}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Start
                      </Button>
                    )}
                    {inquiry.status === "in_progress" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-green-400 hover:text-green-300 hover:bg-green-500/20"
                        onClick={() => updateInquiryStatus(inquiry.id, "resolved")}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resolve
                      </Button>
                    )}
                    {inquiry.status !== "resolved" && (
                      <>
                        {inquiry.priority !== "high" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            onClick={() => updateInquiryPriority(inquiry.id, "high")}
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            High Priority
                          </Button>
                        )}
                        {inquiry.priority === "high" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-500/20"
                            onClick={() => updateInquiryPriority(inquiry.id, "normal")}
                          >
                            Normal Priority
                          </Button>
                        )}
                      </>
                    )}
                    {inquiry.status === "resolved" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20"
                        onClick={() => updateInquiryStatus(inquiry.id, "new")}
                      >
                        <Inbox className="h-3 w-3 mr-1" />
                        Reopen
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
