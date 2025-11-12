"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Pencil, Save, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const limitsFormSchema = z.object({
  maxVehicles: z.number().int().positive(),
  maxFleets: z.number().int().positive(),
  maxCustomers: z.number().int().positive(),
  maxMonthlyInvoices: z.number().int().positive().nullable().optional(),
});

type LimitsFormInput = z.infer<typeof limitsFormSchema>;

interface EditingState {
  organizationId: string;
  maxVehicles: number;
  maxFleets: number;
  maxCustomers: number;
  maxMonthlyInvoices: number | null;
}

export function OrganizationLimitsTable() {
  const [editing, setEditing] = useState<EditingState | null>(null);
  const utils = trpc.useUtils();

  const { data: organizations = [], isLoading: orgsLoading } =
    trpc.admin.getAllOrganizations.useQuery();

  const setLimitsMutation = trpc.admin.setLimits.useMutation({
    onSuccess: () => {
      utils.admin.getLimits.invalidate();
      utils.admin.getUsage.invalidate();
      toast.success("Limits updated successfully");
      setEditing(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update limits");
    },
  });

  function handleEdit(orgId: string, limits: LimitsFormInput) {
    setEditing({
      organizationId: orgId,
      maxVehicles: limits.maxVehicles,
      maxFleets: limits.maxFleets,
      maxCustomers: limits.maxCustomers,
      maxMonthlyInvoices: limits.maxMonthlyInvoices ?? null,
    });
  }

  function handleCancel() {
    setEditing(null);
  }

  function handleSave(orgId: string) {
    if (!editing) return;

    setLimitsMutation.mutate({
      organizationId: orgId,
      limits: {
        maxVehicles: editing.maxVehicles,
        maxFleets: editing.maxFleets,
        maxCustomers: editing.maxCustomers,
        maxMonthlyInvoices: editing.maxMonthlyInvoices,
      },
    });
  }

  if (orgsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Organization</TableHead>
            <TableHead>Vehicles</TableHead>
            <TableHead>Fleets</TableHead>
            <TableHead>Customers</TableHead>
            <TableHead>Monthly Invoices</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No organizations found
              </TableCell>
            </TableRow>
          ) : (
            organizations.map((org) => (
              <OrganizationRow
                key={org.id}
                organization={org}
                editing={editing}
                onEdit={handleEdit}
                onCancel={handleCancel}
                onSave={handleSave}
                isSaving={setLimitsMutation.isPending}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

interface OrganizationRowProps {
  organization: { id: string; name: string; slug: string };
  editing: EditingState | null;
  onEdit: (orgId: string, limits: LimitsFormInput) => void;
  onCancel: () => void;
  onSave: (orgId: string) => void;
  isSaving: boolean;
}

function OrganizationRow({
  organization,
  editing,
  onEdit,
  onCancel,
  onSave,
  isSaving,
}: OrganizationRowProps) {
  const isEditing = editing?.organizationId === organization.id;

  const { data: limits, isLoading: limitsLoading } =
    trpc.admin.getLimits.useQuery(
      { organizationId: organization.id },
      { enabled: true }
    );

  const { data: usage, isLoading: usageLoading } =
    trpc.admin.getUsage.useQuery(
      { organizationId: organization.id },
      { enabled: true }
    );

  // Form is only used for validation, actual state is managed in editing state
  const form = useForm<LimitsFormInput>({
    defaultValues: {
      maxVehicles: limits?.maxVehicles ?? 100,
      maxFleets: limits?.maxFleets ?? 50,
      maxCustomers: limits?.maxCustomers ?? 200,
      maxMonthlyInvoices: limits?.maxMonthlyInvoices ?? null,
    },
  });

  if (limitsLoading || usageLoading) {
    return (
      <TableRow>
        <TableCell>
          <Skeleton className="h-4 w-32" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-8 w-16 ml-auto" />
        </TableCell>
      </TableRow>
    );
  }

  const vehicleUsage = `${usage?.vehicleCount ?? 0}/${limits?.maxVehicles ?? 100}`;
  const fleetUsage = `${usage?.fleetCount ?? 0}/${limits?.maxFleets ?? 50}`;
  const customerUsage = `${usage?.customerCount ?? 0}/${limits?.maxCustomers ?? 200}`;
  const vehicleAtLimit =
    (usage?.vehicleCount ?? 0) >= (limits?.maxVehicles ?? 100);
  const fleetAtLimit =
    (usage?.fleetCount ?? 0) >= (limits?.maxFleets ?? 50);
  const customerAtLimit =
    (usage?.customerCount ?? 0) >= (limits?.maxCustomers ?? 200);

  return (
    <TableRow>
      <TableCell className="font-medium">{organization.name}</TableCell>
      <TableCell>
        {isEditing ? (
          <Field>
            <FieldGroup>
              <Input
                type="number"
                {...form.register("maxVehicles", {
                  valueAsNumber: true,
                  min: 1,
                })}
                onChange={(e) => {
                  form.setValue("maxVehicles", parseInt(e.target.value) || 1);
                  if (editing) {
                    editing.maxVehicles = parseInt(e.target.value) || 1;
                  }
                }}
                className="w-24"
                disabled={isSaving}
              />
            </FieldGroup>
            <div className="text-xs text-muted-foreground mt-1">
              Current: {usage?.vehicleCount ?? 0}
            </div>
          </Field>
        ) : (
          <div>
            <span className={vehicleAtLimit ? "text-destructive font-medium" : ""}>
              {vehicleUsage}
            </span>
            {vehicleAtLimit && (
              <span className="text-xs text-destructive ml-2">(Limit reached)</span>
            )}
          </div>
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Field>
            <FieldGroup>
              <Input
                type="number"
                {...form.register("maxFleets", {
                  valueAsNumber: true,
                  min: 1,
                })}
                onChange={(e) => {
                  form.setValue("maxFleets", parseInt(e.target.value) || 1);
                  if (editing) {
                    editing.maxFleets = parseInt(e.target.value) || 1;
                  }
                }}
                className="w-24"
                disabled={isSaving}
              />
            </FieldGroup>
            <div className="text-xs text-muted-foreground mt-1">
              Current: {usage?.fleetCount ?? 0}
            </div>
          </Field>
        ) : (
          <div>
            <span className={fleetAtLimit ? "text-destructive font-medium" : ""}>
              {fleetUsage}
            </span>
            {fleetAtLimit && (
              <span className="text-xs text-destructive ml-2">(Limit reached)</span>
            )}
          </div>
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Field>
            <FieldGroup>
              <Input
                type="number"
                {...form.register("maxCustomers", {
                  valueAsNumber: true,
                  min: 1,
                })}
                onChange={(e) => {
                  form.setValue("maxCustomers", parseInt(e.target.value) || 1);
                  if (editing) {
                    editing.maxCustomers = parseInt(e.target.value) || 1;
                  }
                }}
                className="w-24"
                disabled={isSaving}
              />
            </FieldGroup>
            <div className="text-xs text-muted-foreground mt-1">
              Current: {usage?.customerCount ?? 0}
            </div>
          </Field>
        ) : (
          <div>
            <span className={customerAtLimit ? "text-destructive font-medium" : ""}>
              {customerUsage}
            </span>
            {customerAtLimit && (
              <span className="text-xs text-destructive ml-2">(Limit reached)</span>
            )}
          </div>
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Field>
            <FieldGroup>
              <Input
                type="number"
                {...form.register("maxMonthlyInvoices", {
                  valueAsNumber: true,
                  setValueAs: (v) => (v === "" ? null : parseInt(v) || null),
                })}
                onChange={(e) => {
                  const value = e.target.value === "" ? null : parseInt(e.target.value) || null;
                  form.setValue("maxMonthlyInvoices", value);
                  if (editing) {
                    editing.maxMonthlyInvoices = value;
                  }
                }}
                className="w-24"
                placeholder="Unlimited"
                disabled={isSaving}
              />
            </FieldGroup>
          </Field>
        ) : (
          <span className="text-muted-foreground">
            {limits?.maxMonthlyInvoices ?? "Unlimited"}
          </span>
        )}
      </TableCell>
      <TableCell className="text-right">
        {isEditing ? (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSave(organization.id)}
              disabled={isSaving}
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onEdit(organization.id, {
                maxVehicles: limits?.maxVehicles ?? 100,
                maxFleets: limits?.maxFleets ?? 50,
                maxCustomers: limits?.maxCustomers ?? 200,
                maxMonthlyInvoices: limits?.maxMonthlyInvoices ?? null,
              })
            }
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

