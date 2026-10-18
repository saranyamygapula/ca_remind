"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { ReminderDetail, ListRemindersResponse } from "@/types/reminders.types";
import CommonDataGrid, {
  GridAction,
  GridColumn,
  createTableActions,
} from "@/components/common/CommonTable";
import PageFilterBar from "@/components/common/PageFilter";
import ResourcePageLayout from "@/components/common/ResourcePageLayout";
import ReminderFormDrawer from "@/components/reminders/ReminderFormDrawer";
import ReminderDetailsDrawer from "@/components/reminders/ReminderDetailsDrawer";
import ConfirmDialog from "@/components/tasks/ConfirmDialog";
import { useReminderFilters } from "@/hooks/reminders/useReminderFilters";
import {
  updateReminder,
  getReminders,
  deleteReminder,
} from "@/services/reminderService";
import {
  compareDates,
  compareStrings,
  SortOption,
  useSortedItems,
} from "@/hooks/useSortedItems";
import { useResourcePageState } from "@/hooks/useResourcePageState";
import { useAsyncAction } from "@/hooks/useAnyAction";
import { DueDate } from "@/components/common/DueDate";
import ChannelBadge from "@/components/common/ChannelBadge";

const STATUS_VALUES = ["SCHEDULED", "SENT", "FAILED", "CANCELLED"];

const SORT_OPTIONS: SortOption<ReminderDetail>[] = [
  {
    key: "scheduled_asc",
    label: "Sort by scheduled date",
    compare: compareDates((r) => r.scheduledAt, "asc"),
  },
  {
    key: "scheduled_desc",
    label: "Sort by scheduled date (Latest)",
    compare: compareDates((r) => r.scheduledAt, "desc"),
  },
  {
    key: "title_asc",
    label: "Sort by task title (A-Z)",
    compare: compareStrings((r) => r.task?.title),
  },
  {
    key: "client_asc",
    label: "Sort by client (A-Z)",
    compare: compareStrings((r) => r.subject?.name),
  },
];

function getTaskTypePrefix(val?: string | null) {
  if (!val) return "TASK";
  const upper = val.toUpperCase();
  if (upper.includes("GST")) return "GST";
  if (upper.includes("TDS")) return "TDS";
  if (upper.includes("ITR")) return "ITR";
  if (upper.includes("ROC")) return "ROC";
  if (upper.includes("MSME")) return "MSME";
  return val.split("_")[0] || "TASK";
}

function getTaskTypeBadgeClass(val?: string | null) {
  const prefix = getTaskTypePrefix(val);
  if (prefix === "TDS")
    return "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
  if (prefix === "ITR")
    return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300";
  if (prefix === "GST")
    return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  if (prefix === "ROC")
    return "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

function StatusBadge({ status }: { status?: string }) {
  const s = (status || "").toUpperCase();
  if (s === "SENT") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ecfdf5] text-[#047857] dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60">
        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
        <span>Sent</span>
      </span>
    );
  }
  if (s === "SCHEDULED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fffbeb] text-[#b45309] dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60">
        <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
        <span>Scheduled</span>
      </span>
    );
  }
  if (s === "FAILED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fef2f2] text-[#dc2626] dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60">
        <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
        <span>Failed</span>
      </span>
    );
  }
  if (s === "CANCELLED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/60">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        <span>Cancelled</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/60">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      <span>{status || "—"}</span>
    </span>
  );
}

const columns: GridColumn<ReminderDetail>[] = [
  {
    headerName: "Task",
    field: "task",
    minWidth: 260,
    flex: 2.5,
    cellRenderer: (p) => {
      const row = p.data;
      if (!row) return null;
      const taskTitle = row.task?.title || "Reminder Notification";
      const clientName = row.subject?.name;
      const taskType = row.taskType || row.task?.title || "";
      const prefix = getTaskTypePrefix(taskType);
      const badgeClass = getTaskTypeBadgeClass(taskType);

      return (
        <div className="flex items-center gap-3 py-1">
          <span
            className={`w-11 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${badgeClass}`}
          >
            {prefix}
          </span>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm text-[var(--primary)] dark:text-slate-100 truncate">
              {taskTitle}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {clientName ? `Client: ${clientName}` : "General reminder"}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    headerName: "Client",
    colId: "client",
    valueGetter: (p) => p.data?.subject?.name ?? "—",
    minWidth: 160,
    flex: 1.2,
    cellRenderer: (p) => {
      const name = p.data?.subject?.name;
      if (!name) return <span className="text-xs text-slate-400">—</span>;
      const initial = name.charAt(0).toUpperCase();

      return (
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
            {initial}
          </span>
          <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate">
            {name}
          </span>
        </div>
      );
    },
  },
  {
    headerName: "Channel",
    field: "channel",
    minWidth: 140,
    flex: 1.1,
    cellRenderer: (p) => <ChannelBadge channel={p.data?.channel} />,
  },
  {
    headerName: "Task Type",
    field: "taskType",
    minWidth: 130,
    flex: 1,
    cellRenderer: (p) => {
      const val = p.value || p.data?.task?.title;
      const prefix = getTaskTypePrefix(val);
      return (
        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {prefix}
        </span>
      );
    },
  },
  {
    headerName: "Status",
    field: "status",
    minWidth: 145,
    flex: 1.1,
    editable: true,
    cellEditor: "agSelectCellEditor",
    cellEditorParams: { values: STATUS_VALUES },
    cellRenderer: (p) => <StatusBadge status={p.value} />,
  },
  {
    headerName: "Due Date",
    field: "scheduledAt",
    minWidth: 180,
    flex: 1.4,
    editable: false,
    cellRenderer: (p) => (
      <DueDate
        value={p.value}
        showTime={true}
        badgeMode="scheduled"
        completed={p.data?.status === "SENT" || p.data?.status === "CANCELLED"}
      />
    ),
  },
];

interface RemindersPageClientProps {
  initialReminders: ReminderDetail[];
  businessId: string;
}

export default function RemindersPageClient({
  initialReminders,
  businessId: serverBusinessId,
}: RemindersPageClientProps) {
  const { businessId: clientBusinessId, orgId } = useWorkspace();
  const id = clientBusinessId || serverBusinessId;

  const [reminders, setReminders] =
    useState<ReminderDetail[]>(initialReminders);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!id) return;
    try {
      setError("");
      const res: ListRemindersResponse = await getReminders(id);
      setReminders(
        Array.isArray(res?.items) ? (res.items as ReminderDetail[]) : []
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch reminders"
      );
    }
  }, [id]);

  const lastBizIdRef = useRef<string>(serverBusinessId);
  useEffect(() => {
    if (clientBusinessId && clientBusinessId !== lastBizIdRef.current) {
      lastBizIdRef.current = clientBusinessId;
      refetch();
    }
  }, [clientBusinessId, refetch]);

  const removeReminder = useCallback(
    async (reminderId: string, label?: string) => {
      if (!id) return false;
      let ok = false;
      try {
        setDeleteLoading(true);
        setError("");
        await deleteReminder(id, reminderId);
        setReminders((prev) => prev.filter((r) => r.id !== reminderId));
        ok = true;
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to delete reminder"
        );
      } finally {
        setDeleteLoading(false);
      }
      return ok;
    },
    [id]
  );

  const filters = useReminderFilters(reminders);
  const { sorted, sortProps } = useSortedItems(
    filters.filteredReminders,
    SORT_OPTIONS
  );

  const page = useResourcePageState();
  const { run } = useAsyncAction();
  const action = useAsyncAction();

  const handleDeleteConfirm = async () => {
    const target = page.deleteTarget;
    if (!target) return;
    const ok = await removeReminder(target.id, target.label);
    if (ok) page.cancelDelete();
  };

  const handleUpdateCell = async ({
    row,
    field,
    newValue,
  }: {
    row: ReminderDetail;
    field: string;
    newValue: unknown;
  }) => {
    let value = newValue;
    if (
      field === "scheduledAt" &&
      typeof newValue === "string" &&
      newValue.trim()
    ) {
      const origDate = row.scheduledAt ? new Date(row.scheduledAt) : null;
      const parts = newValue.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const hours =
          origDate && !isNaN(origDate.getTime()) ? origDate.getHours() : 9;
        const minutes =
          origDate && !isNaN(origDate.getTime()) ? origDate.getMinutes() : 0;
        const d = new Date(year, month, day, hours, minutes, 0, 0);
        value = d.toISOString();
      } else {
        const d = new Date(newValue);
        if (!isNaN(d.getTime())) {
          value = d.toISOString();
        }
      }
    }
    await run(() => updateReminder(id, row.id, { [field]: value }), {
      successMessage: "Reminder updated successfully",
      errorMessage: "Reminder updation failed",
      onSuccess: () => {
        setReminders((prev) =>
          prev.map((r) => (r.id === row.id ? { ...r, [field]: value } : r))
        );
      },
    });
    (row as any)[field] = value;
  };

  const actions = useMemo<GridAction<ReminderDetail>[]>(
    () =>
      createTableActions<ReminderDetail>({
        onView: (r) => page.openView(r.id),
        onDelete: (r) => page.requestDelete(r.id, r.task?.title || "Reminder"),
      }),
    [page.openView, page.requestDelete]
  );

  return (
    <ResourcePageLayout
      title="Reminders"
      description="Manage and monitor all reminder notifications"
      actionLabel="Create reminder"
      onAction={page.openCreate}
      error={error}
      onDismissError={() => {
        setError("");
        action.clearError();
      }}
      filters={
        <PageFilterBar
          type="reminders"
          search={filters.searchQuery}
          onSearchChange={filters.setSearchQuery}
          values={filters.values}
          onChange={filters.onChange}
          dateRange={{
            fromValue: filters.dateFrom,
            toValue: filters.dateTo,
            onFromChange: filters.setDateFrom,
            onToChange: filters.setDateTo,
          }}
          onReset={filters.reset}
        />
      }
      summary={
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-txt-main">
            {sorted.length}
          </span>
          <span className="text-base font-normal text-txt-sub">reminders</span>
        </div>
      }
      sort={sortProps}
      overlays={
        <>
          <ReminderDetailsDrawer
            open={page.viewOpen}
            reminderId={page.viewId}
            businessId={id}
            onClose={page.close}
            onEdit={page.openEdit}
          />
          <ReminderFormDrawer
            open={page.formOpen}
            reminderId={page.formId ?? undefined}
            businessId={id}
            organizationId={orgId ?? ""}
            onClose={page.close}
            onSuccess={() => {
              refetch();
              page.close();
            }}
          />
          <ConfirmDialog
            open={!!page.deleteTarget}
            title="Delete Reminder"
            description={
              <>
                Are you sure you want to delete{" "}
                <strong>{page.deleteTarget?.label}</strong>? This action cannot
                be undone.
              </>
            }
            confirmLabel="Delete"
            variant="danger"
            loading={deleteLoading}
            onConfirm={handleDeleteConfirm}
            onCancel={page.cancelDelete}
          />
        </>
      }
    >
      <CommonDataGrid<ReminderDetail>
        rowData={sorted}
        columns={columns}
        actions={actions}
        isLoading={loading}
        rowHeight={64}
        onUpdateCell={handleUpdateCell}
        emptyMessage="No reminders found"
      />
    </ResourcePageLayout>
  );
}
