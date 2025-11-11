"use client";
import { Spinner } from "@/components/ui/spinner";
import { WorkOrderForm } from "@/components/work-orders/work-order-form";
import { trpc } from "@/lib/trpc";
import { useParams } from "next/navigation";

export default function EditWorkOrderPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: workOrder, isLoading } = trpc.workOrders.getById.useQuery({
    id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-7xl px-5">
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="container mx-auto py-8 max-w-7xl px-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Work Order Not Found</h1>
          <p className="text-muted-foreground">
            The work order you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  const formData = {
    ...workOrder,
    id: workOrder.id,
    title: workOrder.title || "",
    description: workOrder.description ?? undefined,
    status:
      (workOrder.status as
        | "draft"
        | "in-progress"
        | "completed"
        | "cancelled") || "draft",
    notes: workOrder.notes ?? undefined,
    customerId: workOrder.customerId ?? undefined,
    vehicleId: workOrder.vehicleId ?? undefined,
    createdDate: workOrder.createdDate
      ? new Date(workOrder.createdDate).toISOString().split("T")[0]
      : undefined,
    dueDate: workOrder.dueDate
      ? new Date(workOrder.dueDate).toISOString().split("T")[0]
      : undefined,
    completedDate: workOrder.completedDate
      ? new Date(workOrder.completedDate).toISOString().split("T")[0]
      : undefined,
    laborCosts: workOrder.laborCosts ?? undefined,
    laborHours: workOrder.laborHours ?? undefined,
    parts:
      (workOrder.parts as Array<{
        partNumber: string;
        buyPrice: number;
        customerPrice: number;
      }>) || [],
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl px-5">
      <WorkOrderForm initialData={formData} />
    </div>
  );
}
