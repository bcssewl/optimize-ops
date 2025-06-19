import { ColumnDef } from "@tanstack/react-table";

export type Department = {
  id: number;
  created_at: string;
  department_name: string;
};

export const columns: ColumnDef<Department>[] = [
  {
    accessorKey: "department_name",
    header: "Department Name",
    cell: ({ row }) => <span>{row.getValue("department_name")}</span>,
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => new Date(row.getValue("created_at")).toLocaleString(),
  },
];
