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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Customer, Fleet, Vehicle } from "@/lib/db/schemas";
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
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { VehicleForm } from "./vehicle-form";

export function VehiclesTable() {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [customerFilter, setCustomerFilter] = useState<string>("__all__");
  const [fleetFilter, setFleetFilter] = useState<string>("__all__");
  const [sorting, setSorting] = useState<SortingState>([]);
  const utils = trpc.useUtils();

  const { data: vehicles = [], isLoading } = trpc.vehicles.list.useQuery({
    customerId: customerFilter !== "__all__" ? customerFilter : undefined,
    fleetId: fleetFilter !== "__all__" ? fleetFilter : undefined,
  });

  const { data: customers = [] } = trpc.customers.list.useQuery();

  const { data: fleets = [] } = trpc.fleets.list.useQuery();

  const deleteMutation = trpc.vehicles.delete.useMutation({
    onSuccess: () => {
      utils.vehicles.list.invalidate();
      toast.success("Vehicle deleted successfully");
      setDeleteDialogOpen(false);
      setVehicleToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete vehicle");
    },
  });

  function handleEdit(vehicle: Vehicle) {
    setSelectedVehicle(vehicle);
    setIsFormOpen(true);
  }

  function handleDelete(vehicle: Vehicle) {
    setVehicleToDelete(vehicle);
    setDeleteDialogOpen(true);
  }

  function handleCreate() {
    setSelectedVehicle(null);
    setIsFormOpen(true);
  }


  const columns = useMemo<ColumnDef<Vehicle>[]>(() => {
    const getCustomerName = (customerId: string | null | undefined) => {
      if (!customerId) return "-";
      const customer = customers.find((c) => c.id === customerId);
      return customer?.name || "-";
    };

    const getFleetName = (fleetId: string | null | undefined) => {
      if (!fleetId) return "-";
      const fleet = fleets.find((f) => f.id === fleetId);
      return fleet?.name || "-";
    };
    return [
      {
        accessorKey: "licensePlate",
        header: "License Plate",
        cell: ({ row }) => row.original.licensePlate || "-",
      },
      {
        id: "makeModel",
        header: "Make/Model",
        cell: ({ row }) => {
          const { make, model } = row.original;
          return make || model ? `${make || ""} ${model || ""}`.trim() : "-";
        },
        sortingFn: (rowA, rowB) => {
          const aMake = rowA.original.make?.toLowerCase() || "";
          const bMake = rowB.original.make?.toLowerCase() || "";
          if (aMake !== bMake) return aMake.localeCompare(bMake);
          const aModel = rowA.original.model?.toLowerCase() || "";
          const bModel = rowB.original.model?.toLowerCase() || "";
          return aModel.localeCompare(bModel);
        },
      },
      {
        accessorKey: "year",
        header: "Year",
        cell: ({ row }) => row.original.year || "-",
      },
      {
        accessorKey: "vin",
        header: "VIN",
        cell: ({ row }) => row.original.vin || "-",
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
        id: "fleet",
        header: "Fleet",
        cell: ({ row }) => getFleetName(row.original.fleetId),
        sortingFn: (rowA, rowB) => {
          const aName = getFleetName(rowA.original.fleetId).toLowerCase();
          const bName = getFleetName(rowB.original.fleetId).toLowerCase();
          return aName.localeCompare(bName);
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const vehicle = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(vehicle)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(vehicle)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          );
        },
        enableSorting: false,
      },
    ];
  }, [customers, fleets]);

  const table = useReactTable({
    data: vehicles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  function clearFilters() {
    setCustomerFilter("__all__");
    setFleetFilter("__all__");
    setSorting([]);
  }

  const hasActiveFilters =
    customerFilter !== "__all__" ||
    fleetFilter !== "__all__" ||
    sorting.length > 0;

  const vehicleList = vehicles;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vehicles</h1>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Vehicle
        </Button>
      </div>

      {/* Filters and Sorting */}
      <div className="border rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">
              Filter by Customer
            </label>
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All customers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All customers</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">
              Filter by Fleet
            </label>
            <Select value={fleetFilter} onValueChange={setFleetFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All fleets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All fleets</SelectItem>
                {fleets.map((fleet) => (
                  <SelectItem key={fleet.id} value={fleet.id}>
                    {fleet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <VehicleForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={
          selectedVehicle
            ? {
                id: selectedVehicle.id,
                licensePlate: selectedVehicle.licensePlate ?? undefined,
                vin: selectedVehicle.vin ?? undefined,
                make: selectedVehicle.make ?? undefined,
                model: selectedVehicle.model ?? undefined,
                year: selectedVehicle.year ?? undefined,
                mileage: selectedVehicle.mileage ?? undefined,
                color: selectedVehicle.color ?? undefined,
                fuelType: selectedVehicle.fuelType ?? undefined,
                engineInfo: selectedVehicle.engineInfo ?? undefined,
                registrationDate: selectedVehicle.registrationDate
                  ? typeof selectedVehicle.registrationDate === "string"
                    ? selectedVehicle.registrationDate
                    : new Date(selectedVehicle.registrationDate)
                        .toISOString()
                        .split("T")[0]
                  : null,
                customerId: selectedVehicle.customerId ?? undefined,
                fleetId: selectedVehicle.fleetId ?? undefined,
              }
            : null
        }
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
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : vehicleList.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {hasActiveFilters
                    ? "No vehicles match the current filters."
                    : "No vehicles found. Create your first vehicle to get started."}
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
            <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this vehicle? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (vehicleToDelete) {
                  deleteMutation.mutate({ id: vehicleToDelete.id });
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
