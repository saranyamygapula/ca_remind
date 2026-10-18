"use client";

import React, { useEffect, useState } from "react";
import { Pencil, Plus, AlertCircle, X, Loader2 } from "lucide-react";
import Drawer from "@/components/common/Drawer";
import { FormWrapper } from "@/components/wrappers/FormWrapper";
import { useAsyncAction } from "@/hooks/useAnyAction";
import {
  getMessageTemplateById,
  createMessageTemplate,
  updateMessageTemplate,
} from "@/services/messageTemplateService";
import {
  CreateMessageTemplateDto,
  UpdateMessageTemplateDto,
  Templates,
  ChannelType,
} from "@/types/messageTemplate.types";
import {
  DEFAULT_EMAIL_TEMPLATE,
  DEFAULT_WHATSAPP_TEMPLATE,
  DEFAULT_SMS_TEMPLATE,
  DEFAULT_INAPP_TEMPLATE,
} from "@/constants/messageTemplateConstants";
import { templateFormSchema, TemplateFormValues } from "@/utils/schema";

import TemplateInfoSection from "./template-form/TemplateInfoSection";
import TemplateChannelsSection from "./template-form/TemplateChannelsSection";
import TemplateContentSection from "./template-form/TemplateContentSection";

export interface TemplateFormDrawerProps {
  open: boolean;
  onClose: () => void;
  businessId: string;
  templateId?: string | null;
  onSuccess?: () => void;
}

const TEMPLATE_FORM_ID = "template-form";

const DEFAULT_FORM_VALUES: TemplateFormValues = {
  name: "",
  channels: ["email", "whatsapp"],
  reminderType: "GST",
  businessCategory: "COMPLIANCE",
  isActive: true,
  emailSubject: DEFAULT_EMAIL_TEMPLATE.subject,
  emailBody: DEFAULT_EMAIL_TEMPLATE.body,
  whatsappBody: DEFAULT_WHATSAPP_TEMPLATE.body,
  smsBody: DEFAULT_SMS_TEMPLATE.body,
  inAppBody: DEFAULT_INAPP_TEMPLATE.body,
  selectedPlaceholders: [
    "CLIENTNAME",
    "BUSINESSNAME",
    "DUEDATE",
    "SERVICETYPE",
  ],
};

export default function TemplateFormDrawer({
  open,
  onClose,
  businessId,
  templateId,
  onSuccess,
}: TemplateFormDrawerProps) {
  const mode = templateId ? "edit" : "create";

  const [initialFormValues, setInitialFormValues] = useState<
    TemplateFormValues | undefined
  >(undefined);
  const [headerTitle, setHeaderTitle] = useState("");
  const [activeChannelTab, setActiveChannelTab] =
    useState<ChannelType>("email");

  const saveAction = useAsyncAction();
  const fetchAction = useAsyncAction();

  // ── Fetch template details in edit mode ─────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    if (mode === "create") {
      setInitialFormValues(undefined);
      setHeaderTitle("");
      setActiveChannelTab("email");
      return;
    }

    if (!templateId || !businessId) return;

    fetchAction.run(
      async () => {
        const data = await getMessageTemplateById(businessId, templateId);
        const ch = (data.channels || []) as ChannelType[];
        const firstCh = ch[0] || "email";

        setActiveChannelTab(firstCh);
        setHeaderTitle(data.name || "Edit Template");

        setInitialFormValues({
          name: data.name || "",
          channels: ch.length > 0 ? ch : ["email"],
          reminderType: data.reminder_type || "GST",
          businessCategory: data.businessCategory || "COMPLIANCE",
          isActive: data.isActive ?? true,
          emailSubject:
            data.templates?.email?.subject ?? DEFAULT_EMAIL_TEMPLATE.subject,
          emailBody: data.templates?.email?.body ?? DEFAULT_EMAIL_TEMPLATE.body,
          whatsappBody:
            data.templates?.whatsapp?.body ?? DEFAULT_WHATSAPP_TEMPLATE.body,
          smsBody: data.templates?.sms?.body ?? DEFAULT_SMS_TEMPLATE.body,
          inAppBody:
            data.templates?.in_app?.body ?? DEFAULT_INAPP_TEMPLATE.body,
          selectedPlaceholders: data.placeholders || [],
        });
      },
      {
        errorMessage: "Failed to load template details",
        showErrorToast: false,
      },
    );
  }, [open, mode, templateId, businessId]);

  const handleClose = () => {
    if (saveAction.loading) return;
    saveAction.reset();
    fetchAction.reset();
    setHeaderTitle("");
    onClose();
  };

  const handleSubmit = async (data: TemplateFormValues) => {
    const templates: Templates = {};
    if (data.channels.includes("email")) {
      templates.email = {
        subject: data.emailSubject || "",
        body: data.emailBody || "",
      };
    }
    if (data.channels.includes("whatsapp")) {
      templates.whatsapp = {
        body: data.whatsappBody || "",
      };
    }
    if (data.channels.includes("sms")) {
      templates.sms = {
        body: data.smsBody || "",
      };
    }
    if (data.channels.includes("in_app")) {
      templates.in_app = {
        body: data.inAppBody || "",
      };
    }

    await saveAction.run(
      async () => {
        if (mode === "edit" && templateId) {
          const dto: UpdateMessageTemplateDto = {
            name: data.name.trim(),
            templates,
            placeholders: data.selectedPlaceholders,
            channels: data.channels,
            reminder_type:
              data.reminderType as UpdateMessageTemplateDto["reminder_type"],
            serviceType: data.reminderType,
            businessCategory: data.businessCategory,
            isActive: data.isActive,
          };
          await updateMessageTemplate(businessId, templateId, dto);
        } else {
          const dto: CreateMessageTemplateDto = {
            name: data.name.trim(),
            templates,
            placeholders: data.selectedPlaceholders,
            channels: data.channels,
            reminder_type:
              data.reminderType as CreateMessageTemplateDto["reminder_type"],
            serviceType: data.reminderType,
            businessCategory:
              data.businessCategory as CreateMessageTemplateDto["businessCategory"],
            isActive: data.isActive,
          };
          await createMessageTemplate(businessId, dto);
        }
      },
      {
        successMessage:
          mode === "edit"
            ? "Template updated successfully"
            : "Template created successfully",
        errorMessage:
          mode === "edit"
            ? "Failed to update template"
            : "Failed to create template",
        showSuccessToast: true,
        showErrorToast: true,
        onSuccess: () => {
          onSuccess?.();
          handleClose();
        },
      },
    );
  };

  const currentDefaultValues =
    mode === "edit" && initialFormValues
      ? initialFormValues
      : DEFAULT_FORM_VALUES;

  const formKey =
    mode === "edit"
      ? `edit-${templateId}-${initialFormValues ? "loaded" : "pending"}`
      : "create";

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title={
        mode === "edit"
          ? headerTitle || "Edit Template"
          : "Create Notification Template"
      }
      width="lg"
      customHeader={
        <div className="bg-[#0F1E36] px-6 py-5 flex items-center justify-between text-white shrink-0 border-b border-white/10 select-none">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#F59E0B] flex items-center justify-center text-slate-950 font-bold shadow-sm shrink-0">
              {mode === "edit" ? (
                <Pencil className="h-5 w-5 text-slate-950 stroke-[2.5]" />
              ) : (
                <Plus className="h-5 w-5 text-slate-950 stroke-[2.5]" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider mb-0.5">
                {mode === "edit" ? "Update template" : "New template"}
              </p>
              <h2 className="text-lg font-extrabold leading-tight text-white tracking-tight truncate">
                {mode === "edit"
                  ? headerTitle || "Update Template Details"
                  : "Create Notification Template"}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={saveAction.loading}
            aria-label="Close"
            className="rounded-xl bg-white/10 hover:bg-white/20 p-2 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      }
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={saveAction.loading}
            className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-sm font-semibold text-txt-main bg-[var(--bg)] transition-all hover:bg-[var(--border)]/60 disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={TEMPLATE_FORM_ID}
            disabled={saveAction.loading || fetchAction.loading}
            className="flex flex-[2] items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 shadow-md transition-all hover:shadow-lg disabled:opacity-60 cursor-pointer"
          >
            {saveAction.loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{mode === "edit" ? "Saving..." : "Creating..."}</span>
              </>
            ) : (
              <span>
                {mode === "edit" ? "Save changes" : "Create template"}
              </span>
            )}
          </button>
        </div>
      }
    >
      <div className="py-1 space-y-4">
        {/* Loading Indicator */}
        {fetchAction.loading && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Loading template details...</span>
          </div>
        )}

        <FormWrapper
          key={formKey}
          formId={TEMPLATE_FORM_ID}
          schema={templateFormSchema}
          defaultValues={currentDefaultValues}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <TemplateInfoSection />
          <TemplateChannelsSection
            activeChannelTab={activeChannelTab}
            onActiveChannelTabChange={setActiveChannelTab}
          />
          <TemplateContentSection
            activeChannelTab={activeChannelTab}
            onActiveChannelTabChange={setActiveChannelTab}
          />
        </FormWrapper>
      </div>
    </Drawer>
  );
}

export { TemplateFormDrawer as TemplateFormDialog };
