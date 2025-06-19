"use client";

import { Card, CardContent } from "@/src/components/ui/card";
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
import { createClient } from "@/src/lib/supabase/client";
import {
  faUser,
  faUsers,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface Department {
  id: number;
  name: string;
}

interface User {
  id: number;
  created_at: string;
  uuid: string;
  department_id: number | null;
  role: string;
}

export default function UsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  // Stat card values (mocked for now)
  const totalUsers = users.length;
  const admins = users.filter((u) => u.role === "admin").length;
  const employees = users.filter((u) => u.role === "employee").length;
  const managers = users.filter((u) => u.role === "manager").length;

  // Fetch users and departments
  const fetchData = useCallback(async () => {
    setLoading(true);
    const [
      { data: usersData, error: usersError },
      { data: departmentsData, error: departmentsError },
    ] = await Promise.all([
      supabase
        .from("users")
        .select("id, created_at, uuid, department_id, role"),
      supabase.from("departments").select("id, name"),
    ]);
    if (usersError) toast.error("Failed to fetch users");
    if (departmentsError) toast.error("Failed to fetch departments");
    setUsers(usersData || []);
    setDepartments(departmentsData || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle department change
  const handleDepartmentChange = async (
    userId: number,
    departmentId: number | null
  ) => {
    setUpdating(userId);
    const { error } = await supabase
      .from("users")
      .update({ department_id: departmentId })
      .eq("id", userId);
    if (error) {
      toast.error("Failed to update department");
    } else {
      toast.success("Department updated");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, department_id: departmentId } : u
        )
      );
    }
    setUpdating(null);
  };

  return (
    <div className="w-full mx-auto py-12 px-4 md:px-4">
      <h1 className="text-3xl font-bold">Users</h1>
      <p className="text-muted-foreground mb-6">
        Manage your organization's users
      </p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="bg-blue-100 rounded-lg p-3">
              <FontAwesomeIcon
                icon={faUsers}
                className="text-blue-500"
                size="2x"
              />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total Users</div>
              <div className="text-xl font-bold">{totalUsers}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="bg-green-100 rounded-lg p-3">
              <FontAwesomeIcon
                icon={faUserShield}
                className="text-green-500"
                size="2x"
              />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Admins</div>
              <div className="text-xl font-bold">{admins}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="bg-yellow-100 rounded-lg p-3">
              <FontAwesomeIcon
                icon={faUser}
                className="text-yellow-500"
                size="2x"
              />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Employees</div>
              <div className="text-xl font-bold">{employees}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="bg-purple-100 rounded-lg p-3">
              <FontAwesomeIcon
                icon={faUser}
                className="text-purple-500"
                size="2x"
              />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Managers</div>
              <div className="text-xl font-bold">{managers}</div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-semibold">All Users</div>
        {/* Export/other actions can go here */}
      </div>
      <div className="bg-white rounded-xl border p-0">
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <span className="text-muted-foreground">Loading...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="bg-gray-100 rounded-full p-6 mb-4">
                <FontAwesomeIcon
                  icon={faUsers}
                  className="text-3xl text-gray-400"
                />
              </div>
              <div className="font-semibold text-lg mb-1">No users found</div>
              <div className="text-muted-foreground mb-4">
                Invite or create your first user
              </div>
              {/* <Button>+ Create User</Button> */}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>UUID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>{user.uuid}</TableCell>
                    <TableCell>
                      <Select
                        value={
                          user.department_id ? String(user.department_id) : ""
                        }
                        onValueChange={(val) =>
                          handleDepartmentChange(
                            user.id,
                            val ? Number(val) : null
                          )
                        }
                        disabled={updating === user.id}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Assign department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={String(dept.id)}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      {/* Actions (edit, delete, etc.) can go here */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
