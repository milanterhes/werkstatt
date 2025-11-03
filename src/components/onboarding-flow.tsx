"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { WorkshopDetailsFormInput } from "@/lib/db/schemas";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Circle } from "lucide-react";
import { useRouter } from "next/navigation";

interface OnboardingGoal {
  id: string;
  title: string;
  description: string;
  check: (details: WorkshopDetailsFormInput) => boolean;
  priority: "high" | "medium" | "low";
}

const onboardingGoals: OnboardingGoal[] = [
  {
    id: "address",
    title: "Complete Address",
    description: "Add your workshop's full address",
    check: (details) =>
      !!(
        details?.street &&
        details?.houseNumber &&
        details?.postalCode &&
        details?.city
      ),
    priority: "high",
  },
  {
    id: "contact",
    title: "Add Contact Information",
    description: "Provide phone number and business email",
    check: (details) => !!(details?.phone && details?.email),
    priority: "high",
  },
  {
    id: "legal",
    title: "Legal Information",
    description: "Add company name and commercial register number",
    check: (details) =>
      !!(details?.companyName && details?.commercialRegisterNumber),
    priority: "medium",
  },
  {
    id: "tax",
    title: "Tax Details",
    description: "Add Tax ID and VAT ID for invoicing",
    check: (details) => !!(details?.taxId && details?.vatId),
    priority: "medium",
  },
  {
    id: "bank",
    title: "Bank Account",
    description: "Add IBAN and BIC for payments",
    check: (details) => !!(details?.iban && details?.bic),
    priority: "high",
  },
  {
    id: "invoice-settings",
    title: "Invoice Settings",
    description: "Configure payment terms and invoice prefix",
    check: (details) =>
      !!(
        details?.paymentTermsDays &&
        details?.defaultCurrency &&
        details?.invoicePrefix
      ),
    priority: "low",
  },
];

function OnboardingGoalItem({
  goal,
  completed,
}: {
  goal: OnboardingGoal;
  completed: boolean;
}) {
  const Icon = completed ? CheckCircle2 : Circle;
  const priorityColors = {
    high: "text-red-600 dark:text-red-400",
    medium: "text-yellow-600 dark:text-yellow-400",
    low: "text-blue-600 dark:text-blue-400",
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border transition-colors",
        completed
          ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
          : "bg-background border-border"
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 shrink-0",
          completed
            ? "text-green-600 dark:text-green-400"
            : "text-muted-foreground"
        )}
        size={20}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium">{goal.title}</h4>
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              priorityColors[goal.priority]
            )}
          >
            {goal.priority}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{goal.description}</p>
      </div>
    </div>
  );
}

export function OnboardingFlow() {
  const router = useRouter();

  const { data: workshopDetails, isLoading } =
    trpc.workshop.getDetails.useQuery();

  // Exclude database-specific fields (id, organizationId, createdAt, updatedAt)
  const formData: WorkshopDetailsFormInput | undefined = workshopDetails
    ? (Object.fromEntries(
        Object.entries(workshopDetails).filter(
          ([key]) =>
            !["id", "organizationId", "createdAt", "updatedAt"].includes(key)
        )
      ) as WorkshopDetailsFormInput)
    : undefined;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const completedGoals = onboardingGoals.filter((goal) =>
    goal.check(formData ?? {})
  );
  const progress = Math.round(
    (completedGoals.length / onboardingGoals.length) * 100
  );
  const isComplete = completedGoals.length === onboardingGoals.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Your Workshop Dashboard</CardTitle>
          <CardDescription>
            Complete your workshop setup to unlock all features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Setup Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedGoals.length} of {onboardingGoals.length} completed
              </span>
            </div>
            <Progress value={progress} className="h-3" />
            {isComplete && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mt-2">
                <CheckCircle2 size={16} />
                <span>All setup steps completed!</span>
              </div>
            )}
          </div>

          {/* Goals List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Setup Goals</h3>
            {onboardingGoals.map((goal) => (
              <OnboardingGoalItem
                key={goal.id}
                goal={goal}
                completed={goal.check(formData ?? {})}
              />
            ))}
          </div>

          {/* Action Button */}
          <Button
            onClick={() => router.push("/settings")}
            className="w-full"
            size="lg"
          >
            {workshopDetails ? "Update Workshop Details" : "Complete Setup"}
          </Button>

          {!isComplete && (
            <div className="flex items-start gap-2 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
              <AlertCircle
                className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
                size={16}
              />
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Tip:</strong> Start with high-priority items like
                address, contact information, and bank details. These are
                required for invoicing and compliance.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
