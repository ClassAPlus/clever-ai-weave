
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

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
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
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: isHebrew ? "נמחק בהצלחה" : "Deleted successfully",
        description: isHebrew ? "הפנייה נמחקה" : "Submission has been deleted",
      });

      fetchSubmissions();
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast({
        title: isHebrew ? "שגיאה במחיקה" : "Delete error",
        description: isHebrew ? "לא ניתן למחוק את הפנייה" : "Could not delete submission",
        variant: "destructive",
      });
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteSubmission(submission.id)}
                        className="border-red-400/20 text-red-300 hover:bg-red-400/10"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
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
