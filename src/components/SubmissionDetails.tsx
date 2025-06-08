
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, User, Building, Calendar, MessageSquare, X } from "lucide-react";
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

interface SubmissionDetailsProps {
  submission: ContactSubmission;
  onClose: () => void;
}

export const SubmissionDetails = ({ submission, onClose }: SubmissionDetailsProps) => {
  const { isHebrew } = useLanguage();

  const handleEmailClick = () => {
    window.open(`mailto:${submission.email}`, '_blank');
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {isHebrew ? "פרטי פנייה" : "Submission Details"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <User className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">
                    {isHebrew ? "שם מלא" : "Full Name"}
                  </p>
                  <p className="text-white font-medium">
                    {submission.first_name} {submission.last_name}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Mail className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">
                    {isHebrew ? "אימייל" : "Email"}
                  </p>
                  <p className="text-white font-medium">{submission.email}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Building className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">
                    {isHebrew ? "חברה" : "Company"}
                  </p>
                  <p className="text-white font-medium">
                    {submission.company || (isHebrew ? "לא צוין" : "Not provided")}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Calendar className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">
                    {isHebrew ? "תאריך פנייה" : "Submitted"}
                  </p>
                  <p className="text-white font-medium">
                    {format(new Date(submission.created_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Message */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <MessageSquare className="h-5 w-5 text-purple-400" />
              </div>
              <p className="text-sm text-gray-400">
                {isHebrew ? "תוכן ההודעה" : "Message Content"}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-white whitespace-pre-wrap leading-relaxed">
                {submission.message}
              </p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <Button
              onClick={handleEmailClick}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <Mail className="h-4 w-4 mr-2" />
              {isHebrew ? "שלח מייל" : "Send Email"}
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <X className="h-4 w-4 mr-2" />
              {isHebrew ? "סגור" : "Close"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
