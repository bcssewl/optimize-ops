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
import {
  faBullseye,
  faEdit,
  faEye,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as yup from "yup";

interface User {
  id: number;
  email: string;
  full_name?: string;
  uuid: string;
  role?: string;
  department_id?: number;
}

interface Target {
  id: number;
  user_uuid: string;
  target_name: string;
  target_value: string;
  date?: string;
  created_at?: string;
  isAnalyzed?: boolean;
}

interface AddTargetFormValues {
  target_name: string;
  target_value: string;
}

interface EditTargetFormValues {
  target_name: string;
  target_value: string;
}

const schema = yup.object({
  target_name: yup.string().required("Target name is required"),
  target_value: yup
    .string()
    .required("Target value is required")
    .trim()
    .min(1, "Target value cannot be empty"),
});

const editSchema = yup.object({
  target_name: yup.string().required("Target name is required"),
  target_value: yup
    .string()
    .required("Target value is required")
    .trim()
    .min(1, "Target value cannot be empty"),
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
  const [editingTarget, setEditingTarget] = useState<Target | null>(null);
  const [deletingTargetId, setDeletingTargetId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 10;

  const form = useForm<AddTargetFormValues>({
    resolver: yupResolver(schema),
    defaultValues: { target_name: "", target_value: "" },
  });
  const editForm = useForm<EditTargetFormValues>({
    resolver: yupResolver(editSchema),
    defaultValues: { target_name: "", target_value: "" },
  });

  // Memoized user targets for view modal
  const viewUserTargets = useMemo(() => {
    if (!viewUser) return [];
    return targets
      .filter((t) => t.user_uuid === viewUser.uuid)
      .sort((a, b) => {
        // Sort by date first (newest first), then by created_at (newest first)
        const dateA = a.date || a.created_at || "";
        const dateB = b.date || b.created_at || "";
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
  }, [viewUser, targets]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [
        { data: usersData, error: usersError },
        { data: targetsData, error: targetsError },
        { data: departmentsData, error: departmentsError },
      ] = await Promise.all([
        supabase
          .from("users")
          .select("id, email, full_name, uuid, role, department_id"),
        supabase
          .from("targets")
          .select(
            "id, user_uuid, target_name, target_value, date, created_at, isAnalyzed"
          ),
        supabase.from("departments").select("id, title"),
      ]);
      if (usersError) toast.error("Failed to fetch users");
      if (targetsError) toast.error("Failed to fetch targets");
      if (departmentsError) toast.error("Failed to fetch departments");
      console.log("*** UsersData:", usersData);
      setUsers(usersData || []);
      setTargets(targetsData || []);
      setDepartments(departmentsData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Pagination derived values for users table
  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  useEffect(() => {
    setCurrentPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const pagedUsers = useMemo(
    () => users.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [users, currentPage]
  );

  const pageWindow = useMemo(() => {
    const maxButtons = 5;
    const half = Math.floor(maxButtons / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  const handleAddTarget = async (values: AddTargetFormValues) => {
    if (!modalUser) return;
    const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
    const { error } = await supabase.from("targets").insert({
      user_uuid: modalUser.uuid,
      target_name: values.target_name,
      target_value: values.target_value,
      date: today,
    });
    if (error) {
      toast.error(error.message || "Failed to add target");
    } else {
      toast.success("Target added for today");
      setModalUser(null);
      form.reset();
      const { data: targetsData } = await supabase
        .from("targets")
        .select(
          "id, user_uuid, target_name, target_value, date, created_at, isAnalyzed"
        );
      setTargets(targetsData || []);
    }
  };

  const handleEditTarget = async (values: EditTargetFormValues) => {
    if (!editingTarget) return;
    const { error } = await supabase
      .from("targets")
      .update({
        target_name: values.target_name,
        target_value: values.target_value,
      })
      .eq("id", editingTarget.id);
    if (error) {
      toast.error(error.message || "Failed to update target");
    } else {
      toast.success("Target updated successfully");
      setEditingTarget(null);
      editForm.reset();
      const { data: targetsData } = await supabase
        .from("targets")
        .select(
          "id, user_uuid, target_name, target_value, date, created_at, isAnalyzed"
        );
      setTargets(targetsData || []);
    }
  };

  const handleDeleteTarget = async (targetId: number) => {
    setDeletingTargetId(targetId);
    const { error } = await supabase
      .from("targets")
      .delete()
      .eq("id", targetId);
    if (error) {
      toast.error(error.message || "Failed to delete target");
    } else {
      toast.success("Target deleted successfully");
      const { data: targetsData } = await supabase
        .from("targets")
        .select(
          "id, user_uuid, target_name, target_value, date, created_at, isAnalyzed"
        );
      setTargets(targetsData || []);
    }
    setDeletingTargetId(null);
  };

  const openEditModal = (target: Target) => {
    setEditingTarget(target);
    editForm.setValue("target_name", target.target_name);
    editForm.setValue("target_value", target.target_value);
  };

  // Helper to count targets for a user
  const getUserTargets = (user_uuid: string) =>
    targets.filter((t) => t.user_uuid === user_uuid);

  // Helper to check if target is from today
  const isToday = (dateString: string | null | undefined) => {
    if (!dateString) return false;
    const today = new Date().toISOString().split("T")[0];
    return dateString === today;
  };

  // Helper to format date in human readable way
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split("T")[0]) {
      return "Today";
    } else if (dateString === yesterday.toISOString().split("T")[0]) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  console.log("*** Users:", users);
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
                pagedUsers.map((user) => {
                  const userTargets = getUserTargets(user.uuid);
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {/* Optionally add avatar here */}
                          <div>
                            <div className="font-medium">
                              {user.full_name || user.email}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {user.email}
                            </div>
                            <div className="text-xs text-muted-foreground flex flex-col gap-0.5 mt-1">
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
                              + Add Today's Target
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Today's Target</DialogTitle>
                            </DialogHeader>
                            <div className="mb-4 flex flex-col gap-1">
                              <div className="font-medium">
                                {user.full_name || user.email}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {user.email}
                              </div>
                              <div className="text-xs text-muted-foreground flex flex-col gap-0.5 mt-1">
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
                                <span className="text-blue-600 font-medium">
                                  <strong>Date:</strong>{" "}
                                  {new Date().toLocaleDateString()}
                                </span>
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
                                  type="text"
                                  placeholder="Enter target value"
                                  {...form.register("target_value")}
                                />
                                {form.formState.errors.target_value && (
                                  <ErrorText>
                                    {form.formState.errors.target_value.message}
                                  </ErrorText>
                                )}
                              </div>
                              <Button type="submit" className="w-full">
                                Add Today's Target
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
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                            <DialogHeader className="flex-shrink-0">
                              <DialogTitle>
                                Targets for{" "}
                                {user.full_name
                                  ? `${user.full_name} (${user.email})`
                                  : user.email}
                              </DialogTitle>
                            </DialogHeader>
                            {viewUserTargets.length === 0 ? (
                              <div className="text-muted-foreground text-center py-4">
                                No targets found for this user.
                              </div>
                            ) : (
                              <div className="flex-1 overflow-hidden">
                                <div className="overflow-auto max-h-[60vh] border rounded-lg">
                                  <Table>
                                    <TableHeader className="sticky top-0 bg-white z-10">
                                      <TableRow>
                                        <TableHead>Target Name</TableHead>
                                        <TableHead>Value</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Actions</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {viewUserTargets.map((target) => (
                                        <TableRow
                                          key={target.id}
                                          className={
                                            isToday(target.date)
                                              ? "bg-blue-50 border-blue-200"
                                              : ""
                                          }
                                        >
                                          <TableCell>
                                            <div className="flex items-center gap-2">
                                              <span
                                                className="max-w-[200px] truncate"
                                                title={target.target_name}
                                              >
                                                {target.target_name}
                                              </span>
                                              {isToday(target.date) && (
                                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium flex-shrink-0">
                                                  Today
                                                </span>
                                              )}
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <span
                                              className="max-w-[150px] truncate block"
                                              title={target.target_value}
                                            >
                                              {target.target_value}
                                            </span>
                                          </TableCell>
                                          <TableCell>
                                            <span
                                              className={
                                                isToday(target.date)
                                                  ? "font-medium text-blue-700"
                                                  : "text-gray-600"
                                              }
                                            >
                                              {formatDate(target.date)}
                                            </span>
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex gap-1">
                                              {!target.isAnalyzed ? (
                                                <>
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-blue-600 border-blue-200 text-xs px-2 py-1"
                                                    onClick={() =>
                                                      openEditModal(target)
                                                    }
                                                  >
                                                    <FontAwesomeIcon
                                                      icon={faEdit}
                                                      className="mr-1"
                                                    />
                                                    Edit
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 border-red-200 text-xs px-2 py-1"
                                                    onClick={() =>
                                                      handleDeleteTarget(
                                                        target.id
                                                      )
                                                    }
                                                    disabled={
                                                      deletingTargetId ===
                                                      target.id
                                                    }
                                                  >
                                                    <FontAwesomeIcon
                                                      icon={faTrash}
                                                      className="mr-1"
                                                    />
                                                    {deletingTargetId ===
                                                    target.id
                                                      ? "..."
                                                      : "Delete"}
                                                  </Button>
                                                </>
                                              ) : (
                                                <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                                                  Already Analyzed
                                                </span>
                                              )}
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            {pageWindow.map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Edit Target Modal */}
      <Dialog
        open={editingTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTarget(null);
            editForm.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Target</DialogTitle>
          </DialogHeader>
          {editingTarget && (
            <form
              onSubmit={editForm.handleSubmit(handleEditTarget)}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="edit_target_name">Target Name</Label>
                <Input
                  id="edit_target_name"
                  {...editForm.register("target_name")}
                />
                {editForm.formState.errors.target_name && (
                  <ErrorText>
                    {editForm.formState.errors.target_name.message}
                  </ErrorText>
                )}
              </div>
              <div>
                <Label htmlFor="edit_target_value">Target Value</Label>
                <Input
                  id="edit_target_value"
                  type="text"
                  placeholder="Enter target value"
                  {...editForm.register("target_value")}
                />
                {editForm.formState.errors.target_value && (
                  <ErrorText>
                    {editForm.formState.errors.target_value.message}
                  </ErrorText>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Update Target
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setEditingTarget(null);
                    editForm.reset();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
