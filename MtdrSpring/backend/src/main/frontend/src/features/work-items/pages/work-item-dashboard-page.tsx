import { Layers } from 'lucide-react';
import { mockTags } from '@/shared/mock/tags.mock';
import { DashboardSummaryCards } from '../components/dashboard/dashboard-summary-cards';
import { DashboardToolbar } from '../components/dashboard/dashboard-toolbar';
import { WorkItemListView } from '../components/dashboard/work-item-list-view';
import { KanbanView } from '../components/dashboard/kanban-view';
import { WorkItemFormModal } from '../components/dashboard/work-item-form-modal';
import { WorkItemDetailModal } from '../components/dashboard/work-item-detail-modal';
import { useWorkItemsViewModel } from "@/features/work-items/viewModels/useWorkItemsViewModel";
import type { IWorkItemsViewModel } from "@/features/work-items/viewModels/useWorkItemsViewModel";

export function WorkItemDashboardPage() {
  const viewModel: IWorkItemsViewModel = useWorkItemsViewModel();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6">

        {/* Page header */}
        <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100">Work Items</h1>
              <p className="text-sm text-zinc-500">Sprint 1 · Talos OCI DevOps Project</p>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="mb-6">
          <DashboardSummaryCards items={viewModel.items} />
        </div>

        {/* Toolbar */}
        <div className="mb-5">
          <DashboardToolbar
            search={viewModel.search}
            onSearchChange={viewModel.setSearch}
            statusFilter={viewModel.statusFilter}
            onStatusFilterChange={viewModel.setStatusFilter}
            assigneeFilter={viewModel.assigneeFilter}
            onAssigneeFilterChange={viewModel.setAssigneeFilter}
            viewMode={viewModel.viewMode}
            onViewModeChange={viewModel.setViewMode}
            onCreateClick={viewModel.actions.openNew}
            users={viewModel.users}
          />
        </div>

        {/* Results count */}
        <p className="mb-3 text-xs text-zinc-500">
          {viewModel.loading
            ? 'Loading…'
            : `${viewModel.items.length} of ${viewModel.totalItemCount()} task${viewModel.totalItemCount() !== 1 ? 's' : ''}`}
        </p>

        {/* View area */}
        {viewModel.loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-sky-400" />
          </div>
        ) : viewModel.viewMode === 'list' ? (
          <WorkItemListView
            items={viewModel.items}
            onEdit={viewModel.actions.handleEdit}
            onComplete={viewModel.actions.handleComplete}
            onViewDetail={viewModel.actions.openDetail}
          />
        ) : (
          <KanbanView
            items={viewModel.items}
            onEdit={viewModel.actions.handleEdit}
            onComplete={viewModel.actions.handleComplete}
            onViewDetail={viewModel.actions.openDetail}
          />
        )}
      </div>

      {/* Create / Edit modal */}
      <WorkItemFormModal
        isOpen={viewModel.formOpen}
        item={viewModel.editingItem}
        users={viewModel.users}
        tags={mockTags}
        onClose={viewModel.actions.closeAll}
        onCreate={viewModel.actions.handleCreate}
        onUpdate={viewModel.actions.handleUpdate}
      />

      {/* Detail preview modal */}
      <WorkItemDetailModal
        isOpen={viewModel.detailOpen}
        item={viewModel.detailItem}
        onClose={viewModel.actions.closeAll}
        onEdit={viewModel.actions.handleEditFromDetail}
        onComplete={viewModel.actions.handleCompleteFromDetail}
      />
    </div>
  );
}
