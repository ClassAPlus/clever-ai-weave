import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, UserPlus, Trash2, Loader2 } from "lucide-react";

interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "moderator" | "user";
  created_at: string;
  email?: string;
}

export function AdminRoleManager() {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchUserRoles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUserRoles(data || []);
    } catch (error) {
      console.error("Error fetching user roles:", error);
      toast.error("Failed to fetch user roles");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRoles();
  }, []);

  const handleAssignAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsAssigning(true);
    try {
      // First, find the user by email in auth.users via a lookup
      // We need to use the assign_admin_role function which takes user_id
      // But we have email, so we need to look up the user first
      
      // Check if user exists in businesses table by owner_email
      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .select("owner_user_id")
        .eq("owner_email", newAdminEmail.trim())
        .single();

      if (businessError || !business?.owner_user_id) {
        toast.error("User not found. Make sure they have signed up and created a business.");
        return;
      }

      // Use the assign_admin_role function
      const { error } = await supabase.rpc("assign_admin_role", {
        target_user_id: business.owner_user_id,
      });

      if (error) {
        if (error.message.includes("duplicate")) {
          toast.error("This user is already an admin");
        } else {
          throw error;
        }
        return;
      }

      toast.success(`Admin role assigned to ${newAdminEmail}`);
      setNewAdminEmail("");
      fetchUserRoles();
    } catch (error) {
      console.error("Error assigning admin role:", error);
      toast.error("Failed to assign admin role");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveRole = async (roleId: string, userId: string) => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (currentUser.user?.id === userId) {
        toast.error("You cannot remove your own admin role");
        return;
      }

      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      toast.success("Role removed successfully");
      fetchUserRoles();
    } catch (error) {
      console.error("Error removing role:", error);
      toast.error("Failed to remove role");
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "moderator":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Admin Role Management
        </CardTitle>
        <CardDescription>
          Assign or remove admin roles for users. Admins have access to developer settings and Twilio configuration.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Admin */}
        <div className="space-y-3">
          <Label>Assign Admin Role</Label>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter user email address"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAssignAdmin} disabled={isAssigning}>
              {isAssigning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            The user must have already signed up and created a business to be assigned an admin role.
          </p>
        </div>

        {/* Current Roles Table */}
        <div className="space-y-3">
          <Label>Current User Roles</Label>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : userRoles.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No user roles found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRoles.map((userRole) => (
                  <TableRow key={userRole.id}>
                    <TableCell className="font-mono text-xs">
                      {userRole.user_id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(userRole.role)}>
                        {userRole.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(userRole.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveRole(userRole.id, userRole.user_id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
