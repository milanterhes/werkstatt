"use client";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { workOrderFormSchema, type WorkOrderFormInput } from "@/lib/db/schemas";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

interface WorkOrderFormProps {
  initialData?: (WorkOrderFormInput & { id?: string }) | null;
}

export function WorkOrderForm({ initialData }: WorkOrderFormProps) {
  const router = useRouter();
  const isEditing = !!initialData?.id;
  const utils = trpc.useUtils();

  const { data: customers = [] } = trpc.customers.list.useQuery();
  const { data: vehicles = [] } = trpc.vehicles.list.useQuery();
  const { data: fleets = [] } = trpc.fleets.list.useQuery();

  const createMutation = trpc.workOrders.create.useMutation({
    onSuccess: () => {
      utils.workOrders.list.invalidate();
      toast.success("Work order created successfully");
      router.push("/work-orders");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create work order");
    },
  });

  const updateMutation = trpc.workOrders.update.useMutation({
    onSuccess: () => {
      utils.workOrders.list.invalidate();
      toast.success("Work order updated successfully");
      router.push("/work-orders");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update work order");
    },
  });

  const form = useForm<WorkOrderFormInput>({
    resolver: zodResolver(workOrderFormSchema),
    disabled: createMutation.isPending || updateMutation.isPending,
    defaultValues: {
      status: "draft",
      items: initialData?.items || [],
      ...initialData,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title || "",
        description: initialData.description || "",
        status: initialData.status || "draft",
        notes: initialData.notes || "",
        customerId: initialData.customerId || null,
        vehicleId: initialData.vehicleId || null,
        createdDate: initialData.createdDate
          ? new Date(initialData.createdDate).toISOString().split("T")[0]
          : null,
        dueDate: initialData.dueDate
          ? new Date(initialData.dueDate).toISOString().split("T")[0]
          : null,
        completedDate: initialData.completedDate
          ? new Date(initialData.completedDate).toISOString().split("T")[0]
          : null,
        items: initialData.items || [],
      });
    } else {
      form.reset({
        status: "draft",
        items: [],
      });
    }
  }, [initialData, form]);

  function onSubmit(values: WorkOrderFormInput) {
    const submitData: WorkOrderFormInput = {
      ...values,
      status: values.status || "draft",
      items: values.items ?? [],
      createdDate: values.createdDate
        ? new Date(values.createdDate).toISOString()
        : null,
      dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
      completedDate: values.completedDate
        ? new Date(values.completedDate).toISOString()
        : null,
    };

    if (isEditing) {
      updateMutation.mutate({ id: initialData!.id!, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  }

  // Watch items array for reactive updates
  const watchedItems = useWatch({
    control: form.control,
    name: "items",
    defaultValue: [],
  });

  // Calculate items totals
  const itemsTotal = React.useMemo(() => {
    const items = watchedItems || [];
    return items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
  }, [watchedItems]);

  // Helper function to get fleet name
  const getFleetName = React.useCallback(
    (fleetId: string | null | undefined) => {
      if (!fleetId) return null;
      const fleet = fleets.find((f) => f.id === fleetId);
      return fleet?.name || null;
    },
    [fleets]
  );

  // Helper function to format vehicle display text
  const getVehicleDisplayText = React.useCallback(
    (vehicleId: string | null) => {
      if (!vehicleId) return "";
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle) return "";

      const parts: string[] = [];
      if (vehicle.licensePlate) parts.push(vehicle.licensePlate);
      if (vehicle.make || vehicle.model) {
        parts.push(`${vehicle.make || ""} ${vehicle.model || ""}`.trim());
      }
      const fleetName = getFleetName(vehicle.fleetId);
      if (fleetName) parts.push(`(${fleetName})`);

      return parts.join(" ") || vehicle.vin || "Unnamed Vehicle";
    },
    [vehicles, getFleetName]
  );

  // State for vehicle combobox
  const [vehicleComboboxOpen, setVehicleComboboxOpen] = React.useState(false);
  const [vehicleSearchQuery, setVehicleSearchQuery] = React.useState("");

  // Filter vehicles based on search query
  const filteredVehicles = React.useMemo(() => {
    if (!vehicleSearchQuery.trim()) return vehicles;

    const query = vehicleSearchQuery.toLowerCase();
    return vehicles.filter((vehicle) => {
      const licensePlate = vehicle.licensePlate?.toLowerCase() || "";
      const make = vehicle.make?.toLowerCase() || "";
      const model = vehicle.model?.toLowerCase() || "";
      const vin = vehicle.vin?.toLowerCase() || "";
      const fleetName = getFleetName(vehicle.fleetId)?.toLowerCase() || "";

      return (
        licensePlate.includes(query) ||
        make.includes(query) ||
        model.includes(query) ||
        vin.includes(query) ||
        fleetName.includes(query) ||
        `${make} ${model}`.trim().includes(query)
      );
    });
  }, [vehicles, vehicleSearchQuery, getFleetName]);

  // Handle adding new item with type-based defaults
  const handleAddItem = (type: "labor" | "part" | "other") => {
    const defaultUnitType =
      type === "labor" ? "hours" : type === "part" ? "pieces" : "";
    append({
      type,
      description: "",
      quantity: 1,
      unitType: defaultUnitType,
      unitPrice: 0,
      totalPrice: 0,
      notes: "",
      ...(type === "part" && { partNumber: "", buyPrice: 0 }),
      ...(type === "labor" && { hours: 1, rate: 0 }),
    });
  };

  // Handle item type change - update unit type if needed
  const handleItemTypeChange = (
    index: number,
    newType: "labor" | "part" | "other"
  ) => {
    const currentItem = form.getValues(`items.${index}`);
    const defaultUnitType =
      newType === "labor" ? "hours" : newType === "part" ? "pieces" : "";

    form.setValue(`items.${index}.type`, newType);
    if (!currentItem.unitType || currentItem.unitType === "") {
      form.setValue(`items.${index}.unitType`, defaultUnitType);
    }

    // Clear conditional fields when switching types
    if (newType !== "part") {
      form.setValue(`items.${index}.partNumber`, undefined);
      form.setValue(`items.${index}.buyPrice`, undefined);
    }
    if (newType !== "labor") {
      form.setValue(`items.${index}.hours`, undefined);
      form.setValue(`items.${index}.rate`, undefined);
    }
  };

  // Calculate total price when quantity or unit price changes
  const handleQuantityOrPriceChange = (index: number) => {
    const item = form.getValues(`items.${index}`);
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const totalPrice = quantity * unitPrice;
    form.setValue(`items.${index}.totalPrice`, totalPrice);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? "Edit Work Order" : "Create Work Order"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing
              ? "Update work order information"
              : "Add a new work order to your system"}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/work-orders")}>
          Back to Work Orders
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <div className="grid gap-4 md:grid-cols-2">
            <Field className="md:col-span-2">
              <FieldLabel>Title *</FieldLabel>
              <Input {...form.register("title")} />
              <FieldError>{form.formState.errors.title?.message}</FieldError>
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel>Description</FieldLabel>
              <Textarea {...form.register("description")} rows={3} />
              <FieldError>
                {form.formState.errors.description?.message}
              </FieldError>
            </Field>

            <Field>
              <FieldLabel>Status</FieldLabel>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value || "draft"}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{form.formState.errors.status?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel>Customer</FieldLabel>
              <Controller
                name="customerId"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value || "__none__"}
                    onValueChange={(value) =>
                      field.onChange(value === "__none__" ? null : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>
                {form.formState.errors.customerId?.message}
              </FieldError>
            </Field>

            <Field>
              <FieldLabel>Vehicle</FieldLabel>
              <Controller
                name="vehicleId"
                control={form.control}
                render={({ field }) => (
                  <Popover
                    open={vehicleComboboxOpen}
                    onOpenChange={setVehicleComboboxOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={vehicleComboboxOpen}
                        className="w-full justify-between font-normal"
                      >
                        {field.value
                          ? getVehicleDisplayText(field.value)
                          : "Select a vehicle (optional)"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search vehicles..."
                          value={vehicleSearchQuery}
                          onValueChange={setVehicleSearchQuery}
                        />
                        <CommandList>
                          <CommandEmpty>No vehicles found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="__none__"
                              onSelect={() => {
                                field.onChange(null);
                                setVehicleComboboxOpen(false);
                                setVehicleSearchQuery("");
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  !field.value ? "opacity-100" : "opacity-0"
                                )}
                              />
                              None
                            </CommandItem>
                            {filteredVehicles.map((vehicle) => {
                              const fleetName = getFleetName(vehicle.fleetId);
                              const makeModel = `${vehicle.make || ""} ${
                                vehicle.model || ""
                              }`.trim();

                              return (
                                <CommandItem
                                  key={vehicle.id}
                                  value={vehicle.id}
                                  onSelect={() => {
                                    field.onChange(vehicle.id);
                                    setVehicleComboboxOpen(false);
                                    setVehicleSearchQuery("");
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === vehicle.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-2">
                                      {vehicle.licensePlate && (
                                        <span className="font-medium">
                                          {vehicle.licensePlate}
                                        </span>
                                      )}
                                      {makeModel && (
                                        <span className="text-muted-foreground">
                                          {makeModel}
                                        </span>
                                      )}
                                      {fleetName && (
                                        <span className="text-xs text-muted-foreground">
                                          • {fleetName}
                                        </span>
                                      )}
                                    </div>
                                    {vehicle.vin && (
                                      <span className="text-xs text-muted-foreground">
                                        VIN: {vehicle.vin}
                                      </span>
                                    )}
                                  </div>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
              <FieldError>
                {form.formState.errors.vehicleId?.message}
              </FieldError>
            </Field>

            <Field>
              <FieldLabel>Created Date</FieldLabel>
              <Input type="date" {...form.register("createdDate")} />
              <FieldError>
                {form.formState.errors.createdDate?.message}
              </FieldError>
            </Field>

            <Field>
              <FieldLabel>Due Date</FieldLabel>
              <Input type="date" {...form.register("dueDate")} />
              <FieldError>{form.formState.errors.dueDate?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel>Completed Date</FieldLabel>
              <Input type="date" {...form.register("completedDate")} />
              <FieldError>
                {form.formState.errors.completedDate?.message}
              </FieldError>
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel>Notes</FieldLabel>
              <Textarea {...form.register("notes")} rows={3} />
              <FieldError>{form.formState.errors.notes?.message}</FieldError>
            </Field>
          </div>

          {/* Items Section */}
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <FieldLabel>Items</FieldLabel>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddItem("labor")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Labor
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddItem("part")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Part
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddItem("other")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Other
                </Button>
              </div>
            </div>

            {fields.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No items added. Click &quot;Add Labor&quot;, &quot;Add
                Part&quot;, or &quot;Add Other&quot; to add items to this work
                order.
              </p>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => {
                  const itemType = watchedItems?.[index]?.type || "other";
                  return (
                    <div
                      key={field.id}
                      className="border p-4 rounded-lg space-y-4"
                    >
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Field>
                          <FieldLabel>Type *</FieldLabel>
                          <Controller
                            name={`items.${index}.type`}
                            control={form.control}
                            render={({ field }) => (
                              <Select
                                value={field.value}
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  handleItemTypeChange(
                                    index,
                                    value as "labor" | "part" | "other"
                                  );
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="labor">Labor</SelectItem>
                                  <SelectItem value="part">Part</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                          <FieldError>
                            {
                              form.formState.errors.items?.[index]?.type
                                ?.message
                            }
                          </FieldError>
                        </Field>

                        <Field className="md:col-span-2">
                          <FieldLabel>Description *</FieldLabel>
                          <Input
                            {...form.register(`items.${index}.description`)}
                            placeholder="Item description"
                          />
                          <FieldError>
                            {
                              form.formState.errors.items?.[index]?.description
                                ?.message
                            }
                          </FieldError>
                        </Field>

                        <Field className="flex items-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </Field>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Field>
                          <FieldLabel>Quantity *</FieldLabel>
                          <Input
                            type="number"
                            step="0.01"
                            {...form.register(`items.${index}.quantity`, {
                              valueAsNumber: true,
                            })}
                            onChange={(e) => {
                              form
                                .register(`items.${index}.quantity`)
                                .onChange(e);
                              handleQuantityOrPriceChange(index);
                            }}
                            placeholder="0"
                          />
                          <FieldError>
                            {
                              form.formState.errors.items?.[index]?.quantity
                                ?.message
                            }
                          </FieldError>
                        </Field>

                        <Field>
                          <FieldLabel>Unit Type *</FieldLabel>
                          <Input
                            {...form.register(`items.${index}.unitType`)}
                            placeholder="e.g., hours, pieces, each"
                          />
                          <FieldError>
                            {
                              form.formState.errors.items?.[index]?.unitType
                                ?.message
                            }
                          </FieldError>
                        </Field>

                        <Field>
                          <FieldLabel>Unit Price *</FieldLabel>
                          <Input
                            type="number"
                            step="0.01"
                            {...form.register(`items.${index}.unitPrice`, {
                              valueAsNumber: true,
                            })}
                            onChange={(e) => {
                              form
                                .register(`items.${index}.unitPrice`)
                                .onChange(e);
                              handleQuantityOrPriceChange(index);
                            }}
                            placeholder="0.00"
                          />
                          <FieldError>
                            {
                              form.formState.errors.items?.[index]?.unitPrice
                                ?.message
                            }
                          </FieldError>
                        </Field>

                        <Field>
                          <FieldLabel>Total Price *</FieldLabel>
                          <Input
                            type="number"
                            step="0.01"
                            {...form.register(`items.${index}.totalPrice`, {
                              valueAsNumber: true,
                            })}
                            placeholder="0.00"
                          />
                          <FieldError>
                            {
                              form.formState.errors.items?.[index]?.totalPrice
                                ?.message
                            }
                          </FieldError>
                        </Field>
                      </div>

                      {/* Conditional fields for parts */}
                      {itemType === "part" && (
                        <div className="grid gap-4 md:grid-cols-2">
                          <Field>
                            <FieldLabel>Part Number *</FieldLabel>
                            <Input
                              {...form.register(`items.${index}.partNumber`)}
                              placeholder="Part number"
                            />
                            <FieldError>
                              {
                                form.formState.errors.items?.[index]?.partNumber
                                  ?.message
                              }
                            </FieldError>
                          </Field>

                          <Field>
                            <FieldLabel>Buy Price (Cost)</FieldLabel>
                            <Input
                              type="number"
                              step="0.01"
                              {...form.register(`items.${index}.buyPrice`, {
                                valueAsNumber: true,
                              })}
                              placeholder="0.00"
                            />
                            <FieldError>
                              {
                                form.formState.errors.items?.[index]?.buyPrice
                                  ?.message
                              }
                            </FieldError>
                          </Field>
                        </div>
                      )}

                      {/* Conditional fields for labor */}
                      {itemType === "labor" && (
                        <div className="grid gap-4 md:grid-cols-2">
                          <Field>
                            <FieldLabel>Hours</FieldLabel>
                            <Input
                              type="number"
                              step="0.1"
                              {...form.register(`items.${index}.hours`, {
                                valueAsNumber: true,
                              })}
                              placeholder="0.0"
                            />
                            <FieldError>
                              {
                                form.formState.errors.items?.[index]?.hours
                                  ?.message
                              }
                            </FieldError>
                          </Field>

                          <Field>
                            <FieldLabel>Rate (per hour)</FieldLabel>
                            <Input
                              type="number"
                              step="0.01"
                              {...form.register(`items.${index}.rate`, {
                                valueAsNumber: true,
                              })}
                              placeholder="0.00"
                            />
                            <FieldError>
                              {
                                form.formState.errors.items?.[index]?.rate
                                  ?.message
                              }
                            </FieldError>
                          </Field>
                        </div>
                      )}

                      {/* Notes field for all item types */}
                      <Field>
                        <FieldLabel>Notes</FieldLabel>
                        <Textarea
                          {...form.register(`items.${index}.notes`)}
                          rows={2}
                          placeholder="Additional notes (optional)"
                        />
                        <FieldError>
                          {form.formState.errors.items?.[index]?.notes?.message}
                        </FieldError>
                      </Field>
                    </div>
                  );
                })}

                {fields.length > 0 && (
                  <div className="flex justify-end gap-4 pt-2 border-t">
                    <div className="text-sm">
                      <span className="font-medium">Grand Total: </span>
                      <span className="text-muted-foreground">
                        €{itemsTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/work-orders")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Spinner />
              ) : isEditing ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}
