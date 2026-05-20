import { useEffect, useRef, useState } from 'react';
import { Bug, ListTodo, X } from 'lucide-react';
import DevTaskForm, { emptyTaskForm, taskToFormData } from './DevTaskForm';
import { saveTaskEdits } from './devTaskApi';

export default function EditTaskModal({ open, task, sprints, onClose, onSaved, onError }) {
  const [openMenu, setOpenMenu] = useState(null);
  const [formData, setFormData] = useState(emptyTaskForm);
  const [saving, setSaving] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open || !task) return;
    setFormData(taskToFormData(task));
    setOpenMenu(null);
  }, [open, task]);

  useEffect(() => {
    if (!open) return undefined;
    function handleKeyDown(event) {
      if (event.key !== 'Escape' || saving) return;
      if (openMenu) {
        setOpenMenu(null);
        return;
      }
      onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, saving, onClose, openMenu]);

  if (!open || !task) return null;

  const sprintOptions = [
    { value: '', label: 'No sprint' },
    ...sprints.map((s) => ({ value: String(s.id), label: s.name })),
  ];

  function handleSubmit(event) {
    event.preventDefault();
    if (!formData.title.trim()) return;
    setSaving(true);
    saveTaskEdits(task, formData)
      .then((updated) => {
        onSaved(updated);
        onClose();
      })
      .catch((err) => onError(err))
      .finally(() => setSaving(false));
  }

  return (
    <div
      className="dashboard-modal-overlay-enter fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-8"
      role="presentation"
      onMouseDown={(event) => {
        if (!saving && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-task-modal-title"
        className="dashboard-modal-panel-enter flex max-h-[min(92vh,56rem)] w-full max-w-3xl flex-col rounded-2xl border border-[#2A1814]/10 bg-white shadow-xl sm:max-w-[44rem]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#2A1814]/[0.08] px-8 py-6">
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                formData.isBug ? 'bg-[#c74634]/10 text-[#c74634]' : 'bg-[#2A1814]/[0.06] text-[#2A1814]'
              }`}
            >
              {formData.isBug ? <Bug className="h-5 w-5" aria-hidden /> : <ListTodo className="h-5 w-5" aria-hidden />}
            </span>
            <div>
              <h2 id="edit-task-modal-title" className="text-lg font-semibold text-[#2A1814]">
                Edit {formData.isBug ? 'bug' : 'task'}
              </h2>
              <p className="mt-1 text-sm text-[#6B6560]">Update details or move it to another sprint.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full p-2 text-[#6B6560] transition hover:bg-[#faf9f6] hover:text-[#2A1814] disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-8 py-6">
          <DevTaskForm
            formId="edit-task-form"
            formData={formData}
            setFormData={setFormData}
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
            sprintOptions={sprintOptions}
            onSubmit={handleSubmit}
            priorityDropdownId="edit-priority"
            sprintDropdownId="edit-sprint"
          />
        </div>
        <div className="flex shrink-0 justify-end border-t border-[#2A1814]/[0.08] px-8 py-6">
          <button
            type="submit"
            form="edit-task-form"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-[#2A1814] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#1d110e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
