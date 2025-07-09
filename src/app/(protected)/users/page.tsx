"use client";

import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { useAuth } from "@/src/context/AuthContext";
import { createClient } from "@/src/lib/supabase/client";
import { faEdit, faTrash, faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface User {
  id: number;
  uuid: string;
  email: string;
  role?: "admin" | "supervisor" | "manager" | "staff";
  department_id?: number;
  created_at: string;
}

interface Department {
  id: number;
  title: string;
}

interface FormValues {
  email: string;
  role: "admin" | "supervisor" | "manager" | "staff";
  department_id?: number | null;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const form = useForm<FormValues>({
    defaultValues: {
      email: "",
      role: "staff",
      department_id: undefined,
    },
  });

  // Check if current user is admin or manager
  const canManageUsers =
    currentUser?.role === "admin" || currentUser?.role === "manager";

  // Fetch users and departments
  const fetchData = async () => {
    setLoading(true);
    const supabase = createClient();

    const [usersResult, departmentsResult] = await Promise.all([
      supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("departments").select("id, title").order("title"),
    ]);

    if (usersResult.error) {
      toast.error("Failed to fetch users");
    } else {
      setUsers(usersResult.data || []);
    }

    if (departmentsResult.error) {
      toast.error("Failed to fetch departments");
    } else {
      setDepartments(departmentsResult.data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle form submit (create or update)
  const onSubmit = async (values: FormValues) => {
    // Simple validation
    if (!values.email || !values.role) {
      toast.error("Email and role are required");
      return;
    }

    const supabase = createClient();

    if (editing) {
      // Update user
      const { error } = await supabase
        .from("users")
        .update({
          role: values.role,
          department_id: values.department_id,
        })
        .eq("id", editing.id);

      if (error) {
        toast.error(error.message || "Failed to update user");
      } else {
        toast.success("User updated successfully");
        setEditing(null);
        setModalOpen(false);
        form.reset();
        fetchData();
      }
    } else {
      // Note: Creating users should typically be done through auth signup
      // This is just for updating existing user roles/departments
      toast.info("New users should sign up through the registration process");
    }
  };

  // Handle edit
  const handleEdit = (user: User) => {
    setEditing(user);
    form.setValue("email", user.email);
    form.setValue("role", user.role || "staff");
    form.setValue("department_id", user.department_id || null);
    setModalOpen(true);
  };

  // Handle delete
  const handleDelete = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    const supabase = createClient();
    const { error } = await supabase.from("users").delete().eq("id", userId);

    if (error) {
      toast.error(error.message || "Failed to delete user");
    } else {
      toast.success("User deleted successfully");
      fetchData();
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditing(null);
    form.reset();
  };

  // Get department name
  const getDepartmentName = (departmentId?: number) => {
    if (!departmentId) return "No Department";
    const dept = departments.find((d) => d.id === departmentId);
    return dept ? dept.title : "Unknown";
  };

  if (!canManageUsers) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600">
          You don't have permission to manage users.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 w-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <FontAwesomeIcon
            icon={faUsers}
            width={32}
            height={32}
            className="text-primary"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Users Management
            </h1>
            <p className="text-gray-600">Manage user roles and departments</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-red-100 text-red-800"
                          : user.role === "manager"
                          ? "bg-blue-100 text-blue-800"
                          : user.role === "supervisor"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.role || "staff"}
                    </span>
                  </TableCell>
                  <TableCell>{getDepartmentName(user.department_id)}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(user)}
                        disabled={
                          user.role === "admin" || user.role === "manager"
                        }
                        className={`${
                          user.role === "admin" || user.role === "manager"
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-blue-600 hover:text-blue-700"
                        }`}
                      >
                        <FontAwesomeIcon icon={faEdit} width={16} height={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                        disabled={user.role === "admin"}
                        className={`${
                          user.role === "admin"
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-red-600 hover:text-red-700"
                        }`}
                      >
                        <FontAwesomeIcon
                          icon={faTrash}
                          width={16}
                          height={16}
                        />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit User Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="user@example.com"
                {...form.register("email")}
                disabled={!!editing} // Email cannot be changed for existing users
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={form.watch("role") || ""}
                onValueChange={(value) => form.setValue("role", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={form.watch("department_id")?.toString() || "none"}
                onValueChange={(value) =>
                  form.setValue(
                    "department_id",
                    value === "none" ? null : parseInt(value)
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Department</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {editing ? "Update" : "Create"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
