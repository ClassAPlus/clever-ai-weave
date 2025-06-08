
import { useLanguage } from "@/contexts/LanguageContext";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { Eye } from "lucide-react";
import { format } from "date-fns";

interface ContactSubmission {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string | null;
  message: string;
  created_at: string;
}

interface AdminTableRowProps {
  submission: ContactSubmission;
  onView: (submission: ContactSubmission) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export const AdminTableRow = ({ 
  submission, 
  onView, 
  onDelete, 
  isDeleting 
}: AdminTableRowProps) => {
  const { isHebrew } = useLanguage();

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <TableRow className="border-white/10">
      <TableCell className="text-white">
        {submission.first_name} {submission.last_name}
      </TableCell>
      <TableCell className="text-gray-300">
        {submission.email}
      </TableCell>
      <TableCell className="text-gray-300">
        {submission.company || '-'}
      </TableCell>
      <TableCell className="text-gray-300">
        {truncateText(submission.message)}
      </TableCell>
      <TableCell className="text-gray-300">
        {format(new Date(submission.created_at), 'MMM dd, yyyy')}
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(submission)}
            className="border-purple-400/20 text-purple-300 hover:bg-purple-400/10"
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          <DeleteConfirmationDialog
            submissionId={submission.id}
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
        </div>
      </TableCell>
    </TableRow>
  );
};
