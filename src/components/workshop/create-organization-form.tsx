"use client";
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
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const organizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  slug: z
    .string()
    .min(1, "Organization slug is required")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
});

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CreateOrganizationForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const createOrganizationMutation = useMutation({
    mutationFn: async (values: z.infer<typeof organizationSchema>) => {
      const result = await authClient.organization.create({
        name: values.name,
        slug: values.slug,
      });
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: async (data) => {
      // Set the newly created organization as active
      if (data?.id) {
        await authClient.organization.setActive({
          organizationId: data.id,
        });
      }
      toast.success("Organization created successfully");
      // Refresh the page to update the UI
      router.refresh();
    },
  });

  const form = useForm<z.infer<typeof organizationSchema>>({
    resolver: zodResolver(organizationSchema),
    disabled: createOrganizationMutation.isPending,
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const nameValue = form.watch("name");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = React.useState(false);

  // Auto-generate slug from name when name changes, but only if slug hasn't been manually edited
  useEffect(() => {
    if (nameValue && !isSlugManuallyEdited) {
      const generatedSlug = generateSlug(nameValue);
      form.setValue("slug", generatedSlug, { shouldValidate: false });
    }
  }, [nameValue, isSlugManuallyEdited, form]);

  // Track if user manually edits the slug
  const handleSlugChange = () => {
    setIsSlugManuallyEdited(true);
  };

  function onSubmit(values: z.infer<typeof organizationSchema>) {
    createOrganizationMutation.mutate(values, {
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to create organization"
        );
      },
    });
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Create Your Organization</CardTitle>
          <CardDescription>
            Get started by creating your workshop organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="name">Organization Name</FieldLabel>
                    <Input
                      {...field}
                      id="name"
                      type="text"
                      aria-invalid={fieldState.invalid}
                      placeholder="My Workshop"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="slug"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="slug">Organization Slug</FieldLabel>
                    <Input
                      {...field}
                      id="slug"
                      type="text"
                      aria-invalid={fieldState.invalid}
                      placeholder="my-workshop"
                      autoComplete="off"
                      onChange={(e) => {
                        handleSlugChange();
                        field.onChange(e);
                      }}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Field>
                <Button
                  type="submit"
                  disabled={createOrganizationMutation.isPending}
                >
                  {createOrganizationMutation.isPending && <Spinner />}
                  {createOrganizationMutation.isPending
                    ? "Creating..."
                    : "Create Organization"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
