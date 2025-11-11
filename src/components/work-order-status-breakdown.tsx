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

interface StatusCardProps {
  status: string;
  count: number;
  isLoading?: boolean;
}

function StatusCard({ status, count, isLoading }: StatusCardProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card className="cursor-pointer transition-colors hover:bg-accent">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            <Skeleton className="h-4 w-24" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-12" />
        </CardContent>
      </Card>
    );
  }

  const label = statusLabels[status] || status;
  const color = statusColors[status] || statusColors.draft;

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent"
      onClick={() => router.push(`/work-orders?status=${status}`)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Badge className={color}>{label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{count}</div>
      </CardContent>
    </Card>
  );
}

export function WorkOrderStatusBreakdown() {
  const { data: workOrders = [], isLoading } = trpc.workOrders.list.useQuery();

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      draft: 0,
      "in-progress": 0,
      completed: 0,
      cancelled: 0,
    };

    workOrders.forEach((order) => {
      const status = order.status || "draft";
      counts[status] = (counts[status] || 0) + 1;
    });

    return counts;
  }, [workOrders]);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Work Order Status</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          status="draft"
          count={statusCounts.draft}
          isLoading={isLoading}
        />
        <StatusCard
          status="in-progress"
          count={statusCounts["in-progress"]}
          isLoading={isLoading}
        />
        <StatusCard
          status="completed"
          count={statusCounts.completed}
          isLoading={isLoading}
        />
        <StatusCard
          status="cancelled"
          count={statusCounts.cancelled}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

