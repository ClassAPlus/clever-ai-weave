
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SubmissionDetails } from "@/components/SubmissionDetails";
import { Search, Eye, Trash, RefreshCw } from "lucide-react";
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

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Stats */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder={isHebrew ? "חיפוש פניות..." : "Search submissions..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
          />
        </div>
        
        <div className="flex gap-4 items-center">
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
            {filteredSubmissions.length} {isHebrew ? "פניות" : "submissions"}
          </Badge>
          <Button
            onClick={fetchSubmissions}
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {isHebrew ? "רענן" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-gray-300">
                {isHebrew ? "שם" : "Name"}
              </TableHead>
              <TableHead className="text-gray-300">
                {isHebrew ? "אימייל" : "Email"}
              </TableHead>
              <TableHead className="text-gray-300">
                {isHebrew ? "חברה" : "Company"}
              </TableHead>
              <TableHead className="text-gray-300">
                {isHebrew ? "הודעה" : "Message"}
              </TableHead>
              <TableHead className="text-gray-300">
                {isHebrew ? "תאריך" : "Date"}
              </TableHead>
              <TableHead className="text-gray-300">
                {isHebrew ? "פעולות" : "Actions"}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubmissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400 py-12">
                  {isHebrew ? "לא נמצאו פניות" : "No submissions found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredSubmissions.map((submission) => (
                <TableRow key={submission.id} className="border-white/10">
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
                        onClick={() => setSelectedSubmission(submission)}
                        className="border-purple-400/20 text-purple-300 hover:bg-purple-400/10"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={deletingId === submission.id}
                            className="border-red-400/20 text-red-300 hover:bg-red-400/10"
                          >
                            {deletingId === submission.id ? (
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
                              onClick={() => deleteSubmission(submission.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                              disabled={deletingId === submission.id}
                            >
                              {deletingId === submission.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              {isHebrew ? "מחק" : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
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
