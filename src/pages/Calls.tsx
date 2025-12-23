import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, 
  Clock, MessageSquare, RefreshCw, Filter
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Call {
  id: string;
  caller_phone: string;
  call_status: string;
  was_answered: boolean | null;
  duration_seconds: number | null;
  textback_sent: boolean | null;
  created_at: string | null;
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

      setCalls(callsData || []);

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
          event: '*',
          schema: 'public',
          table: 'calls',
          filter: `business_id=eq.${businessId}`
        },
        () => {
          fetchCalls();
        }
      )
      .subscribe();

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
                  className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
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
