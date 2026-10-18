"use client";

import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { TaskListItem } from "@/types/task.types";
import CommonDataGrid, {
  GridAction,
  GridColumn,
  createTableActions,
} from "@/components/common/CommonTable";
import PageFilterBar from "@/components/common/PageFilter";
import ResourcePageLayout from "@/components/common/ResourcePageLayout";
import TaskFormDialog from "@/components/tasks/TaskFormDialogue";
import TaskDetailsDrawer from "@/components/tasks/TaskDetailsDrawer";
import ConfirmDialog from "@/components/tasks/ConfirmDialog";
import { useTaskFilters } from "@/hooks/tasks/useTaskFilters";

import { updateTask, getTasks, deleteTask } from "@/services/taskService";
import { TASK_TYPES } from "@/constants/taskConstants";
import {
  compareDates,
  compareStrings,
  SortOption,
  useSortedItems,
} from "@/hooks/useSortedItems";
import { useResourcePageState } from "@/hooks/useResourcePageState";
import { useAsyncAction } from "@/hooks/useAnyAction";
import { DueDate } from "@/components/common/DueDate";
import { DateCellEditor } from "@/components/grid/DateCellEditor";

const STATUS_VALUES = [
  "OPEN",
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "CLOSED",
  "CANCELLED",
];

const SORT_OPTIONS: SortOption<TaskListItem>[] = [
  {
    key: "due_asc",
    label: "Sort by due date",
    compare: compareDates((t) => t.dueDate, "asc"),
  },
  {
    key: "due_desc",
    label: "Sort by due date (Latest)",
    compare: compareDates((t) => t.dueDate, "desc"),
  },
  {
    key: "title_asc",
    label: "Sort by title (A-Z)",
    compare: compareStrings((t) => t.title),
  },
  {
    key: "client_asc",
    label: "Sort by client (A-Z)",
    compare: compareStrings((t) => t.subject?.name),
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

function StatusPill({ status }: { status?: string }) {
  const s = (status || "").toUpperCase();
  if (s === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ecfdf5] text-[#047857] dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60">
        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
        <span>Completed</span>
      </span>
    );
  }
  if (s === "OPEN") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#eff6ff] text-[#1d4ed8] dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/60">
        <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
        <span>Open</span>
      </span>
    );
  }
  if (s === "IN_PROGRESS") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f5f3ff] text-[#6d28d9] dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200/60">
        <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]" />
        <span>In Progress</span>
      </span>
    );
  }
  if (s === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fffbeb] text-[#b45309] dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60">
        <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
        <span>Pending</span>
      </span>
    );
  }
  if (s === "CLOSED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/60">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        <span>Closed</span>
      </span>
    );
  }
  if (s === "CANCELLED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fef2f2] text-[#dc2626] dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60">
        <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
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

const columns: GridColumn<TaskListItem>[] = [
  {
    headerName: "Task",
    field: "title",
    minWidth: 260,
    flex: 2.5,
    editable: true,
    cellRenderer: (p) => {
      const row = p.data;
      if (!row) return null;
      const taskType = row.taskType || row.title || "";
      const prefix = getTaskTypePrefix(taskType);
      const badgeClass = getTaskTypeBadgeClass(taskType);
      const clientName = row.subject?.name;

      return (
        <div className="flex items-center gap-3 py-1">
          <span
            className={`w-11 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${badgeClass}`}
          >
            {prefix}
          </span>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm text-[var(--primary)] dark:text-slate-100 truncate">
              {row.title || "—"}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {clientName ? `Client: ${clientName}` : "General task"}
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
    headerName: "Task Type",
    field: "taskType",
    minWidth: 130,
    flex: 1,
    editable: true,
    cellEditor: "agSelectCellEditor",
    cellEditorParams: { values: TASK_TYPES.map((t) => t.label) },
    cellRenderer: (p) => {
      const val = p.value;
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
    cellRenderer: (p) => <StatusPill status={p.value} />,
  },
  {
    headerName: "Due Date",
    field: "dueDate",
    minWidth: 180,
    flex: 1.4,
    editable: true,
    cellEditor: DateCellEditor,
    cellEditorPopup: true,
    cellEditorPopupPosition: "under",
    cellRenderer: (p) => (
      <DueDate
        value={p.value}
        completed={
          p.data?.status === "COMPLETED" || p.data?.status === "CLOSED"
        }
      />
    ),
  },
];

interface TasksPageClientProps {
  initialTasks: TaskListItem[];
  businessId: string;
}

export default function TasksPageClient({
  initialTasks,
  businessId: serverBusinessId,
}: TasksPageClientProps) {
  const { businessId: clientBusinessId } = useWorkspace();
  const id = clientBusinessId || serverBusinessId;

  const [tasks, setTasks] = useState<TaskListItem[]>(initialTasks);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refetch = useCallback(async () => {
    if (!id) return;
    try {
      setError("");
      const data = await getTasks(id);
      setTasks(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
    }
  }, [id]);

  const lastBizIdRef = useRef<string>(serverBusinessId);
  useEffect(() => {
    if (clientBusinessId && clientBusinessId !== lastBizIdRef.current) {
      lastBizIdRef.current = clientBusinessId;
      refetch();
    }
  }, [clientBusinessId, refetch]);

  const removeTask = useCallback(
    async (taskId: string) => {
      if (!id) return;
      try {
        setError("");
        await deleteTask(id, taskId);
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to delete task");
        throw err;
      }
    },
    [id]
  );

  const filters = useTaskFilters(tasks);
  const { sorted, sortProps } = useSortedItems(
    filters.filteredTasks,
    SORT_OPTIONS
  );

  const page = useResourcePageState();
  const deleteAction = useAsyncAction();

  const handleDeleteConfirm = async () => {
    const target = page.deleteTarget;
    if (!target) return;
    await deleteAction.run(() => removeTask(target.id), {
      successMessage: `"${target.label}" deleted`,
      errorMessage: "Failed to delete task",
      onSuccess: page.cancelDelete,
    });
  };

  const updateAction = useAsyncAction();
  const { run: runUpdate } = updateAction;

  const handleUpdateCell = useCallback(
    async ({
      row,
      field,
      newValue,
    }: {
      row: TaskListItem;
      field: string;
      newValue: unknown;
    }) => {
      if (!id) return;

      let value = newValue;
      if (field === "taskType") {
        const matched = TASK_TYPES.find(
          (t) =>
            t.label === newValue ||
            t.value === newValue ||
            t.apiValue === newValue
        );
        if (matched) value = matched.apiValue;
      }

      await runUpdate(() => updateTask(id, row.id, { [field]: value }), {
        successMessage: "Task updated successfully",
        errorMessage: "Failed to update task",
      });
    },
    [id, runUpdate]
  );

  const actions = useMemo<GridAction<TaskListItem>[]>(
    () =>
      createTableActions<TaskListItem>({
        onView: (r) => page.openView(r.id),
        onEdit: (r) => page.openEdit(r.id),
        onDelete: (r) => page.requestDelete(r.id, r.title),
      }),
    [page.openView, page.openEdit, page.requestDelete]
  );

  return (
    <ResourcePageLayout
      title="Tasks"
      description="Manage all compliance tasks"
      actionLabel="Create task"
      onAction={page.openCreate}
      error={error}
      onDismissError={() => setError("")}
      filters={
        <PageFilterBar
          type="tasks"
          search={filters.searchQuery}
          onSearchChange={filters.setSearchQuery}
          values={filters.values}
          onChange={filters.onChange}
          onReset={filters.reset}
        />
      }
      summary={
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-txt-main">
            {sorted.length}
          </span>
          <span className="text-base font-normal text-txt-sub">tasks</span>
        </div>
      }
      sort={sortProps}
      overlays={
        <>
          <TaskDetailsDrawer
            open={page.viewOpen}
            taskId={page.viewId}
            businessId={id}
            onClose={page.close}
            onEdit={page.openEdit}
            onRefresh={refetch}
          />
          <TaskFormDialog
            open={page.formOpen}
            taskId={page.formId ?? undefined}
            businessId={id}
            onClose={page.close}
            onSuccess={() => {
              refetch();
              page.close();
            }}
          />
          <ConfirmDialog
            open={!!page.deleteTarget}
            title="Delete Task"
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
      <CommonDataGrid<TaskListItem>
        rowData={sorted}
        columns={columns}
        actions={actions}
        isLoading={loading}
        rowHeight={64}
        onUpdateCell={handleUpdateCell}
        emptyMessage="No tasks found"
      />
    </ResourcePageLayout>
  );
}
