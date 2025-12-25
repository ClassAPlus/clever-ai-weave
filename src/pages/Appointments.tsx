import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Calendar, Clock, User, RefreshCw, Filter,
  CheckCircle, XCircle, AlertCircle, CalendarCheck, Bell, MessageSquare, Send,
  ChevronLeft, ChevronRight, List, CalendarDays, LayoutGrid, Plus, GripVertical, AlignJustify
} from "lucide-react";
import { CreateAppointmentDialog } from "@/components/CreateAppointmentDialog";
import { DraggableAppointment } from "@/components/appointments/DraggableAppointment";
import { DroppableDayCell } from "@/components/appointments/DroppableDayCell";
import { AppointmentDetailsDialog } from "@/components/appointments/AppointmentDetailsDialog";
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { 
  format, formatDistanceToNow, isPast, isToday, isTomorrow, 
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  addDays, addWeeks, addMonths, subDays, subWeeks, subMonths,
  eachDayOfInterval, isSameDay, isSameMonth, getDay, setHours, setMinutes, getHours, getMinutes
} from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface Appointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  service_type: string | null;
  status: string | null;
  notes: string | null;
  confirmation_code: string | null;
  created_at: string | null;
  reminder_sent_at: string | null;
  reminder_response: string | null;
  reminder_response_at: string | null;
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
  remindersSent: number;
  customerConfirmed: number;
  customerCancelled: number;
}

type ViewMode = "day" | "week" | "month" | "agenda";

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<AppointmentStats>({ 
    total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0,
    remindersSent: 0, customerConfirmed: 0, customerCancelled: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all");
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedDateForCreate, setSelectedDateForCreate] = useState<Date>(new Date());
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const isInitialLoad = useRef(true);

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDetailsDialogOpen(true);
  };

  // DnD sensors with activation constraint to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDayClick = (day: Date) => {
    setSelectedDateForCreate(day);
    setCreateDialogOpen(true);
  };

  const handleDragStart = (event: any) => {
    const { active } = event;
    const appointment = appointments.find(apt => apt.id === active.id);
    if (appointment) {
      setActiveAppointment(appointment);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveAppointment(null);

    if (!over) return;

    const appointmentId = active.id as string;
    const droppedData = over.data.current as { day: Date } | undefined;
    
    if (!droppedData?.day) return;

    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (!appointment) return;

    const oldDate = new Date(appointment.scheduled_at);
    const newDate = droppedData.day;

    // If dropped on the same day, do nothing
    if (isSameDay(oldDate, newDate)) return;

    // Keep the same time, just change the date
    const newScheduledAt = setMinutes(
      setHours(newDate, getHours(oldDate)),
      getMinutes(oldDate)
    );

    try {
      const { error } = await supabase
        .from("appointments")
        .update({ scheduled_at: newScheduledAt.toISOString() })
        .eq("id", appointmentId);

      if (error) throw error;

      toast.success("Appointment rescheduled", {
        description: `Moved to ${format(newScheduledAt, "EEEE, MMM d 'at' h:mm a")}`,
      });

      fetchAppointments();
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      toast.error("Failed to reschedule appointment");
    }
  };

  const getDateRange = useCallback(() => {
    switch (viewMode) {
      case "day":
      case "agenda":
        return { start: startOfDay(currentDate), end: endOfDay(currentDate) };
      case "week":
        return { start: startOfWeek(currentDate, { weekStartsOn: 0 }), end: endOfWeek(currentDate, { weekStartsOn: 0 }) };
      case "month":
        return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
    }
  }, [viewMode, currentDate]);

  const fetchAppointments = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
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

      const { start, end } = getDateRange();

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
          reminder_sent_at,
          reminder_response,
          reminder_response_at,
          contact:contacts(id, name, phone_number)
        `)
        .eq("business_id", business.id)
        .gte("scheduled_at", start.toISOString())
        .lte("scheduled_at", end.toISOString())
        .order("scheduled_at", { ascending: true });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data: appointmentsData, error: apptsError } = await query;

      if (apptsError) {
        console.error("Error fetching appointments:", apptsError);
        return;
      }

      setAppointments(appointmentsData || []);

      // Fetch stats for current view
      const { data: allAppts } = await supabase
        .from("appointments")
        .select("status, reminder_sent_at, reminder_response")
        .eq("business_id", business.id)
        .gte("scheduled_at", start.toISOString())
        .lte("scheduled_at", end.toISOString());

      if (allAppts) {
        setStats({
          total: allAppts.length,
          pending: allAppts.filter(a => a.status === "pending").length,
          confirmed: allAppts.filter(a => a.status === "confirmed").length,
          completed: allAppts.filter(a => a.status === "completed").length,
          cancelled: allAppts.filter(a => a.status === "cancelled").length,
          remindersSent: allAppts.filter(a => a.reminder_sent_at !== null).length,
          customerConfirmed: allAppts.filter(a => a.reminder_response === "confirmed").length,
          customerCancelled: allAppts.filter(a => a.reminder_response === "cancelled").length,
        });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, filter, getDateRange]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    if (!businessId) return;

    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          filter: `business_id=eq.${businessId}`
        },
        () => {
          if (!isInitialLoad.current) {
            toast.info("New appointment", {
              description: "A new appointment has been scheduled",
              icon: <Calendar className="h-4 w-4 text-purple-400" />
            });
          }
          fetchAppointments();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `business_id=eq.${businessId}`
        },
        () => {
          fetchAppointments();
        }
      )
      .subscribe();

    setTimeout(() => {
      isInitialLoad.current = false;
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, fetchAppointments]);

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

      fetchAppointments();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const sendManualReminder = async (appointmentId: string) => {
    setSendingReminderId(appointmentId);
    try {
      const { data, error } = await supabase.functions.invoke('send-appointment-reminder', {
        body: { appointmentId }
      });

      if (error) {
        console.error("Error sending reminder:", error);
        toast.error("Failed to send reminder", {
          description: error.message
        });
        return;
      }

      if (data?.success) {
        toast.success("Reminder sent!", {
          description: "The customer has been notified via SMS"
        });
        fetchAppointments();
      } else {
        toast.error("Failed to send reminder", {
          description: data?.error || "Unknown error"
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to send reminder");
    } finally {
      setSendingReminderId(null);
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    setCurrentDate(prev => {
      switch (viewMode) {
        case "day":
        case "agenda":
          return direction === "prev" ? subDays(prev, 1) : addDays(prev, 1);
        case "week":
          return direction === "prev" ? subWeeks(prev, 1) : addWeeks(prev, 1);
        case "month":
          return direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1);
      }
    });
  };

  const goToToday = () => setCurrentDate(new Date());

  const getDateRangeLabel = () => {
    const { start, end } = getDateRange();
    switch (viewMode) {
      case "day":
      case "agenda":
        return format(currentDate, "EEEE, MMMM d, yyyy");
      case "week":
        return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
      case "month":
        return format(currentDate, "MMMM yyyy");
    }
  };

  const formatPhoneNumber = (phone: string) => phone;

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
      case "rescheduled":
        return (
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
            <Calendar className="h-3 w-3 mr-1" />
            Rescheduled
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

  const getReminderBadge = (appointment: Appointment) => {
    if (!appointment.reminder_sent_at) return null;
    
    if (appointment.reminder_response === 'confirmed') {
      return (
        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
          <MessageSquare className="h-3 w-3 mr-1" />
          Customer Confirmed
        </Badge>
      );
    }
    
    if (appointment.reminder_response === 'cancelled') {
      return (
        <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
          <MessageSquare className="h-3 w-3 mr-1" />
          Customer Cancelled
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
        <Bell className="h-3 w-3 mr-1" />
        Reminder Sent
      </Badge>
    );
  };

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter(apt => isSameDay(new Date(apt.scheduled_at), day));
  };

  const renderAppointmentCard = (appointment: Appointment, compact = false) => (
    <div 
      key={appointment.id} 
      className={`flex flex-col p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 hover:ring-1 hover:ring-purple-400 transition-colors cursor-pointer ${compact ? 'text-xs' : ''}`}
      onClick={() => handleAppointmentClick(appointment)}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className={`font-medium text-white ${compact ? 'text-xs truncate' : ''}`}>
          {appointment.contact?.name || formatPhoneNumber(appointment.contact?.phone_number || "Unknown")}
        </span>
        {!compact && getStatusBadge(appointment.status)}
      </div>
      <div className="flex items-center gap-2 text-gray-400">
        <Clock className="h-3 w-3" />
        <span>{format(new Date(appointment.scheduled_at), "h:mm a")}</span>
        {appointment.duration_minutes && <span>({appointment.duration_minutes}m)</span>}
      </div>
      {appointment.service_type && (
        <Badge variant="outline" className="border-gray-600 text-gray-300 mt-2 w-fit text-xs">
          {appointment.service_type}
        </Badge>
      )}
      {!compact && (
        <div className="flex items-center gap-2 mt-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
          {getReminderBadge(appointment)}
          {!isPast(new Date(appointment.scheduled_at)) &&
           appointment.status !== "completed" && appointment.status !== "cancelled" && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20"
              onClick={() => sendManualReminder(appointment.id)}
              disabled={sendingReminderId === appointment.id}
            >
              {sendingReminderId === appointment.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3 w-3" />
              )}
            </Button>
          )}
          {appointment.status === "pending" && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-green-400 hover:text-green-300 hover:bg-green-500/20"
                onClick={() => updateAppointmentStatus(appointment.id, "confirmed")}
              >
                <CheckCircle className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                onClick={() => updateAppointmentStatus(appointment.id, "cancelled")}
              >
                <XCircle className="h-3 w-3" />
              </Button>
            </>
          )}
          {appointment.status === "confirmed" && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
              onClick={() => updateAppointmentStatus(appointment.id, "completed")}
            >
              <CalendarCheck className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
      {compact && (
        <div className={`mt-1 h-1 rounded-full ${
          appointment.status === 'confirmed' ? 'bg-green-500' :
          appointment.status === 'cancelled' ? 'bg-red-500' :
          appointment.status === 'completed' ? 'bg-blue-500' :
          'bg-yellow-500'
        }`} />
      )}
    </div>
  );

  const renderDayView = () => (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-400" />
            {format(currentDate, "EEEE, MMMM d")}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
          </CardDescription>
        </div>
        <Button
          size="sm"
          onClick={() => handleDayClick(currentDate)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div 
            className="text-center py-8 text-gray-400 cursor-pointer hover:bg-gray-700/30 rounded-lg transition-colors"
            onClick={() => handleDayClick(currentDate)}
          >
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No appointments for this day</p>
            <p className="text-sm text-purple-400 mt-2">Click to add one</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map(apt => renderAppointmentCard(apt))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderWeekView = () => {
    const { start, end } = getDateRange();
    const days = eachDayOfInterval({ start, end });

    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map(day => {
          const dayAppointments = getAppointmentsForDay(day);
          const isCurrentDay = isToday(day);
          
          return (
            <DroppableDayCell
              key={day.toISOString()}
              day={day}
              isCurrentDay={isCurrentDay}
              onClick={() => handleDayClick(day)}
              variant="week"
            >
              {dayAppointments.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">Drag here or click to add</p>
              ) : (
                dayAppointments.map(apt => (
                  <DraggableAppointment 
                    key={apt.id} 
                    appointment={apt} 
                    compact 
                    onClick={handleAppointmentClick}
                  />
                ))
              )}
            </DroppableDayCell>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b border-gray-700">
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center text-xs font-medium text-gray-400 bg-gray-800/80">
              {day}
            </div>
          ))}
        </div>
        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map(day => {
            const dayAppointments = getAppointmentsForDay(day);
            const isCurrentDay = isToday(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            
            return (
              <DroppableDayCell
                key={day.toISOString()}
                day={day}
                isCurrentDay={isCurrentDay}
                isCurrentMonth={isCurrentMonth}
                onClick={() => handleDayClick(day)}
                variant="month"
              >
                {dayAppointments.slice(0, 3).map(apt => (
                  <DraggableAppointment 
                    key={apt.id} 
                    appointment={apt} 
                    compact 
                    onClick={handleAppointmentClick}
                  />
                ))}
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-gray-400 text-center">
                    +{dayAppointments.length - 3} more
                  </div>
                )}
              </DroppableDayCell>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAgendaView = () => {
    // Generate hour slots from 6 AM to 10 PM
    const hourSlots = Array.from({ length: 17 }, (_, i) => i + 6);
    
    const getAppointmentsForHour = (hour: number) => {
      return appointments.filter(apt => {
        const aptHour = getHours(new Date(apt.scheduled_at));
        return aptHour === hour;
      });
    };

    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <AlignJustify className="h-5 w-5 text-purple-400" />
              {format(currentDate, "EEEE, MMMM d")}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} today
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => handleDayClick(currentDate)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-700/50">
            {hourSlots.map(hour => {
              const hourAppointments = getAppointmentsForHour(hour);
              const timeLabel = format(setHours(new Date(), hour), "h a");
              const isCurrentHour = isToday(currentDate) && getHours(new Date()) === hour;
              
              return (
                <div 
                  key={hour} 
                  className={`flex min-h-[60px] hover:bg-gray-700/20 transition-colors cursor-pointer ${
                    isCurrentHour ? 'bg-purple-500/10 border-l-2 border-purple-500' : ''
                  }`}
                  onClick={() => {
                    const dateWithHour = setHours(currentDate, hour);
                    setSelectedDateForCreate(dateWithHour);
                    setCreateDialogOpen(true);
                  }}
                >
                  {/* Time column */}
                  <div className={`w-20 flex-shrink-0 p-3 text-right border-r border-gray-700/50 ${
                    isCurrentHour ? 'text-purple-400 font-medium' : 'text-gray-500'
                  }`}>
                    <span className="text-sm">{timeLabel}</span>
                  </div>
                  
                  {/* Appointments column */}
                  <div className="flex-1 p-2">
                    {hourAppointments.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <span className="text-xs text-gray-600 opacity-0 hover:opacity-100 transition-opacity">
                          Click to add
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {hourAppointments.map(apt => (
                          <div
                            key={apt.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:ring-1 hover:ring-purple-400 ${
                              apt.status === 'confirmed' ? 'bg-green-500/10 border-green-500/30' :
                              apt.status === 'cancelled' ? 'bg-red-500/10 border-red-500/30' :
                              apt.status === 'completed' ? 'bg-blue-500/10 border-blue-500/30' :
                              'bg-gray-700/30 border-gray-600/50'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAppointmentClick(apt);
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-white truncate">
                                    {apt.contact?.name || apt.contact?.phone_number || "Unknown"}
                                  </span>
                                  {getStatusBadge(apt.status)}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(apt.scheduled_at), "h:mm a")}
                                  </span>
                                  {apt.duration_minutes && (
                                    <span>{apt.duration_minutes} min</span>
                                  )}
                                  {apt.service_type && (
                                    <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                                      {apt.service_type}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {getReminderBadge(apt)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
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
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => handleDayClick(currentDate)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
          <Button 
            onClick={fetchAppointments} 
            variant="outline" 
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* View Toggle & Date Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigateDate("prev")}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToToday}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Today
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigateDate("next")}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-white font-medium ml-2">{getDateRangeLabel()}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)}>
            <ToggleGroupItem 
              value="day" 
              className="data-[state=on]:bg-purple-500/20 data-[state=on]:text-purple-300"
            >
              <List className="h-4 w-4 mr-1" />
              Day
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="week"
              className="data-[state=on]:bg-purple-500/20 data-[state=on]:text-purple-300"
            >
              <CalendarDays className="h-4 w-4 mr-1" />
              Week
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="month"
              className="data-[state=on]:bg-purple-500/20 data-[state=on]:text-purple-300"
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Month
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="agenda"
              className="data-[state=on]:bg-purple-500/20 data-[state=on]:text-purple-300"
            >
              <AlignJustify className="h-4 w-4 mr-1" />
              Agenda
            </ToggleGroupItem>
          </ToggleGroup>
          
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all" className="text-white hover:bg-gray-700">All</SelectItem>
              <SelectItem value="pending" className="text-white hover:bg-gray-700">Pending</SelectItem>
              <SelectItem value="confirmed" className="text-white hover:bg-gray-700">Confirmed</SelectItem>
              <SelectItem value="completed" className="text-white hover:bg-gray-700">Completed</SelectItem>
              <SelectItem value="cancelled" className="text-white hover:bg-gray-700">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-500/20 rounded-lg">
                <Calendar className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-gray-400">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-yellow-500/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{stats.pending}</p>
                <p className="text-xs text-gray-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-500/20 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{stats.confirmed}</p>
                <p className="text-xs text-gray-400">Confirmed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/20 rounded-lg">
                <CalendarCheck className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{stats.completed}</p>
                <p className="text-xs text-gray-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-500/20 rounded-lg">
                <XCircle className="h-4 w-4 text-red-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{stats.cancelled}</p>
                <p className="text-xs text-gray-400">Cancelled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View with Drag and Drop */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {viewMode === "day" && renderDayView()}
        {viewMode === "week" && renderWeekView()}
        {viewMode === "month" && renderMonthView()}
        {viewMode === "agenda" && renderAgendaView()}
        
        <DragOverlay>
          {activeAppointment ? (
            <div className="bg-purple-600/90 text-white p-2 rounded-lg shadow-xl text-sm max-w-[200px]">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4" />
                <span className="font-medium truncate">
                  {activeAppointment.contact?.name || "Unknown"}
                </span>
              </div>
              <div className="text-xs text-purple-200 ml-6">
                {format(new Date(activeAppointment.scheduled_at), "h:mm a")}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Create Appointment Dialog */}
      {businessId && (
        <CreateAppointmentDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          selectedDate={selectedDateForCreate}
          businessId={businessId}
          onAppointmentCreated={fetchAppointments}
        />
      )}

      {/* Appointment Details Dialog */}
      <AppointmentDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        appointment={selectedAppointment}
        onAppointmentUpdated={fetchAppointments}
      />
    </div>
  );
}
