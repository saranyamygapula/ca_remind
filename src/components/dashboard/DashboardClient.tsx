"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Clock,
  Calendar,
  Check,
  ChevronRight,
  MessageSquare,
  Mail,
  Plus,
  X,
} from "lucide-react";

import { useWorkspace } from "@/context/WorkspaceContext";
import { getTasks } from "@/services/taskService";
import { getReminders } from "@/services/reminderService";
import { TaskListItem } from "@/types/task.types";
import { Reminder } from "@/types/reminders.types";

// ─── Types & Constants ───────────────────────────────────────
type TaskTab = "All" | "Overdue" | "Today" | "Upcoming" | "Completed";
const TABS: TaskTab[] = ["All", "Overdue", "Today", "Upcoming", "Completed"];

type Bucket = "overdue" | "today" | "upcoming";

const getStartOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

function getBucket(dueDateStr: string, todayStart: number): Bucket {
  if (!dueDateStr) return "upcoming";
  const due = getStartOfDay(new Date(dueDateStr));
  if (due < todayStart) return "overdue";
  if (due === todayStart) return "today";
  return "upcoming";
}

const formatLongDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const formatShortDate = (dateStr: string) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  return `${month} ${day}`;
};

// ─── Props ───────────────────────────────────────────────────
interface DashboardClientProps {
  initialTasks: TaskListItem[];
  initialReminders: Reminder[];
  initialError?: string;
  businessId: string;
}

export default function DashboardClient({
  initialTasks,
  initialReminders,
  initialError = "",
  businessId: serverBusinessId,
}: DashboardClientProps) {
  const { businessId: clientBusinessId } = useWorkspace();
  const currentBusinessId = clientBusinessId || serverBusinessId;

  const [tasks, setTasks] = useState<TaskListItem[]>(initialTasks);
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [error, setError] = useState(initialError);
  const [activeTab, setActiveTab] = useState<TaskTab>("All");

  // Re-fetch only if businessId changes on the client from the initial server businessId
  useEffect(() => {
    const targetBizId = clientBusinessId;
    if (!targetBizId || targetBizId === serverBusinessId) return;

    let isCancelled = false;
    async function refreshDashboard(bizId: string) {
      try {
        const [tasksResult, remindersResult] = await Promise.allSettled([
          getTasks(bizId),
          getReminders(bizId),
        ]);

        if (isCancelled) return;

        if (tasksResult.status === "fulfilled") {
          setTasks(tasksResult.value || []);
        }
        if (remindersResult.status === "fulfilled") {
          setReminders((remindersResult.value?.items || []) as Reminder[]);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load dashboard data"
          );
        }
      }
    }

    refreshDashboard(targetBizId);
    return () => {
      isCancelled = true;
    };
  }, [clientBusinessId, serverBusinessId]);

  // ─── Current Date & Summary Counts ──────────────────────────
  const today = useMemo(() => new Date(), []);
  const todayStart = useMemo(() => getStartOfDay(today), [today]);

  const summary = useMemo(() => {
    let overdue = 0;
    let dueToday = 0;
    let upcoming = 0;
    let completed = 0;

    for (const task of tasks) {
      if (task.status === "COMPLETED") {
        completed++;
        continue;
      }
      const bucket = getBucket(task.dueDate, todayStart);
      if (bucket === "overdue") overdue++;
      else if (bucket === "today") dueToday++;
      else upcoming++;
    }

    return { overdue, dueToday, upcoming, completed };
  }, [tasks, todayStart]);

  // ─── Filtered Tasks ─────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      switch (activeTab) {
        case "All":
          return true;
        case "Completed":
          return t.status === "COMPLETED";
        case "Overdue":
          return (
            t.status !== "COMPLETED" &&
            getBucket(t.dueDate, todayStart) === "overdue"
          );
        case "Today":
          return (
            t.status !== "COMPLETED" &&
            getBucket(t.dueDate, todayStart) === "today"
          );
        case "Upcoming":
          return (
            t.status !== "COMPLETED" &&
            getBucket(t.dueDate, todayStart) === "upcoming"
          );
      }
    });
  }, [tasks, activeTab, todayStart]);

  const visibleTasks = useMemo(
    () => filteredTasks.slice(0, 5),
    [filteredTasks]
  );

  // ─── Reminders Summary & List ───────────────────────────────
  const reminderStatsText = useMemo(() => {
    let sent = 0;
    let failed = 0;
    for (const r of reminders) {
      if (r.status === "SENT") sent++;
      else if (r.status === "FAILED") failed++;
    }
    if (sent === 0 && failed === 0) {
      return reminders.length === 0
        ? "No reminders"
        : `${reminders.length} reminders`;
    }
    return `${sent} sent, ${failed} failed`;
  }, [reminders]);

  const visibleReminders = useMemo(() => reminders.slice(0, 5), [reminders]);

  // ─── Helper for Task Row Visuals ────────────────────────────
  const getTaskVisuals = (task: TaskListItem) => {
    if (task.status === "COMPLETED") {
      return {
        label: "Completed",
        dotClass: "bg-emerald-500",
        badgeClass:
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
      };
    }
    const bucket = getBucket(task.dueDate, todayStart);
    if (bucket === "overdue") {
      return {
        label: "Overdue",
        dotClass: "bg-rose-500",
        badgeClass:
          "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
      };
    }
    if (bucket === "today") {
      return {
        label: "Today",
        dotClass: "bg-amber-500",
        badgeClass:
          "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
      };
    }
    return {
      label: "Upcoming",
      dotClass: "bg-indigo-500",
      badgeClass:
        "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400",
    };
  };

  return (
    <div className="min-h-screen bg-bg py-8 px-4 sm:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-7">
        {/* ── Dashboard Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-txt-main tracking-tight">
              Dashboard overview
            </h1>
            <p className="text-sm text-txt-sub mt-1">
              Your tasks and compliance activity at a glance.
            </p>
          </div>

          {/* Current Date Badge */}
          <div className="inline-flex items-center gap-2 border border-divider bg-surface px-4 py-2 rounded-xl text-sm font-medium text-txt-main shadow-xs self-start sm:self-auto">
            <Calendar className="w-4 h-4 text-txt-sub" />
            <span>{formatLongDate(today)}</span>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div
            role="alert"
            className="rounded-xl flex items-center justify-between p-4 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              aria-label="Dismiss error"
              onClick={() => setError("")}
              className="rounded-full p-1 hover:bg-rose-500/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── 4 Top Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1. Overdue Card */}
          <Link
            href="/tasks"
            className="block rounded-2xl border border-rose-200/80 bg-rose-50/40 dark:bg-rose-950/20 dark:border-rose-900/40 p-5 shadow-xs transition-all hover:shadow-md hover:border-rose-300"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400 mb-4">
              <AlertCircle className="w-4 h-4" />
            </div>
            <span className="block text-3xl font-bold text-rose-600 dark:text-rose-400 tracking-tight">
              {summary.overdue}
            </span>
            <p className="text-sm font-bold text-txt-main mt-1">Overdue</p>
            <p className="text-xs text-txt-sub mt-0.5">
              {summary.overdue === 0
                ? "No overdue tasks"
                : `${summary.overdue} task${summary.overdue === 1 ? "" : "s"} need attention`}
            </p>
          </Link>

          {/* 2. Due today Card */}
          <Link
            href="/tasks"
            className="block rounded-2xl border border-divider bg-surface p-5 shadow-xs transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400 mb-4">
              <Clock className="w-4 h-4" />
            </div>
            <span className="block text-3xl font-bold text-txt-main tracking-tight">
              {summary.dueToday}
            </span>
            <p className="text-sm font-bold text-txt-main mt-1">Due today</p>
            <p className="text-xs text-txt-sub mt-0.5">
              {summary.dueToday === 0
                ? "No tasks due today"
                : `${summary.dueToday} task${summary.dueToday === 1 ? "" : "s"} due today`}
            </p>
          </Link>

          {/* 3. Upcoming Card */}
          <Link
            href="/tasks"
            className="block rounded-2xl border border-divider bg-surface p-5 shadow-xs transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 mb-4">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="block text-3xl font-bold text-txt-main tracking-tight">
              {summary.upcoming}
            </span>
            <p className="text-sm font-bold text-txt-main mt-1">Upcoming</p>
            <p className="text-xs text-txt-sub mt-0.5">
              {summary.upcoming === 0
                ? "No upcoming tasks"
                : `${summary.upcoming} task${summary.upcoming === 1 ? "" : "s"} coming up`}
            </p>
          </Link>

          {/* 4. Completed Card */}
          <Link
            href="/tasks"
            className="block rounded-2xl border border-divider bg-surface p-5 shadow-xs transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400 mb-4">
              <Check className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="block text-3xl font-bold text-txt-main tracking-tight">
              {summary.completed}
            </span>
            <p className="text-sm font-bold text-txt-main mt-1">Completed</p>
            <p className="text-xs text-txt-sub mt-0.5">
              {summary.completed} task{summary.completed === 1 ? "" : "s"} done
            </p>
          </Link>
        </div>

        {/* ── 2 Columns Section ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* ── Left Column: Tasks at a glance ── */}
          <div className="rounded-2xl border border-divider bg-surface p-6 shadow-xs flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-txt-main tracking-tight">
                Tasks at a glance
              </h2>
              <Link
                href="/tasks"
                className="inline-flex items-center gap-1 text-sm font-medium text-txt-sub hover:text-txt-main transition-colors"
              >
                <span>All tasks</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-5" role="tablist">
              {TABS.map((tab) => {
                const isSelected = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setActiveTab(tab)}
                    className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                        : "border border-divider bg-transparent text-txt-sub hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-txt-main"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Tasks List */}
            {visibleTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <p className="text-sm font-medium text-txt-sub">
                  No tasks found in this view.
                </p>
                <Link
                  href="/tasks"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy dark:text-gold hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create a task</span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-divider/60">
                {visibleTasks.map((task) => {
                  const visuals = getTaskVisuals(task);
                  return (
                    <div
                      key={task.id}
                      className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${visuals.dotClass}`}
                        />
                        <Link
                          href="/tasks"
                          className="text-sm font-medium text-txt-main hover:text-navy dark:hover:text-gold transition-colors truncate"
                        >
                          {task.title}
                        </Link>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${visuals.badgeClass}`}
                        >
                          {visuals.label}
                        </span>
                        <span className="text-xs font-medium text-txt-sub min-w-[50px] text-right">
                          {formatShortDate(task.dueDate)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Right Column: Upcoming reminders ── */}
          <div className="rounded-2xl border border-divider bg-surface p-6 shadow-xs flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-txt-main tracking-tight">
                Upcoming reminders
              </h2>
              <Link
                href="/reminders"
                className="inline-flex items-center gap-1 text-sm font-medium text-txt-sub hover:text-txt-main transition-colors"
              >
                <span>View all</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Subtitle count (e.g. 2 sent, 3 failed) */}
            <p className="text-xs text-txt-sub mt-1 mb-5">
              {reminderStatsText}
            </p>

            {/* Reminders List */}
            {visibleReminders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <p className="text-sm font-medium text-txt-sub">
                  No recent reminder activity.
                </p>
                <Link
                  href="/reminders"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy dark:text-gold hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Configure a reminder</span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-divider/60">
                {visibleReminders.map((r) => {
                  const channel = (r.channel || "").toUpperCase();
                  const isWhatsApp = channel === "WHATSAPP";
                  const isFailed = r.status === "FAILED";
                  const isSent = r.status === "SENT";

                  return (
                    <div
                      key={r.id}
                      className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Channel Icon rounded square */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isWhatsApp
                              ? "bg-indigo-100/70 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
                              : "bg-blue-100/70 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                          }`}
                        >
                          {isWhatsApp ? (
                            <MessageSquare className="w-4 h-4" />
                          ) : (
                            <Mail className="w-4 h-4" />
                          )}
                        </div>

                        {/* Title & Channel label */}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-txt-main truncate">
                            {r.task?.title || "Reminder notification"}
                          </p>
                          <p className="text-xs text-txt-sub">
                            {isWhatsApp
                              ? "WhatsApp"
                              : channel === "EMAIL"
                                ? "Email"
                                : r.channel}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase shrink-0 ${
                          isFailed
                            ? "bg-rose-100/80 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                            : isSent
                              ? "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : "bg-blue-100/80 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
