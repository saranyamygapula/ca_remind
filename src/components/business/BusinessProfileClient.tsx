"use client";

import { useState } from "react";
import {
  Building2,
  Phone,
  Mail,
  User,
  MapPin,
  Clock,
  ShieldCheck,
  FileText,
  Briefcase,
} from "lucide-react";
import { updateBusiness } from "@/services/businessService";
import {
  Business,
  BusinessType,
  UpdateBusinessDto,
  BusinessAddress,
} from "@/types/business";
import { useToast } from "@/context/ToastContext";
import { useAsyncAction } from "@/hooks/useAnyAction";
import { useRouter } from "next/navigation";
import ProfileLayout, {
  ProfileCard,
  ProfileField,
  ProfileIdentifiersCard,
  ProfileQuickLinksCard,
} from "@/components/common/ProfileLayout";

const BUSINESS_TYPE_OPTIONS: { value: BusinessType; label: string }[] = [
  { value: "ACCOUNTS", label: "Accounting / CA Firm" },
  { value: "SERVICE", label: "Professional Services" },
  { value: "RETAIL", label: "Retail" },
  { value: "WHOLESALE", label: "Wholesale" },
  { value: "OTHER", label: "Other" },
];

const inputCls =
  "w-full h-11 sm:h-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-txt-main " +
  "placeholder:text-txt-sub/50 outline-none transition-all hover:border-txt-sub/40 " +
  "focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 dark:focus:border-[var(--accent)]";

const selectCls =
  "w-full h-11 sm:h-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-txt-main " +
  "outline-none transition-all hover:border-txt-sub/40 " +
  "focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 dark:focus:border-[var(--accent)] cursor-pointer";

interface BusinessProfileClientProps {
  initialBusiness: Business | null;
  orgId: string;
}

export default function BusinessProfileClient({
  initialBusiness,
  orgId,
}: BusinessProfileClientProps) {
  const router = useRouter();
  const toast = useToast();
  const { loading: saving, run } = useAsyncAction();

  const [business, setBusiness] = useState<Business | null>(initialBusiness);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Form state initialized from initialBusiness
  const [name, setName] = useState(initialBusiness?.name || "");
  const [phone, setPhone] = useState(initialBusiness?.phone || "");
  const [businessType, setBusinessType] = useState<BusinessType>(
    (initialBusiness?.businessType as BusinessType) || "ACCOUNTS"
  );
  const [ownerName, setOwnerName] = useState(
    initialBusiness?.ownerName ||
      initialBusiness?.settings?.uiConfig?.ownerName ||
      ""
  );
  const [email, setEmail] = useState(
    initialBusiness?.email || initialBusiness?.settings?.uiConfig?.email || ""
  );
  const [line1, setLine1] = useState(initialBusiness?.address?.line1 || "");
  const [area, setArea] = useState(initialBusiness?.address?.area || "");
  const [city, setCity] = useState(initialBusiness?.address?.city || "");
  const [state, setState] = useState(initialBusiness?.address?.state || "");
  const [pincode, setPincode] = useState(
    initialBusiness?.address?.pincode || ""
  );
  const [country, setCountry] = useState(
    initialBusiness?.address?.country || "India"
  );
  const [notes, setNotes] = useState(initialBusiness?.notes || "");

  const handleCancel = () => {
    setIsEditing(false);
    if (business) {
      setName(business.name || "");
      setPhone(business.phone || "");
      setBusinessType((business.businessType as BusinessType) || "ACCOUNTS");
      setOwnerName(
        business.ownerName || business.settings?.uiConfig?.ownerName || ""
      );
      setEmail(business.email || business.settings?.uiConfig?.email || "");
      setLine1(business.address?.line1 || "");
      setArea(business.address?.area || "");
      setCity(business.address?.city || "");
      setState(business.address?.state || "");
      setPincode(business.address?.pincode || "");
      setCountry(business.address?.country || "India");
      setNotes(business.notes || "");
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!business || !orgId) return;

    if (!name.trim()) {
      toast.error("Business name is required");
      return;
    }

    if (phone && !/^[0-9]{10}$/.test(phone.trim())) {
      toast.error("Phone number must be a valid 10-digit number");
      return;
    }

    const addressPayload: BusinessAddress = {
      type: "COMMUNICATION",
      line1: line1.trim() || undefined,
      area: area.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      pincode: pincode.trim() || undefined,
      country: country.trim() || undefined,
    };

    const dto: UpdateBusinessDto = {
      name: name.trim(),
      phone: phone.trim(),
      businessType,
      address: addressPayload,
      notes: notes.trim() || undefined,
      uiConfig: {
        ownerName: ownerName.trim() || undefined,
        email: email.trim() || undefined,
      },
    };

    await run(
      async () => {
        const updated = await updateBusiness(orgId, business.id, dto);
        setBusiness(updated);
        setIsEditing(false);
        return updated;
      },
      {
        successMessage: "Business profile updated successfully",
        errorMessage: "Failed to update business profile",
      }
    );
  };

  if (!business) {
    return (
      <div className="min-h-screen bg-bg py-16 px-4 sm:px-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-8 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--surface-subtle)] text-[var(--primary)] dark:text-[var(--accent)] flex items-center justify-center border border-[var(--border)]">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-[var(--heading)] tracking-tight">
              No Business Found
            </h2>
            <p className="text-sm text-txt-sub leading-relaxed">
              You don&apos;t have any business entity registered yet. Please
              create your business to get started.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/business-create")}
            className="w-full h-11 rounded-xl bg-navy hover:bg-navy-hover text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Building2 className="w-4 h-4" />
            Create Your Business
          </button>
        </div>
      </div>
    );
  }

  const initial = (business.name?.[0] || "B").toUpperCase();
  const addressFormatted = [line1, area, city, state, pincode, country]
    .filter(Boolean)
    .join(", ");
  const categoryLabel =
    BUSINESS_TYPE_OPTIONS.find((o) => o.value === business.businessType)
      ?.label ||
    business.businessType ||
    "Accounting / CA Firm";

  return (
    <ProfileLayout
      pageTitle="Business Profile"
      pageDescription="Manage your firm details, registered office address and workspace identity."
      error={error}
      onDismissError={() => setError("")}
      hero={{
        avatar: { text: initial },
        title: business.name || "Business Firm",
        badges: [
          { label: categoryLabel, variant: "role", icon: Briefcase },
          {
            label: business.isActive ? "Active Firm" : "Inactive",
            variant: business.isActive ? "success" : "warning",
            icon: ShieldCheck,
          },
        ],
        contactInfo: [
          ...(business.phone ? [{ icon: Phone, text: business.phone }] : []),
          ...(email ? [{ icon: Mail, text: email }] : []),
        ],
        metaInfo: [
          {
            icon: Clock,
            text: `Timezone: ${business.settings?.timezone || "Asia/Kolkata"} · Locale: ${business.settings?.locale || "en-IN"}`,
          },
        ],
        isEditing,
        saving,
        onEdit: () => setIsEditing(true),
        onCancel: handleCancel,
        onSave: handleSave,
        formId: "business-profile-form",
        editLabel: "Edit firm details",
        saveLabel: "Save changes",
        isActive: business.isActive,
      }}
      sidebar={
        <>
          {/* Workspace Identifiers */}
          <ProfileIdentifiersCard
            title="Workspace Identifiers"
            identifiers={[
              {
                label: "Business Entity ID",
                value: business.id,
                copyable: true,
              },
              {
                label: "Organization ID",
                value: orgId || business.organizationId,
                copyable: true,
              },
            ]}
            timestamps={[
              { label: "Created Date", value: business.createdAt },
              { label: "Last Updated", value: business.updatedAt },
            ]}
          />

          {/* Related Settings */}
          <ProfileQuickLinksCard
            title="Related Workspace Settings"
            links={[
              { href: "/user-profile", label: "User Profile & Account" },
              { href: "/staff", label: "Staff & Team Management" },
              { href: "/subscription", label: "Billing & Subscription" },
            ]}
          />
        </>
      }
    >
      <form
        id="business-profile-form"
        onSubmit={handleSave}
        className="space-y-6"
      >
        {/* Firm Overview Card */}
        <ProfileCard
          icon={Building2}
          title="Firm Overview & Identity"
          subtitle="Core registered firm details, category and managing partners"
          isEditing={isEditing}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Firm Name */}
              <ProfileField
                label="Firm / Business Name"
                required
                isEditing={isEditing}
                value={business.name}
              >
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter business name"
                  className={inputCls}
                  required
                />
              </ProfileField>

              {/* Category */}
              <ProfileField
                label="Business Category"
                isEditing={isEditing}
                value={categoryLabel}
              >
                <select
                  value={businessType}
                  onChange={(e) =>
                    setBusinessType(e.target.value as BusinessType)
                  }
                  className={selectCls}
                >
                  {BUSINESS_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </ProfileField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Managing Partner / Owner */}
              <ProfileField
                label="Firm Owner / Managing Partner"
                isEditing={isEditing}
                value={ownerName}
                icon={User}
              >
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-txt-sub" />
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. CA Ramesh Sharma"
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </ProfileField>

              {/* Official Phone */}
              <ProfileField
                label="Official Contact Phone"
                isEditing={isEditing}
                value={phone}
                icon={Phone}
                isMono
              >
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-txt-sub" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit phone number"
                    className={`${inputCls} pl-10 font-mono`}
                    maxLength={10}
                  />
                </div>
              </ProfileField>
            </div>

            {/* Official Email */}
            <ProfileField
              label="Official Notification Email"
              isEditing={isEditing}
              value={email}
              icon={Mail}
              isMono
            >
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-txt-sub" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. contact@mycafirm.com"
                  className={`${inputCls} pl-10 font-mono`}
                />
              </div>
            </ProfileField>
          </div>
        </ProfileCard>

        {/* Registered Office & Address Card */}
        <ProfileCard
          icon={MapPin}
          title="Operating Office & Address"
          subtitle="Communication and registered office coordinates"
          isEditing={isEditing}
        >
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-[13px] font-bold text-txt-main">
                  Address Line 1
                </label>
                <input
                  type="text"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  placeholder="Suite, Street, Building name"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block mb-2 text-[13px] font-bold text-txt-main">
                    Area / Locality
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Connaught Place"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block mb-2 text-[13px] font-bold text-txt-main">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City name"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block mb-2 text-[13px] font-bold text-txt-main">
                    State
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block mb-2 text-[13px] font-bold text-txt-main">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="6-digit pincode"
                    className={`${inputCls} font-mono`}
                    maxLength={6}
                  />
                </div>
                <div>
                  <label className="block mb-2 text-[13px] font-bold text-txt-main">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Country"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-sm text-txt-main">
              {addressFormatted ? (
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] mt-0.5">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div className="space-y-1">
                    <p className="font-semibold text-txt-main leading-relaxed">
                      {line1 || addressFormatted}
                    </p>
                    {line1 && (
                      <p className="text-xs text-txt-sub">
                        {[area, city, state, pincode, country]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-txt-sub italic">
                  No address configured yet. Click &quot;Edit firm details&quot;
                  above to set your location coordinates.
                </p>
              )}
            </div>
          )}
        </ProfileCard>

        {/* Firm Bio & Internal Notes Card */}
        <ProfileCard
          icon={FileText}
          title="Firm Bio & Remarks"
          subtitle="Internal notes, practice summary and operational description"
          isEditing={isEditing}
        >
          {isEditing ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal remarks, partner specializations, or client servicing notes..."
              className="w-full min-h-28 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 text-sm font-medium text-txt-main placeholder:text-txt-sub/50 outline-none transition-all hover:border-txt-sub/40 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 dark:focus:border-[var(--accent)]"
            />
          ) : (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <p className="text-xs sm:text-sm text-txt-main whitespace-pre-wrap leading-relaxed">
                {notes || (
                  <span className="text-txt-sub italic">
                    No internal notes added.
                  </span>
                )}
              </p>
            </div>
          )}
        </ProfileCard>
      </form>
    </ProfileLayout>
  );
}
