import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ShieldCheck, UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { format } from "date-fns";

type UserWithRole = {
  user_id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  roles: string[];
};

export default function AdminUsers() {
  const { isAdmin, loading: roleLoading } = useRole();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    // Get profiles (admin can see all via RLS)
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, created_at");
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");

    if (!profiles) { setLoading(false); return; }

    const roleMap: Record<string, string[]> = {};
    (roles || []).forEach((r) => {
      if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
      roleMap[r.user_id].push(r.role);
    });

    const usersData: UserWithRole[] = profiles.map((p) => ({
      user_id: p.user_id,
      full_name: p.full_name,
      email: "", // We don't expose emails from auth.users for security
      created_at: p.created_at,
      roles: roleMap[p.user_id] || [],
    }));

    setUsers(usersData);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const toggleAdmin = async (userId: string, currentlyAdmin: boolean) => {
    if (userId === user?.id) {
      toast.error("You can't remove your own admin role");
      return;
    }

    if (currentlyAdmin) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      if (error) { toast.error(error.message); return; }
      toast.success("Admin role removed");
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      if (error) { toast.error(error.message); return; }
      toast.success("Admin role granted");
    }
    fetchUsers();
  };

  const toggleTeamMember = async (userId: string, currentlyMember: boolean) => {
    if (currentlyMember) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "team_member");
      if (error) { toast.error(error.message); return; }
      toast.success("Team member role removed");
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "team_member" });
      if (error) { toast.error(error.message); return; }
      toast.success("Team member role granted");
    }
    fetchUsers();
  };

  if (roleLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage team members and assign roles</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Admin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Full access to all data, can manage users and roles.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-chart-2" /> Team Member
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Can manage only their own leads, deals, and contacts.</p>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="w-48">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
              ) : users.map((u) => {
                const uIsAdmin = u.roles.includes("admin");
                const uIsMember = u.roles.includes("team_member");
                const isSelf = u.user_id === user?.id;
                return (
                  <TableRow key={u.user_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{u.full_name || "Unnamed"}</p>
                        {isSelf && <p className="text-xs text-muted-foreground">(you)</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(u.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {uIsAdmin && <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">Admin</Badge>}
                        {uIsMember && <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/20" variant="outline">Team Member</Badge>}
                        {!uIsAdmin && !uIsMember && <span className="text-xs text-muted-foreground">No role</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => toggleAdmin(u.user_id, uIsAdmin)}
                          disabled={isSelf && uIsAdmin}
                        >
                          {uIsAdmin ? <UserMinus className="h-3 w-3 mr-1" /> : <UserPlus className="h-3 w-3 mr-1" />}
                          {uIsAdmin ? "Remove Admin" : "Make Admin"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => toggleTeamMember(u.user_id, uIsMember)}
                        >
                          {uIsMember ? "Remove Member" : "Make Member"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
