import { serverApi, getServerWorkspace } from "@/lib/serverApi";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { TasksListResponse, TaskListItem } from "@/types/task.types";
import { ListRemindersResponse, Reminder } from "@/types/reminders.types";
import { Organization } from "@/types/organizations";
import { Business } from "@/types/business";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let businessId: string = "";
  let initialTasks: TaskListItem[] = [];
  let initialReminders: Reminder[] = [];
  let initialError: string | undefined;

  try {
    const workspace = await getServerWorkspace();
    businessId = workspace.businessId || "";

    // Fallback if not yet in cookie: query org and first business
    if (!businessId) {
      let orgId = workspace.orgId;
      if (!orgId) {
        const orgs = await serverApi.get<Organization[]>("/private/organizations");
        if (orgs?.length > 0) {
          orgId = orgs[0].id;
        }
      }
      if (orgId) {
        const businesses = await serverApi.get<Business[]>(
          `/private/organizations/${orgId}/businesses`
        );
        if (businesses?.length > 0) {
          businessId = businesses[0].id;
        }
      }
    }

    if (businessId) {
      const [tasksResult, remindersResult] = await Promise.allSettled([
        serverApi.get<TasksListResponse>(`/private/business/${businessId}/tasks`),
        serverApi.get<ListRemindersResponse>(
          `/private/business/${businessId}/reminders`
        ),
      ]);

      if (tasksResult.status === "fulfilled") {
        initialTasks = Array.isArray(tasksResult.value?.items)
          ? tasksResult.value.items
          : [];
      } else {
        initialError =
          tasksResult.reason instanceof Error
            ? tasksResult.reason.message
            : "Failed to fetch tasks";
      }

      if (remindersResult.status === "fulfilled") {
        initialReminders = Array.isArray(remindersResult.value?.items)
          ? (remindersResult.value.items as Reminder[])
          : [];
      }
    }
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
      throw err;
    }
    console.error("Failed to load dashboard data on server:", err);
    initialError =
      err instanceof Error ? err.message : "Failed to load dashboard";
  }

  return (
    <DashboardClient
      initialTasks={initialTasks}
      initialReminders={initialReminders}
      initialError={initialError}
      businessId={businessId}
    />
  );
}