import { serverApi, getServerWorkspace } from "@/lib/serverApi";
import TasksPageClient from "@/components/tasks/TasksPageClient";
import { TasksListResponse, TaskListItem } from "@/types/task.types";
import { Organization } from "@/types/organizations";
import { Business } from "@/types/business";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  let businessId = "";
  let initialTasks: TaskListItem[] = [];

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
      const res = await serverApi.get<TasksListResponse>(
        `/private/business/${businessId}/tasks`
      );
      initialTasks = Array.isArray(res?.items) ? res.items : [];
    }

    return <TasksPageClient initialTasks={initialTasks} businessId={businessId} />;
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
      throw err;
    }
    console.error("Failed to load tasks on server:", err);
    return <TasksPageClient initialTasks={[]} businessId={businessId} />;
  }
}
