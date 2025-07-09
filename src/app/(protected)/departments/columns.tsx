import { ColumnDef } from "@tanstack/react-table";

export type Department = {
  id: number;
  created_at: string;
  title: string;
};

export const columns: ColumnDef<Department>[] = [
  {
    accessorKey: "title",
    header: "Department Name",
    cell: ({ row }) => <span>{row.getValue("title")}</span>,
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => new Date(row.getValue("created_at")).toLocaleString(),
  },
];
