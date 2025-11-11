"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { vehicleFormSchema, type VehicleFormInput } from "@/lib/db/schemas";
import { trpc } from "@/lib/trpc";

interface VehicleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: (VehicleFormInput & { id?: string }) | null;
}

export function VehicleForm({
  open,
  onOpenChange,
  initialData,
}: VehicleFormProps) {
  const isEditing = !!initialData?.id;
  const utils = trpc.useUtils();

  const { data: customers = [] } = trpc.customers.list.useQuery();

  const { data: fleets = [] } = trpc.fleets.list.useQuery();

  const createMutation = trpc.vehicles.create.useMutation({
    onSuccess: () => {
      utils.vehicles.list.invalidate();
      toast.success("Vehicle created successfully");
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create vehicle");
    },
  });

  const updateMutation = trpc.vehicles.update.useMutation({
    onSuccess: () => {
      utils.vehicles.list.invalidate();
      toast.success("Vehicle updated successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update vehicle");
    },
  });

  const form = useForm<VehicleFormInput>({
    resolver: zodResolver(vehicleFormSchema),
    disabled: createMutation.isPending || updateMutation.isPending,
    defaultValues: {
      ...initialData,
      customerId: initialData?.customerId || null,
      fleetId: initialData?.fleetId || null,
      year: initialData?.year || null,
      mileage: initialData?.mileage || null,
      registrationDate: initialData?.registrationDate
        ? new Date(initialData.registrationDate).toISOString().split("T")[0]
        : null,
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        licensePlate: initialData.licensePlate || "",
        vin: initialData.vin || "",
        make: initialData.make || "",
        model: initialData.model || "",
        year: initialData.year || null,
        mileage: initialData.mileage || null,
        color: initialData.color || "",
        fuelType: initialData.fuelType || "",
        engineInfo: initialData.engineInfo || "",
        registrationDate: initialData.registrationDate
          ? new Date(initialData.registrationDate).toISOString().split("T")[0]
          : null,
        customerId: initialData.customerId || null,
        fleetId: initialData.fleetId || null,
      });
    } else {
      form.reset({
        customerId: null,
        fleetId: null,
        year: null,
        mileage: null,
        registrationDate: null,
      });
    }
  }, [initialData, form]);

  function onSubmit(values: VehicleFormInput) {
    const submitData = {
      ...values,
      year: values.year ? Number(values.year) : null,
      mileage: values.mileage ? Number(values.mileage) : null,
      registrationDate: values.registrationDate
        ? new Date(values.registrationDate).toISOString()
        : null,
    };

    if (isEditing) {
      updateMutation.mutate({ id: initialData!.id!, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Vehicle" : "Create Vehicle"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update vehicle information"
              : "Add a new vehicle to your system"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>License Plate</FieldLabel>
                <Input {...form.register("licensePlate")} />
                <FieldError>
                  {form.formState.errors.licensePlate?.message}
                </FieldError>
              </Field>

              <Field>
                <FieldLabel>VIN</FieldLabel>
                <Input {...form.register("vin")} />
                <FieldError>{form.formState.errors.vin?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel>Make</FieldLabel>
                <Input {...form.register("make")} />
                <FieldError>{form.formState.errors.make?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel>Model</FieldLabel>
                <Input {...form.register("model")} />
                <FieldError>{form.formState.errors.model?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel>Year</FieldLabel>
                <Input
                  type="number"
                  {...form.register("year", { valueAsNumber: true })}
                />
                <FieldError>{form.formState.errors.year?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel>Mileage</FieldLabel>
                <Input
                  type="number"
                  {...form.register("mileage", { valueAsNumber: true })}
                />
                <FieldError>
                  {form.formState.errors.mileage?.message}
                </FieldError>
              </Field>

              <Field>
                <FieldLabel>Color</FieldLabel>
                <Input {...form.register("color")} />
                <FieldError>{form.formState.errors.color?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel>Fuel Type</FieldLabel>
                <Input {...form.register("fuelType")} />
                <FieldError>
                  {form.formState.errors.fuelType?.message}
                </FieldError>
              </Field>

              <Field className="md:col-span-2">
                <FieldLabel>Engine Info</FieldLabel>
                <Input {...form.register("engineInfo")} />
                <FieldError>
                  {form.formState.errors.engineInfo?.message}
                </FieldError>
              </Field>

              <Field>
                <FieldLabel>Registration Date</FieldLabel>
                <Input type="date" {...form.register("registrationDate")} />
                <FieldError>
                  {form.formState.errors.registrationDate?.message}
                </FieldError>
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
                <FieldLabel>Fleet</FieldLabel>
                <Controller
                  name="fleetId"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value || "__none__"}
                      onValueChange={(value) =>
                        field.onChange(value === "__none__" ? null : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a fleet (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {fleets.map((fleet) => (
                          <SelectItem key={fleet.id} value={fleet.id}>
                            {fleet.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError>
                  {form.formState.errors.fleetId?.message}
                </FieldError>
              </Field>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
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
      </DialogContent>
    </Dialog>
  );
}
