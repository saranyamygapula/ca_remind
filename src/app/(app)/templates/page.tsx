import { serverApi, getServerWorkspace } from "@/lib/serverApi";
import TemplatesPageClient from "@/components/templates/TemplatesPageClient";
import { MessageTemplateListItem } from "@/types/messageTemplate.types";
import { Organization } from "@/types/organizations";
import { Business } from "@/types/business";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  let businessId = "";
  let initialTemplates: MessageTemplateListItem[] = [];

  try {
    const workspace = await getServerWorkspace();
    businessId = workspace.businessId || "";

    if (!businessId) {
      let orgId = workspace.orgId;
      if (!orgId) {
        const orgs = await serverApi.get<Organization[]>("/private/organizations");
        if (orgs?.length > 0) orgId = orgs[0].id;
      }
      if (orgId) {
        const businesses = await serverApi.get<Business[]>(
          `/private/organizations/${orgId}/businesses`
        );
        if (businesses?.length > 0) businessId = businesses[0].id;
      }
    }

    if (businessId) {
      const data = await serverApi.get<unknown[]>(
        `/private/business/${businessId}/v2messagetemplates`
      );
      initialTemplates = (data ?? []).map((item: any): MessageTemplateListItem => ({
        id: item.id ?? item.key,
        key: item.key ?? "",
        name: item.name ?? "",
        channels: item.channels ?? [],
        reminder_type: item.reminder_type,
        serviceType: item.serviceType ?? item.reminder_type,
        businessCategory: item.businessCategory ?? item.business_category ?? "",
        placeholders: item.placeholders ?? [],
        isActive: item.isActive ?? item.is_active ?? true,
        templates: {
          email: item.templates?.email
            ? {
                subject: item.templates.email.subject ?? "",
                body: item.templates.email.body ?? "",
              }
            : undefined,
          whatsapp: item.templates?.whatsapp
            ? { body: item.templates.whatsapp.body ?? "" }
            : undefined,
        },
      }));
    }

    return (
      <TemplatesPageClient
        initialTemplates={initialTemplates}
        businessId={businessId}
      />
    );
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
      throw err;
    }
    console.error("Failed to load templates on server:", err);
    return (
      <TemplatesPageClient initialTemplates={[]} businessId={businessId} />
    );
  }
}
