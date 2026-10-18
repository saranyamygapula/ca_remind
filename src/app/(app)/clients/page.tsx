import { serverApi, getServerWorkspace } from "@/lib/serverApi";
import ClientsPageClient from "@/components/clients/ClientsPageClient";
import { SubjectListItem } from "@/types/subject";
import { Organization } from "@/types/organizations";
import { Business } from "@/types/business";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  let businessId = "";
  let initialClients: SubjectListItem[] = [];

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
      const res = await serverApi.get<SubjectListItem[]>(
        `/private/business/${businessId}/subjects`
      );
      const allSubjects = Array.isArray(res) ? res : [];
      initialClients = allSubjects.filter(
        (subject) => subject.subjectType === "CLIENT"
      );
    }

    return (
      <ClientsPageClient
        initialClients={initialClients}
        businessId={businessId}
      />
    );
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
      throw err;
    }
    console.error("Failed to load clients on server:", err);
    return (
      <ClientsPageClient
        initialClients={[]}
        businessId={businessId}
      />
    );
  }
}
