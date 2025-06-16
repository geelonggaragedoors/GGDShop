import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Plus, UserPlus, Mail, Edit, Trash2, Users, Shield, Settings, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User, StaffInvitation, Role } from "@shared/schema";

const inviteStaffSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.string().min(1, "Please select a role"),
});

const createRoleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  displayName: z.string().min(1, "Display name is required"),
  description: z.string().optional(),
  permissions: z.array(z.string()).default([]),
});

const updateStaffSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  role: z.string().min(1, "Please select a role"),
  isActive: z.boolean().default(true),
});

export default function Staff() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editStaffDialogOpen, setEditStaffDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: staffMembers = [], isLoading: staffLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/staff"],
  });

  const { data: invitations = [], isLoading: invitationsLoading } = useQuery<StaffInvitation[]>({
    queryKey: ["/api/admin/invitations"],
  });

  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/admin/roles"],
  });

  // Forms
  const inviteForm = useForm({
    resolver: zodResolver(inviteStaffSchema),
    defaultValues: {
      email: "",
      role: "",
    },
  });

  const roleForm = useForm({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
      permissions: [],
    },
  });

  const editStaffForm = useForm({
    resolver: zodResolver(updateStaffSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      role: "",
      isActive: true,
    },
  });

  // Mutations
  const inviteStaffMutation = useMutation({
    mutationFn: async (data: z.infer<typeof inviteStaffSchema>) => {
      const response = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to send invitation");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Staff invitation sent successfully",
      });
      setInviteDialogOpen(false);
      inviteForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invitations"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createRoleSchema>) => {
      const response = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create role");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Role created successfully",
      });
      setRoleDialogOpen(false);
      roleForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create role",
        variant: "destructive",
      });
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof updateStaffSchema> }) => {
      const response = await fetch(`/api/admin/staff/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update staff member");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Staff member updated successfully",
      });
      setEditStaffDialogOpen(false);
      setSelectedStaff(null);
      editStaffForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/staff"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update staff member",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (staffId: string) => {
      const response = await fetch(`/api/admin/staff/${staffId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to send password reset email");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password reset email sent successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send password reset email",
        variant: "destructive",
      });
    },
  });

  const deleteInvitationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/invitations/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to delete invitation");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invitation deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invitations"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete invitation",
        variant: "destructive",
      });
    },
  });

  const deactivateStaffMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/staff/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to deactivate staff member");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Staff member deactivated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/staff"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to deactivate staff member",
        variant: "destructive",
      });
    },
  });

  const handleEditStaff = (staff: User) => {
    setSelectedStaff(staff);
    editStaffForm.reset({
      firstName: staff.firstName || "",
      lastName: staff.lastName || "",
      email: staff.email || "",
      role: staff.role || "",
      isActive: staff.isActive ?? true,
    });
    setEditStaffDialogOpen(true);
  };

  const onInviteSubmit = (data: z.infer<typeof inviteStaffSchema>) => {
    inviteStaffMutation.mutate(data);
  };

  const onRoleSubmit = (data: z.infer<typeof createRoleSchema>) => {
    createRoleMutation.mutate(data);
  };

  const onEditStaffSubmit = (data: z.infer<typeof updateStaffSchema>) => {
    if (selectedStaff) {
      updateStaffMutation.mutate({ id: selectedStaff.id, data });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      case "staff":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (staffLoading || invitationsLoading || rolesLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Staff & Roles</h2>
        <p className="text-gray-600">Manage team members, invitations, and permissions</p>
      </div>

      <Tabs defaultValue="staff" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="staff" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Staff Members</span>
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center space-x-2">
            <Mail className="w-4 h-4" />
            <span>Invitations</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Roles</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Staff Members</span>
                <Badge variant="secondary">{staffMembers.length}</Badge>
              </CardTitle>
              <div className="flex space-x-2">
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite Staff
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite New Staff Member</DialogTitle>
                    </DialogHeader>
                    <Form {...inviteForm}>
                      <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)} className="space-y-4">
                        <FormField
                          control={inviteForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="staff@example.com" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={inviteForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="manager">Manager</SelectItem>
                                  <SelectItem value="staff">Staff</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setInviteDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={inviteStaffMutation.isPending}>
                            Send Invitation
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffMembers.map((staff: User) => (
                    <TableRow key={staff.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {staff.firstName?.[0]}{staff.lastName?.[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{staff.firstName} {staff.lastName}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{staff.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(staff.role || "staff")}>
                          {staff.role || "staff"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={staff.isActive ? "default" : "secondary"}>
                          {staff.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditStaff(staff)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resetPasswordMutation.mutate(staff.id)}
                            disabled={resetPasswordMutation.isPending}
                            title="Reset Password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deactivateStaffMutation.mutate(staff.id)}
                            disabled={!staff.isActive}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="w-5 h-5" />
                <span>Pending Invitations</span>
                <Badge variant="secondary">{invitations.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invitations.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No pending invitations</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Invited By</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((invitation: StaffInvitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell>{invitation.email}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(invitation.role)}>
                            {invitation.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(invitation.status || "pending")}>
                            {invitation.status || "pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>{invitation.invitedBy}</TableCell>
                        <TableCell>
                          {invitation.createdAt ? new Date(invitation.createdAt).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteInvitationMutation.mutate(invitation.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Roles & Permissions</span>
                <Badge variant="secondary">{roles.length}</Badge>
              </CardTitle>
              <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Role
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Role</DialogTitle>
                  </DialogHeader>
                  <Form {...roleForm}>
                    <form onSubmit={roleForm.handleSubmit(onRoleSubmit)} className="space-y-4">
                      <FormField
                        control={roleForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., sales_rep" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={roleForm.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Sales Representative" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={roleForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Brief description of the role" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setRoleDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createRoleMutation.isPending}>
                          Create Role
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {roles.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No custom roles created yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role Name</TableHead>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role: Role) => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <Badge variant="outline">{role.name}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{role.displayName}</TableCell>
                        <TableCell>{role.description || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={role.isActive ? "default" : "secondary"}>
                            {role.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {role.createdAt ? new Date(role.createdAt).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Staff Dialog */}
      <Dialog open={editStaffDialogOpen} onOpenChange={setEditStaffDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          <Form {...editStaffForm}>
            <form onSubmit={editStaffForm.handleSubmit(onEditStaffSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editStaffForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editStaffForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editStaffForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editStaffForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditStaffDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateStaffMutation.isPending}>
                  Update Staff
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}