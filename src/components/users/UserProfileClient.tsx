"use client";

import { useState } from "react";
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { updateUser } from "@/services/userService";
import { User, UpdateUserDto } from "@/types/user";
import { useToast } from "@/context/ToastContext";
import { useAsyncAction } from "@/hooks/useAnyAction";
import Link from "next/link";
import ProfileLayout, {
  ProfileCard,
  ProfileField,
  ProfileIdentifiersCard,
  ProfileQuickLinksCard,
} from "@/components/common/ProfileLayout";

const inputCls =
  "w-full h-11 sm:h-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-txt-main " +
  "placeholder:text-txt-sub/50 outline-none transition-all hover:border-txt-sub/40 " +
  "focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 dark:focus:border-[var(--accent)]";

interface UserProfileClientProps {
  initialUser: User;
}

export default function UserProfileClient({ initialUser }: UserProfileClientProps) {
  const toast = useToast();
  const { loading: saving, run } = useAsyncAction();

  const [user, setUser] = useState<User>(initialUser);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState(initialUser.firstName || "");
  const [lastName, setLastName] = useState(initialUser.lastName || "");
  const [phone, setPhone] = useState(
    initialUser.mobileNumber || initialUser.phone || ""
  );

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.mobileNumber || user.phone || "");
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!firstName.trim()) {
      toast.error("First name is required");
      return;
    }

    if (phone && !/^[0-9]{10}$/.test(phone.trim())) {
      toast.error("Mobile number must be a valid 10-digit number");
      return;
    }

    const dto: UpdateUserDto = {
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      phone: phone.trim() || undefined,
    };

    await run(
      async () => {
        const updated = await updateUser(dto);
        setUser(updated);
        setIsEditing(false);
        return updated;
      },
      {
        successMessage: "Profile updated successfully",
        errorMessage: "Failed to update profile",
      }
    );
  };

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    "User";
  const initials =
    (user.firstName?.[0] || user.username?.[0] || "U").toUpperCase() +
    (user.lastName?.[0] || "").toUpperCase();

  const memberSinceYear = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : "2024";

  return (
    <ProfileLayout
      pageTitle="Profile"
      pageDescription="Manage your personal details, plan and account information."
      error={error}
      onDismissError={() => setError("")}
      hero={{
        avatar: { text: initials },
        title: fullName,
        badges: [
          { label: user.roles || "Owner", variant: "role" },
          { label: "Verified", variant: "success", icon: ShieldCheck },
        ],
        contactInfo: [
          {
            icon: Mail,
            text: user.email || "No email associated",
          },
          ...(user.mobileNumber || user.phone
            ? [{ icon: Phone, text: user.mobileNumber || user.phone || "" }]
            : []),
        ],
        metaInfo: [
          {
            icon: Calendar,
            text: `Member since ${memberSinceYear}`,
          },
        ],
        isEditing,
        saving,
        onEdit: () => setIsEditing(true),
        onCancel: handleCancel,
        onSave: handleSave,
        formId: "user-profile-form",
        editLabel: "Edit profile",
        saveLabel: "Save changes",
      }}
      sidebar={
        <>
          {/* Account Details */}
          <ProfileIdentifiersCard
            title="Account details"
            identifiers={[
              { label: "System user ID", value: user.id || "", copyable: true },
              {
                label: "Assigned role",
                value: user.roles || "Owner / Administrator",
              },
            ]}
            timestamps={[
              { label: "Account created", value: user.createdAt },
              { label: "Last updated", value: user.updatedAt },
            ]}
          />

          {/* Related Settings */}
          <ProfileQuickLinksCard
            title="Related settings"
            links={[
              { href: "/business-profile", label: "Business & firm profile" },
              { href: "/staff", label: "Staff & team management" },
              { href: "/subscription", label: "Billing & subscription" },
            ]}
          />
        </>
      }
    >
      {/* Personal Information Card */}
      <ProfileCard
        icon={UserIcon}
        title="Personal information"
        subtitle="Your personal identity and contact details"
        isEditing={isEditing}
      >
        <form
          id="user-profile-form"
          onSubmit={handleSave}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* First Name */}
            <ProfileField
              label="First name"
              required
              isEditing={isEditing}
              value={user.firstName}
            >
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
                className={inputCls}
                required
              />
            </ProfileField>

            {/* Last Name */}
            <ProfileField
              label="Last name"
              isEditing={isEditing}
              value={user.lastName}
            >
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
                className={inputCls}
              />
            </ProfileField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Mobile number */}
            <ProfileField
              label="Mobile number"
              isEditing={isEditing}
              value={user.mobileNumber || user.phone}
              icon={Phone}
              isMono
            >
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-txt-sub" />
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className={`${inputCls} pl-10 font-mono`}
                  maxLength={10}
                />
              </div>
            </ProfileField>

            {/* Email (read-only) */}
            <ProfileField
              label="Email address"
              hint="primary, cannot be changed"
              isEditing={false}
              value={user.email}
              isMono
              rightBadge={
                <span
                  title="Verified email"
                  className="inline-flex items-center text-emerald-600"
                >
                  <ShieldCheck className="h-4 w-4" />
                </span>
              }
            >
              <div />
            </ProfileField>
          </div>

          {/* Username */}
          <ProfileField
            label="Account username"
            isEditing={false}
            value={`@${user.username || user.email?.split("@")[0] || "user"}`}
            isMono
          >
            <div />
          </ProfileField>
        </form>
      </ProfileCard>

      {/* Subscription & Plan Card */}
      <ProfileCard
        icon={CreditCard}
        title="Subscription & plan"
        subtitle="Current active tier and billing cycle"
        action={
          <Link
            href="/subscription"
            className="inline-flex items-center px-1 text-sm font-bold text-[var(--primary)] dark:text-[var(--accent)] hover:underline"
          >
            Manage plan &rarr;
          </Link>
        }
      >
        {user.razorpaySubscriptionData ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <p className="text-xs font-semibold text-txt-sub">Plan tier</p>
              <p className="mt-1 text-[15px] font-extrabold text-txt-main">
                {user.razorpaySubscriptionData.planName || "Pro Tier"}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <p className="text-xs font-semibold text-txt-sub">Status</p>
              <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 px-3 py-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {user.razorpaySubscriptionData.subscriptionStatus || "Active"}
              </span>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <p className="text-xs font-semibold text-txt-sub">Next renewal</p>
              <p className="mt-1 font-mono text-[14px] font-semibold text-txt-main">
                {user.razorpaySubscriptionData.nextBillingDate
                  ? new Date(
                      user.razorpaySubscriptionData.nextBillingDate
                    ).toLocaleDateString("en-IN")
                  : "—"}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-navy shadow-xs">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-extrabold text-txt-main">
                  Standard business workspace
                </p>
                <p className="text-xs sm:text-sm text-txt-sub">
                  Access to all core compliance modules &amp; reminder engines.
                </p>
              </div>
            </div>
            <Link
              href="/subscription"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-navy px-4 text-xs sm:text-sm font-bold text-white transition-colors hover:bg-navy-hover"
            >
              View plans
            </Link>
          </div>
        )}
      </ProfileCard>
    </ProfileLayout>
  );
}
