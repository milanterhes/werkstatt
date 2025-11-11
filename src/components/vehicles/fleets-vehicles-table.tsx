"use client";
import { FleetForm } from "@/components/fleets/fleet-form";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Fleet, Vehicle } from "@/lib/db/schemas";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { ChevronDown, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { nanoid } from "nanoid";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { VehicleForm } from "./vehicle-form";

interface Filter {
  id: string;
  column: string;
  value: string;
}

export function FleetsVehiclesTable() {
  const [expandedFleets, setExpandedFleets] = useState<Set<string>>(
    new Set(["__unassigned__"])
  );
  const [selectedFleet, setSelectedFleet] = useState<Fleet | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isFleetFormOpen, setIsFleetFormOpen] = useState(false);
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false);
  const [deleteFleetDialogOpen, setDeleteFleetDialogOpen] = useState(false);
  const [deleteVehicleDialogOpen, setDeleteVehicleDialogOpen] = useState(false);
  const [fleetToDelete, setFleetToDelete] = useState<Fleet | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [filters, setFilters] = useState<Filter[]>([]);
  const utils = trpc.useUtils();

  // Convert filters to query parameters
  const queryFilters = useMemo(() => {
    const customerFilter = filters.find((f) => f.column === "customerId");
    const searchFilters = filters.filter((f) => f.column !== "customerId");

    return {
      customerId:
        customerFilter?.value !== "__all__" ? customerFilter?.value : undefined,
      filters: searchFilters
        .map((f) => ({
          column: f.column,
          value: f.value.trim(),
        }))
        .filter((f) => f.value),
    };
  }, [filters]);

  const { data: fleets = [], isLoading: fleetsLoading } =
    trpc.fleets.list.useQuery({
      customerId: queryFilters.customerId,
      filters:
        queryFilters.filters.length > 0 ? queryFilters.filters : undefined,
    });
  const { data: vehicles = [], isLoading: vehiclesLoading } =
    trpc.vehicles.list.useQuery({
      customerId: queryFilters.customerId,
      filters:
        queryFilters.filters.length > 0 ? queryFilters.filters : undefined,
    });
  const { data: customers = [] } = trpc.customers.list.useQuery();

  const isLoading = fleetsLoading || vehiclesLoading;

  const deleteFleetMutation = trpc.fleets.delete.useMutation({
    onSuccess: () => {
      utils.fleets.list.invalidate();
      utils.vehicles.list.invalidate();
      toast.success("Fleet deleted successfully");
      setDeleteFleetDialogOpen(false);
      setFleetToDelete(null);
      setExpandedFleets((prev) => {
        const next = new Set(prev);
        if (fleetToDelete) next.delete(fleetToDelete.id);
        return next;
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete fleet");
    },
  });

  const deleteVehicleMutation = trpc.vehicles.delete.useMutation({
    onSuccess: () => {
      utils.vehicles.list.invalidate();
      toast.success("Vehicle deleted successfully");
      setDeleteVehicleDialogOpen(false);
      setVehicleToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete vehicle");
    },
  });

  // Group vehicles by fleet
  const vehiclesByFleet = useMemo(() => {
    const grouped = new Map<string, Vehicle[]>();
    vehicles.forEach((vehicle) => {
      if (vehicle.fleetId) {
        const existing = grouped.get(vehicle.fleetId) || [];
        grouped.set(vehicle.fleetId, [...existing, vehicle]);
      }
    });
    return grouped;
  }, [vehicles]);

  // Unassigned vehicles (no fleetId)
  const unassignedVehicles = useMemo(() => {
    return vehicles.filter((v) => !v.fleetId);
  }, [vehicles]);

  function toggleFleet(fleetId: string) {
    setExpandedFleets((prev) => {
      const next = new Set(prev);
      if (next.has(fleetId)) {
        next.delete(fleetId);
      } else {
        next.add(fleetId);
      }
      return next;
    });
  }

  function handleEditFleet(fleet: Fleet) {
    setSelectedFleet(fleet);
    setIsFleetFormOpen(true);
  }

  function handleDeleteFleet(fleet: Fleet) {
    setFleetToDelete(fleet);
    setDeleteFleetDialogOpen(true);
  }

  function handleCreateFleet() {
    setSelectedFleet(null);
    setIsFleetFormOpen(true);
  }

  function handleEditVehicle(vehicle: Vehicle) {
    setSelectedVehicle(vehicle);
    setIsVehicleFormOpen(true);
  }

  function handleDeleteVehicle(vehicle: Vehicle) {
    setVehicleToDelete(vehicle);
    setDeleteVehicleDialogOpen(true);
  }

  function handleCreateVehicle() {
    setSelectedVehicle(null);
    setIsVehicleFormOpen(true);
  }

  function getCustomerName(customerId: string | null | undefined) {
    if (!customerId) return "-";
    const customer = customers.find((c) => c.id === customerId);
    return customer?.name || "-";
  }

  function addFilter() {
    setFilters([...filters, { id: nanoid(), column: "make", value: "" }]);
  }

  function removeFilter(filterId: string) {
    setFilters(filters.filter((f) => f.id !== filterId));
  }

  function updateFilter(filterId: string, updates: Partial<Filter>) {
    setFilters(
      filters.map((f) => (f.id === filterId ? { ...f, ...updates } : f))
    );
  }

  function clearFilters() {
    setFilters([]);
  }

  const hasActiveFilters = filters.some((f) => {
    if (f.column === "customerId") {
      return f.value !== "__all__";
    }
    return f.value.trim() !== "";
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vehicles & Fleets</h1>
        <div className="flex gap-2">
          <Button onClick={handleCreateFleet} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Create Fleet
          </Button>
          <Button onClick={handleCreateVehicle}>
            <Plus className="w-4 h-4 mr-2" />
            Create Vehicle
          </Button>
        </div>
      </div>

      <FleetForm
        open={isFleetFormOpen}
        onOpenChange={setIsFleetFormOpen}
        initialData={selectedFleet}
      />

      <VehicleForm
        open={isVehicleFormOpen}
        onOpenChange={setIsVehicleFormOpen}
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

      {/* Filters */}
      <div className="border rounded-lg p-4 space-y-4">
        <div className="space-y-3">
          {filters.map((filter) => (
            <div
              key={filter.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
            >
              <div className="md:col-span-4">
                <label className="text-sm font-medium mb-2 block">
                  Filter Column
                </label>
                <Select
                  value={filter.column}
                  onValueChange={(value) =>
                    updateFilter(filter.id, { column: value, value: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customerId">Customer</SelectItem>
                    <SelectItem value="licensePlate">License Plate</SelectItem>
                    <SelectItem value="vin">VIN</SelectItem>
                    <SelectItem value="make">Make</SelectItem>
                    <SelectItem value="model">Model</SelectItem>
                    <SelectItem value="fleetName">Fleet Name</SelectItem>
                    <SelectItem value="fleetDescription">
                      Fleet Description
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-7">
                <label className="text-sm font-medium mb-2 block">Value</label>
                {filter.column === "customerId" ? (
                  <Select
                    value={filter.value}
                    onValueChange={(value) =>
                      updateFilter(filter.id, { value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
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
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={`Filter by ${filter.column === "licensePlate" ? "license plate" : filter.column === "fleetName" ? "fleet name" : filter.column === "fleetDescription" ? "fleet description" : filter.column}...`}
                      value={filter.value}
                      onChange={(e) =>
                        updateFilter(filter.id, { value: e.target.value })
                      }
                      className="pl-9"
                    />
                  </div>
                )}
              </div>

              <div className="md:col-span-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFilter(filter.id)}
                  className="h-10 w-10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={addFilter}>
            <Plus className="w-4 h-4 mr-2" />
            Add Filter
          </Button>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" />
              Clear All Filters
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Manager Contact</TableHead>
              <TableHead>Vehicles</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-5 w-5" />
                  </TableCell>
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
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : fleets.length === 0 && unassignedVehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {hasActiveFilters
                    ? "No fleets or vehicles match the current filters."
                    : "No fleets found. Create your first fleet to get started."}
                </TableCell>
              </TableRow>
            ) : (
              [
                // Unassigned vehicles row
                ...(unassignedVehicles.length > 0
                  ? (() => {
                      const isUnassignedExpanded =
                        expandedFleets.has("__unassigned__");
                      return [
                        <TableRow
                          key="__unassigned__"
                          className={cn(
                            "cursor-pointer hover:bg-muted/50",
                            isUnassignedExpanded && "bg-muted/30"
                          )}
                          onClick={() => toggleFleet("__unassigned__")}
                        >
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFleet("__unassigned__");
                              }}
                            >
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 transition-transform",
                                  isUnassignedExpanded && "rotate-180"
                                )}
                              />
                            </Button>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">Unassigned</span>
                          </TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {unassignedVehicles.length}
                            </Badge>
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>,
                        ...(isUnassignedExpanded
                          ? [
                              <TableRow
                                key="__unassigned__-header"
                                className="bg-muted/30"
                              >
                                <TableHead></TableHead>
                                <TableHead className="pl-8">
                                  License Plate
                                </TableHead>
                                <TableHead>Make/Model</TableHead>
                                <TableHead>Year</TableHead>
                                <TableHead>VIN</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead className="text-right">
                                  Actions
                                </TableHead>
                              </TableRow>,
                              ...unassignedVehicles.map((vehicle) => (
                                <TableRow
                                  key={vehicle.id}
                                  className="bg-muted/20"
                                >
                                  <TableCell></TableCell>
                                  <TableCell className="pl-8">
                                    {vehicle.licensePlate || "-"}
                                  </TableCell>
                                  <TableCell>
                                    {vehicle.make || vehicle.model
                                      ? `${vehicle.make || ""} ${vehicle.model || ""}`.trim()
                                      : "-"}
                                  </TableCell>
                                  <TableCell>{vehicle.year || "-"}</TableCell>
                                  <TableCell>{vehicle.vin || "-"}</TableCell>
                                  <TableCell>
                                    {getCustomerName(vehicle.customerId)}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleEditVehicle(vehicle)
                                        }
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleDeleteVehicle(vehicle)
                                        }
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )),
                            ]
                          : []),
                      ];
                    })()
                  : []),
                ...fleets.flatMap((fleet) => {
                  const isExpanded = expandedFleets.has(fleet.id);
                  const fleetVehicles = vehiclesByFleet.get(fleet.id) || [];
                  const vehicleCount = fleetVehicles.length;

                  return [
                    <TableRow
                      key={fleet.id}
                      className={cn(
                        "cursor-pointer hover:bg-muted/50",
                        isExpanded && "bg-muted/30"
                      )}
                      onClick={() => toggleFleet(fleet.id)}
                    >
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFleet(fleet.id);
                          }}
                        >
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              isExpanded && "rotate-180"
                            )}
                          />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{fleet.name}</span>
                      </TableCell>
                      <TableCell>{getCustomerName(fleet.customerId)}</TableCell>
                      <TableCell>
                        {fleet.description ? (
                          <span className="line-clamp-1">
                            {fleet.description}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{fleet.fleetManagerContact || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{vehicleCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditFleet(fleet);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFleet(fleet);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>,
                    ...(isExpanded
                      ? fleetVehicles.length === 0
                        ? [
                            <TableRow key={`${fleet.id}-empty`}>
                              <TableCell colSpan={7} className="bg-muted/20">
                                <div className="py-4 text-center text-sm text-muted-foreground">
                                  No vehicles in this fleet
                                </div>
                              </TableCell>
                            </TableRow>,
                          ]
                        : [
                            <TableRow
                              key={`${fleet.id}-header`}
                              className="bg-muted/30"
                            >
                              <TableHead></TableHead>
                              <TableHead className="pl-8">
                                License Plate
                              </TableHead>
                              <TableHead>Make/Model</TableHead>
                              <TableHead>Year</TableHead>
                              <TableHead>VIN</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead className="text-right">
                                Actions
                              </TableHead>
                            </TableRow>,
                            ...fleetVehicles.map((vehicle) => (
                              <TableRow
                                key={vehicle.id}
                                className="bg-muted/20"
                              >
                                <TableCell></TableCell>
                                <TableCell className="pl-8">
                                  {vehicle.licensePlate || "-"}
                                </TableCell>
                                <TableCell>
                                  {vehicle.make || vehicle.model
                                    ? `${vehicle.make || ""} ${vehicle.model || ""}`.trim()
                                    : "-"}
                                </TableCell>
                                <TableCell>{vehicle.year || "-"}</TableCell>
                                <TableCell>{vehicle.vin || "-"}</TableCell>
                                <TableCell>
                                  {getCustomerName(vehicle.customerId)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditVehicle(vehicle)}
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteVehicle(vehicle)
                                      }
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )),
                          ]
                      : []),
                  ];
                }),
              ]
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Fleet Dialog */}
      <AlertDialog
        open={deleteFleetDialogOpen}
        onOpenChange={setDeleteFleetDialogOpen}
      >
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
                  deleteFleetMutation.mutate({ id: fleetToDelete.id });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Vehicle Dialog */}
      <AlertDialog
        open={deleteVehicleDialogOpen}
        onOpenChange={setDeleteVehicleDialogOpen}
      >
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
                  deleteVehicleMutation.mutate({ id: vehicleToDelete.id });
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
