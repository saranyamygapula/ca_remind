import { serverApi, getServerWorkspace } from "@/lib/serverApi";
import TaskDefinitionsPageClient from "@/components/task-definitions/TaskDefinitionsPageClient";
import {
  TaskDefinitionsListResponse,
  TaskDefinitionListItem,
} from "@/types/taskDefinition.types";
import { Organization } from "@/types/organizations";
import { Business } from "@/types/business";

export const dynamic = "force-dynamic";

export default async function TaskDefinitionsPage() {
  let businessId = "";
  let initialDefinitions: TaskDefinitionListItem[] = [];

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
      const res = await serverApi.get<TaskDefinitionsListResponse>(
        `/private/business/${businessId}/taskdefinitions`
      );
      initialDefinitions = Array.isArray(res?.items) ? res.items : [];
    }

    return (
      <TaskDefinitionsPageClient
        initialDefinitions={initialDefinitions}
        businessId={businessId}
      />
    );
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
      throw err;
    }
    console.error("Failed to load task definitions on server:", err);
    return (
      <TaskDefinitionsPageClient
        initialDefinitions={[]}
        businessId={businessId}
      />
    );
  }
}
