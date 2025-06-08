
import { useLanguage } from "@/contexts/LanguageContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash, RefreshCw } from "lucide-react";

interface DeleteConfirmationDialogProps {
  submissionId: string;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export const DeleteConfirmationDialog = ({ 
  submissionId, 
  onDelete, 
  isDeleting 
}: DeleteConfirmationDialogProps) => {
  const { isHebrew } = useLanguage();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          disabled={isDeleting}
          className="border-red-400/20 text-red-300 hover:bg-red-400/10"
        >
          {isDeleting ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Trash className="h-4 w-4" />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            {isHebrew ? "מחק פנייה" : "Delete Submission"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300">
            {isHebrew 
              ? "האם אתה בטוח שברצונך למחוק את הפנייה הזו? פעולה זו לא ניתנת לביטול."
              : "Are you sure you want to delete this submission? This action cannot be undone."
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
            {isHebrew ? "ביטול" : "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => onDelete(submissionId)}
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {isHebrew ? "מחק" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
