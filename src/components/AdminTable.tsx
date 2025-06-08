
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { AdminSearchBar } from "@/components/AdminSearchBar";
import { AdminTableHeader } from "@/components/AdminTableHeader";
import { AdminTableRow } from "@/components/AdminTableRow";
import { SubmissionDetails } from "@/components/SubmissionDetails";
import { RefreshCw } from "lucide-react";

interface ContactSubmission {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string | null;
  message: string;
  created_at: string;
}

export const AdminTable = () => {
  const { isHebrew } = useLanguage();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    console.log('Admin: Fetching submissions...');
    
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Admin fetch error:', error);
        throw error;
      }
      
      console.log('Admin: Fetched', data?.length || 0, 'submissions');
      setSubmissions(data || []);
      setFilteredSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: isHebrew ? "שגיאה בטעינת הנתונים" : "Error loading data",
        description: isHebrew ? "לא ניתן לטעון את הפניות" : "Could not load submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteSubmission = async (id: string) => {
    setDeletingId(id);
    
    try {
      console.log('Admin: Attempting to delete submission:', id);
      
      // Check if the record exists first
      const { data: existingRecord, error: fetchError } = await supabase
        .from('contact_submissions')
        .select('id')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Admin: Error checking record existence:', fetchError);
        throw new Error('Record not found or access denied');
      }

      console.log('Admin: Record exists, proceeding with delete:', existingRecord);

      const { error } = await supabase
        .from('contact_submissions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Admin: Delete error:', error);
        throw error;
      }

      console.log('Admin: Successfully deleted submission from database:', id);

      toast({
        title: isHebrew ? "נמחק בהצלחה" : "Deleted successfully",
        description: isHebrew ? "הפנייה נמחקה מהמסד נתונים" : "Submission has been deleted from database",
      });

      // Refresh the data instead of just updating state to ensure consistency
      await fetchSubmissions();
    } catch (error) {
      console.error('Admin: Error deleting submission:', error);
      toast({
        title: isHebrew ? "שגיאה במחיקה" : "Delete error",
        description: isHebrew ? 
          `לא ניתן למחוק את הפנייה: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}` : 
          `Could not delete submission: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    const filtered = submissions.filter(submission =>
      submission.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (submission.company && submission.company.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredSubmissions(filtered);
  }, [searchTerm, submissions]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminSearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        submissionCount={filteredSubmissions.length}
        onRefresh={fetchSubmissions}
      />

      {/* Table */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
        <Table>
          <AdminTableHeader />
          <TableBody>
            {filteredSubmissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400 py-12">
                  {isHebrew ? "לא נמצאו פניות" : "No submissions found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredSubmissions.map((submission) => (
                <AdminTableRow
                  key={submission.id}
                  submission={submission}
                  onView={setSelectedSubmission}
                  onDelete={deleteSubmission}
                  isDeleting={deletingId === submission.id}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Submission Details Modal */}
      {selectedSubmission && (
        <SubmissionDetails
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  );
};
