"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Plus, X } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import ClientsTable from "@/components/clients/ClientsTable";
import ClientsFilter from "@/components/clients/ClientsFilter";
import { getSubjects, deleteSubject, updateSubject } from "@/services/subjectService";
import { SubjectListItem, Subject, type ComplianceFilter } from "@/types/subject";
import ClientDetailsDrawer from "@/components/clients/ClientDetailsDrawer";
import CreateClientDialog from "@/components/clients/CreateClientDialog";
import ConfirmDialog from "@/components/tasks/ConfirmDialog";
import { useAsyncAction } from "@/hooks/useAnyAction";

interface ClientsPageClientProps {
  initialClients: SubjectListItem[];
  businessId: string;
}

export default function ClientsPageClient({
  initialClients,
  businessId: serverBusinessId,
}: ClientsPageClientProps) {
  const { businessId: clientBusinessId } = useWorkspace();
  const businessId = clientBusinessId || serverBusinessId;

  // Data state
  const [clients, setClients] = useState<SubjectListItem[]>(initialClients);
  const fetchAction = useAsyncAction();
  const deleteAction = useAsyncAction();
  const updateAction = useAsyncAction();

  const { run: runFetch } = fetchAction;
  const { run: runDelete } = deleteAction;
  const { run: runUpdate } = updateAction;

  // Dialog / drawer state
  const [formOpen, setFormOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [gstinFilter, setGstinFilter] = useState<"ALL" | "WITH_GST" | "WITHOUT_GST">("ALL");
  const [complianceFilter, setComplianceFilter] = useState<ComplianceFilter>("ALL");

  // Delete target state
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const fetchClients = useCallback(async () => {
    if (!businessId) return;

    await runFetch(() => getSubjects(businessId), {
      errorMessage: "Failed to load clients",
      showErrorToast: false,
      onSuccess: (data) => {
        setClients(data.filter((subject) => subject.subjectType === "CLIENT"));
      },
    });
  }, [businessId, runFetch]);

  // Synchronize if user changes active workspace on client
  const lastBizIdRef = useRef<string>(serverBusinessId);
  useEffect(() => {
    if (clientBusinessId && clientBusinessId !== lastBizIdRef.current) {
      lastBizIdRef.current = clientBusinessId;
      fetchClients();
    }
  }, [clientBusinessId, fetchClients]);

  const filteredClients = useMemo(() => {
    let result = [...clients];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (client) =>
          client.displayName?.toLowerCase().includes(q) ||
          client.businessName?.toLowerCase().includes(q) ||
          client.email?.toLowerCase().includes(q) ||
          client.phone?.includes(q)
      );
    }

    if (statusFilter === "ACTIVE") {
      result = result.filter((client) => client.isActive);
    }
    if (statusFilter === "INACTIVE") {
      result = result.filter((client) => !client.isActive);
    }

    if (gstinFilter === "WITH_GST") {
      result = result.filter((client) => !!client.gstin);
    }
    if (gstinFilter === "WITHOUT_GST") {
      result = result.filter((client) => !client.gstin);
    }

    if (complianceFilter !== "ALL") {
      result = result.filter((client) =>
        client.activeCompliances?.includes(complianceFilter.toLowerCase())
      );
    }

    return result;
  }, [clients, searchQuery, statusFilter, gstinFilter, complianceFilter]);

  // Handlers
  const handleView = (clientId: string) => {
    setFormOpen(false);
    setEditingClientId(null);
    setSelectedClientId(clientId);
    setDrawerOpen(true);
  };

  const handleCreate = () => {
    setSelectedClientId(null);
    setDrawerOpen(false);
    setEditingClientId(null);
    setFormOpen(true);
  };

  const handleEdit = (clientId: string) => {
    setSelectedClientId(null);
    setDrawerOpen(false);
    setEditingClientId(clientId);
    setFormOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedClientId(null);
  };

  const handleDeleteRequest = (clientId: string, clientName: string) => {
    setDeleteTarget({ id: clientId, name: clientName });
  };

  const handleDeleteConfirm = async () => {
    if (!businessId || !deleteTarget) return;

    const targetId = deleteTarget.id;
    const targetName = deleteTarget.name;

    await runDelete(() => deleteSubject(businessId, targetId), {
      successMessage: `Client "${targetName}" deleted successfully`,
      errorMessage: "Failed to delete client",
      showSuccessToast: true,
      showErrorToast: true,
      onSuccess: () => {
        setDeleteTarget(null);
        setClients((prev) => prev.filter((client) => client.id !== targetId));
      },
    });
  };

  const handleUpdateCell = useCallback(
    async ({
      row,
      field,
      newValue,
    }: {
      row: SubjectListItem;
      field: string;
      newValue: unknown;
    }) => {
      if (!businessId) return;

      const valToSave = field === "isActive" ? newValue === "Active" : newValue;
      const boolVal = field === "isActive" ? newValue === "Active" : Boolean(newValue);

      await runUpdate(
        () => updateSubject(businessId, row.id, { [field]: valToSave }),
        {
          successMessage: "Client updated successfully",
          errorMessage: "Failed to update client",
          showSuccessToast: true,
          showErrorToast: true,
          onSuccess: () => {
            setClients((prev) =>
              prev.map((c) =>
                c.id === row.id
                  ? { ...c, [field]: field === "isActive" ? boolVal : newValue }
                  : c
              )
            );
          },
        }
      );
    },
    [businessId, runUpdate]
  );

  const handleClientSaved = (saved?: Subject) => {
    setFormOpen(false);
    setEditingClientId(null);
    if (!saved) {
      fetchClients();
      return;
    }

    const activeCompliances: string[] = [];
    const cp = saved.metadata?.complianceProfile;
    if (cp?.gst?.enabled) activeCompliances.push("GST");
    if (cp?.tds?.enabled) activeCompliances.push("TDS");
    if (cp?.itr?.enabled) activeCompliances.push("ITR");
    if (cp?.roc?.enabled) activeCompliances.push("ROC");
    if (cp?.msme?.enabled) activeCompliances.push("MSME");

    const displayName = saved.profile?.displayName || saved.primaryContact?.name || "Client";
    const businessName = saved.profile?.businessName || saved.profile?.legalName || "";

    const listItem: SubjectListItem = {
      id: saved.id,
      subjectType: saved.subjectType || "CLIENT",
      displayName,
      businessName,
      phone: saved.primaryContact?.phone || "",
      email: saved.primaryContact?.email || "",
      gstin: saved.gst?.gstins?.[0]?.gstin || null,
      assignedTeam: saved.assignedTeam
        ? {
            primaryAssignee: {
              userId: saved.assignedTeam.primaryAssignee?.userId || "",
              name: saved.assignedTeam.primaryAssignee?.name || "",
            },
          }
        : null,
      isActive: saved.isActive,
      activeCompliances,
    };

    setClients((prev) => {
      const exists = prev.some((c) => c.id === listItem.id);
      if (exists) {
        return prev.map((c) => (c.id === listItem.id ? { ...c, ...listItem } : c));
      }
      return [listItem, ...prev];
    });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setGstinFilter("ALL");
    setComplianceFilter("ALL");
  };

  const pageError = fetchAction.error || deleteAction.error;

  return (
    <div className="min-h-screen bg-bg py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-txt-main">Clients</h1>
            <p className="mt-1 text-sm text-txt-sub">
              Manage your client information and compliance details
            </p>
          </div>

          <button
            type="button"
            className="btn gap-2 border-none bg-navy text-white hover:bg-navy-hover"
            onClick={handleCreate}
          >
            <Plus className="h-4 w-4" />
            Add Client
          </button>
        </div>

        {/* Error Alert */}
        {pageError && (
          <div role="alert" className="alert alert-error flex items-center justify-between text-sm">
            <span>{pageError}</span>
            <button
              type="button"
              className="btn btn-ghost btn-xs btn-circle"
              aria-label="Dismiss error"
              onClick={() => {
                fetchAction.clearError();
                deleteAction.clearError();
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Filters */}
        <ClientsFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          gstinFilter={gstinFilter}
          onGstinChange={setGstinFilter}
          complianceFilter={complianceFilter}
          onComplianceChange={setComplianceFilter}
          onReset={handleResetFilters}
        />

        {/* Results count */}
        {!fetchAction.loading && (
          <p className="text-sm text-txt-sub">
            Showing {filteredClients.length} of {clients.length} clients
          </p>
        )}

        {/* Table using CommonDataGrid */}
        <ClientsTable
          clients={filteredClients}
          loading={fetchAction.loading}
          businessId={businessId}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
          onUpdateCell={handleUpdateCell}
          onRefresh={fetchClients}
        />

        {/* View Details Drawer */}
        <ClientDetailsDrawer
          open={drawerOpen}
          onClose={handleDrawerClose}
          clientId={selectedClientId}
          businessId={businessId}
          onEdit={handleEdit}
        />

        {/* Client Form Drawer (Create & Edit) */}
        <CreateClientDialog
          open={formOpen}
          clientId={editingClientId}
          businessId={businessId}
          onClose={() => {
            setFormOpen(false);
            setEditingClientId(null);
          }}
          onSuccess={handleClientSaved}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete Client"
          description={
            <>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </>
          }
          confirmLabel="Delete"
          variant="danger"
          loading={deleteAction.loading}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </div>
  );
}
