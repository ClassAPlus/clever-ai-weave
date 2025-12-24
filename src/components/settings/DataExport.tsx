import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, Database, Users, MessageSquare, Calendar, Phone, Loader2 } from "lucide-react";

interface DataExportProps {
  businessId: string;
}

interface DataStats {
  contacts: number;
  conversations: number;
  messages: number;
  appointments: number;
  calls: number;
}

export function DataExport({ businessId }: DataExportProps) {
  const { toast } = useToast();
  const [stats, setStats] = useState<DataStats>({
    contacts: 0,
    conversations: 0,
    messages: 0,
    appointments: 0,
    calls: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, [businessId]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const [contactsRes, conversationsRes, appointmentsRes, callsRes] = await Promise.all([
        supabase.from("contacts").select("id", { count: "exact", head: true }).eq("business_id", businessId),
        supabase.from("conversations").select("id", { count: "exact", head: true }).eq("business_id", businessId),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("business_id", businessId),
        supabase.from("calls").select("id", { count: "exact", head: true }).eq("business_id", businessId),
      ]);

      // Get message count from all conversations
      const { data: convData } = await supabase
        .from("conversations")
        .select("id")
        .eq("business_id", businessId);
      
      let messageCount = 0;
      if (convData && convData.length > 0) {
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .in("conversation_id", convData.map(c => c.id));
        messageCount = count || 0;
      }

      setStats({
        contacts: contactsRes.count || 0,
        conversations: conversationsRes.count || 0,
        messages: messageCount,
        appointments: appointmentsRes.count || 0,
        calls: callsRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const downloadCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) {
      toast({
        variant: "destructive",
        title: "No data",
        description: "No records to export",
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          const stringValue = typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
          return `"${stringValue.replace(/"/g, '""')}"`;
        }).join(",")
      )
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportContacts = async () => {
    setExporting("contacts");
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("business_id", businessId);

      if (error) throw error;

      downloadCSV(data || [], `contacts_${new Date().toISOString().split("T")[0]}.csv`);
      toast({ title: "Export complete", description: `Exported ${data?.length || 0} contacts` });
    } catch (error) {
      toast({ variant: "destructive", title: "Export failed", description: "Could not export contacts" });
    } finally {
      setExporting(null);
    }
  };

  const exportConversations = async () => {
    setExporting("conversations");
    try {
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .select(`
          id,
          status,
          created_at,
          updated_at,
          contact:contacts(name, phone_number)
        `)
        .eq("business_id", businessId);

      if (convError) throw convError;

      const flatData = (convData || []).map(c => ({
        id: c.id,
        status: c.status,
        contact_name: c.contact?.name,
        contact_phone: c.contact?.phone_number,
        created_at: c.created_at,
        updated_at: c.updated_at,
      }));

      downloadCSV(flatData, `conversations_${new Date().toISOString().split("T")[0]}.csv`);
      toast({ title: "Export complete", description: `Exported ${flatData.length} conversations` });
    } catch (error) {
      toast({ variant: "destructive", title: "Export failed", description: "Could not export conversations" });
    } finally {
      setExporting(null);
    }
  };

  const exportAppointments = async () => {
    setExporting("appointments");
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          scheduled_at,
          status,
          service_type,
          duration_minutes,
          notes,
          confirmation_code,
          contact:contacts(name, phone_number)
        `)
        .eq("business_id", businessId);

      if (error) throw error;

      const flatData = (data || []).map(a => ({
        id: a.id,
        scheduled_at: a.scheduled_at,
        status: a.status,
        service_type: a.service_type,
        duration_minutes: a.duration_minutes,
        notes: a.notes,
        confirmation_code: a.confirmation_code,
        contact_name: a.contact?.name,
        contact_phone: a.contact?.phone_number,
      }));

      downloadCSV(flatData, `appointments_${new Date().toISOString().split("T")[0]}.csv`);
      toast({ title: "Export complete", description: `Exported ${flatData.length} appointments` });
    } catch (error) {
      toast({ variant: "destructive", title: "Export failed", description: "Could not export appointments" });
    } finally {
      setExporting(null);
    }
  };

  const exportCalls = async () => {
    setExporting("calls");
    try {
      const { data, error } = await supabase
        .from("calls")
        .select(`
          id,
          caller_phone,
          call_status,
          was_answered,
          duration_seconds,
          textback_sent,
          created_at
        `)
        .eq("business_id", businessId);

      if (error) throw error;

      downloadCSV(data || [], `calls_${new Date().toISOString().split("T")[0]}.csv`);
      toast({ title: "Export complete", description: `Exported ${data?.length || 0} calls` });
    } catch (error) {
      toast({ variant: "destructive", title: "Export failed", description: "Could not export calls" });
    } finally {
      setExporting(null);
    }
  };

  const statItems = [
    { label: "Contacts", value: stats.contacts, icon: Users },
    { label: "Conversations", value: stats.conversations, icon: MessageSquare },
    { label: "Messages", value: stats.messages, icon: MessageSquare },
    { label: "Appointments", value: stats.appointments, icon: Calendar },
    { label: "Calls", value: stats.calls, icon: Phone },
  ];

  const exportItems = [
    { label: "Export Contacts", onClick: exportContacts, key: "contacts", icon: Users },
    { label: "Export Conversations", onClick: exportConversations, key: "conversations", icon: MessageSquare },
    { label: "Export Appointments", onClick: exportAppointments, key: "appointments", icon: Calendar },
    { label: "Export Calls", onClick: exportCalls, key: "calls", icon: Phone },
  ];

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Database className="h-5 w-5 text-purple-400" />
          Data & Export
        </CardTitle>
        <CardDescription className="text-gray-400">
          View usage statistics and export your data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div>
          <Label className="text-gray-300 font-medium mb-3 block">Database Usage</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {statItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="p-3 rounded-lg bg-gray-900/50 border border-gray-700 text-center"
                >
                  <Icon className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white">
                    {loadingStats ? "-" : item.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Export Buttons */}
        <div className="pt-4 border-t border-gray-700">
          <Label className="text-gray-300 font-medium mb-3 block">Export Data (CSV)</Label>
          <div className="grid grid-cols-2 gap-3">
            {exportItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.key}
                  variant="outline"
                  onClick={item.onClick}
                  disabled={exporting !== null}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white justify-start"
                >
                  {exporting === item.key ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={className}>{children}</p>;
}
