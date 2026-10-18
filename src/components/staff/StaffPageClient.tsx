"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import ResourcePageLayout from "@/components/common/ResourcePageLayout";
import StatCard from "@/components/task-definitions/StatCard";
import ConfirmDialog from "@/components/tasks/ConfirmDialog";

import AddStaffDialog from "@/components/staff/AddStaffDialog";
import StaffDetailsDrawer from "@/components/staff/StaffDetailsDrawer";
import StaffFilter from "@/components/staff/StaffFilter";
import StaffTable from "@/components/staff/StaffTable";

import { getStaff, deleteStaff } from "@/services/staffService";
import { StaffMember } from "@/types/staff.types";
import { useResourcePageState } from "@/hooks/useResourcePageState";
import { useAsyncAction } from "@/hooks/useAnyAction";
import { useStaffFilters } from "@/hooks/staff/useStaffFilters";

interface StaffPageClientProps {
  initialStaff: StaffMember[];
  businessId: string;
}

export default function StaffPageClient({
  initialStaff,
  businessId: serverBusinessId,
}: StaffPageClientProps) {
  const { businessId: clientBusinessId } = useWorkspace();
  const businessId = clientBusinessId || serverBusinessId;

  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);

  const fetchAction = useAsyncAction(false);
  const deleteAction = useAsyncAction();
  const page = useResourcePageState();
  const filters = useStaffFilters(staff);

  const { run: runFetch } = fetchAction;
  const { run: runDelete } = deleteAction;

  const fetchStaff = useCallback(async () => {
    if (!businessId) return;
    await runFetch(() => getStaff(businessId), {
      errorMessage: "Failed to load staff members",
      showErrorToast: false,
      onSuccess: (data) => {
        setStaff(Array.isArray(data) ? data : []);
      },
    });
  }, [businessId, runFetch]);

  // If businessId changes from the initial server value, re-fetch
  const lastBizIdRef = useRef<string>(serverBusinessId);
  useEffect(() => {
    if (clientBusinessId && clientBusinessId !== lastBizIdRef.current) {
      lastBizIdRef.current = clientBusinessId;
      fetchStaff();
    }
  }, [clientBusinessId, fetchStaff]);

  // ─── Delete Staff Confirmation ───────────────────────────────
  const handleDeleteConfirm = async () => {
    const target = page.deleteTarget;
    if (!businessId || !target) return;

    await runDelete(() => deleteStaff(businessId, target.id), {
      successMessage: `"${target.label}" removed from firm`,
      errorMessage: "Failed to remove staff member",
      onSuccess: async () => {
        page.cancelDelete();
        await fetchStaff();
      },
    });
  };

  const stats = useMemo(() => {
    let active = 0;
    let inactive = 0;
    let admins = 0;

    for (const member of staff) {
      if (member.status === "ACTIVE") active++;
      else if (member.status === "INACTIVE") inactive++;

      const r = (member.roles?.[0] || member.role || "").toUpperCase();
      if (r === "ADMIN" || r === "OWNER") admins++;
    }

    return {
      total: staff.length,
      active,
      inactive,
      admins,
    };
  }, [staff]);

  return (
    <ResourcePageLayout
      title="Staff directory"
      description="Manage your firm's team, assign compliance responsibilities, and monitor member workloads."
      actionLabel="Add Staff"
      onAction={page.openCreate}
      error={fetchAction.error || deleteAction.error}
      onDismissError={() => {
        fetchAction.clearError();
        deleteAction.clearError();
      }}
      stats={
        <>
          <StatCard
            label="Total team"
            value={stats.total}
            hint="Registered firm members"
          />
          <StatCard
            label="Active members"
            value={stats.active}
            hint="Ready for task assignment"
            valueClassName="text-[#059669] dark:text-emerald-400"
          />
          <StatCard
            label="Inactive members"
            value={stats.inactive}
            hint="Access suspended"
            valueClassName={
              stats.inactive > 0 ? "text-slate-500" : "text-txt-main"
            }
          />
          <StatCard
            label="Admins & Owners"
            value={stats.admins}
            hint="Full administrative access"
            valueClassName="text-purple-600 dark:text-purple-400"
          />
        </>
      }
      filters={
        <StaffFilter
          searchQuery={filters.searchQuery}
          onSearchChange={filters.setSearchQuery}
          statusFilter={filters.statusFilter}
          onStatusChange={filters.setStatusFilter}
          roleFilter={filters.roleFilter}
          onRoleChange={filters.setRoleFilter}
          onReset={filters.reset}
        />
      }
      summary={
        !fetchAction.loading && (
          <p className="text-sm text-txt-sub">
            Showing <strong>{filters.filtered.length}</strong> of{" "}
            <strong>{staff.length}</strong> staff members
          </p>
        )
      }
      overlays={
        <>
          <AddStaffDialog
            open={page.formOpen}
            onClose={page.close}
            businessId={businessId}
            onSuccess={() => {
              fetchStaff();
              page.close();
            }}
          />

          {/* View Details Drawer */}
          <StaffDetailsDrawer
            open={page.viewOpen}
            onClose={page.close}
            membershipId={page.viewId}
            businessId={businessId}
          />

          {/* Remove Staff Confirm Dialog */}
          <ConfirmDialog
            open={Boolean(page.deleteTarget)}
            title="Remove Staff Member"
            description={
              page.deleteTarget ? (
                <>
                  Are you sure you want to remove{" "}
                  <strong>{page.deleteTarget.label}</strong> from your firm?
                  This member will immediately lose access to workspace tasks,
                  clients, and reminder schedules.
                </>
              ) : (
                ""
              )
            }
            confirmLabel="Remove Member"
            variant="danger"
            loading={deleteAction.loading}
            onConfirm={handleDeleteConfirm}
            onCancel={page.cancelDelete}
          />
        </>
      }
    >
      <StaffTable
        staff={filters.filtered}
        loading={fetchAction.loading}
        businessId={businessId}
        onView={page.openView}
        onDelete={(id, name) => page.requestDelete(id, name)}
        onRefresh={fetchStaff}
      />
    </ResourcePageLayout>
  );
}
