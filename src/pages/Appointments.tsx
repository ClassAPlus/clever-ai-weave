import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Calendar, Clock, User, RefreshCw, Filter,
  CheckCircle, XCircle, AlertCircle, CalendarCheck
} from "lucide-react";
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Appointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  service_type: string | null;
  status: string | null;
  notes: string | null;
  confirmation_code: string | null;
  created_at: string | null;
  contact: {
    id: string;
    name: string | null;
    phone_number: string;
  } | null;
}

interface AppointmentStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<AppointmentStats>({ 
    total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all");
  const [businessId, setBusinessId] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
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

      // Fetch appointments with contact info
      let query = supabase
        .from("appointments")
        .select(`
          id,
          scheduled_at,
          duration_minutes,
          service_type,
          status,
          notes,
          confirmation_code,
          created_at,
          contact:contacts(id, name, phone_number)
        `)
        .eq("business_id", business.id)
        .order("scheduled_at", { ascending: true });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data: appointmentsData, error: apptsError } = await query.limit(50);

      if (apptsError) {
        console.error("Error fetching appointments:", apptsError);
        return;
      }

      setAppointments(appointmentsData || []);

      // Fetch stats
      const { data: allAppts } = await supabase
        .from("appointments")
        .select("status")
        .eq("business_id", business.id);

      if (allAppts) {
        setStats({
          total: allAppts.length,
          pending: allAppts.filter(a => a.status === "pending").length,
          confirmed: allAppts.filter(a => a.status === "confirmed").length,
          completed: allAppts.filter(a => a.status === "completed").length,
          cancelled: allAppts.filter(a => a.status === "cancelled").length,
        });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, filter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", appointmentId);

      if (error) {
        console.error("Error updating appointment:", error);
        return;
      }

      // Refresh appointments
      fetchAppointments();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    return phone;
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmed
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
            <CalendarCheck className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isPast(date)) return "Past";
    return format(date, "EEE, MMM d");
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
          <h1 className="text-2xl font-bold text-white">Appointments</h1>
          <p className="text-gray-400">View and manage scheduled appointments</p>
        </div>
        <Button 
          onClick={fetchAppointments} 
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
                <Calendar className="h-5 w-5 text-purple-400" />
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
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
                <p className="text-sm text-gray-400">Pending</p>
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
                <p className="text-2xl font-bold text-white">{stats.confirmed}</p>
                <p className="text-sm text-gray-400">Confirmed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <CalendarCheck className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.completed}</p>
                <p className="text-sm text-gray-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.cancelled}</p>
                <p className="text-sm text-gray-400">Cancelled</p>
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
            <SelectItem value="all" className="text-white hover:bg-gray-700">All Appointments</SelectItem>
            <SelectItem value="pending" className="text-white hover:bg-gray-700">Pending</SelectItem>
            <SelectItem value="confirmed" className="text-white hover:bg-gray-700">Confirmed</SelectItem>
            <SelectItem value="completed" className="text-white hover:bg-gray-700">Completed</SelectItem>
            <SelectItem value="cancelled" className="text-white hover:bg-gray-700">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Appointments List */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Scheduled Appointments</CardTitle>
          <CardDescription className="text-gray-400">
            {appointments.length} appointments found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No appointments yet</p>
              <p className="text-sm">Scheduled appointments will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <div 
                  key={appointment.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors gap-4"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      isPast(new Date(appointment.scheduled_at)) && appointment.status !== "completed"
                        ? "bg-red-500/20" 
                        : isToday(new Date(appointment.scheduled_at))
                        ? "bg-green-500/20"
                        : "bg-purple-500/20"
                    }`}>
                      <Calendar className={`h-5 w-5 ${
                        isPast(new Date(appointment.scheduled_at)) && appointment.status !== "completed"
                          ? "text-red-400" 
                          : isToday(new Date(appointment.scheduled_at))
                          ? "text-green-400"
                          : "text-purple-400"
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white">
                          {appointment.contact?.name || formatPhoneNumber(appointment.contact?.phone_number || "Unknown")}
                        </span>
                        {appointment.service_type && (
                          <Badge variant="outline" className="border-gray-600 text-gray-300">
                            {appointment.service_type}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {getDateLabel(appointment.scheduled_at)} at {format(new Date(appointment.scheduled_at), "h:mm a")}
                        </span>
                        {appointment.duration_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {appointment.duration_minutes} min
                          </span>
                        )}
                      </div>
                      {appointment.notes && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {appointment.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-11 sm:ml-0">
                    {getStatusBadge(appointment.status)}
                    {appointment.status === "pending" && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-green-400 hover:text-green-300 hover:bg-green-500/20"
                          onClick={() => updateAppointmentStatus(appointment.id, "confirmed")}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          onClick={() => updateAppointmentStatus(appointment.id, "cancelled")}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {appointment.status === "confirmed" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                        onClick={() => updateAppointmentStatus(appointment.id, "completed")}
                      >
                        <CalendarCheck className="h-4 w-4" />
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
