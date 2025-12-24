import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Phone, MessageSquare, Calendar, Bell, Settings as SettingsIcon, LogOut, PhoneMissed, PhoneIncoming, Users, BarChart3, Menu, FileText } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { EditPhoneDialog } from "@/components/EditPhoneDialog";
import { ChangeAIPhoneDialog } from "@/components/ChangeAIPhoneDialog";
import { AddAIPhoneDialog } from "@/components/AddAIPhoneDialog";
import Settings from "./Settings";
import Calls from "./Calls";
import Conversations from "./Conversations";
import Appointments from "./Appointments";
import Inquiries from "./Inquiries";
import Contacts from "./Contacts";
import Templates from "./Templates";
interface Business {
  id: string;
  name: string;
  twilio_phone_number: string | null;
  owner_phone: string | null;
  subscription_status: string;
}
interface DashboardStats {
  totalCalls: number;
  missedCalls: number;
  conversations: number;
  appointments: number;
  inquiries: number;
}
export default function Dashboard() {
  const {
    user,
    loading,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [business, setBusiness] = useState<Business | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalCalls: 0,
    missedCalls: 0,
    conversations: 0,
    appointments: 0,
    inquiries: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [updatedStats, setUpdatedStats] = useState<Set<string>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Helper to trigger pulse animation and update timestamp
  const triggerPulse = (statKeys: string[]) => {
    setUpdatedStats(new Set(statKeys));
    setLastUpdated(new Date());
    setTimeout(() => setUpdatedStats(new Set()), 1500);
  };

  // Format relative time
  const formatLastUpdated = (date: Date | null) => {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 5) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Update displayed time every 10 seconds
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);
  const fetchBusiness = useCallback(async () => {
    try {
      // Fetch business
      const {
        data: businessData,
        error: businessError
      } = await supabase.from("businesses").select("*").eq("owner_user_id", user?.id).single();
      if (businessError) {
        if (businessError.code === "PGRST116") {
          // No business found, redirect to onboarding
          navigate("/onboarding");
          return;
        }
        throw businessError;
      }
      setBusiness(businessData);

      // Fetch stats
      const businessId = businessData.id;
      const [callsRes, convsRes, apptsRes, inquiriesRes] = await Promise.all([supabase.from("calls").select("id, was_answered", {
        count: "exact"
      }).eq("business_id", businessId), supabase.from("conversations").select("id", {
        count: "exact"
      }).eq("business_id", businessId), supabase.from("appointments").select("id", {
        count: "exact"
      }).eq("business_id", businessId), supabase.from("inquiries").select("id", {
        count: "exact"
      }).eq("business_id", businessId).eq("status", "new")]);
      const totalCalls = callsRes.count || 0;
      const missedCalls = callsRes.data?.filter(c => !c.was_answered).length || 0;
      setStats({
        totalCalls,
        missedCalls,
        conversations: convsRes.count || 0,
        appointments: apptsRes.count || 0,
        inquiries: inquiriesRes.count || 0
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, navigate]);
  useEffect(() => {
    if (user) {
      fetchBusiness();
    }
  }, [user, fetchBusiness]);

  // Real-time subscriptions for stats updates
  useEffect(() => {
    if (!business?.id) return;

    const businessId = business.id;

    // Subscribe to calls changes
    const callsChannel = supabase
      .channel('dashboard-calls')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calls', filter: `business_id=eq.${businessId}` },
        async () => {
          const { data, count } = await supabase
            .from("calls")
            .select("id, was_answered", { count: "exact" })
            .eq("business_id", businessId);
          const totalCalls = count || 0;
          const missedCalls = data?.filter(c => !c.was_answered).length || 0;
          setStats(prev => ({ ...prev, totalCalls, missedCalls }));
          triggerPulse(['totalCalls', 'missedCalls']);
        }
      )
      .subscribe();

    // Subscribe to conversations changes
    const convsChannel = supabase
      .channel('dashboard-conversations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations', filter: `business_id=eq.${businessId}` },
        async () => {
          const { count } = await supabase
            .from("conversations")
            .select("id", { count: "exact" })
            .eq("business_id", businessId);
          setStats(prev => ({ ...prev, conversations: count || 0 }));
          triggerPulse(['conversations']);
        }
      )
      .subscribe();

    // Subscribe to appointments changes
    const apptsChannel = supabase
      .channel('dashboard-appointments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments', filter: `business_id=eq.${businessId}` },
        async () => {
          const { count } = await supabase
            .from("appointments")
            .select("id", { count: "exact" })
            .eq("business_id", businessId);
          setStats(prev => ({ ...prev, appointments: count || 0 }));
          triggerPulse(['appointments']);
        }
      )
      .subscribe();

    // Subscribe to inquiries changes
    const inquiriesChannel = supabase
      .channel('dashboard-inquiries')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inquiries', filter: `business_id=eq.${businessId}` },
        async () => {
          const { count } = await supabase
            .from("inquiries")
            .select("id", { count: "exact" })
            .eq("business_id", businessId)
            .eq("status", "new");
          setStats(prev => ({ ...prev, inquiries: count || 0 }));
          triggerPulse(['inquiries']);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(callsChannel);
      supabase.removeChannel(convsChannel);
      supabase.removeChannel(apptsChannel);
      supabase.removeChannel(inquiriesChannel);
    };
  }, [business?.id]);
  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };
  if (loading || isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>;
  }
  const navItems = [{
    icon: BarChart3,
    label: "Overview",
    path: "/dashboard"
  }, {
    icon: PhoneIncoming,
    label: "Calls",
    path: "/dashboard/calls"
  }, {
    icon: MessageSquare,
    label: "Conversations",
    path: "/dashboard/conversations"
  }, {
    icon: Calendar,
    label: "Appointments",
    path: "/dashboard/appointments"
  }, {
    icon: Bell,
    label: "Inquiries",
    path: "/dashboard/inquiries",
    badge: stats.inquiries
  }, {
    icon: Users,
    label: "Contacts",
    path: "/dashboard/contacts"
  }, {
    icon: FileText,
    label: "Templates",
    path: "/dashboard/templates"
  }, {
    icon: SettingsIcon,
    label: "Settings",
    path: "/dashboard/settings"
  }];
  const Sidebar = ({
    mobile = false
  }: {
    mobile?: boolean;
  }) => <div className={`${mobile ? "" : "hidden lg:flex"} flex-col w-64 bg-gray-800/50 border-r border-gray-700`}>
      <div className="p-6 border-b border-gray-700">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
            <Phone className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-white">LocalEdgeAI</span>
        </Link>
      </div>

      <div className="p-4 border-b border-gray-700">
        <div className="text-sm text-gray-400">Business</div>
        <div className="font-medium text-white">{business?.name}</div>
        {business?.twilio_phone_number ? <div className="flex items-center gap-2">
            <span className="text-sm text-purple-400 font-mono">{business.twilio_phone_number}</span>
            <ChangeAIPhoneDialog businessId={business.id} currentPhone={business.twilio_phone_number} onUpdate={fetchBusiness} />
          </div> : business ? <AddAIPhoneDialog businessId={business.id} onUpdate={fetchBusiness} trigger={<button className="text-sm text-yellow-400 hover:underline">
                + Add phone number
              </button>} /> : null}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${location.pathname === item.path ? "bg-purple-600 text-white" : "text-gray-400 hover:bg-gray-700 hover:text-white"}`}>
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
            {item.badge && item.badge > 0 && <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {item.badge}
              </span>}
          </Link>)}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2 w-full text-gray-400 hover:bg-gray-700 hover:text-white rounded-lg transition-colors">
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>;
  return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-800/95 backdrop-blur border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
            <Phone className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-white">LocalEdgeAI</span>
        </Link>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-gray-800 border-gray-700">
            <Sidebar mobile />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {location.pathname === "/dashboard/settings" ? <Settings /> : location.pathname === "/dashboard/calls" ? <Calls /> : location.pathname === "/dashboard/conversations" ? <Conversations /> : location.pathname === "/dashboard/appointments" ? <Appointments /> : location.pathname === "/dashboard/inquiries" ? <Inquiries /> : location.pathname === "/dashboard/contacts" ? <Contacts /> : location.pathname === "/dashboard/templates" ? <Templates /> : <>
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                  <p className="text-gray-400">Welcome back, {user?.email}</p>
                </div>
                {lastUpdated && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span>Updated {formatLastUpdated(lastUpdated)}</span>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {isLoading ? (
                  <>
                    {[...Array(4)].map((_, i) => (
                      <Card key={i} className="bg-gray-800/50 border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-9 w-9 rounded-lg bg-gray-700" />
                            <div className="space-y-2">
                              <Skeleton className="h-6 w-12 bg-gray-700" />
                              <Skeleton className="h-4 w-20 bg-gray-700" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : (
                  <>
                    <Card className={`bg-gray-800/50 border-gray-700 transition-all duration-300 ${updatedStats.has('totalCalls') ? 'ring-2 ring-blue-400/50 animate-pulse' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 bg-blue-500/20 rounded-lg transition-all duration-300 ${updatedStats.has('totalCalls') ? 'bg-blue-500/40 scale-110' : ''}`}>
                            <PhoneIncoming className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-white">{stats.totalCalls}</p>
                            <p className="text-sm text-gray-400">Total Calls</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className={`bg-gray-800/50 border-gray-700 transition-all duration-300 ${updatedStats.has('missedCalls') ? 'ring-2 ring-red-400/50 animate-pulse' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 bg-red-500/20 rounded-lg transition-all duration-300 ${updatedStats.has('missedCalls') ? 'bg-red-500/40 scale-110' : ''}`}>
                            <PhoneMissed className="h-5 w-5 text-red-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-white">{stats.missedCalls}</p>
                            <p className="text-sm text-gray-400">Missed Calls</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className={`bg-gray-800/50 border-gray-700 transition-all duration-300 ${updatedStats.has('conversations') ? 'ring-2 ring-purple-400/50 animate-pulse' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 bg-purple-500/20 rounded-lg transition-all duration-300 ${updatedStats.has('conversations') ? 'bg-purple-500/40 scale-110' : ''}`}>
                            <MessageSquare className="h-5 w-5 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-white">{stats.conversations}</p>
                            <p className="text-sm text-gray-400">Conversations</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className={`bg-gray-800/50 border-gray-700 transition-all duration-300 ${updatedStats.has('appointments') ? 'ring-2 ring-green-400/50 animate-pulse' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 bg-green-500/20 rounded-lg transition-all duration-300 ${updatedStats.has('appointments') ? 'bg-green-500/40 scale-110' : ''}`}>
                            <Calendar className="h-5 w-5 text-green-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-white">{stats.appointments}</p>
                            <p className="text-sm text-gray-400">Appointments</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              {/* Quick Actions */}
              <div className="grid lg:grid-cols-2 gap-6">
                {isLoading ? (
                  <>
                    {[...Array(2)].map((_, i) => (
                      <Card key={i} className="bg-gray-800/50 border-gray-700">
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-5 rounded bg-gray-700" />
                            <Skeleton className="h-5 w-32 bg-gray-700" />
                          </div>
                          <Skeleton className="h-4 w-48 mt-2 bg-gray-700" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-10 w-32 bg-gray-700" />
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : (
                  <>
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Bell className="h-5 w-5 text-yellow-400" />
                          New Inquiries
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          {stats.inquiries > 0 ? `${stats.inquiries} inquiry needs your attention` : "No new inquiries"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Link to="/dashboard/inquiries">
                          <Button variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white">
                            View Inquiries
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Users className="h-5 w-5 text-blue-400" />
                          Recent Activity
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          View your recent calls and conversations
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Link to="/dashboard/calls">
                          <Button variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white">
                            View Calls
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              {/* Setup reminder if no phone number */}
              {!business?.twilio_phone_number && <Card className="mt-6 bg-yellow-500/10 border-yellow-500/30">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-yellow-400" />
                      <div>
                        <p className="font-medium text-white">Complete your setup</p>
                        <p className="text-sm text-gray-400">Add a phone number to start receiving calls</p>
                      </div>
                    </div>
                    {business && <AddAIPhoneDialog businessId={business.id} onUpdate={fetchBusiness} />}
                  </CardContent>
                </Card>}
            </>}
        </div>
      </div>
    </div>;
}