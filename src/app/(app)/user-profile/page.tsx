import { serverApi } from "@/lib/serverApi";
import UserProfileClient from "@/components/users/UserProfileClient";
import { User } from "@/types/user";

export const dynamic = "force-dynamic";

export default async function UserProfilePage() {
  try {
    const user = await serverApi.get<User>("/private/user");
    return <UserProfileClient initialUser={user} />;
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
      throw err;
    }
    console.error("Failed to load user profile on server:", err);
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-bg px-4">
        <div className="alert alert-error max-w-md shadow-lg rounded-2xl">
          <span>
            {err instanceof Error
              ? err.message
              : "Failed to load user profile. Please try again."}
          </span>
        </div>
      </div>
    );
  }
}