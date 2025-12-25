import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Phone, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight, FileText, ChevronDown, ChevronUp, ExternalLink, Zap } from "lucide-react";

interface UploadedDocument {
  name: string;
  path: string;
  type: string;
}

interface PortRequest {
  id: string;
  phone_number: string;
  status: string;
  target_port_date: string | null;
  actual_port_date: string | null;
  rejection_reason: string | null;
  created_at: string;
  authorized_rep_email: string | null;
  uploaded_documents: UploadedDocument[] | null;
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
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const { toast } = useToast();

  const fetchPortRequests = useCallback(async (showRefreshToast = false) => {
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
  }, [businessId, toast]);

  // Initial fetch
  useEffect(() => {
    fetchPortRequests();
  }, [fetchPortRequests]);

  // Real-time subscription to port_requests table
  useEffect(() => {
    const channel = supabase
      .channel(`port-requests-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'port_requests',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          console.log('Port request update received:', payload);
          
          const newData = payload.new as any;
          const oldData = payload.old as any;

          if (payload.eventType === 'INSERT') {
            // New port request created
            toast({
              title: "New Port Request",
              description: `Port request for ${newData.phone_number} has been created.`,
            });
            fetchPortRequests();
          } else if (payload.eventType === 'UPDATE') {
            // Status changed
            const oldStatus = oldData?.status;
            const newStatus = newData?.status;
            
            if (oldStatus !== newStatus) {
              const statusLabel = STATUS_CONFIG[newStatus?.toLowerCase()]?.label || newStatus;
              toast({
                title: "Port Status Updated",
                description: `${newData.phone_number}: ${statusLabel}`,
                className: newStatus === 'completed' || newStatus === 'ported' 
                  ? 'border-green-500 bg-green-500/10' 
                  : newStatus === 'rejected' || newStatus === 'failed'
                    ? 'border-red-500 bg-red-500/10'
                    : undefined,
              });
            }
            fetchPortRequests();
          } else if (payload.eventType === 'DELETE') {
            toast({
              title: "Port Request Removed",
              description: "A port request has been removed.",
            });
            fetchPortRequests();
          }
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
        console.log('Port requests realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, fetchPortRequests, toast]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPortRequests(true);
  };

  const toggleExpanded = (requestId: string) => {
    setExpandedRequests(prev => {
      const next = new Set(prev);
      if (next.has(requestId)) {
        next.delete(requestId);
      } else {
        next.add(requestId);
      }
      return next;
    });
  };

  const handleDownloadDocument = async (doc: UploadedDocument) => {
    setDownloadingDoc(doc.path);
    try {
      // Create a signed URL for download (valid for 1 hour)
      const { data, error } = await supabase.storage
        .from('port-documents')
        .createSignedUrl(doc.path, 3600);

      if (error) throw error;
      if (!data?.signedUrl) throw new Error('Failed to generate download URL');

      // Open in new tab or trigger download
      window.open(data.signedUrl, '_blank');
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: error.message,
      });
    } finally {
      setDownloadingDoc(null);
    }
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

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    return '📎';
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

  const isEmpty = portRequests.length === 0;

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-white flex items-center gap-2">
            <Phone className="h-5 w-5 text-purple-400" />
            Port Requests
            {isRealtimeConnected && (
              <span className="flex items-center gap-1 text-xs font-normal text-green-400" title="Real-time updates active">
                <Zap className="h-3 w-3" />
                Live
              </span>
            )}
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
        {isEmpty ? (
          <div className="text-center py-8 text-gray-400">
            <Phone className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No port requests yet</p>
            <p className="text-xs text-gray-500 mt-1">
              Use "Port Existing Number" to transfer your phone number
            </p>
          </div>
        ) : (
          portRequests.map((request) => {
          const statusInfo = getStatusInfo(request.status);
          const isComplete = ['completed', 'ported'].includes(request.status.toLowerCase());
          const isFailed = ['rejected', 'failed', 'cancelled'].includes(request.status.toLowerCase());
          const hasDocuments = request.uploaded_documents && request.uploaded_documents.length > 0;
          const isExpanded = expandedRequests.has(request.id);

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

              {/* Documents Section */}
              {hasDocuments && (
                <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(request.id)}>
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between text-gray-400 hover:text-white hover:bg-gray-600/50 p-2 h-auto"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-purple-400" />
                          <span className="text-sm">
                            {request.uploaded_documents!.length} Document{request.uploaded_documents!.length !== 1 ? 's' : ''} Attached
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-2">
                      {request.uploaded_documents!.map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-lg">{getFileIcon(doc.type)}</span>
                            <span className="text-sm text-white truncate max-w-[180px]" title={doc.name}>
                              {doc.name}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadDocument(doc)}
                            disabled={downloadingDoc === doc.path}
                            className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 p-1 h-8 w-8"
                            title="Download document"
                          >
                            {downloadingDoc === doc.path ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ExternalLink className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </div>
                </Collapsible>
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
        })
        )}
      </CardContent>
    </Card>
  );
}
