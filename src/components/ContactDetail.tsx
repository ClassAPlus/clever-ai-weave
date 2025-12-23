import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, User, Phone, Mail, Clock, ArrowLeft,
  PhoneIncoming, PhoneMissed, MessageSquare, Calendar,
  UserX, UserCheck, Bot
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface Contact {
  id: string;
  name: string | null;
  phone_number: string;
  email: string | null;
  opted_out: boolean | null;
  opted_out_at: string | null;
  created_at: string | null;
}

interface Call {
  id: string;
  call_status: string;
  was_answered: boolean | null;
  duration_seconds: number | null;
  textback_sent: boolean | null;
  created_at: string | null;
}

interface Conversation {
  id: string;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  lastMessage?: {
    content: string;
    direction: string;
    ai_generated: boolean | null;
  };
}

interface Appointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  service_type: string | null;
  status: string | null;
  notes: string | null;
}

interface ContactDetailProps {
  contact: Contact;
  onBack: () => void;
}

export default function ContactDetail({ contact, onBack }: ContactDetailProps) {
  const [calls, setCalls] = useState<Call[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("calls");

  const fetchContactData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch calls for this contact
      const { data: callsData } = await supabase
        .from("calls")
        .select("id, call_status, was_answered, duration_seconds, textback_sent, created_at")
        .eq("contact_id", contact.id)
        .order("created_at", { ascending: false });

      setCalls(callsData || []);

      // Fetch conversations for this contact
      const { data: conversationsData } = await supabase
        .from("conversations")
        .select("id, status, created_at, updated_at")
        .eq("contact_id", contact.id)
        .order("updated_at", { ascending: false });

      // Get last message for each conversation
      const convsWithMessages = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          const { data: lastMessage } = await supabase
            .from("messages")
            .select("content, direction, ai_generated")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1);
          
          return {
            ...conv,
            lastMessage: lastMessage?.[0] || undefined
          };
        })
      );

      setConversations(convsWithMessages);

      // Fetch appointments for this contact
      const { data: appointmentsData } = await supabase
        .from("appointments")
        .select("id, scheduled_at, duration_minutes, service_type, status, notes")
        .eq("contact_id", contact.id)
        .order("scheduled_at", { ascending: false });

      setAppointments(appointmentsData || []);
    } catch (error) {
      console.error("Error fetching contact data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [contact.id]);

  useEffect(() => {
    fetchContactData();
  }, [fetchContactData]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const getStatusBadge = (status: string | null, type: "appointment" | "conversation") => {
    if (type === "appointment") {
      switch (status) {
        case "confirmed":
          return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Confirmed</Badge>;
        case "completed":
          return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Completed</Badge>;
        case "cancelled":
          return <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Cancelled</Badge>;
        default:
          return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Pending</Badge>;
      }
    } else {
      return status === "active" 
        ? <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Active</Badge>
        : <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">Closed</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onBack}
          className="text-gray-400 hover:text-white hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Contact Details</h1>
          <p className="text-gray-400">View all activity for this contact</p>
        </div>
      </div>

      {/* Contact Info Card */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className={`p-4 rounded-full ${contact.opted_out ? "bg-red-500/20" : "bg-purple-500/20"}`}>
              <User className={`h-8 w-8 ${contact.opted_out ? "text-red-400" : "text-purple-400"}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-semibold text-white">
                  {contact.name || "Unknown"}
                </h2>
                {contact.opted_out ? (
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                    <UserX className="h-3 w-3 mr-1" />
                    Opted Out
                  </Badge>
                ) : (
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    <UserCheck className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-gray-400">
                <span className="flex items-center gap-2 font-mono">
                  <Phone className="h-4 w-4" />
                  {contact.phone_number}
                </span>
                {contact.email && (
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {contact.email}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                <Clock className="h-3 w-3 inline mr-1" />
                Contact since {contact.created_at 
                  ? format(new Date(contact.created_at), "MMM d, yyyy")
                  : "unknown"}
              </p>
            </div>
            <div className="flex gap-4 text-center">
              <div className="bg-gray-700/50 rounded-lg p-3">
                <p className="text-2xl font-bold text-white">{calls.length}</p>
                <p className="text-xs text-gray-400">Calls</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <p className="text-2xl font-bold text-white">{conversations.length}</p>
                <p className="text-xs text-gray-400">Conversations</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <p className="text-2xl font-bold text-white">{appointments.length}</p>
                <p className="text-xs text-gray-400">Appointments</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Tabs */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="calls" className="data-[state=active]:bg-purple-600">
              <PhoneIncoming className="h-4 w-4 mr-2" />
              Calls ({calls.length})
            </TabsTrigger>
            <TabsTrigger value="conversations" className="data-[state=active]:bg-purple-600">
              <MessageSquare className="h-4 w-4 mr-2" />
              Conversations ({conversations.length})
            </TabsTrigger>
            <TabsTrigger value="appointments" className="data-[state=active]:bg-purple-600">
              <Calendar className="h-4 w-4 mr-2" />
              Appointments ({appointments.length})
            </TabsTrigger>
          </TabsList>

          {/* Calls Tab */}
          <TabsContent value="calls">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Call History</CardTitle>
                <CardDescription className="text-gray-400">
                  All calls with this contact
                </CardDescription>
              </CardHeader>
              <CardContent>
                {calls.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <PhoneIncoming className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No calls with this contact</p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-96">
                    <div className="space-y-3">
                      {calls.map((call) => (
                        <div 
                          key={call.id} 
                          className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${
                              call.was_answered ? "bg-green-500/20" : "bg-red-500/20"
                            }`}>
                              {call.was_answered ? (
                                <PhoneIncoming className="h-5 w-5 text-green-400" />
                              ) : (
                                <PhoneMissed className="h-5 w-5 text-red-400" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  className={call.was_answered 
                                    ? "bg-green-500/20 text-green-300 border-green-500/30" 
                                    : "bg-red-500/20 text-red-300 border-red-500/30"
                                  }
                                >
                                  {call.was_answered ? "Answered" : "Missed"}
                                </Badge>
                                {call.textback_sent && (
                                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    Textback
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-400 mt-1">
                                {call.created_at 
                                  ? format(new Date(call.created_at), "MMM d, yyyy 'at' h:mm a")
                                  : "Unknown time"}
                              </p>
                            </div>
                          </div>
                          {call.duration_seconds !== null && call.duration_seconds > 0 && (
                            <span className="text-gray-400 text-sm">
                              {formatDuration(call.duration_seconds)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conversations Tab */}
          <TabsContent value="conversations">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">SMS Conversations</CardTitle>
                <CardDescription className="text-gray-400">
                  All message threads with this contact
                </CardDescription>
              </CardHeader>
              <CardContent>
                {conversations.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No conversations with this contact</p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-96">
                    <div className="space-y-3">
                      {conversations.map((conv) => (
                        <div 
                          key={conv.id} 
                          className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={`p-2 rounded-full ${
                              conv.status === "active" ? "bg-green-500/20" : "bg-gray-500/20"
                            }`}>
                              <MessageSquare className={`h-5 w-5 ${
                                conv.status === "active" ? "text-green-400" : "text-gray-400"
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {getStatusBadge(conv.status, "conversation")}
                                <span className="text-sm text-gray-400">
                                  {conv.updated_at 
                                    ? formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })
                                    : "Unknown"}
                                </span>
                              </div>
                              {conv.lastMessage && (
                                <p className="text-sm text-gray-300 mt-1 truncate">
                                  {conv.lastMessage.ai_generated && (
                                    <Bot className="h-3 w-3 inline mr-1 text-purple-400" />
                                  )}
                                  {conv.lastMessage.direction === "outbound" ? "You: " : ""}
                                  {conv.lastMessage.content}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Appointments</CardTitle>
                <CardDescription className="text-gray-400">
                  All scheduled appointments with this contact
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No appointments with this contact</p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-96">
                    <div className="space-y-3">
                      {appointments.map((appt) => (
                        <div 
                          key={appt.id} 
                          className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${
                              appt.status === "confirmed" ? "bg-green-500/20" 
                              : appt.status === "completed" ? "bg-blue-500/20"
                              : appt.status === "cancelled" ? "bg-red-500/20"
                              : "bg-yellow-500/20"
                            }`}>
                              <Calendar className={`h-5 w-5 ${
                                appt.status === "confirmed" ? "text-green-400" 
                                : appt.status === "completed" ? "text-blue-400"
                                : appt.status === "cancelled" ? "text-red-400"
                                : "text-yellow-400"
                              }`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {getStatusBadge(appt.status, "appointment")}
                                {appt.service_type && (
                                  <Badge variant="outline" className="border-gray-600 text-gray-300">
                                    {appt.service_type}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-300 mt-1">
                                {format(new Date(appt.scheduled_at), "EEEE, MMM d, yyyy 'at' h:mm a")}
                              </p>
                              {appt.notes && (
                                <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                                  {appt.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          {appt.duration_minutes && (
                            <span className="text-gray-400 text-sm">
                              {appt.duration_minutes} min
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
