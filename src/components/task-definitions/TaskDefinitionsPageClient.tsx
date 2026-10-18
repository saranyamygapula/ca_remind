"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import TaskDefinitionsTable from "@/components/task-definitions/TaskDefinitionsTable";
import TaskDefinitionsFilter from "@/components/task-definitions/TaskDefinitionsFilter";
import TaskDefinitionDetailsDrawer from "@/components/task-definitions/TaskDefinitionDetailsDrawer";
import TaskDefinitionFormDrawer from "@/components/task-definitions/TaskDefinitionFormDrawer";
import ConfirmDialog from "@/components/tasks/ConfirmDialog";
import ResourcePageLayout from "@/components/common/ResourcePageLayout";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useResourcePageState } from "@/hooks/useResourcePageState";
import { useTaskDefinitionFilters } from "@/hooks/task-definitions/useTaskDefinitions";
import { getTaskDefinitionStats } from "@/lib/task-definitons/taskDefinitionStat";
import StatCard from "@/components/task-definitions/StatCard";
import { TaskDefinitionListItem } from "@/types/taskDefinition.types";
import {
  getTaskDefinitions,
  deleteTaskDefinition,
} from "@/services/taskDefinitionService";
import { useAsyncAction } from "@/hooks/useAnyAction";

interface TaskDefinitionsPageClientProps {
  initialDefinitions: TaskDefinitionListItem[];
  businessId: string;
}

export default function TaskDefinitionsPageClient({
  initialDefinitions,
  businessId: serverBusinessId,
}: TaskDefinitionsPageClientProps) {
  const { businessId: clientBusinessId } = useWorkspace();
  const businessId = clientBusinessId || serverBusinessId;
  const page = useResourcePageState();

  const [definitions, setDefinitions] =
    useState<TaskDefinitionListItem[]>(initialDefinitions);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchAction = useAsyncAction(false);
  const deleteAction = useAsyncAction();
  const { run: runFetch, clearError: clearFetchError } = fetchAction;
  const { run: runDelete, clearError: clearDeleteError } = deleteAction;

  const requestId = useRef(0);

  const refetch = useCallback(async () => {
    if (!businessId) return;
    const rid = ++requestId.current;
    await runFetch(() => getTaskDefinitions(businessId), {
      errorMessage: "Failed to load task definitions",
      showErrorToast: false,
      onSuccess: (data) => {
        if (rid !== requestId.current) return;
        setDefinitions(data);
        setRefreshKey((prev) => prev + 1);
      },
    });
  }, [businessId, runFetch]);

  const lastBizIdRef = useRef<string>(serverBusinessId);
  useEffect(() => {
    if (clientBusinessId && clientBusinessId !== lastBizIdRef.current) {
      lastBizIdRef.current = clientBusinessId;
      refetch();
    }
  }, [clientBusinessId, refetch]);

  const removeDefinition = useCallback(
    async (id: string, label?: string) => {
      if (!businessId) return false;
      let ok = false;
      await runDelete(() => deleteTaskDefinition(businessId, id), {
        successMessage: label
          ? `"${label}" deleted`
          : "Task definition deleted",
        errorMessage: "Failed to delete task definition",
        onSuccess: () => {
          ok = true;
          setDefinitions((prev) => prev.filter((d) => d.id !== id));
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

  const filters = useTaskDefinitionFilters(definitions);
  const stats = useMemo(
    () => getTaskDefinitionStats(definitions),
    [definitions]
  );

  const handleDeleteConfirm = async () => {
    const target = page.deleteTarget;
    if (!target) return;
    const ok = await removeDefinition(target.id, target.label);
    if (ok) page.cancelDelete();
  };

  return (
    <ResourcePageLayout
      title="Automatic tasks & reminders"
      description="Rules that create recurring tasks and reminders for you, on schedule."
      actionLabel="New rule"
      actionVariant="amber"
      onAction={page.openCreate}
      error={fetchAction.error || deleteAction.error}
      onDismissError={clearError}
      stats={
        <>
          <StatCard
            label="Total rules"
            value={stats.total}
            hint={
              stats.allActive ? "All active" : `${stats.activeCount} active`
            }
          />
          <StatCard
            label="Past due"
            value={stats.pastDueCount}
            hint="Need your attention"
            valueClassName={
              stats.pastDueCount > 0 ? "text-[#dc2626]" : "text-txt-main"
            }
          />
          <StatCard
            label="Due this week"
            value={stats.dueThisWeekCount}
            hint={stats.nextDueName}
            truncateHint
          />
          <StatCard
            label="Fully automated"
            value={`${stats.fullyAutomatedCount} of ${stats.total}`}
            hint="Task and reminder both on"
            valueClassName="text-[#059669] dark:text-emerald-400"
          />
        </>
      }
      banner={
        stats.pastDueCount > 0 && (
          <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50/60 px-5 py-3.5 dark:border-rose-900/40 dark:bg-rose-950/20">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:rose-400" />
              <span className="text-sm font-semibold text-red-900 dark:text-rose-200">
                {stats.pastDueCount} rules are past their next due date.
              </span>
            </div>
            <button
              type="button"
              onClick={filters.togglePastDueOnly}
              className="cursor-pointer rounded-xl border border-red-300 bg-surface px-3.5 py-1.5 text-xs font-semibold text-red-700 shadow-xs transition-colors hover:bg-red-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/40"
            >
              {filters.showPastDueOnly ? "Show all rules" : "Show past due"}
            </button>
          </div>
        )
      }
      filters={
        <TaskDefinitionsFilter
          searchQuery={filters.searchQuery}
          onSearchChange={filters.setSearchQuery}
          statusFilter={filters.statusFilter}
          onStatusChange={filters.setStatusFilter}
          scheduleFilter={filters.scheduleFilter}
          onScheduleChange={filters.setScheduleFilter}
          autoCreateFilter={filters.autoCreateFilter}
          onAutoCreateChange={filters.setAutoCreateFilter}
          onReset={filters.reset}
        />
      }
      summary={
        !fetchAction.loading && (
          <p className="text-sm text-txt-sub">
            Showing {filters.filtered.length} of {definitions.length} rules
          </p>
        )
      }
      overlays={
        <>
          <TaskDefinitionDetailsDrawer
            open={page.viewOpen}
            onClose={page.close}
            definitionId={page.viewId}
            businessId={businessId}
            onEdit={page.openEdit}
            onRefresh={refetch}
            refreshKey={refreshKey}
          />
          <TaskDefinitionFormDrawer
            open={page.formOpen}
            onClose={page.close}
            definitionId={page.formId}
            businessId={businessId}
            onSuccess={() => {
              refetch();
              page.close();
            }}
          />
          <ConfirmDialog
            open={!!page.deleteTarget}
            title="Delete Task Definition"
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
      <TaskDefinitionsTable
        definitions={filters.filtered}
        loading={fetchAction.loading}
        businessId={businessId}
        onView={page.openView}
        onEdit={page.openEdit}
        onDelete={page.requestDelete}
        onRefresh={refetch}
      />
    </ResourcePageLayout>
  );
}
