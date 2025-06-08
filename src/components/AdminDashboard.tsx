
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdminTable } from "@/components/AdminTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { Lock, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const { isHebrew } = useLanguage();
  const { toast } = useToast();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submissionCount, setSubmissionCount] = useState(0);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: isHebrew ? "שגיאה" : "Error",
        description: isHebrew ? "הסיסמאות אינן תואמות" : "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: isHebrew ? "שגיאה" : "Error",
        description: isHebrew ? "הסיסמה חייבת להכיל לפחות 6 תווים" : "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    // In production, this would update the password in the database
    localStorage.setItem('adminPassword', newPassword);
    
    toast({
      title: isHebrew ? "הצלחה" : "Success",
      description: isHebrew ? "הסיסמה שונתה בהצלחה" : "Password changed successfully",
    });
    
    setShowChangePassword(false);
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {isHebrew ? "לוח בקרה מנהל" : "Admin Dashboard"}
              </h1>
              <div className="flex gap-2">
                <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
                    >
                      <KeyRound className="h-4 w-4 mr-2" />
                      {isHebrew ? "שנה סיסמה" : "Change Password"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-white/10 text-white">
                    <DialogHeader>
                      <DialogTitle className="text-white">
                        {isHebrew ? "שינוי סיסמה" : "Change Password"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder={isHebrew ? "סיסמה חדשה" : "New password"}
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
                          required
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder={isHebrew ? "אשר סיסמה חדשה" : "Confirm new password"}
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      >
                        {isHebrew ? "שנה סיסמה" : "Change Password"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
                <Button
                  onClick={onLogout}
                  variant="outline"
                  className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                >
                  {isHebrew ? "התנתק" : "Logout"}
                </Button>
              </div>
            </div>
            <p className="text-xl text-gray-300">
              {isHebrew ? "ניהול פניות ובקשות ליצירת קשר" : "Manage contact submissions and inquiries"}
            </p>
          </div>

          <AdminTable onSubmissionCountChange={setSubmissionCount} />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};
