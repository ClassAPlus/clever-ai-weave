import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  Trash2, 
  X, 
  Loader2,
  CheckSquare,
  Square
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BatchActionsToolbarProps {
  selectedIds: Set<string>;
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onActionComplete: () => void;
}

export function BatchActionsToolbar({
  selectedIds,
  totalCount,
  onClearSelection,
  onSelectAll,
  onActionComplete,
}: BatchActionsToolbarProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>("");

  const selectedCount = selectedIds.size;
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  const handleBatchStatusUpdate = async (newStatus: string) => {
    if (selectedCount === 0) return;

    setIsProcessing(true);
    setCurrentAction(newStatus);

    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .in("id", Array.from(selectedIds));

      if (error) throw error;

      toast.success(`${selectedCount} appointment${selectedCount > 1 ? 's' : ''} ${newStatus}`);
      onClearSelection();
      onActionComplete();
    } catch (error) {
      console.error("Error updating appointments:", error);
      toast.error("Failed to update appointments");
    } finally {
      setIsProcessing(false);
      setCurrentAction("");
    }
  };

  const handleBatchDelete = async () => {
    if (selectedCount === 0) return;

    setIsProcessing(true);
    setCurrentAction("delete");

    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .in("id", Array.from(selectedIds));

      if (error) throw error;

      toast.success(`${selectedCount} appointment${selectedCount > 1 ? 's' : ''} deleted`);
      onClearSelection();
      onActionComplete();
    } catch (error) {
      console.error("Error deleting appointments:", error);
      toast.error("Failed to delete appointments");
    } finally {
      setIsProcessing(false);
      setCurrentAction("");
      setDeleteDialogOpen(false);
    }
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl">
          {/* Selection info */}
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              {selectedCount} selected
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-gray-400 hover:text-white"
              onClick={allSelected ? onClearSelection : onSelectAll}
            >
              {allSelected ? (
                <>
                  <Square className="h-3.5 w-3.5 mr-1" />
                  Deselect all
                </>
              ) : (
                <>
                  <CheckSquare className="h-3.5 w-3.5 mr-1" />
                  Select all ({totalCount})
                </>
              )}
            </Button>
          </div>

          <div className="w-px h-6 bg-gray-700" />

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-3 text-green-400 hover:text-green-300 hover:bg-green-500/20"
              onClick={() => handleBatchStatusUpdate("confirmed")}
              disabled={isProcessing}
            >
              {isProcessing && currentAction === "confirmed" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Confirm
                </>
              )}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-3 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20"
              onClick={() => handleBatchStatusUpdate("cancelled")}
              disabled={isProcessing}
            >
              {isProcessing && currentAction === "cancelled" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancel
                </>
              )}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-3 text-red-400 hover:text-red-300 hover:bg-red-500/20"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isProcessing}
            >
              {isProcessing && currentAction === "delete" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </>
              )}
            </Button>
          </div>

          <div className="w-px h-6 bg-gray-700" />

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-white"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete {selectedCount} Appointment{selectedCount > 1 ? 's' : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action cannot be undone. This will permanently delete the selected appointments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
