"use client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WorkOrder } from "@/lib/db/schemas";
import { trpc } from "@/lib/trpc";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  draft: "bg-gray-500",
  "in-progress": "bg-blue-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  "in-progress": "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function formatDate(date: Date | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
}

export function WorkOrdersTable() {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workOrderToDelete, setWorkOrderToDelete] = useState<WorkOrder | null>(
    null
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const utils = trpc.useUtils();

  const { data: workOrders = [], isLoading } = trpc.workOrders.list.useQuery();
  const { data: customers = [] } = trpc.customers.list.useQuery();
  const { data: vehicles = [] } = trpc.vehicles.list.useQuery();

  const deleteMutation = trpc.workOrders.delete.useMutation({
    onSuccess: () => {
      utils.workOrders.list.invalidate();
      toast.success("Work order deleted successfully");
      setDeleteDialogOpen(false);
      setWorkOrderToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete work order");
    },
  });

  function handleEdit(workOrder: WorkOrder) {
    router.push(`/work-orders/${workOrder.id}/edit`);
  }

  function handleDelete(workOrder: WorkOrder) {
    setWorkOrderToDelete(workOrder);
    setDeleteDialogOpen(true);
  }

  function handleCreate() {
    router.push("/work-orders/new");
  }

  const columns = useMemo<ColumnDef<WorkOrder>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.title}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status || "draft";
          return (
            <Badge
              className={`${
                statusColors[status] || statusColors.draft
              } text-white`}
            >
              {statusLabels[status] || status}
            </Badge>
          );
        },
      },
      {
        id: "customer",
        header: "Customer",
        cell: ({ row }) => {
          const customerId = row.original.customerId;
          if (!customerId) return "-";
          const customer = customers.find((c) => c.id === customerId);
          return customer?.name || "-";
        },
        enableSorting: false,
      },
      {
        id: "vehicle",
        header: "Vehicle",
        cell: ({ row }) => {
          const vehicleId = row.original.vehicleId;
          if (!vehicleId) return "-";
          const vehicle = vehicles.find((v) => v.id === vehicleId);
          if (!vehicle) return "-";
          return (
            vehicle.licensePlate ||
            vehicle.vin ||
            `${vehicle.make || ""} ${vehicle.model || ""}`.trim() ||
            "-"
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "dueDate",
        header: "Due Date",
        cell: ({ row }) => formatDate(row.original.dueDate),
      },
      {
        accessorKey: "createdDate",
        header: "Created Date",
        cell: ({ row }) => formatDate(row.original.createdDate),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const workOrder = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(workOrder)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(workOrder)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [customers, vehicles]
  );

  const table = useReactTable({
    data: workOrders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Work Orders</h1>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Work Order
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  return (
                    <TableHead key={header.id}>
                      {canSort ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 -ml-2"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: <ArrowUp className="w-4 h-4 ml-1" />,
                            desc: <ArrowDown className="w-4 h-4 ml-1" />,
                          }[header.column.getIsSorted() as string] ?? (
                            <ArrowUpDown className="w-4 h-4 ml-1" />
                          )}
                        </Button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : workOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No work orders found. Create your first work order to get
                  started.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Work Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {workOrderToDelete?.title}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (workOrderToDelete) {
                  deleteMutation.mutate({ id: workOrderToDelete.id });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
