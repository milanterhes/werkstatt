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
import { Textarea } from "@/components/ui/textarea";
import type { Customer } from "@/lib/db/schemas";
import { fleetFormSchema, type FleetFormInput } from "@/lib/db/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface FleetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: (FleetFormInput & { id?: string }) | null;
}

export function FleetForm({ open, onOpenChange, initialData }: FleetFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!initialData?.id;

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

  const createMutation = useMutation({
    mutationFn: async (values: FleetFormInput) => {
      const response = await fetch("/api/fleets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create fleet");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fleets"] });
      toast.success("Fleet created successfully");
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create fleet"
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: FleetFormInput) => {
      const response = await fetch(`/api/fleets/${initialData?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update fleet");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fleets"] });
      toast.success("Fleet updated successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update fleet"
      );
    },
  });

  const form = useForm<FleetFormInput>({
    resolver: zodResolver(fleetFormSchema),
    disabled: createMutation.isPending || updateMutation.isPending,
    defaultValues: {
      ...initialData,
      customerId: initialData?.customerId || null,
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        description: initialData.description || "",
        notes: initialData.notes || "",
        fleetManagerContact: initialData.fleetManagerContact || "",
        customerId: initialData.customerId || null,
      });
    } else {
      form.reset({
        customerId: null,
      });
    }
  }, [initialData, form]);

  function onSubmit(values: FleetFormInput) {
    if (isEditing) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  const customers = customersData?.data || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Fleet" : "Create Fleet"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update fleet information"
              : "Add a new fleet to your system"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="grid gap-4">
              <Field>
                <FieldLabel>Name *</FieldLabel>
                <Input {...form.register("name")} />
                <FieldError>{form.formState.errors.name?.message}</FieldError>
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
                <FieldLabel>Description</FieldLabel>
                <Textarea {...form.register("description")} />
                <FieldError>
                  {form.formState.errors.description?.message}
                </FieldError>
              </Field>

              <Field>
                <FieldLabel>Fleet Manager Contact</FieldLabel>
                <Input {...form.register("fleetManagerContact")} />
                <FieldError>
                  {form.formState.errors.fleetManagerContact?.message}
                </FieldError>
              </Field>

              <Field>
                <FieldLabel>Notes</FieldLabel>
                <Textarea {...form.register("notes")} />
                <FieldError>{form.formState.errors.notes?.message}</FieldError>
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
