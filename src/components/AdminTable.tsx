import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Table, TableBody } from "@/components/ui/table";
import { AdminSearchBar } from "@/components/AdminSearchBar";
import { AdminTableHeader } from "@/components/AdminTableHeader";
import { AdminTableRow } from "@/components/AdminTableRow";
import { SubmissionDetails } from "@/components/SubmissionDetails";
import { toast } from "sonner";

interface ContactSubmission {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string | null;
  message: string;
  created_at: string;
}

interface AdminTableProps {
  onSubmissionCountChange: (count: number) => void;
}

export const AdminTable = ({ onSubmissionCountChange }: AdminTableProps) => {
  const { isHebrew } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const queryClient = useQueryClient();

  const { data: submissions = [], isLoading, refetch } = useQuery({
    queryKey: ['contact-submissions'],
    queryFn: async () => {
      console.log('Fetching submissions...');
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching submissions:', error);
        throw error;
      }
      
      console.log('Fetched submissions:', data);
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('=== Starting delete operation ===');
      console.log('Attempting to delete submission with ID:', id);
      
      // Perform the delete operation
      console.log('Performing delete...');
      const { data, error } = await supabase
        .from('contact_submissions')
        .delete()
        .eq('id', id)
        .select();
      
      console.log('Delete operation result:');
      console.log('- Data returned:', data);
      console.log('- Error:', error);
      
      if (error) {
        console.error('Delete error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      // Check if any rows were actually deleted
      if (!data || data.length === 0) {
        console.warn('No rows were deleted - this might indicate an RLS policy issue');
        
        // Check if the row still exists
        const { data: checkData, error: checkError } = await supabase
          .from('contact_submissions')
          .select('id')
          .eq('id', id);
        
        console.log('Row existence check:', { checkData, checkError });
        
        if (checkData && checkData.length > 0) {
          throw new Error('Row still exists after delete operation - possible RLS policy issue');
        }
      }
      
      console.log('=== Delete operation completed successfully ===');
      return id;
    },
    onSuccess: (deletedId) => {
      console.log('Delete mutation succeeded for ID:', deletedId);
      
      // Force a hard refetch from the database
      queryClient.invalidateQueries({ queryKey: ['contact-submissions'] });
      queryClient.refetchQueries({ queryKey: ['contact-submissions'] });
      
      toast.success(isHebrew ? "הפנייה נמחקה בהצלחה" : "Submission deleted successfully");
      
      // Close the details dialog if the deleted submission was selected
      if (selectedSubmission?.id === deletedId) {
        setSelectedSubmission(null);
      }
    },
    onError: (error: any) => {
      console.error('Delete mutation failed:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error?.message);
      
      let errorMessage = isHebrew ? "שגיאה במחיקת הפנייה" : "Error deleting submission";
      
      if (error?.message?.includes('RLS') || error?.message?.includes('policy')) {
        errorMessage += isHebrew ? " - בעיית הרשאות" : " - Permission issue";
      }
      
      toast.error(errorMessage);
    },
  });

  const filteredSubmissions = submissions.filter(submission =>
    submission.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (submission.company && submission.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
    submission.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    onSubmissionCountChange(filteredSubmissions.length);
  }, [filteredSubmissions.length, onSubmissionCountChange]);

  const handleDelete = (id: string) => {
    console.log('Handle delete called for ID:', id);
    deleteMutation.mutate(id);
  };

  const handleRefresh = () => {
    console.log('Refreshing submissions...');
    refetch();
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400">
          {isHebrew ? "טוען פניות..." : "Loading submissions..."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminSearchBar 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        submissionCount={filteredSubmissions.length}
        onRefresh={handleRefresh}
      />

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
        <Table>
          <AdminTableHeader />
          <TableBody>
            {filteredSubmissions.map((submission) => (
              <AdminTableRow
                key={submission.id}
                submission={submission}
                onView={setSelectedSubmission}
                onDelete={handleDelete}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </TableBody>
        </Table>

        {filteredSubmissions.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            {searchTerm ? (
              isHebrew ? "לא נמצאו פניות התואמות לחיפוש" : "No submissions found matching your search"
            ) : (
              isHebrew ? "אין פניות עדיין" : "No submissions yet"
            )}
          </div>
        )}
      </div>

      {selectedSubmission && (
        <SubmissionDetails
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  );
};
