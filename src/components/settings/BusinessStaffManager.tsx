import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, UserPlus, Trash2, Loader2 } from "lucide-react";

type BusinessRole = "manager" | "staff";

interface StaffMember {
  id: string;
  user_id: string;
  role: BusinessRole;
  created_at: string;
  email?: string;
}

interface BusinessStaffManagerProps {
  businessId: string;
}

export function BusinessStaffManager({ businessId }: BusinessStaffManagerProps) {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<BusinessRole>("staff");
  const [isAdding, setIsAdding] = useState(false);

  const fetchStaffMembers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("business_staff")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStaffMembers((data || []) as StaffMember[]);
    } catch (error) {
      console.error("Error fetching staff members:", error);
      toast.error("Failed to fetch team members");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      fetchStaffMembers();
    }
  }, [businessId]);

  const handleAddStaff = async () => {
    if (!newStaffEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsAdding(true);
    try {
      // Check if user exists in businesses table by owner_email
      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .select("owner_user_id")
        .eq("owner_email", newStaffEmail.trim())
        .single();

      if (businessError || !business?.owner_user_id) {
        toast.error("User not found. They must have signed up and created their own account first.");
        return;
      }

      // Insert the staff member
      const { error } = await supabase
        .from("business_staff")
        .insert({
          business_id: businessId,
          user_id: business.owner_user_id,
          role: selectedRole,
        });

      if (error) {
        if (error.message.includes("duplicate") || error.code === "23505") {
          toast.error("This user is already a team member");
        } else {
          throw error;
        }
        return;
      }

      toast.success(`${newStaffEmail} added as ${selectedRole}`);
      setNewStaffEmail("");
      fetchStaffMembers();
    } catch (error) {
      console.error("Error adding staff member:", error);
      toast.error("Failed to add team member");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    try {
      const { error } = await supabase
        .from("business_staff")
        .delete()
        .eq("id", staffId);

      if (error) throw error;

      toast.success("Team member removed");
      fetchStaffMembers();
    } catch (error) {
      console.error("Error removing staff member:", error);
      toast.error("Failed to remove team member");
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "manager":
        return "default";
      case "staff":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleDescription = (role: BusinessRole) => {
    switch (role) {
      case "manager":
        return "Can edit settings and manage team";
      case "staff":
        return "View-only access to calls, messages, appointments";
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-400" />
          Business Team Members
        </CardTitle>
        <CardDescription className="text-gray-400">
          Invite staff to help manage your business. They can view calls, messages, and appointments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Staff */}
        <div className="space-y-3">
          <Label className="text-gray-300">Add Team Member</Label>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter their email address"
              value={newStaffEmail}
              onChange={(e) => setNewStaffEmail(e.target.value)}
              className="flex-1 bg-gray-900 border-gray-600 text-white"
            />
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as BusinessRole)}>
              <SelectTrigger className="w-[140px] bg-gray-900 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddStaff} disabled={isAdding} className="bg-purple-600 hover:bg-purple-700">
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add
                </>
              )}
            </Button>
          </div>
          <div className="text-sm text-gray-500 space-y-1">
            <p><strong>Manager:</strong> {getRoleDescription("manager")}</p>
            <p><strong>Staff:</strong> {getRoleDescription("staff")}</p>
          </div>
        </div>

        {/* Current Team Table */}
        <div className="space-y-3">
          <Label className="text-gray-300">Current Team</Label>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : staffMembers.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              No team members yet. Add someone to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-400">User ID</TableHead>
                  <TableHead className="text-gray-400">Role</TableHead>
                  <TableHead className="text-gray-400">Added</TableHead>
                  <TableHead className="text-gray-400 w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffMembers.map((member) => (
                  <TableRow key={member.id} className="border-gray-700">
                    <TableCell className="font-mono text-xs text-gray-300">
                      {member.user_id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(member.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveStaff(member.id)}
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
