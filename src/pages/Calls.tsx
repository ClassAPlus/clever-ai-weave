import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, 
  Clock, MessageSquare, RefreshCw, Filter, FileText, ChevronDown, ChevronUp,
  Pencil, Save, X
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { format, formatDistanceToNow } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface CallSummary {
  reason: string;
  outcome: string;
  next_steps: string[];
  caller_name?: string;
  functions_used?: string[];
  discussion_summary?: string | null;
}

interface Call {
  id: string;
  caller_phone: string;
  call_status: string;
  was_answered: boolean | null;
  duration_seconds: number | null;
  textback_sent: boolean | null;
  created_at: string | null;
  call_summary: CallSummary | null;
  manual_notes: string | null;
  contact: {
    name: string | null;
    phone_number: string;
  } | null;
}

interface CallStats {
  total: number;
  answered: number;
  missed: number;
  textbacksSent: number;
}

export default function Calls() {
  const { user } = useAuth();
  const [calls, setCalls] = useState<Call[]>([]);
  const [stats, setStats] = useState<CallStats>({ total: 0, answered: 0, missed: 0, textbacksSent: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "answered" | "missed">("all");
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const isInitialLoad = useRef(true);

  const fetchCalls = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // First get the business
      const { data: business, error: bizError } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_user_id", user.id)
        .single();

      if (bizError || !business) {
        console.error("Error fetching business:", bizError);
        return;
      }

      setBusinessId(business.id);

      // Fetch calls with contact info
      let query = supabase
        .from("calls")
        .select(`
          id,
          caller_phone,
          call_status,
          was_answered,
          duration_seconds,
          textback_sent,
          created_at,
          call_summary,
          manual_notes,
          contact:contacts(name, phone_number)
        `)
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });

      if (filter === "answered") {
        query = query.eq("was_answered", true);
      } else if (filter === "missed") {
        query = query.eq("was_answered", false);
      }

      const { data: callsData, error: callsError } = await query.limit(50);

      if (callsError) {
        console.error("Error fetching calls:", callsError);
        return;
      }

      // Map data to properly type call_summary
      const typedCalls: Call[] = (callsData || []).map((call: any) => ({
        ...call,
        call_summary: call.call_summary as CallSummary | null
      }));
      setCalls(typedCalls);

      // Fetch stats
      const { data: allCalls } = await supabase
        .from("calls")
        .select("was_answered, textback_sent")
        .eq("business_id", business.id);

      if (allCalls) {
        setStats({
          total: allCalls.length,
          answered: allCalls.filter(c => c.was_answered).length,
          missed: allCalls.filter(c => !c.was_answered).length,
          textbacksSent: allCalls.filter(c => c.textback_sent).length,
        });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, filter]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  // Real-time subscription for calls
  useEffect(() => {
    if (!businessId) return;

    const channel = supabase
      .channel('calls-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `business_id=eq.${businessId}`
        },
        (payload) => {
          if (!isInitialLoad.current) {
            const newCall = payload.new as { was_answered?: boolean };
            if (newCall.was_answered === false) {
              toast.info("New missed call", { 
                description: "A new missed call has been recorded",
                icon: <PhoneMissed className="h-4 w-4 text-red-400" />
              });
            } else {
              toast.info("New call received", {
                description: "A new call has been recorded",
                icon: <PhoneIncoming className="h-4 w-4 text-green-400" />
              });
            }
          }
          fetchCalls();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `business_id=eq.${businessId}`
        },
        () => {
          fetchCalls();
        }
      )
      .subscribe();

    // Mark initial load as complete after a short delay
    setTimeout(() => {
      isInitialLoad.current = false;
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, fetchCalls]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatPhoneNumber = (phone: string) => {
    // Simple formatting for display
    if (phone.startsWith("+")) {
      return phone;
    }
    return phone;
  };

  const startEditingNotes = (call: Call) => {
    setEditingNotesId(call.id);
    setNotesValue(call.manual_notes || "");
  };

  const cancelEditingNotes = () => {
    setEditingNotesId(null);
    setNotesValue("");
  };

  const saveNotes = async (callId: string) => {
    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from("calls")
        .update({ manual_notes: notesValue || null })
        .eq("id", callId);

      if (error) {
        console.error("Error saving notes:", error);
        toast.error("Failed to save notes");
      } else {
        toast.success("Notes saved");
        // Update local state
        setCalls(calls.map(c => 
          c.id === callId ? { ...c, manual_notes: notesValue || null } : c
        ));
        setEditingNotesId(null);
        setNotesValue("");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
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
          <h1 className="text-2xl font-bold text-white">Calls</h1>
          <p className="text-gray-400">View and manage your incoming calls</p>
        </div>
        <Button 
          onClick={fetchCalls} 
          variant="outline" 
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Phone className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-gray-400">Total Calls</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <PhoneIncoming className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.answered}</p>
                <p className="text-sm text-gray-400">Answered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <PhoneMissed className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.missed}</p>
                <p className="text-sm text-gray-400">Missed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <MessageSquare className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.textbacksSent}</p>
                <p className="text-sm text-gray-400">Textbacks Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-gray-400" />
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all" className="text-white hover:bg-gray-700">All Calls</SelectItem>
            <SelectItem value="answered" className="text-white hover:bg-gray-700">Answered</SelectItem>
            <SelectItem value="missed" className="text-white hover:bg-gray-700">Missed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Calls List */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Calls</CardTitle>
          <CardDescription className="text-gray-400">
            {calls.length} calls found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {calls.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Phone className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No calls yet</p>
              <p className="text-sm">Incoming calls will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {calls.map((call) => (
                <div 
                  key={call.id} 
                  className="bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors overflow-hidden"
                >
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => setExpandedCallId(expandedCallId === call.id ? null : call.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        call.was_answered 
                          ? "bg-green-500/20" 
                          : "bg-red-500/20"
                      }`}>
                        {call.was_answered ? (
                          <PhoneIncoming className="h-5 w-5 text-green-400" />
                        ) : (
                          <PhoneMissed className="h-5 w-5 text-red-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {call.contact?.name || formatPhoneNumber(call.caller_phone)}
                          </span>
                          {call.contact?.name && (
                            <span className="text-sm text-gray-400 font-mono">
                              {formatPhoneNumber(call.caller_phone)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {call.created_at 
                              ? formatDistanceToNow(new Date(call.created_at), { addSuffix: true })
                              : "Unknown"}
                          </span>
                          {call.duration_seconds !== null && call.duration_seconds > 0 && (
                            <span>Duration: {formatDuration(call.duration_seconds)}</span>
                          )}
                          {call.call_summary && (
                            <span className="flex items-center gap-1 text-blue-400">
                              <FileText className="h-3 w-3" />
                              {call.call_summary.reason}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {call.textback_sent && (
                        <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Textback Sent
                        </Badge>
                      )}
                      <Badge 
                        variant={call.was_answered ? "default" : "destructive"}
                        className={call.was_answered 
                          ? "bg-green-500/20 text-green-300 border-green-500/30" 
                          : "bg-red-500/20 text-red-300 border-red-500/30"
                        }
                      >
                        {call.was_answered ? "Answered" : "Missed"}
                      </Badge>
                      {(call.call_summary || call.manual_notes !== null) && (
                        expandedCallId === call.id 
                          ? <ChevronUp className="h-4 w-4 text-gray-400" />
                          : <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                      {!call.call_summary && call.manual_notes === null && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-400 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCallId(call.id);
                            startEditingNotes(call);
                          }}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Add Notes
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Expandable Call Summary & Notes */}
                  {expandedCallId === call.id && (
                    <div className="px-4 pb-4 pt-0 border-t border-gray-600/50">
                      {/* AI Summary Section */}
                      {call.call_summary && (
                        <div className="mt-3 space-y-4">
                          {/* Discussion Summary */}
                          {call.call_summary.discussion_summary && (
                            <div className="bg-gray-800/50 p-3 rounded-lg">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Conversation</p>
                              <div className="text-sm text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto font-mono leading-relaxed">
                                {call.call_summary.discussion_summary.split('\n').map((line, idx) => {
                                  const isCustomer = line.startsWith('Customer:');
                                  const isAI = line.startsWith('AI:');
                                  return (
                                    <div key={idx} className={`${isCustomer ? 'text-blue-300' : isAI ? 'text-green-300' : 'text-gray-300'} mb-1`}>
                                      {line}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* Structured Summary */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-800/50 p-3 rounded-lg">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Reason</p>
                              <p className="text-white font-medium">{call.call_summary.reason}</p>
                            </div>
                            <div className="bg-gray-800/50 p-3 rounded-lg">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Outcome</p>
                              <p className="text-white font-medium">{call.call_summary.outcome}</p>
                            </div>
                            <div className="bg-gray-800/50 p-3 rounded-lg">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Next Steps</p>
                              {call.call_summary.next_steps && call.call_summary.next_steps.length > 0 ? (
                                <ul className="text-white text-sm space-y-1">
                                  {call.call_summary.next_steps.map((step, idx) => (
                                    <li key={idx} className="flex items-center gap-1">
                                      <span className="text-blue-400">•</span> {step}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-gray-400 text-sm">No follow-up required</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Manual Notes Section */}
                      <div className={`${call.call_summary ? 'mt-4' : 'mt-3'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Manual Notes</p>
                          {editingNotesId !== call.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-gray-400 hover:text-white h-6 px-2"
                              onClick={() => startEditingNotes(call)}
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              {call.manual_notes ? "Edit" : "Add"}
                            </Button>
                          )}
                        </div>
                        
                        {editingNotesId === call.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={notesValue}
                              onChange={(e) => setNotesValue(e.target.value)}
                              placeholder="Add notes about this call..."
                              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 min-h-[80px]"
                            />
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelEditingNotes}
                                disabled={savingNotes}
                                className="text-gray-400 hover:text-white"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => saveNotes(call.id)}
                                disabled={savingNotes}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                              >
                                {savingNotes ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Save className="h-3 w-3 mr-1" />
                                )}
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-800/50 p-3 rounded-lg">
                            {call.manual_notes ? (
                              <p className="text-white text-sm whitespace-pre-wrap">{call.manual_notes}</p>
                            ) : (
                              <p className="text-gray-500 text-sm italic">No notes added yet</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
