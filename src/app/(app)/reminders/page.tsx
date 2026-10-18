import { serverApi, getServerWorkspace } from "@/lib/serverApi";
import RemindersPageClient from "@/components/reminders/RemindersPageClient";
import { ReminderDetail, ListRemindersResponse } from "@/types/reminders.types";
import { Organization } from "@/types/organizations";
import { Business } from "@/types/business";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  let businessId = "";
  let initialReminders: ReminderDetail[] = [];

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
      const res = await serverApi.get<ListRemindersResponse>(
        `/private/business/${businessId}/reminders`
      );
      initialReminders = Array.isArray(res?.items) ? (res.items as ReminderDetail[]) : [];
    }

    return (
      <RemindersPageClient
        initialReminders={initialReminders}
        businessId={businessId}
      />
    );
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
      throw err;
    }
    console.error("Failed to load reminders on server:", err);
    return (
      <RemindersPageClient
        initialReminders={[]}
        businessId={businessId}
      />
    );
  }
}
