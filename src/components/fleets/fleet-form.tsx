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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { Customer } from "@/lib/db/schemas";
import { fleetFormSchema, type FleetFormInput } from "@/lib/db/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { authClient } from "@/lib/auth-client";

interface FleetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: (FleetFormInput & { id?: string }) | null;
}

export function FleetForm({ open, onOpenChange, initialData }: FleetFormProps) {
  const isEditing = !!initialData?.id;
  const utils = trpc.useUtils();
  const activeOrganization = authClient.useActiveOrganization();

  const { data: customers = [] } = trpc.customers.list.useQuery();

  // Fetch limits and usage only when creating (not editing)
  const { data: limits } = trpc.admin.getLimits.useQuery(
    { organizationId: activeOrganization.data?.id ?? "" },
    { enabled: !isEditing && !!activeOrganization.data?.id }
  );

  const { data: usage } = trpc.admin.getUsage.useQuery(
    { organizationId: activeOrganization.data?.id ?? "" },
    { enabled: !isEditing && !!activeOrganization.data?.id }
  );

  // Check if fleet limit is reached
  const isLimitReached =
    !isEditing &&
    limits &&
    usage &&
    usage.fleetCount >= limits.maxFleets;

  const createMutation = trpc.fleets.create.useMutation({
    onSuccess: () => {
      utils.fleets.list.invalidate();
      toast.success("Fleet created successfully");
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create fleet");
    },
  });

  const updateMutation = trpc.fleets.update.useMutation({
    onSuccess: () => {
      utils.fleets.list.invalidate();
      toast.success("Fleet updated successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update fleet");
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
      updateMutation.mutate({ id: initialData!.id!, data: values });
    } else {
      createMutation.mutate(values);
    }
  }

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
        {isLimitReached && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Fleet Limit Reached</AlertTitle>
            <AlertDescription>
              You have reached your fleet limit ({usage?.fleetCount}/
              {limits?.maxFleets}). Please contact your administrator to
              increase your limit.
            </AlertDescription>
          </Alert>
        )}
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
                disabled={
                  createMutation.isPending ||
                  updateMutation.isPending ||
                  isLimitReached
                }
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
