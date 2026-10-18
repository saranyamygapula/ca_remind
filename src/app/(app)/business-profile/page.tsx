import { serverApi, getServerWorkspace } from "@/lib/serverApi";
import BusinessProfileClient from "@/components/business/BusinessProfileClient";
import { Organization } from "@/types/organizations";
import { Business } from "@/types/business";

export const dynamic = "force-dynamic";

export default async function BusinessProfilePage() {
  let initialBusiness: Business | null = null;
  let organizationId = "";

  try {
    const workspace = await getServerWorkspace();
    organizationId = workspace.orgId || "";

    if (!organizationId) {
      const orgs = await serverApi.get<Organization[]>("/private/organizations");
      if (orgs && orgs.length > 0) {
        organizationId = orgs[0].id;
      }
    }

    if (organizationId) {
      const businesses = await serverApi.get<Business[]>(
        `/private/organizations/${organizationId}/businesses`
      );
      if (businesses && businesses.length > 0) {
        initialBusiness = businesses[0];
      }
    }

    return (
      <BusinessProfileClient
        initialBusiness={initialBusiness}
        orgId={organizationId}
      />
    );
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
      throw err;
    }
    console.error("Failed to load business profile on server:", err);
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-bg px-4">
        <div className="alert alert-error max-w-md shadow-lg rounded-2xl">
          <span>
            {err instanceof Error
              ? err.message
              : "Failed to load business profile. Please try again."}
          </span>
        </div>
      </div>
    );
  }
}