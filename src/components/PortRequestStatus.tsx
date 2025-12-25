import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Phone, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight } from "lucide-react";

interface PortRequest {
  id: string;
  phone_number: string;
  status: string;
  target_port_date: string | null;
  actual_port_date: string | null;
  rejection_reason: string | null;
  created_at: string;
  authorized_rep_email: string | null;
}

interface PortRequestStatusProps {
  businessId: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Draft", color: "bg-gray-500", icon: <Clock className="h-3 w-3" /> },
  submitted: { label: "Submitted", color: "bg-blue-500", icon: <Clock className="h-3 w-3" /> },
  pending: { label: "Pending", color: "bg-yellow-500", icon: <Clock className="h-3 w-3" /> },
  in_progress: { label: "In Progress", color: "bg-purple-500", icon: <ArrowRight className="h-3 w-3" /> },
  approved: { label: "Approved", color: "bg-green-500", icon: <CheckCircle className="h-3 w-3" /> },
  porting: { label: "Porting", color: "bg-purple-500", icon: <ArrowRight className="h-3 w-3" /> },
  completed: { label: "Completed", color: "bg-green-600", icon: <CheckCircle className="h-3 w-3" /> },
  ported: { label: "Ported", color: "bg-green-600", icon: <CheckCircle className="h-3 w-3" /> },
  rejected: { label: "Rejected", color: "bg-red-500", icon: <XCircle className="h-3 w-3" /> },
  failed: { label: "Failed", color: "bg-red-500", icon: <XCircle className="h-3 w-3" /> },
  cancelled: { label: "Cancelled", color: "bg-gray-500", icon: <XCircle className="h-3 w-3" /> },
};

export function PortRequestStatus({ businessId }: PortRequestStatusProps) {
  const [portRequests, setPortRequests] = useState<PortRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchPortRequests = async (showRefreshToast = false) => {
    try {
      const { data, error } = await supabase.functions.invoke("twilio-get-port-status", {
        body: { business_id: businessId },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setPortRequests(data.port_requests || []);
      
      if (showRefreshToast) {
        toast({ title: "Status updated", description: "Port request statuses have been refreshed." });
      }
    } catch (error: any) {
      console.error("Error fetching port requests:", error);
      if (showRefreshToast) {
        toast({
          variant: "destructive",
          title: "Failed to refresh",
          description: error.message,
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPortRequests();
  }, [businessId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPortRequests(true);
  };

  const getStatusInfo = (status: string) => {
    return STATUS_CONFIG[status.toLowerCase()] || STATUS_CONFIG.pending;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="py-8">
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (portRequests.length === 0) {
    return null; // Don't show the card if there are no port requests
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-white flex items-center gap-2">
            <Phone className="h-5 w-5 text-purple-400" />
            Port Requests
          </CardTitle>
          <CardDescription className="text-gray-400">
            Track the status of your number porting requests
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-gray-400 hover:text-white hover:bg-gray-700"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {portRequests.map((request) => {
          const statusInfo = getStatusInfo(request.status);
          const isComplete = ['completed', 'ported'].includes(request.status.toLowerCase());
          const isFailed = ['rejected', 'failed', 'cancelled'].includes(request.status.toLowerCase());

          return (
            <div
              key={request.id}
              className={`rounded-lg border p-4 ${
                isComplete
                  ? "border-green-500/30 bg-green-500/5"
                  : isFailed
                    ? "border-red-500/30 bg-red-500/5"
                    : "border-gray-600 bg-gray-700/30"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-purple-400" />
                    <span className="font-mono text-white">{request.phone_number}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>Submitted {formatDate(request.created_at)}</span>
                    {request.target_port_date && (
                      <>
                        <span>•</span>
                        <span>Target: {formatDate(request.target_port_date)}</span>
                      </>
                    )}
                  </div>
                </div>
                <Badge className={`${statusInfo.color} text-white flex items-center gap-1`}>
                  {statusInfo.icon}
                  {statusInfo.label}
                </Badge>
              </div>

              {request.actual_port_date && (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <p className="text-sm text-green-400">
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                    Ported on {formatDate(request.actual_port_date)}
                  </p>
                </div>
              )}

              {request.rejection_reason && (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{request.rejection_reason}</p>
                  </div>
                </div>
              )}

              {/* Progress indicator for active requests */}
              {!isComplete && !isFailed && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <span className={request.status !== 'draft' ? 'text-purple-400' : ''}>Submitted</span>
                    <div className={`flex-1 h-0.5 ${['approved', 'in_progress', 'porting'].includes(request.status.toLowerCase()) ? 'bg-purple-500' : 'bg-gray-600'}`} />
                    <span className={['approved', 'in_progress', 'porting'].includes(request.status.toLowerCase()) ? 'text-purple-400' : ''}>Processing</span>
                    <div className={`flex-1 h-0.5 ${request.status.toLowerCase() === 'porting' ? 'bg-purple-500' : 'bg-gray-600'}`} />
                    <span>Complete</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
