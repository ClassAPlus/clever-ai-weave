
import { useState, useEffect } from "react";
import { AdminAuth } from "@/components/AdminAuth";
import { AdminDashboard } from "@/components/AdminDashboard";

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminPassword');
  };

  // Check if user was previously logged in
  useEffect(() => {
    const savedPassword = localStorage.getItem('adminPassword');
    if (savedPassword === "Rla102232@50") {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={handleAuthenticated} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
};

export default Admin;
