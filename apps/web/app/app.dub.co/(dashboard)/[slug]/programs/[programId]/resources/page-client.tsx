"use client";

import { deleteProgramResourceAction } from "@/lib/actions/partners/program-resources/delete-program-resource";
import useProgramResources from "@/lib/swr/use-program-resources";
import useWorkspace from "@/lib/swr/use-workspace";
import { ProgramResourceType } from "@/lib/zod/schemas/program-resources";
import { ThreeDots } from "@/ui/shared/icons";
import {
  AnimatedSizeContainer,
  Button,
  LoadingSpinner,
  Popover,
  Trash,
} from "@dub/ui";
import { capitalize, cn, formatFileSize } from "@dub/utils";
import { useAction } from "next-safe-action/hooks";
import { useParams } from "next/navigation";
import { PropsWithChildren, ReactNode, useState } from "react";
import { toast } from "sonner";
import { useAddColorModal } from "./add-color-modal";
import { useAddLogoModal } from "./add-logo-modal";

export function ProgramResourcesPageClient() {
  const { programId } = useParams();
  const { id: workspaceId } = useWorkspace();

  const { resources, mutate } = useProgramResources();
  const { setShowAddLogoModal, AddLogoModal } = useAddLogoModal();
  const { setShowAddColorModal, AddColorModal } = useAddColorModal();

  const { executeAsync } = useAction(deleteProgramResourceAction, {
    onSuccess: ({ input }) => {
      toast.success(`${capitalize(input.resourceType)} deleted successfully`);
      mutate();
    },
    onError: ({ input, error }) => {
      toast.error(
        error.serverError || `Failed to delete ${input.resourceType}`,
      );
    },
  });

  const handleDelete = async (
    resourceType: ProgramResourceType,
    resourceId: string,
  ) => {
    const result = await executeAsync({
      workspaceId: workspaceId as string,
      programId: programId as string,
      resourceType,
      resourceId,
    });

    return !!result?.data?.success;
  };

  return (
    <>
      <AddLogoModal />
      <AddColorModal />
      <div className="flex flex-col gap-10">
        <Section
          resource="logo"
          title="Brand logos"
          description="SVG, JPG, or PNG, max size of 10 MB"
          onAdd={() => setShowAddLogoModal(true)}
        >
          {resources?.logos?.map((logo) => (
            <ResourceCard
              key={logo.id}
              resourceType="logo"
              icon={
                <div className="relative size-8 overflow-hidden">
                  <img
                    src={logo.url}
                    alt="thumbnail"
                    className="size-full object-contain"
                  />
                </div>
              }
              title={logo.name || "Logo"}
              description={formatFileSize(logo.size, 0)}
              onDelete={() => handleDelete("logo", logo.id)}
            />
          ))}
        </Section>
        <Section
          resource="color"
          title="Colors"
          description="Provide affiliates with official colors"
          onAdd={() => setShowAddColorModal(true)}
        >
          {resources?.colors?.map((color) => (
            <ResourceCard
              key={color.id}
              resourceType="color"
              icon={
                <div
                  className="size-full"
                  style={{ backgroundColor: color.color }}
                />
              }
              title={color.name || "Color"}
              description={color.color.toUpperCase()}
              onDelete={() => handleDelete("color", color.id)}
            />
          ))}
        </Section>
        <Section
          resource="file"
          title="Additional files"
          description="Any document file format, max size 10 MB"
        ></Section>
      </div>
    </>
  );
}

function Section({
  resource,
  title,
  description,
  onAdd,
  children,
}: PropsWithChildren<{
  resource: string;
  title: string;
  description: string;
  onAdd?: () => void;
}>) {
  const { isLoading, isValidating } = useProgramResources();

  return (
    <div className="grid grid-cols-1 rounded-lg border border-neutral-200 p-6 sm:grid-cols-2">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
        <p className="text-sm text-neutral-600">{description}</p>
      </div>
      <div className="-m-1">
        <AnimatedSizeContainer
          height={!isLoading}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <div
            className={cn(
              "flex flex-col items-end gap-4 p-1 transition-opacity",
              isValidating && "opacity-50",
            )}
          >
            {isLoading ? <ResourceCardSkeleton /> : children}
            <Button
              type="button"
              text={`Add ${resource}`}
              onClick={onAdd || (() => alert("WIP"))}
              className="h-8 w-fit px-3"
            />
          </div>
        </AnimatedSizeContainer>
      </div>
    </div>
  );
}

function ResourceCardSkeleton() {
  return (
    <div className="flex w-full items-center gap-4 rounded-lg border border-neutral-200 p-4">
      <div className="flex size-10 shrink-0 animate-pulse items-center justify-center rounded-md bg-neutral-200" />
      <div className="flex min-w-0 animate-pulse flex-col gap-1">
        <div className="h-4 w-32 max-w-full rounded-md bg-neutral-200" />
        <div className="h-4 w-16 max-w-full rounded-md bg-neutral-200" />
      </div>
    </div>
  );
}

function ResourceCard({
  resourceType,
  title,
  description,
  icon,
  onDelete,
}: {
  resourceType: ProgramResourceType;
  title: string;
  description: string;
  icon: ReactNode;
  onDelete?: () => Promise<boolean>;
}) {
  const [openPopover, setOpenPopover] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <div className="flex w-full items-center justify-between gap-4 rounded-lg border border-neutral-200 p-4 shadow-sm">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-200">
          {icon}
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-neutral-800">
            {title}
          </span>
          <span className="truncate text-xs text-neutral-500">
            {description}
          </span>
        </div>
      </div>
      <div className="relative">
        {onDelete && (
          <Popover
            content={
              <div className="w-full sm:w-48">
                <div className="grid gap-px p-2">
                  <Button
                    text={`Delete ${resourceType}`}
                    variant="danger-outline"
                    onClick={async () => {
                      setOpenPopover(false);

                      if (
                        !confirm(
                          "Are you sure you want to delete this resource?",
                        )
                      )
                        return;

                      setIsDeleting(true);
                      const success = await onDelete();
                      if (success) setIsDeleting(false);
                    }}
                    icon={<Trash className="size-4" />}
                    className="h-9 justify-start px-2 font-medium"
                  />
                </div>
              </div>
            }
            align="end"
            openPopover={openPopover}
            setOpenPopover={setOpenPopover}
          >
            <Button
              variant="secondary"
              className={cn(
                "h-8 px-1.5 text-neutral-500 outline-none transition-all duration-200",
                "border-transparent data-[state=open]:border-neutral-500 sm:group-hover/card:data-[state=closed]:border-neutral-200",
              )}
              icon={
                isDeleting ? (
                  <LoadingSpinner className="size-4 shrink-0" />
                ) : (
                  <ThreeDots className="size-4 shrink-0" />
                )
              }
              onClick={() => {
                setOpenPopover(!openPopover);
              }}
            />
          </Popover>
        )}
      </div>
    </div>
  );
}
