import { serverApi, getServerWorkspace } from "@/lib/serverApi";
import PlansPageClient from "@/components/subscription/PlanPageClient";
import { AvailablePlans } from "@/types/billing";
import { Organization } from "@/types/organizations";

export const dynamic = "force-dynamic";

export default async function SubscriptionPlansPage() {
  try {
    // 1. Check workspace cookie first for orgId
    const workspace = await getServerWorkspace();
    let organizationId = workspace.orgId;

    if (!organizationId) {
      const orgs = await serverApi.get<Organization[]>("/private/organizations");
      if (!orgs || orgs.length === 0) {
        return (
          <div className="flex min-h-[60vh] items-center justify-center bg-bg px-4">
            <div className="alert alert-warning max-w-md shadow-lg rounded-2xl">
              <span>No organization found. Please create an organization first.</span>
            </div>
          </div>
        );
      }
      organizationId = orgs[0].id;
    }

    // 2. Fetch available plans for the organization
    const plans = await serverApi.get<AvailablePlans>(
      `/private/organizations/${organizationId}/plans`
    );

    return <PlansPageClient plans={plans} organizationId={organizationId} />;
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
      throw err;
    }
    console.error("Failed to load subscription plans on server:", err);
    const message =
      err instanceof Error
        ? err.message
        : "Failed to load subscription plans. Please try again.";

    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-bg px-4">
        <div className="alert alert-error max-w-md shadow-lg rounded-2xl">
          <span>{message}</span>
        </div>
      </div>
    );
  }
}