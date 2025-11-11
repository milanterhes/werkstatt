"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

const statusColors: Record<string, string> = {
  draft: "bg-gray-500",
  "in-progress": "bg-blue-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  "in-progress": "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function formatDate(date: Date | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
}

export function RecentWorkOrders() {
  const router = useRouter();
  const { data: workOrders = [], isLoading: isLoadingWorkOrders } =
    trpc.workOrders.list.useQuery();
  const { data: customers = [], isLoading: isLoadingCustomers } =
    trpc.customers.list.useQuery();

  const isLoading = isLoadingWorkOrders || isLoadingCustomers;

  const recentWorkOrders = useMemo(() => {
    return [...workOrders]
      .sort((a, b) => {
        const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
        const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 10);
  }, [workOrders]);

  const getCustomerName = (customerId: string | null | undefined): string => {
    if (!customerId) return "-";
    const customer = customers.find((c) => c.id === customerId);
    return customer?.name || "-";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Work Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recentWorkOrders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Work Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No work orders yet. Create your first work order to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Work Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentWorkOrders.map((order) => {
            const status = order.status || "draft";
            return (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                onClick={() => router.push(`/work-orders/${order.id}/edit`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{order.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {getCustomerName(order.customerId)} •{" "}
                    {formatDate(order.createdDate)}
                  </div>
                </div>
                <Badge className={statusColors[status]}>
                  {statusLabels[status]}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
