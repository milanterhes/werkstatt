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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { customerFormSchema, type CustomerFormInput } from "@/lib/db/schemas";
import { trpc } from "@/lib/trpc";
import { authClient } from "@/lib/auth-client";

interface CustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: (CustomerFormInput & { id?: string }) | null;
}

export function CustomerForm({
  open,
  onOpenChange,
  initialData,
}: CustomerFormProps) {
  const isEditing = !!initialData?.id;
  const utils = trpc.useUtils();
  const activeOrganization = authClient.useActiveOrganization();

  // Fetch limits and usage only when creating (not editing)
  const { data: limits } = trpc.admin.getLimits.useQuery(
    { organizationId: activeOrganization.data?.id ?? "" },
    { enabled: !isEditing && !!activeOrganization.data?.id }
  );

  const { data: usage } = trpc.admin.getUsage.useQuery(
    { organizationId: activeOrganization.data?.id ?? "" },
    { enabled: !isEditing && !!activeOrganization.data?.id }
  );

  // Check if customer limit is reached
  const isLimitReached =
    !isEditing &&
    limits &&
    usage &&
    usage.customerCount >= limits.maxCustomers;

  const createMutation = trpc.customers.create.useMutation({
    onSuccess: () => {
      utils.customers.list.invalidate();
      toast.success("Customer created successfully");
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create customer");
    },
  });

  const updateMutation = trpc.customers.update.useMutation({
    onSuccess: () => {
      utils.customers.list.invalidate();
      toast.success("Customer updated successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update customer");
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
      updateMutation.mutate({ id: initialData!.id!, data: values });
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
        {isLimitReached && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Customer Limit Reached</AlertTitle>
            <AlertDescription>
              You have reached your customer limit ({usage?.customerCount}/
              {limits?.maxCustomers}). Please contact your administrator to
              increase your limit.
            </AlertDescription>
          </Alert>
        )}
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
                <FieldError>{form.formState.errors.email?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel>Phone</FieldLabel>
                <Input type="tel" {...form.register("phone")} />
                <FieldError>{form.formState.errors.phone?.message}</FieldError>
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
                <FieldError>{form.formState.errors.street?.message}</FieldError>
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
                <FieldError>{form.formState.errors.city?.message}</FieldError>
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
