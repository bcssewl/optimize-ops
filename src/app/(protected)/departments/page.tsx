"use client";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import ErrorText from "@/src/components/ui/error-text";
import { Input } from "@/src/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { createClient } from "@/src/lib/supabase/client";
import { faBuilding } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as yup from "yup";
import { Department } from "./columns";

const schema = yup.object({
  title: yup.string().required("Department name is required"),
});

type FormValues = yup.InferType<typeof schema>;

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const form = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: { title: "" },
  });

  // Fetch departments
  const fetchDepartments = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to fetch departments");
    } else {
      setDepartments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Handle form submit (create or update)
  const onSubmit = async (values: FormValues) => {
    const supabase = createClient();
    if (editing) {
      // Update
      const { error } = await supabase
        .from("departments")
        .update({ title: values.title })
        .eq("id", editing.id);
      if (error) {
        toast.error(error.message || "Failed to update department");
      } else {
        toast.success("Department updated");
        setEditing(null);
        setModalOpen(false);
        form.reset();
        fetchDepartments();
      }
    } else {
      // Create
      const { error } = await supabase
        .from("departments")
        .insert([{ title: values.title }]);
      if (error) {
        toast.error(error.message || "Failed to create department");
      } else {
        toast.success("Department created");
        setModalOpen(false);
        form.reset();
        fetchDepartments();
      }
    }
  };

  // Handle edit click
  const handleEdit = (dept: Department) => {
    setEditing(dept);
    form.setValue("title", dept.title);
    setModalOpen(true);
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditing(null);
    setModalOpen(false);
    form.reset();
  };

  // Stats (mocked for now)
  const totalDepartments = departments.length;
  const activeDepartments = 0; // Replace with real logic if available
  const employees = 0; // Replace with real logic if available
  const thisMonth = 0; // Replace with real logic if available

  return (
    <div className="w-full mx-auto py-12 px-4 md:px-4">
      <h1 className="text-3xl font-bold">Departments</h1>
      <p className="text-muted-foreground mb-6">
        Manage your organization's departments
      </p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="bg-blue-100 rounded-lg p-3">
              <FontAwesomeIcon
                icon={faBuilding}
                className="text-blue-500"
                size="2x"
              />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                Total Departments
              </div>
              <div className="text-xl font-bold">{totalDepartments}</div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-semibold">All Departments</div>
        <div className="flex gap-2">
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null);
                  form.reset();
                }}
              >
                + Create Department
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editing ? "Edit Department" : "Create Department"}
                </DialogTitle>
              </DialogHeader>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-2"
              >
                <Input
                  placeholder="Department name"
                  {...form.register("title")}
                  disabled={loading}
                />
                {form.formState.errors.title && (
                  <ErrorText>{form.formState.errors.title.message}</ErrorText>
                )}
                <div className="flex gap-2 mt-2">
                  <Button type="submit" disabled={loading}>
                    {editing ? "Update" : "Create"}
                  </Button>
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="bg-white rounded-xl border p-0">
        <div>
          {departments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="bg-gray-100 rounded-full p-6 mb-4">
                <FontAwesomeIcon
                  icon={faBuilding}
                  className="text-3xl text-gray-400"
                />
              </div>
              <div className="font-semibold text-lg mb-1">
                No departments found
              </div>
              <div className="text-muted-foreground mb-4">
                Get started by creating your first department
              </div>
              <Button
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
              >
                + Create Department
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department Name</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell>{dept.title}</TableCell>
                    <TableCell>
                      {new Date(dept.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>0</TableCell>
                    <TableCell>
                      <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-700">
                        Active
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(dept)}
                      >
                        Edit
                      </Button>
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
