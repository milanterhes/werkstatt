"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  workshopDetailsFormSchema,
  type WorkshopDetailsFormInput,
} from "@/lib/db/schemas";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface WorkshopDetailsFormProps extends React.ComponentProps<"div"> {
  initialData?: Partial<WorkshopDetailsFormInput> | null;
  onSuccess?: () => void;
}

export function WorkshopDetailsForm({
  className,
  initialData,
  onSuccess,
  ...props
}: WorkshopDetailsFormProps) {
  const utils = trpc.useUtils();

  const updateMutation = trpc.workshop.updateDetails.useMutation({
    onSuccess: () => {
      utils.workshop.getDetails.invalidate();
      toast.success("Workshop details saved successfully");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save workshop details");
    },
  });

  const form = useForm<WorkshopDetailsFormInput>({
    resolver: zodResolver(workshopDetailsFormSchema),
    disabled: updateMutation.isPending,
    defaultValues: {
      country: "Deutschland",
      paymentTermsDays: 14,
      defaultCurrency: "EUR",
      invoicePrefix: "RE",
      ...initialData,
    },
  });

  function onSubmit(values: WorkshopDetailsFormInput) {
    updateMutation.mutate(values);
  }

  return (
    <Card className={cn(className)} {...props}>
      <CardHeader>
        <CardTitle>Workshop Details</CardTitle>
        <CardDescription>
          Complete your workshop information for invoicing and compliance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Company Information Section */}
              <div className="space-y-4">
                <h3 className="font-semibold">Company Information</h3>
                <Controller
                  name="companyName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="companyName">
                        Company Name
                      </FieldLabel>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        id="companyName"
                        type="text"
                        placeholder="Company Name GmbH"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="commercialRegisterNumber"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="commercialRegisterNumber">
                        Commercial Register Number
                      </FieldLabel>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        id="commercialRegisterNumber"
                        type="text"
                        placeholder="HRB 12345"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="managingDirector"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="managingDirector">
                        Managing Director
                      </FieldLabel>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        id="managingDirector"
                        type="text"
                        placeholder="Max Mustermann"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              {/* Address Section */}
              <div className="space-y-4">
                <h3 className="font-semibold">Address</h3>
                <div className="grid grid-cols-3 gap-2">
                  <Controller
                    name="street"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        className="col-span-2"
                      >
                        <FieldLabel htmlFor="street">Street</FieldLabel>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          id="street"
                          type="text"
                          placeholder="Musterstraße"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="houseNumber"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="houseNumber">No.</FieldLabel>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          id="houseNumber"
                          type="text"
                          placeholder="123"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Controller
                    name="postalCode"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="postalCode">
                          Postal Code
                        </FieldLabel>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          id="postalCode"
                          type="text"
                          placeholder="12345"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="city"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        className="col-span-2"
                      >
                        <FieldLabel htmlFor="city">City</FieldLabel>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          id="city"
                          type="text"
                          placeholder="Berlin"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>
                <Controller
                  name="country"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="country">Country</FieldLabel>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        id="country"
                        type="text"
                        placeholder="Deutschland"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4">
                <h3 className="font-semibold">Contact Information</h3>
                <Controller
                  name="phone"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="phone">Phone</FieldLabel>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        id="phone"
                        type="tel"
                        placeholder="+49 30 12345678"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="email">Business Email</FieldLabel>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        id="email"
                        type="email"
                        placeholder="info@workshop.de"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="website"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="website">Website</FieldLabel>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        id="website"
                        type="url"
                        placeholder="https://www.workshop.de"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              {/* Tax & Bank Information Section */}
              <div className="space-y-4">
                <h3 className="font-semibold">Tax & Bank Information</h3>
                <Controller
                  name="taxId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="taxId">
                        Tax ID (Steuernummer)
                      </FieldLabel>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        id="taxId"
                        type="text"
                        placeholder="12345/67890"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="vatId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="vatId">
                        VAT ID (USt-IdNr.)
                      </FieldLabel>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        id="vatId"
                        type="text"
                        placeholder="DE123456789"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="iban"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="iban">IBAN</FieldLabel>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        id="iban"
                        type="text"
                        placeholder="DE89 3704 0044 0532 0130 00"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="bic"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="bic">BIC/SWIFT</FieldLabel>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        id="bic"
                        type="text"
                        placeholder="COBADEFFXXX"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              {/* Invoice Settings Section */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="font-semibold">Invoice Settings</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <Controller
                    name="paymentTermsDays"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="paymentTermsDays">
                          Payment Terms (days)
                        </FieldLabel>
                        <Input
                          {...field}
                          id="paymentTermsDays"
                          type="number"
                          min={1}
                          max={365}
                          value={field.value ?? undefined}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? Number(e.target.value)
                                : undefined
                            )
                          }
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="defaultCurrency"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="defaultCurrency">
                          Default Currency
                        </FieldLabel>
                        <Input
                          {...field}
                          id="defaultCurrency"
                          type="text"
                          maxLength={3}
                          placeholder="EUR"
                          value={field.value ?? ""}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="invoicePrefix"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="invoicePrefix">
                          Invoice Prefix
                        </FieldLabel>
                        <Input
                          {...field}
                          id="invoicePrefix"
                          type="text"
                          placeholder="RE"
                          value={field.value ?? ""}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>
              </div>
            </div>

            <Field>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Spinner />}
                {updateMutation.isPending ? "Saving..." : "Save Details"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
