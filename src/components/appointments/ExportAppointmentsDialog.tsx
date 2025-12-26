import { useState } from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ExportAppointmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
}

export function ExportAppointmentsDialog({
  open,
  onOpenChange,
  businessId,
}: ExportAppointmentsDialogProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<"csv" | "pdf" | null>(null);

  const fetchAppointmentsForExport = async () => {
    if (!startDate || !endDate) return [];

    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        scheduled_at,
        duration_minutes,
        service_type,
        status,
        notes,
        confirmation_code,
        reminder_sent_at,
        reminder_response,
        contact:contacts(name, phone_number, email)
      `)
      .eq("business_id", businessId)
      .gte("scheduled_at", startOfDay(startDate).toISOString())
      .lte("scheduled_at", endOfDay(endDate).toISOString())
      .order("scheduled_at", { ascending: true });

    if (error) {
      console.error("Error fetching appointments:", error);
      throw error;
    }

    return data || [];
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    setExportType("csv");
    try {
      const appointments = await fetchAppointmentsForExport();

      if (appointments.length === 0) {
        toast.error("No appointments found in selected date range");
        return;
      }

      const headers = [
        "Date",
        "Time",
        "Duration (min)",
        "Service",
        "Status",
        "Customer Name",
        "Phone",
        "Email",
        "Notes",
        "Confirmation Code",
        "Reminder Sent",
        "Customer Response",
      ];

      const rows = appointments.map((apt) => [
        format(new Date(apt.scheduled_at), "yyyy-MM-dd"),
        format(new Date(apt.scheduled_at), "HH:mm"),
        apt.duration_minutes || 60,
        apt.service_type || "",
        apt.status || "pending",
        apt.contact?.name || "Unknown",
        apt.contact?.phone_number || "",
        apt.contact?.email || "",
        (apt.notes || "").replace(/"/g, '""'),
        apt.confirmation_code || "",
        apt.reminder_sent_at ? format(new Date(apt.reminder_sent_at), "yyyy-MM-dd HH:mm") : "",
        apt.reminder_response || "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${cell}"`).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `appointments_${format(startDate!, "yyyy-MM-dd")}_to_${format(endDate!, "yyyy-MM-dd")}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("CSV exported successfully", {
        description: `${appointments.length} appointments exported`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export appointments");
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    setExportType("pdf");
    try {
      const appointments = await fetchAppointmentsForExport();

      if (appointments.length === 0) {
        toast.error("No appointments found in selected date range");
        return;
      }

      // Generate HTML for PDF
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Appointments Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h1 { color: #1a1a1a; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
            .date-range { color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #6366f1; color: white; padding: 12px 8px; text-align: left; font-size: 12px; }
            td { padding: 10px 8px; border-bottom: 1px solid #e5e5e5; font-size: 11px; }
            tr:nth-child(even) { background: #f9fafb; }
            .status-pending { color: #f59e0b; }
            .status-confirmed { color: #10b981; }
            .status-completed { color: #3b82f6; }
            .status-cancelled { color: #ef4444; }
            .footer { margin-top: 30px; text-align: center; color: #999; font-size: 10px; }
          </style>
        </head>
        <body>
          <h1>Appointments Report</h1>
          <p class="date-range">${format(startDate!, "MMMM d, yyyy")} - ${format(endDate!, "MMMM d, yyyy")}</p>
          <p>Total: ${appointments.length} appointments</p>
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${appointments
                .map(
                  (apt) => `
                <tr>
                  <td>${format(new Date(apt.scheduled_at), "MMM d, yyyy h:mm a")}</td>
                  <td>${apt.contact?.name || "Unknown"}<br><small>${apt.contact?.phone_number || ""}</small></td>
                  <td>${apt.service_type || "-"}</td>
                  <td>${apt.duration_minutes || 60} min</td>
                  <td class="status-${apt.status || "pending"}">${apt.status || "pending"}</td>
                  <td>${apt.notes || "-"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <p class="footer">Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
        </body>
        </html>
      `;

      // Open print dialog
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
      }

      toast.success("PDF ready for printing", {
        description: `${appointments.length} appointments included`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Appointments</DialogTitle>
          <DialogDescription>
            Select a date range and export format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MMM d, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MMM d, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => startDate ? date < startDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={exportToCSV}
              disabled={!startDate || !endDate || isExporting}
              className="flex-1"
              variant="outline"
            >
              {isExporting && exportType === "csv" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export CSV
            </Button>
            <Button
              onClick={exportToPDF}
              disabled={!startDate || !endDate || isExporting}
              className="flex-1"
            >
              {isExporting && exportType === "pdf" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Export PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
