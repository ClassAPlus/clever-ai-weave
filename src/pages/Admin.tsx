
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdminTable } from "@/components/AdminTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { Shield, Lock } from "lucide-react";

const Admin = () => {
  const { isHebrew } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple password protection - in production, use proper authentication
    if (password === "admin123") {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError(isHebrew ? "סיסמה שגויה" : "Incorrect password");
    }
  };

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
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {isHebrew ? "לוח בקרה מנהל" : "Admin Dashboard"}
            </h1>
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
