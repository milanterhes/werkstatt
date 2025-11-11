"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ClipboardList, Truck, Users, Warehouse } from "lucide-react";
import { useRouter } from "next/navigation";

interface StatCardProps {
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  isLoading?: boolean;
}

function StatCard({ title, count, icon: Icon, href, isLoading }: StatCardProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card className="cursor-pointer transition-colors hover:bg-accent" onClick={() => router.push(href)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent"
      onClick={() => router.push(href)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{count}</div>
      </CardContent>
    </Card>
  );
}

export function DashboardStats() {
  const { data: customers = [], isLoading: isLoadingCustomers } =
    trpc.customers.list.useQuery();
  const { data: vehicles = [], isLoading: isLoadingVehicles } =
    trpc.vehicles.list.useQuery();
  const { data: fleets = [], isLoading: isLoadingFleets } =
    trpc.fleets.list.useQuery();
  const { data: workOrders = [], isLoading: isLoadingWorkOrders } =
    trpc.workOrders.list.useQuery();

  const isLoading =
    isLoadingCustomers ||
    isLoadingVehicles ||
    isLoadingFleets ||
    isLoadingWorkOrders;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Customers"
        count={customers.length}
        icon={Users}
        href="/customers"
        isLoading={isLoading}
      />
      <StatCard
        title="Vehicles"
        count={vehicles.length}
        icon={Truck}
        href="/vehicles"
        isLoading={isLoading}
      />
      <StatCard
        title="Fleets"
        count={fleets.length}
        icon={Warehouse}
        href="/fleets"
        isLoading={isLoading}
      />
      <StatCard
        title="Work Orders"
        count={workOrders.length}
        icon={ClipboardList}
        href="/work-orders"
        isLoading={isLoading}
      />
    </div>
  );
}

