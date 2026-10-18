"use client";

import { useState, useMemo, useCallback } from "react";
import TemplatesTable from "@/components/templates/TemplatesTable";
import TemplatesFilter from "@/components/templates/TemplatesFilter";
import TemplateFormDrawer from "@/components/templates/TemplateFormDrawer";
import TemplateDetailsDrawer from "@/components/templates/TemplateDetailsDrawer";
import ConfirmDialog from "@/components/tasks/ConfirmDialog";
import ResourcePageLayout from "@/components/common/ResourcePageLayout";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useResourcePageState } from "@/hooks/useResourcePageState";
import StatCard from "@/components/task-definitions/StatCard";
import {
  StatusFilter,
  ChannelFilter,
  ReminderTypeFilter,
} from "@/constants/messageTemplateConstants";
import { MessageTemplateListItem } from "@/types/messageTemplate.types";
import {
  getMessageTemplates,
  deleteMessageTemplate,
} from "@/services/messageTemplateService";
import { useAsyncAction } from "@/hooks/useAnyAction";

interface TemplatesPageClientProps {
  initialTemplates: MessageTemplateListItem[];
  businessId: string;
}

export default function TemplatesPageClient({
  initialTemplates,
  businessId: serverBusinessId,
}: TemplatesPageClientProps) {
  const { businessId: clientBusinessId } = useWorkspace();
  const businessId = clientBusinessId || serverBusinessId;
  const page = useResourcePageState();

  const [templates, setTemplates] =
    useState<MessageTemplateListItem[]>(initialTemplates);

  const fetchAction = useAsyncAction(false);
  const deleteAction = useAsyncAction();
  const { run: runFetch, clearError: clearFetchError } = fetchAction;
  const { run: runDelete, clearError: clearDeleteError } = deleteAction;

  const refetch = useCallback(async () => {
    if (!businessId) return;
    await runFetch(() => getMessageTemplates(businessId), {
      errorMessage: "Failed to load message templates",
      showErrorToast: false,
      onSuccess: (data) => {
        setTemplates(data);
      },
    });
  }, [businessId, runFetch]);

  const removeTemplate = useCallback(
    async (id: string, label?: string) => {
      if (!businessId) return false;
      let ok = false;
      await runDelete(() => deleteMessageTemplate(businessId, id), {
        successMessage: label ? `"${label}" deleted` : "Template deleted",
        errorMessage: "Failed to delete template",
        onSuccess: () => {
          ok = true;
          setTemplates((prev) => prev.filter((t) => t.id !== id));
        },
      });
      return ok;
    },
    [businessId, runDelete]
  );

  const clearError = useCallback(() => {
    clearFetchError();
    clearDeleteError();
  }, [clearFetchError, clearDeleteError]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("ALL");
  const [reminderTypeFilter, setReminderTypeFilter] =
    useState<ReminderTypeFilter>("ALL");

  const handleDeleteConfirm = async () => {
    const target = page.deleteTarget;
    if (!target) return;
    const ok = await removeTemplate(target.id, target.label);
    if (ok) page.cancelDelete();
  };

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let result = [...templates];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.key?.toLowerCase().includes(query) ||
          t.reminder_type?.toLowerCase().includes(query)
      );
    }

    if (statusFilter === "ACTIVE") {
      result = result.filter((t) => t.isActive === true);
    } else if (statusFilter === "INACTIVE") {
      result = result.filter((t) => t.isActive === false);
    }

    if (channelFilter !== "ALL") {
      result = result.filter((t) => t.channels?.includes(channelFilter));
    }

    if (reminderTypeFilter !== "ALL") {
      result = result.filter((t) => t.reminder_type === reminderTypeFilter);
    }

    return result;
  }, [templates, searchQuery, statusFilter, channelFilter, reminderTypeFilter]);

  // Derived stats
  const stats = useMemo(() => {
    const activeCount = templates.filter((t) => t.isActive).length;
    const whatsappCount = templates.filter((t) =>
      t.channels?.includes("whatsapp")
    ).length;
    const emailCount = templates.filter((t) =>
      t.channels?.includes("email")
    ).length;
    return {
      total: templates.length,
      activeCount,
      whatsappCount,
      emailCount,
    };
  }, [templates]);

  return (
    <ResourcePageLayout
      title="Message templates"
      description="Create and manage notification templates for compliance reminders."
      actionLabel="New template"
      actionVariant="amber"
      onAction={page.openCreate}
      error={fetchAction.error || deleteAction.error}
      onDismissError={clearError}
      stats={
        <>
          <StatCard
            label="Total templates"
            value={stats.total}
            hint={
              stats.total > 0 && stats.activeCount === stats.total
                ? "All active"
                : `${stats.activeCount} active`
            }
          />
          <StatCard
            label="WhatsApp enabled"
            value={stats.whatsappCount}
            hint="Instant messaging ready"
            valueClassName="text-[#15803d] dark:text-emerald-400"
          />
          <StatCard
            label="Email enabled"
            value={stats.emailCount}
            hint="Email delivery ready"
            valueClassName="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            label="Active templates"
            value={`${stats.activeCount} of ${stats.total}`}
            hint="Ready for automated alerts"
            valueClassName="text-[#059669] dark:text-emerald-400"
          />
        </>
      }
      filters={
        <TemplatesFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          channelFilter={channelFilter}
          onChannelChange={setChannelFilter}
          reminderTypeFilter={reminderTypeFilter}
          onReminderTypeChange={setReminderTypeFilter}
          onReset={() => {
            setSearchQuery("");
            setStatusFilter("ALL");
            setChannelFilter("ALL");
            setReminderTypeFilter("ALL");
          }}
        />
      }
      summary={
        !fetchAction.loading && (
          <p className="text-sm text-txt-sub">
            Showing {filteredTemplates.length} of {templates.length} templates
          </p>
        )
      }
      overlays={
        <>
          <TemplateDetailsDrawer
            open={page.viewOpen}
            onClose={page.close}
            templateId={page.viewId}
            businessId={businessId}
            onEdit={page.openEdit}
          />

          <TemplateFormDrawer
            open={page.formOpen}
            onClose={page.close}
            templateId={page.formId}
            businessId={businessId}
            onSuccess={() => {
              refetch();
              page.close();
            }}
          />

          <ConfirmDialog
            open={Boolean(page.deleteTarget)}
            title="Delete Template"
            description={
              <>
                Are you sure you want to delete{" "}
                <strong>{page.deleteTarget?.label}</strong>? This action cannot
                be undone.
              </>
            }
            confirmLabel="Delete"
            variant="danger"
            loading={deleteAction.loading}
            onConfirm={handleDeleteConfirm}
            onCancel={page.cancelDelete}
          />
        </>
      }
    >
      <TemplatesTable
        templates={filteredTemplates}
        loading={fetchAction.loading}
        businessId={businessId}
        onView={page.openView}
        onEdit={page.openEdit}
        onDelete={(id, name) => page.requestDelete(id, name)}
        onRefresh={refetch}
      />
    </ResourcePageLayout>
  );
}
