"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Loader2,
  AlertCircle,
  Mail,
  Smartphone,
  Pencil,
  Plus,
  ChevronDown,
  Eye,
  Building2,
  Check,
  X,
  Clock,
  Calendar,
} from "lucide-react";
import Drawer from "@/components/common/Drawer";
import DrawerSection from "@/components/common/DrawerSection";
import WhatsAppIcon from "@/components/common/WhatsAppIcon";
import SearchableSelect from "@/components/common/SearchableSelect";
import ClientSelector from "@/components/common/ClientSelector";
import DeliveryChannelSelector from "@/components/common/DeliveryChannelSelector";
import { useAsyncAction } from "@/hooks/useAnyAction";
import {
  CreateReminderPayload,
  CreateReminderFormState,
  DEFAULT_REMINDER_FORM,
  ReminderChannel,
  ReminderStatus,
} from "@/types/reminders.types";
import {
  createReminder,
  getReminderById,
  updateReminder,
} from "@/services/reminderService";
import { getSubjects } from "@/services/subjectService";
import { getTaskDefinitions } from "@/services/taskDefinitionService";
import { getTasks, createTask } from "@/services/taskService";
import { getV2ReminderDefinitions } from "@/services/reminderDefinitionService";
import { getMessageTemplates } from "@/services/messageTemplateService";
import { getBusinesses } from "@/services/businessService";
import { SubjectListItem } from "@/types/subject";
import { TaskDefinitionListItem } from "@/types/taskDefinition.types";
import { TaskListItem, CreateTaskDto } from "@/types/task.types";
import { V2ReminderDefinition } from "@/types/v2ReminderDefinition.types";
import { MessageTemplateListItem } from "@/types/messageTemplate.types";
import { replaceTemplatePlaceholders } from "@/utils/templatePlaceholders";

interface ReminderFormDrawerProps {
  open: boolean;
  onClose: () => void;
  reminderId?: string | null;
  businessId: string;
  organizationId: string;
  onSuccess: () => void;
}

export interface ExtendedReminderFormState extends CreateReminderFormState {
  dueDate?: string;
  category?: string;
  selectedTaskId?: string;
}

const STATUS_OPTIONS: { value: ReminderStatus; label: string }[] = [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "SENT", label: "Sent" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const INPUT =
  "w-full h-11 rounded-xl border border-divider bg-bg/50 px-3.5 " +
  "text-sm font-medium text-txt-main placeholder:text-txt-sub/60 " +
  "focus:bg-surface focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all";

const SELECT =
  "w-full h-11 rounded-xl border border-divider bg-bg/50 px-3.5 " +
  "text-sm font-medium text-txt-main appearance-none cursor-pointer " +
  "focus:bg-surface focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all";

export default function ReminderFormDrawer({
  open,
  onClose,
  reminderId,
  businessId,
  organizationId,
  onSuccess,
}: ReminderFormDrawerProps) {
  const isEditMode = Boolean(reminderId);

  // ── Form State ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState<ExtendedReminderFormState>(
    DEFAULT_REMINDER_FORM,
  );
  const [editStatus, setEditStatus] = useState<ReminderStatus>("SCHEDULED");
  const [editScheduledAt, setEditScheduledAt] = useState("");
  const [editReminderTaskTitle, setEditReminderTaskTitle] = useState("");

  // ── Master Data Cache (prevent reloading & blinking) ───────────────────────
  const [clients, setClients] = useState<SubjectListItem[]>([]);
  const [taskDefinitions, setTaskDefinitions] = useState<
    TaskDefinitionListItem[]
  >([]);
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [reminderDefinitions, setReminderDefinitions] = useState<
    V2ReminderDefinition[]
  >([]);
  const [messageTemplates, setMessageTemplates] = useState<
    MessageTemplateListItem[]
  >([]);
  const [businessName, setBusinessName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [localError, setLocalError] = useState("");

  const masterDataLoadedRef = useRef(false);

  // ── Async Actions Hook (useAsyncAction for submit loading & toasts) ─────────
  const saveAction = useAsyncAction();

  // ── Load Master Data (Only once or when businessId changes) ─────────────────
  const fetchMasterData = useCallback(async () => {
    if (!businessId) return;
    try {
      setLoadingInitial(true);
      setLocalError("");

      const [
        clientsRes,
        taskDefsRes,
        tasksRes,
        reminderDefsRes,
        templatesRes,
        businessesRes,
      ] = await Promise.allSettled([
        getSubjects(businessId),
        getTaskDefinitions(businessId),
        getTasks(businessId),
        getV2ReminderDefinitions(businessId),
        getMessageTemplates(businessId),
        getBusinesses(organizationId),
      ]);

      if (clientsRes.status === "fulfilled") setClients(clientsRes.value || []);
      if (taskDefsRes.status === "fulfilled")
        setTaskDefinitions(taskDefsRes.value || []);
      if (tasksRes.status === "fulfilled") setTasks(tasksRes.value || []);
      if (reminderDefsRes.status === "fulfilled")
        setReminderDefinitions(reminderDefsRes.value || []);
      if (templatesRes.status === "fulfilled")
        setMessageTemplates(templatesRes.value || []);

      if (businessesRes.status === "fulfilled" && businessesRes.value?.length) {
        const currentBiz =
          businessesRes.value.find((b) => b.id === businessId) ||
          businessesRes.value[0];
        setBusinessName(currentBiz.name || "");
        setBusinessPhone(currentBiz.phone || "");
      }

      masterDataLoadedRef.current = true;
    } catch (err: unknown) {
      setLocalError(
        err instanceof Error
          ? err.message
          : "Failed to load form dependencies.",
      );
    } finally {
      setLoadingInitial(false);
    }
  }, [businessId, organizationId]);

  // ── Load Single Reminder (Edit Mode) ────────────────────────────────────────
  const fetchSingleReminder = useCallback(async () => {
    if (!reminderId || !businessId) return;
    try {
      setLoadingInitial(true);
      setLocalError("");
      const rem = await getReminderById(businessId, reminderId);
      setEditStatus(rem.status);
      setEditReminderTaskTitle(rem.task?.title || "Reminder Details");

      if (rem.scheduledAt) {
        const d = new Date(rem.scheduledAt);
        const isoLocal = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setEditScheduledAt(isoLocal);
      } else {
        setEditScheduledAt("");
      }
    } catch (err: unknown) {
      setLocalError(
        err instanceof Error ? err.message : "Failed to load reminder.",
      );
    } finally {
      setLoadingInitial(false);
    }
  }, [reminderId, businessId]);

  // ── Open / Reset Trigger (Stable, no loops) ─────────────────────────────────
  useEffect(() => {
    if (open) {
      setLocalError("");
      if (isEditMode) {
        fetchSingleReminder();
      } else {
        // Reset form for new reminder
        setForm({
          ...DEFAULT_REMINDER_FORM,
          channel: "WHATSAPP",
        });
        if (!masterDataLoadedRef.current) {
          fetchMasterData();
        }
      }
    } else {
      setLocalError("");
      saveAction.reset();
    }
  }, [open, isEditMode, reminderId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Client Selection ────────────────────────────────────────────────────────
  const selectedClient = useMemo(
    () => clients.find((c) => c.id === form.targetUserId) || null,
    [clients, form.targetUserId],
  );

  const handleClientChange = (client: SubjectListItem | null) => {
    setForm((prev) => ({
      ...prev,
      targetUserId: client ? client.id : "",
      selectedTaskId: "",
      selectedTaskDefinitionId: "",
      taskName: "",
      dueDate: "",
      messageTemplateId: "",
    }));
  };

  // ── Task Definition Selection & Synchronous Cascade ─────────────────────────
  const selectedTaskDef = useMemo(
    () =>
      taskDefinitions.find((td) => td.id === form.selectedTaskDefinitionId) ||
      null,
    [taskDefinitions, form.selectedTaskDefinitionId],
  );

  // ── Reminder Definition Selection & Helpers ───────────────────────────────
  const { matchingDefs, otherDefs } = useMemo(() => {
    if (!form.selectedTaskDefinitionId) {
      return { matchingDefs: [], otherDefs: reminderDefinitions };
    }
    const matching = reminderDefinitions.filter(
      (rd) => rd.taskDefinitionId === form.selectedTaskDefinitionId,
    );
    const others = reminderDefinitions.filter(
      (rd) => rd.taskDefinitionId !== form.selectedTaskDefinitionId,
    );
    return { matchingDefs: matching, otherDefs: others };
  }, [reminderDefinitions, form.selectedTaskDefinitionId]);

  const selectedReminderDef = useMemo(
    () =>
      reminderDefinitions.find((rd) => rd.id === form.reminderDefinitionId) ||
      null,
    [reminderDefinitions, form.reminderDefinitionId],
  );

  const formatOffsetLabel = (offsetDays: number) => {
    if (offsetDays === 0) return "On due date";
    if (offsetDays < 0) return `${Math.abs(offsetDays)}d before`;
    return `${offsetDays}d after`;
  };

  const handleReminderDefChange = (reminderDefId: string) => {
    const chosenDef = reminderDefinitions.find((rd) => rd.id === reminderDefId);
    if (!chosenDef) {
      setForm((prev) => ({ ...prev, reminderDefinitionId: "" }));
      return;
    }

    const defChannel =
      (chosenDef.channel as ReminderChannel) || form.channel || "WHATSAPP";

    let templateId = chosenDef.messageTemplateId || form.messageTemplateId;
    if (chosenDef.messageTemplateId) {
      const matched = messageTemplates.find(
        (t) => t.id === chosenDef.messageTemplateId,
      );
      if (matched) templateId = matched.id;
    }

    let updatedTaskDefId = form.selectedTaskDefinitionId;
    let updatedTaskName = form.taskName;
    let updatedDueDate = form.dueDate;

    if (chosenDef.taskDefinitionId && !form.selectedTaskDefinitionId) {
      const matchedTaskDef = taskDefinitions.find(
        (td) => td.id === chosenDef.taskDefinitionId,
      );
      if (matchedTaskDef) {
        updatedTaskDefId = matchedTaskDef.id;
        if (!updatedTaskName) {
          updatedTaskName = selectedClient
            ? `${selectedClient.displayName || selectedClient.businessName} - ${matchedTaskDef.name}`
            : matchedTaskDef.name;
        }
        if (matchedTaskDef.dueDate) {
          updatedDueDate = matchedTaskDef.dueDate.slice(0, 10);
        }
      }
    }

    let proposedScheduledAt = form.scheduledAt;
    if (updatedDueDate && typeof chosenDef.offsetDays === "number") {
      const due = new Date(updatedDueDate);
      if (!isNaN(due.getTime())) {
        due.setDate(due.getDate() + chosenDef.offsetDays);
        due.setHours(9, 0, 0, 0);
        proposedScheduledAt = due.toISOString().slice(0, 16);
      }
    }

    setForm((prev) => ({
      ...prev,
      reminderDefinitionId: reminderDefId,
      selectedTaskDefinitionId: updatedTaskDefId || prev.selectedTaskDefinitionId,
      taskName: updatedTaskName || prev.taskName,
      dueDate: updatedDueDate || prev.dueDate,
      channel: defChannel,
      messageTemplateId: templateId || prev.messageTemplateId,
      scheduledAt: proposedScheduledAt || prev.scheduledAt,
    }));
  };

  const handleTaskTypeChange = (taskDefinitionId: string) => {
    const matchedDef = taskDefinitions.find((td) => td.id === taskDefinitionId);
    if (!matchedDef) return;

    let autoTaskName = matchedDef.name;
    if (selectedClient) {
      autoTaskName = `${selectedClient.displayName || selectedClient.businessName} - ${matchedDef.name}`;
    }

    let nextDueDate = "";
    if (matchedDef.dueDate) {
      nextDueDate = matchedDef.dueDate.slice(0, 10);
    } else {
      const today = new Date();
      today.setDate(today.getDate() + 7);
      nextDueDate = today.toISOString().slice(0, 10);
    }

    // Match reminder definitions for this task definition
    const matchedDefs = reminderDefinitions.filter(
      (rd) => rd.taskDefinitionId === taskDefinitionId,
    );
    const matchedReminderDef =
      matchedDefs.find((rd) => rd.isActive) || matchedDefs[0];

    // Auto-match message template synchronously
    const matchedTemplate = messageTemplates.find(
      (t) =>
        (matchedReminderDef?.messageTemplateId &&
          t.id === matchedReminderDef.messageTemplateId) ||
        t.name
          ?.toLowerCase()
          .includes(matchedDef.taskType?.toLowerCase() || "") ||
        t.name?.toLowerCase().includes(matchedDef.name?.toLowerCase() || ""),
    );

    let proposedScheduledAt = form.scheduledAt;
    if (
      matchedReminderDef &&
      nextDueDate &&
      typeof matchedReminderDef.offsetDays === "number"
    ) {
      const due = new Date(nextDueDate);
      if (!isNaN(due.getTime())) {
        due.setDate(due.getDate() + matchedReminderDef.offsetDays);
        due.setHours(9, 0, 0, 0);
        proposedScheduledAt = due.toISOString().slice(0, 16);
      }
    }

    setForm((prev) => ({
      ...prev,
      selectedTaskDefinitionId: taskDefinitionId,
      taskName: autoTaskName,
      dueDate: nextDueDate,
      channel:
        (matchedReminderDef?.channel as ReminderChannel) ||
        prev.channel ||
        "WHATSAPP",
      reminderDefinitionId: matchedReminderDef?.id || prev.reminderDefinitionId,
      messageTemplateId: matchedTemplate?.id || prev.messageTemplateId,
      scheduledAt: proposedScheduledAt || prev.scheduledAt,
      category: (matchedDef as any).category || "COMPLIANCE",
    }));
  };

  // ── Live Message Preview Calculation ────────────────────────────────────────
  const selectedTemplate = useMemo(
    () => messageTemplates.find((t) => t.id === form.messageTemplateId) || null,
    [messageTemplates, form.messageTemplateId],
  );

  const previewContent = useMemo(() => {
    if (!selectedTemplate) return null;

    const isEmail = form.channel === "EMAIL";
    const isWhatsapp = form.channel === "WHATSAPP";
    const isSms = form.channel === "SMS";

    const rawSubject = selectedTemplate.templates?.email?.subject || "";
    const rawBody =
      (isEmail ? selectedTemplate.templates?.email?.body : null) ||
      (isWhatsapp ? selectedTemplate.templates?.whatsapp?.body : null) ||
      (isSms ? selectedTemplate.templates?.sms?.body : null) ||
      selectedTemplate.templates?.email?.body ||
      selectedTemplate.templates?.whatsapp?.body ||
      (selectedTemplate as any).body ||
      "";

    const placeholderValues: Record<string, string> = {
      CLIENTNAME:
        selectedClient?.displayName || selectedClient?.businessName || "Client",
      BUSINESSNAME: selectedClient?.businessName || "",
      DUEDATE: form.scheduledAt
        ? new Date(form.scheduledAt).toLocaleDateString("en-IN")
        : form.dueDate || "Due Date",
      SERVICETYPE: selectedTaskDef?.name || "Compliance",
      YOURFIRMNAME: businessName || "Our Firm",
      YOURCONTACTNUMBER: businessPhone || "",
    };

    return {
      subject: rawSubject
        ? replaceTemplatePlaceholders(rawSubject, placeholderValues)
        : "",
      body: rawBody
        ? replaceTemplatePlaceholders(rawBody, placeholderValues)
        : "",
    };
  }, [
    selectedTemplate,
    form.channel,
    selectedClient,
    selectedTaskDef,
    form.scheduledAt,
    form.dueDate,
    businessName,
    businessPhone,
  ]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateCreate = (): string | null => {
    if (!form.targetUserId) return "Please select a client.";
    if (!form.selectedTaskDefinitionId)
      return "Please select a task definition.";
    if (reminderDefinitions.length > 0 && !form.reminderDefinitionId)
      return "Please select a reminder definition.";
    if (!form.taskName.trim()) return "Please enter a task name.";
    if (!form.channel) return "Please select a delivery channel.";
    if (!form.sendNow && !form.scheduledAt)
      return "Please specify a scheduled date and time.";
    return null;
  };

  // ── Submit with useAsyncAction (handles loading & toasts) ────────────────────
  const handleSubmit = async () => {
    await saveAction.run(
      async () => {
        if (isEditMode) {
          if (!reminderId) return;
          await updateReminder(businessId, reminderId, {
            status: editStatus,
            scheduledAt: editScheduledAt
              ? new Date(editScheduledAt).toISOString()
              : undefined,
          });
        } else {
          const valErr = validateCreate();
          if (valErr) {
            throw new Error(valErr);
          }

          let resolvedTaskId = form.selectedTaskId || form.taskId;
          if (!resolvedTaskId && form.selectedTaskDefinitionId) {
            const newTaskDto: CreateTaskDto = {
              subjectId: form.targetUserId,
              taskDefinitionId: form.selectedTaskDefinitionId,
              title: form.taskName.trim(),
              taskName: form.taskName.trim(),
              dueDate: form.dueDate || new Date().toISOString().slice(0, 10),
              category: form.category || "COMPLIANCE",
              priority: "MEDIUM",
            };
            const createdTask = await createTask(businessId, newTaskDto);
            resolvedTaskId = createdTask.id;
          }

          const payload: CreateReminderPayload = {
            taskId: resolvedTaskId,
            reminderDefinitionId: form.reminderDefinitionId,
            reminderSource: form.reminderSource || "MANUAL",
            channel: form.channel as ReminderChannel,
            targetUserId: form.targetUserId,
            messageTemplateId: form.messageTemplateId,
            sendNow: form.sendNow,
            ...(!form.sendNow &&
              form.scheduledAt && {
                scheduledAt: new Date(form.scheduledAt).toISOString(),
              }),
          };

          await createReminder(businessId, payload);
        }
      },
      {
        successMessage: isEditMode
          ? "Reminder updated successfully"
          : "Reminder created successfully",
        errorMessage: isEditMode
          ? "Failed to update reminder"
          : "Failed to create reminder",
        showSuccessToast: true,
        showErrorToast: true,
        onSuccess: () => {
          onSuccess();
          onClose();
        },
      },
    );
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        isEditMode
          ? editReminderTaskTitle || "Edit Reminder"
          : "Create reminder"
      }
      width="lg"
      submitVariant="gold"
      onSubmit={handleSubmit}
      onCancel={onClose}
      cancelLabel="Cancel"
      submitLabel={isEditMode ? "Save changes" : "Create reminder"}
      submitting={saveAction.loading}
      customHeader={
        <div className="bg-[#0F1E36] px-6 py-5 flex items-center justify-between text-white shrink-0 border-b border-white/10 select-none">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#F59E0B] flex items-center justify-center text-slate-950 font-bold shadow-sm shrink-0">
              {isEditMode ? (
                <Pencil className="h-5 w-5 text-slate-950 stroke-[2.5]" />
              ) : (
                <Plus className="h-5 w-5 text-slate-950 stroke-[2.5]" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider mb-0.5">
                {isEditMode ? "Update reminder" : "New reminder"}
              </p>
              <h2 className="text-lg font-extrabold leading-tight text-white tracking-tight truncate">
                {isEditMode
                  ? editReminderTaskTitle || "Edit Reminder"
                  : "Create reminder"}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saveAction.loading}
            aria-label="Close"
            className="rounded-xl bg-white/10 hover:bg-white/20 p-2 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      }
    >
      <div className="space-y-4 py-1">
        {/* Subtle Non-blocking Loading Indicator */}
        {loadingInitial && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Loading dependencies...</span>
          </div>
        )}

        {/* Error Banner */}
        {(localError || saveAction.error) && (
          <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Error: </span>
              <span>{localError || saveAction.error}</span>
            </div>
          </div>
        )}

        {isEditMode ? (
          /* ──────────────── EDIT MODE ──────────────── */
          <div className="space-y-4">
            <DrawerSection step={1} title="Reminder Configuration" required>
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-txt-main mb-1.5">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      value={editStatus}
                      onChange={(e) =>
                        setEditStatus(e.target.value as ReminderStatus)
                      }
                      className={`${SELECT} pr-9`}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className="bg-surface"
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-txt-sub" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-txt-main mb-1.5">
                    Scheduled Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={editScheduledAt}
                    onChange={(e) => setEditScheduledAt(e.target.value)}
                    className={INPUT}
                  />
                  <p className="text-[11px] text-txt-sub mt-1">
                    Adjust when this reminder is queued to dispatch.
                  </p>
                </div>
              </div>
            </DrawerSection>
          </div>
        ) : (
          /* ──────────────── CREATE MODE ──────────────── */
          <div className="space-y-4">
            {/* Step 1: Client Selection */}
            <DrawerSection step={1} title="Client" required>
              <ClientSelector
                clients={clients}
                value={selectedClient}
                onChange={handleClientChange}
                required
              />
            </DrawerSection>

            {/* Step 2: Task Details */}
            <DrawerSection step={2} title="Task and compliance" required>
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-txt-main mb-1.5">
                    Task definition <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={form.selectedTaskDefinitionId}
                      onChange={(e) => handleTaskTypeChange(e.target.value)}
                      disabled={!form.targetUserId}
                      className={`${SELECT} pr-9 disabled:opacity-50`}
                    >
                      <option value="" disabled>
                        {!form.targetUserId
                          ? "Select a client first"
                          : "Select task definition"}
                      </option>
                      {taskDefinitions.map((td) => (
                        <option
                          key={td.id}
                          value={td.id}
                          className="bg-surface"
                        >
                          {td.name} ({td.taskType})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-txt-sub" />
                  </div>
                </div>

                {/* Reminder Rule / Definition Dropdown */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-txt-main">
                      Reminder definition (rule){" "}
                      {reminderDefinitions.length > 0 && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    {form.reminderDefinitionId && (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Rule selected
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <select
                      value={form.reminderDefinitionId}
                      onChange={(e) => handleReminderDefChange(e.target.value)}
                      disabled={!form.targetUserId}
                      className={`${SELECT} pr-9 disabled:opacity-50`}
                    >
                      <option value="">
                        {!form.targetUserId
                          ? "Select a client first"
                          : reminderDefinitions.length === 0
                          ? "No reminder definitions found"
                          : "Select a reminder definition"}
                      </option>
                      {matchingDefs.length > 0 && (
                        <optgroup label="Rules for selected task definition">
                          {matchingDefs.map((rd) => (
                            <option
                              key={rd.id}
                              value={rd.id}
                              className="bg-surface"
                            >
                              {rd.name} • {rd.channel} ({formatOffsetLabel(rd.offsetDays)})
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {otherDefs.length > 0 && (
                        <optgroup
                          label={
                            matchingDefs.length > 0
                              ? "Other reminder rules"
                              : "Available reminder rules"
                          }
                        >
                          {otherDefs.map((rd) => (
                            <option
                              key={rd.id}
                              value={rd.id}
                              className="bg-surface"
                            >
                              {rd.name} • {rd.channel} ({formatOffsetLabel(rd.offsetDays)})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-txt-sub" />
                  </div>
                  {selectedReminderDef && (
                    <p className="text-[11px] text-txt-sub mt-1 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>
                        Preset: {selectedReminderDef.channel} • {formatOffsetLabel(selectedReminderDef.offsetDays)}
                      </span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-txt-main mb-1.5">
                    Task name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.taskName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, taskName: e.target.value }))
                    }
                    disabled={!form.selectedTaskDefinitionId}
                    placeholder="e.g. GST filing for October"
                    className={`${INPUT} disabled:opacity-50`}
                  />
                </div>
              </div>
            </DrawerSection>

            {/* Step 3: Channel Selection */}
            <DrawerSection
              step={3}
              title="Delivery channel"
              required
              subtitle="Pick one or more"
            >
              <DeliveryChannelSelector
                label=""
                value={form.channel}
                onChange={(ch) => setForm((p) => ({ ...p, channel: ch }))}
              />
            </DrawerSection>

            {/* Step 4: Message Template & Preview */}
            <DrawerSection step={4} title="Message template">
              <div className="space-y-3">
                <div className="relative">
                  <select
                    value={form.messageTemplateId}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        messageTemplateId: e.target.value,
                      }))
                    }
                    className={`${SELECT} pr-9`}
                  >
                    <option value="">
                      Auto-matched to the task definition
                    </option>
                    {messageTemplates.map((t) => (
                      <option key={t.id} value={t.id} className="bg-surface">
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-txt-sub" />
                </div>

                {previewContent ? (
                  <div className="rounded-xl border border-divider overflow-hidden bg-surface">
                    <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-divider text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-txt-main">
                        <Eye className="h-3.5 w-3.5 text-[#F59E0B]" />
                        <span>Live Message Preview</span>
                      </div>
                      <span className="text-[11px] text-txt-sub font-medium">
                        {form.channel}
                      </span>
                    </div>

                    <div className="p-3.5 space-y-2 text-xs">
                      {previewContent.subject && (
                        <div className="pb-2 border-b border-divider/60">
                          <span className="text-[10px] font-bold text-txt-sub uppercase tracking-wider block mb-0.5">
                            Subject
                          </span>
                          <p className="font-semibold text-txt-main">
                            {previewContent.subject}
                          </p>
                        </div>
                      )}

                      <div>
                        <span className="text-[10px] font-bold text-txt-sub uppercase tracking-wider block mb-1">
                          Message
                        </span>
                        <p className="text-txt-sub whitespace-pre-wrap leading-relaxed bg-slate-50/60 dark:bg-slate-900/40 p-3 rounded-lg border border-divider/50">
                          {previewContent.body || "Template loaded"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-divider bg-slate-50/50 dark:bg-slate-900/20 p-4 text-center text-xs text-txt-sub">
                    Select a client and task definition to automatically
                    generate the personalized message preview.
                  </div>
                )}
              </div>
            </DrawerSection>

            {/* Step 5: Schedule Timing */}
            <DrawerSection step={5} title="Dispatch timing" required>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, sendNow: true }))}
                    className={`h-11 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      form.sendNow
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-surface text-txt-main border-divider hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Send Now</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, sendNow: false }))}
                    className={`h-11 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      !form.sendNow
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-surface text-txt-main border-divider hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Schedule for later</span>
                  </button>
                </div>

                {!form.sendNow && (
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-txt-main mb-1.5">
                      Scheduled Date &amp; Time{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={form.scheduledAt}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, scheduledAt: e.target.value }))
                      }
                      min={new Date().toISOString().slice(0, 16)}
                      className={INPUT}
                    />
                    <p className="text-[11px] text-txt-sub mt-1">
                      The reminder notification will be dispatched automatically
                      at this time.
                    </p>
                  </div>
                )}
              </div>
            </DrawerSection>
          </div>
        )}
      </div>
    </Drawer>
  );
}
