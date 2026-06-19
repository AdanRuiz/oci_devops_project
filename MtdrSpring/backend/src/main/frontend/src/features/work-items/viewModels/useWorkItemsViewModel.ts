import { useState, useCallback, useEffect, useMemo } from 'react';
import { workItemService } from '../services/work-item.service';
import type { ViewMode } from "@/features/work-items/components/dashboard/dashboard-toolbar";
import type { WorkItemDetailDto } from '../dtos/work-item-detail.dto';
import type { CreateWorkItemDto } from '../dtos/create-work-item.dto';
import type { UpdateWorkItemDto } from '../dtos/update-work-item.dto';
import type { WorkItemStatus } from '../enums/work-item-status.enum';

export const useWorkItemsViewModel = () => {
  // 1. Data State
  const [items, setItems] = useState<WorkItemDetailDto[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. UI State (Grouped logically)
  const [filters, setFilters] = useState({
    search: '',
    status: '' as WorkItemStatus | '',
    assignee: '',
  });
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // 3. Modal/Overlay State
  const [modals, setModals] = useState({
    formOpen: false,
    detailOpen: false,
    editingItem: null as WorkItemDetailDto | null,
    detailItem: null as WorkItemDetailDto | null,
  });

  // --- Actions ---

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const result = await workItemService.getWorkItems({ page: 1, pageSize: 100 });
      if (result.success) {
        const ids = result.data.items.map((i) => i.id);
        const details = await Promise.all(ids.map((id) => workItemService.getWorkItemById(id)));
        const fullItems = details
          .filter((r) => r.success && r.data !== null)
          .map((r) => r.data as WorkItemDetailDto);
        setItems(fullItems);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadItems().then(); }, [loadItems]);

  // Derived State (SwiftUI "Computed Properties")
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = !filters.search ||
        item.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        (item.description ?? '').toLowerCase().includes(filters.search.toLowerCase());
      const matchesStatus = !filters.status || item.status === filters.status;
      const matchesAssignee = !filters.assignee ||
        item.assignees.some((a) => a.user.id === filters.assignee);

      return matchesSearch && matchesStatus && matchesAssignee;
    });
  }, [items, filters]);

  // --- Handlers ---
  const handleCreate = async (dto: CreateWorkItemDto) => {
    const result = await workItemService.createWorkItem(dto);
    if (result.success) setItems((prev) => [result.data, ...prev]);
  };

  const handleUpdate = async (id: string, dto: UpdateWorkItemDto) => {
    const result = await workItemService.updateWorkItem(id, dto);
    if (result.success && result.data) {
      const updated = result.data;
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      if (modals.detailItem?.id === id) {
        setModals(m => ({ ...m, detailItem: updated }));
      }
    }
  };

  const handleEdit = useCallback((item: WorkItemDetailDto) => {
    setModals({
      formOpen: true,
      detailOpen: false,
      editingItem: item,
      detailItem: null,
    });
  }, []);

  const handleComplete = async (item: WorkItemDetailDto) => {
    await handleUpdate(item.id, {
      status: 'DONE',
      completedAt: new Date().toISOString()
    });
  };

  // UI Navigation / Modal Handlers
  const openNew = () =>
    setModals({ ...modals, editingItem: null,  formOpen: true});
  
  const openEdit = (item: WorkItemDetailDto) =>
    setModals({ ...modals, editingItem: item, formOpen: true, detailOpen: false });

  const openDetail = (item: WorkItemDetailDto) =>
    setModals({ ...modals, detailItem: item, detailOpen: true });

  const closeAll = () =>
    setModals({ ...modals, formOpen: false, detailOpen: false, editingItem: null, detailItem: null });

  const handleEditFromDetail = useCallback((item: WorkItemDetailDto) => {
    closeAll();
    handleEdit(item);
  }, [handleEdit, closeAll]);

  const handleCompleteFromDetail = useCallback(async (item: WorkItemDetailDto) => {
    await handleComplete(item);
    closeAll();
  }, [handleComplete, closeAll]);
  
  // --- Final API ---
  return {
    // Data
    items: filteredItems,
    totalItemCount: () => { return items.length },
    loading,
    viewMode,
    setViewMode,

    // UI State
    search: filters.search,
    statusFilter: filters.status,
    assigneeFilter: filters.assignee,
    setSearch: (search: string) => setFilters(f => ({ ...f, search })),
    setStatusFilter: (status: WorkItemStatus | '') => setFilters(f => ({ ...f, status })),
    setAssigneeFilter: (assignee: string) => setFilters(f => ({ ...f, assignee })),

    // Modal state
    ...modals,
    editingItem: modals.editingItem,

    // Actions
    actions: {
      loadItems,
      openNew,
      handleCreate,
      handleUpdate,
      handleComplete,
      handleEdit,
      handleEditFromDetail,
      handleCompleteFromDetail,
      openEdit,
      openDetail,
      closeAll
    }
  };
};

export type IWorkItemsViewModel = ReturnType<typeof useWorkItemsViewModel>;