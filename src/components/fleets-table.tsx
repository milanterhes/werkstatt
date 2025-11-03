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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Customer, Fleet } from "@/lib/db/schemas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  const { data: fleets, isLoading } = useQuery<{ data: Fleet[] }>({
    queryKey: ["fleets"],
    queryFn: async () => {
      const response = await fetch("/api/fleets");
      if (!response.ok) {
        throw new Error("Failed to fetch fleets");
      }
      return response.json();
    },
  });

  const { data: customersData } = useQuery<{ data: Customer[] }>({
    queryKey: ["customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers");
      if (!response.ok) {
        return { data: [] };
      }
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/fleets/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete fleet");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fleets"] });
      toast.success("Fleet deleted successfully");
      setDeleteDialogOpen(false);
      setFleetToDelete(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete fleet"
      );
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

  const customers = useMemo(
    () => customersData?.data || [],
    [customersData?.data]
  );

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
    data: fleets?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (isLoading) {
    return <div className="p-4">Loading fleets...</div>;
  }

  const fleetList = fleets?.data || [];

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

      {fleetList.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No fleets found. Create your first fleet to get started.
        </div>
      ) : (
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
              {table.getRowModel().rows?.length ? (
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
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

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
                  deleteMutation.mutate(fleetToDelete.id);
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
