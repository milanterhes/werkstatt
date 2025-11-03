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
import { Spinner } from "@/components/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { customerFormSchema, type CustomerFormInput } from "@/lib/db/schemas";

interface CustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: CustomerFormInput & { id?: string } | null;
}

export function CustomerForm({
  open,
  onOpenChange,
  initialData,
}: CustomerFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!initialData?.id;

  const createMutation = useMutation({
    mutationFn: async (values: CustomerFormInput) => {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create customer");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer created successfully");
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create customer"
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: CustomerFormInput) => {
      const response = await fetch(`/api/customers/${initialData?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update customer");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer updated successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update customer"
      );
    },
  });

  const form = useForm<CustomerFormInput>({
    resolver: zodResolver(customerFormSchema),
    disabled: createMutation.isPending || updateMutation.isPending,
    defaultValues: {
      country: "Deutschland",
      ...initialData,
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        street: initialData.street || "",
        houseNumber: initialData.houseNumber || "",
        postalCode: initialData.postalCode || "",
        city: initialData.city || "",
        country: initialData.country || "Deutschland",
      });
    } else {
      form.reset({
        country: "Deutschland",
      });
    }
  }, [initialData, form]);

  function onSubmit(values: CustomerFormInput) {
    if (isEditing) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Customer" : "Create Customer"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update customer information"
              : "Add a new customer to your system"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Name *</FieldLabel>
                <Input {...form.register("name")} />
                <FieldError>{form.formState.errors.name?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input type="email" {...form.register("email")} />
                <FieldError>
                  {form.formState.errors.email?.message}
                </FieldError>
              </Field>

              <Field>
                <FieldLabel>Phone</FieldLabel>
                <Input type="tel" {...form.register("phone")} />
                <FieldError>
                  {form.formState.errors.phone?.message}
                </FieldError>
              </Field>

              <Field>
                <FieldLabel>Country</FieldLabel>
                <Input {...form.register("country")} />
                <FieldError>
                  {form.formState.errors.country?.message}
                </FieldError>
              </Field>

              <Field>
                <FieldLabel>Street</FieldLabel>
                <Input {...form.register("street")} />
                <FieldError>
                  {form.formState.errors.street?.message}
                </FieldError>
              </Field>

              <Field>
                <FieldLabel>House Number</FieldLabel>
                <Input {...form.register("houseNumber")} />
                <FieldError>
                  {form.formState.errors.houseNumber?.message}
                </FieldError>
              </Field>

              <Field>
                <FieldLabel>Postal Code</FieldLabel>
                <Input {...form.register("postalCode")} />
                <FieldError>
                  {form.formState.errors.postalCode?.message}
                </FieldError>
              </Field>

              <Field>
                <FieldLabel>City</FieldLabel>
                <Input {...form.register("city")} />
                <FieldError>
                  {form.formState.errors.city?.message}
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
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
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

