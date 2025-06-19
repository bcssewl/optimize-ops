"use client";

import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import ErrorText from "@/src/components/ui/error-text";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { createClient } from "@/src/lib/supabase/client";
import { faBullseye, faEye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as yup from "yup";

interface User {
  id: number;
  email: string;
  uuid: string;
  role?: string;
  department_id?: number;
}

interface Target {
  id: number;
  user_uuid: string;
  target_name: string;
  target_value: number;
  created_at?: string;
}

interface AddTargetFormValues {
  target_name: string;
  target_value: number;
}

const schema = yup.object({
  target_name: yup.string().required("Target name is required"),
  target_value: yup
    .number()
    .typeError("Target value must be a number")
    .required("Target value is required"),
});

export default function TargetsPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<User[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [departments, setDepartments] = useState<
    { id: number; title: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [modalUser, setModalUser] = useState<User | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const form = useForm<AddTargetFormValues>({
    resolver: yupResolver(schema),
    defaultValues: { target_name: "", target_value: undefined },
  });

  // Memoized user targets for view modal
  const viewUserTargets = useMemo(() => {
    if (!viewUser) return [];
    return targets.filter((t) => t.user_uuid === viewUser.uuid);
  }, [viewUser, targets]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [
        { data: usersData, error: usersError },
        { data: targetsData, error: targetsError },
        { data: departmentsData, error: departmentsError },
      ] = await Promise.all([
        supabase.from("users").select("id, email, uuid, role, department_id"),
        supabase
          .from("targets")
          .select("id, user_uuid, target_name, target_value, created_at"),
        supabase.from("departments").select("id, title"),
      ]);
      if (usersError) toast.error("Failed to fetch users");
      if (targetsError) toast.error("Failed to fetch targets");
      if (departmentsError) toast.error("Failed to fetch departments");
      setUsers(usersData || []);
      setTargets(targetsData || []);
      setDepartments(departmentsData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleAddTarget = async (values: AddTargetFormValues) => {
    if (!modalUser) return;
    const { error } = await supabase.from("targets").insert({
      user_uuid: modalUser.uuid,
      target_name: values.target_name,
      target_value: values.target_value,
    });
    if (error) {
      toast.error(error.message || "Failed to add target");
    } else {
      toast.success("Target added");
      setModalUser(null);
      form.reset();
      const { data: targetsData } = await supabase
        .from("targets")
        .select("id, user_uuid, target_name, target_value");
      setTargets(targetsData || []);
    }
  };

  // Helper to count targets for a user
  const getUserTargets = (user_uuid: string) =>
    targets.filter((t) => t.user_uuid === user_uuid);

  return (
    <div className="w-full mx-auto py-12 px-4 md:px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Targets Management</h1>
          <p className="text-muted-foreground">
            Manage user targets and track progress
          </p>
        </div>
      </div>
      <div className="bg-white rounded-xl border p-0">
        <div>
          <div className="text-xl font-semibold px-6 py-4 border-b">
            User Targets Overview
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/2">User Email</TableHead>
                <TableHead className="w-1/4">Number of Targets</TableHead>
                <TableHead className="w-1/4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const userTargets = getUserTargets(user.uuid);
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {/* Optionally add avatar here */}
                          <div>
                            <div className="font-medium">{user.email}</div>
                            <div className="text-xs text-muted-foreground flex flex-col gap-0.5">
                              {(() => {
                                const dept = departments.find(
                                  (d) => d.id === user.department_id
                                );
                                return dept ? (
                                  <span>
                                    <strong>Department</strong> - {dept.title}
                                  </span>
                                ) : null;
                              })()}
                              {user.role ? (
                                <span>
                                  <strong>Role</strong> -{" "}
                                  {user.role.charAt(0).toUpperCase() +
                                    user.role.slice(1)}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                            userTargets.length === 0
                              ? "bg-gray-100 text-gray-500"
                              : userTargets.length < 4
                              ? "bg-yellow-100 text-yellow-700"
                              : userTargets.length < 7
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          <FontAwesomeIcon icon={faBullseye} />{" "}
                          {userTargets.length} targets
                        </span>
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Dialog
                          open={modalUser?.id === user.id}
                          onOpenChange={(open) => {
                            setModalUser(open ? user : null);
                            form.reset();
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 border-blue-200"
                            >
                              + Add Target
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Target</DialogTitle>
                            </DialogHeader>
                            <div className="mb-4 flex flex-col gap-1">
                              <div className="font-medium">{user.email}</div>
                              <div className="text-xs text-muted-foreground flex flex-col gap-0.5">
                                {(() => {
                                  const dept = departments.find(
                                    (d) => d.id === user.department_id
                                  );
                                  return dept ? (
                                    <span>
                                      <strong>Department</strong> - {dept.title}
                                    </span>
                                  ) : null;
                                })()}
                                {user.role ? (
                                  <span>
                                    <strong>Role</strong> -{" "}
                                    {user.role.charAt(0).toUpperCase() +
                                      user.role.slice(1)}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <form
                              onSubmit={form.handleSubmit(handleAddTarget)}
                              className="space-y-4"
                            >
                              <div>
                                <Label htmlFor="target_name">Target Name</Label>
                                <Input
                                  id="target_name"
                                  {...form.register("target_name")}
                                />
                                {form.formState.errors.target_name && (
                                  <ErrorText>
                                    {form.formState.errors.target_name.message}
                                  </ErrorText>
                                )}
                              </div>
                              <div>
                                <Label htmlFor="target_value">
                                  Target Value
                                </Label>
                                <Input
                                  id="target_value"
                                  type="number"
                                  {...form.register("target_value")}
                                />
                                {form.formState.errors.target_value && (
                                  <ErrorText>
                                    {form.formState.errors.target_value.message}
                                  </ErrorText>
                                )}
                              </div>
                              <Button type="submit" className="w-full">
                                Add Target
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200"
                          onClick={() => setViewUser(user)}
                        >
                          <FontAwesomeIcon icon={faEye} className="mr-1" /> View
                          All
                        </Button>
                        {/* View Targets Modal */}
                        <Dialog
                          open={viewUser?.id === user.id}
                          onOpenChange={(open) =>
                            setViewUser(open ? user : null)
                          }
                        >
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Targets for {user.email}
                              </DialogTitle>
                            </DialogHeader>
                            {viewUserTargets.length === 0 ? (
                              <div className="text-muted-foreground text-center py-4">
                                No targets found for this user.
                              </div>
                            ) : (
                              <div className="bg-white rounded-xl border p-0">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Target Name</TableHead>
                                      <TableHead>Value</TableHead>
                                      <TableHead>Created At</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {viewUserTargets.map((target) => (
                                      <TableRow key={target.id}>
                                        <TableCell>
                                          {target.target_name}
                                        </TableCell>
                                        <TableCell>
                                          {target.target_value}
                                        </TableCell>
                                        <TableCell>
                                          {target.created_at
                                            ? new Date(
                                                target.created_at
                                              ).toLocaleString()
                                            : "-"}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
