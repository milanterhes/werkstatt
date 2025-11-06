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
import type { Customer, Fleet } from "@/lib/db/schemas";
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
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FleetForm } from "./fleet-form";

export function FleetsTable() {
  const [selectedFleet, setSelectedFleet] = useState<Fleet | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fleetToDelete, setFleetToDelete] = useState<Fleet | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const utils = trpc.useUtils();

  const { data: fleets = [], isLoading } = trpc.fleets.list.useQuery();

  const { data: customers = [] } = trpc.customers.list.useQuery();

  const deleteMutation = trpc.fleets.delete.useMutation({
    onSuccess: () => {
      utils.fleets.list.invalidate();
      toast.success("Fleet deleted successfully");
      setDeleteDialogOpen(false);
      setFleetToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete fleet");
    },
  });

  function handleEdit(fleet: Fleet) {
    setSelectedFleet(fleet);
    setIsFormOpen(true);
  }

  function handleDelete(fleet: Fleet) {
    setFleetToDelete(fleet);
    setDeleteDialogOpen(true);
  }

  function handleCreate() {
    setSelectedFleet(null);
    setIsFormOpen(true);
  }

  const columns = useMemo<ColumnDef<Fleet>[]>(() => {
    const getCustomerName = (customerId: string | null | undefined) => {
      if (!customerId) return "-";
      const customer = customers.find((c) => c.id === customerId);
      return customer?.name || "-";
    };
    return [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        id: "customer",
        header: "Customer",
        cell: ({ row }) => getCustomerName(row.original.customerId),
        sortingFn: (rowA, rowB) => {
          const aName = getCustomerName(rowA.original.customerId).toLowerCase();
          const bName = getCustomerName(rowB.original.customerId).toLowerCase();
          return aName.localeCompare(bName);
        },
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => {
          const desc = row.original.description;
          return desc ? <span className="line-clamp-1">{desc}</span> : "-";
        },
      },
      {
        accessorKey: "fleetManagerContact",
        header: "Manager Contact",
        cell: ({ row }) => row.original.fleetManagerContact || "-",
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const fleet = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(fleet)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(fleet)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          );
        },
        enableSorting: false,
      },
    ];
  }, [customers]);

  const table = useReactTable({
    data: fleets,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  const fleetList = fleets;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Fleets</h1>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Fleet
        </Button>
      </div>

      <FleetForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={selectedFleet}
      />

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
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-40" />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : fleetList.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No fleets found. Create your first fleet to get started.
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
            <AlertDialogTitle>Delete Fleet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {fleetToDelete?.name}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (fleetToDelete) {
                  deleteMutation.mutate({ id: fleetToDelete.id });
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
