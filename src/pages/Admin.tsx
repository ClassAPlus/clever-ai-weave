
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdminTable } from "@/components/AdminTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { Shield, Lock, KeyRound, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Admin = () => {
  const { isHebrew } = useLanguage();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showRecoverPassword, setShowRecoverPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple password protection - in production, use proper authentication
    if (password === "admin123") {
      setIsAuthenticated(true);
      setError("");
      localStorage.setItem('adminPassword', password);
    } else {
      setError(isHebrew ? "סיסמה שגויה" : "Incorrect password");
    }
  };

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

  const handleRecoverPassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In production, this would send a recovery email
    toast({
      title: isHebrew ? "נשלח" : "Sent",
      description: isHebrew ? "הוראות לאיפוס סיסמה נשלחו למייל" : "Password recovery instructions sent to email",
    });
    
    setShowRecoverPassword(false);
    setRecoveryEmail("");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword("");
    localStorage.removeItem('adminPassword');
  };

  // Check if user was previously logged in
  useEffect(() => {
    const savedPassword = localStorage.getItem('adminPassword');
    if (savedPassword === "admin123") {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <Shield className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              {isHebrew ? "כניסת מנהל" : "Admin Access"}
            </h1>
            <p className="text-gray-300">
              {isHebrew ? "הזן סיסמה לצפייה בפניות" : "Enter password to view submissions"}
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isHebrew ? "סיסמה" : "Password"}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
                required
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              {isHebrew ? "כניסה" : "Login"}
            </Button>
          </form>
          
          <div className="mt-4 space-y-2">
            <Dialog open={showRecoverPassword} onOpenChange={setShowRecoverPassword}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full text-purple-300 hover:text-purple-200 hover:bg-purple-500/10"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {isHebrew ? "שכחתי סיסמה" : "Forgot Password"}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {isHebrew ? "איפוס סיסמה" : "Password Recovery"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleRecoverPassword} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder={isHebrew ? "כתובת מייל" : "Email address"}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    {isHebrew ? "שלח הוראות איפוס" : "Send Recovery Instructions"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <p className="text-xs text-gray-400 text-center mt-4">
            {isHebrew ? "סיסמה: admin123" : "Password: admin123"}
          </p>
        </div>
      </div>
    );
  }

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
                  onClick={handleLogout}
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

          <AdminTable />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Admin;
