import { serverApi, getServerWorkspace } from "@/lib/serverApi";
import StaffPageClient from "@/components/staff/StaffPageClient";
import { StaffMember } from "@/types/staff.types";
import { Organization } from "@/types/organizations";
import { Business } from "@/types/business";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  let businessId = "";
  let initialStaff: StaffMember[] = [];

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
      const res = await serverApi.get<{ items?: any[] }>(
        `/private/business/${businessId}/staff`
      );
      initialStaff = (res?.items ?? []).map((item: any): StaffMember => ({
        ...item,
        role: item.roles?.[0] ?? "",
        roles: item.roles ?? [],
        firstName: item.firstName ?? item.user?.firstName ?? "",
        lastName: item.lastName ?? item.user?.lastName ?? "",
      }));
    }

    return (
      <StaffPageClient initialStaff={initialStaff} businessId={businessId} />
    );
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
      throw err;
    }
    console.error("Failed to load staff on server:", err);
    return (
      <StaffPageClient initialStaff={[]} businessId={businessId} />
    );
  }
}
