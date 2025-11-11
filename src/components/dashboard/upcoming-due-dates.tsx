"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { AlertCircle } from "lucide-react";
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

function isOverdue(dueDate: Date | null | undefined): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function getDaysUntilDue(dueDate: Date | null | undefined): number | null {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function UpcomingDueDates() {
  const router = useRouter();
  const { data: workOrders = [], isLoading } = trpc.workOrders.list.useQuery();

  const upcomingWorkOrders = useMemo(() => {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    return [...workOrders]
      .filter((order) => {
        if (!order.dueDate) return false;
        const dueDate = new Date(order.dueDate);
        // Include overdue items and items due in next 7 days
        return dueDate <= sevenDaysFromNow;
      })
      .filter((order) => {
        // Exclude completed and cancelled orders
        const status = order.status || "draft";
        return status !== "completed" && status !== "cancelled";
      })
      .sort((a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return dateA - dateB;
      });
  }, [workOrders]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Due Dates</CardTitle>
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

  if (upcomingWorkOrders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Due Dates</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No work orders due in the next 7 days.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Due Dates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingWorkOrders.map((order) => {
            const status = order.status || "draft";
            const overdue = isOverdue(order.dueDate);
            const daysUntilDue = getDaysUntilDue(order.dueDate);

            return (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                onClick={() => router.push(`/work-orders/${order.id}/edit`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate flex items-center gap-2">
                    {order.title}
                    {overdue && (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {overdue
                      ? `Overdue: ${formatDate(order.dueDate)}`
                      : daysUntilDue === 0
                        ? "Due today"
                        : daysUntilDue === 1
                          ? "Due tomorrow"
                          : `Due in ${daysUntilDue} days`}
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

