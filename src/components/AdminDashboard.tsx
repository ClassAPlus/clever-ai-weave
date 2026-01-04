import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdminTable } from "@/components/AdminTable";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { LogOut, Bot } from "lucide-react";

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const { isHebrew } = useLanguage();
  const navigate = useNavigate();
  const [submissionCount, setSubmissionCount] = useState(0);

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
                <Button
                  onClick={() => navigate("/admin/voiceflow")}
                  variant="outline"
                  className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  {isHebrew ? "הגדרות Voiceflow" : "Voiceflow Settings"}
                </Button>
                <Button
                  onClick={onLogout}
                  variant="outline"
                  className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {isHebrew ? "התנתק" : "Sign Out"}
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