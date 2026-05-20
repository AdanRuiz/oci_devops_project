import React, { useEffect, useRef, useState } from 'react';
import { Bug, ChevronDown, Filter, Layers, ListTodo, Plus, X } from 'lucide-react';

const emptyForm = {
  title: '',
  description: '',
  expectedHours: '',
  priority: 'MEDIUM',
  isBug: false,
  sprintId: '',
};

function UnderlineDropdown({ id, label, value, options, onChange, icon, openMenu, setOpenMenu }) {
  const isOpen = openMenu === id;
  const rootRef = useRef(null);
  const selected = options.find((o) => o.value === value) ?? options[0];
  const others = options.filter((o) => o.value !== value);

  useEffect(() => {
    if (!isOpen) return undefined;
    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpenMenu(null);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setOpenMenu]);

  return (
    <div ref={rootRef} className="relative block">
      <span className="mb-2 block text-sm text-[#2a1814]/60">{label}</span>
      <button
        type="button"
        id={`${id}-trigger`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${id}-listbox`}
        onClick={() => setOpenMenu(isOpen ? null : id)}
        className="flex w-full items-center gap-2 border-0 border-b border-[#2A1814]/25 bg-transparent py-2.5 text-left transition hover:border-[#2A1814] focus:border-[#2A1814] focus:outline-none"
      >
        {React.createElement(icon, {
          className: 'h-4 w-4 shrink-0 text-[#2A1814]/55',
          'aria-hidden': true,
        })}
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#2A1814]">{selected.label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#2A1814]/45 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {isOpen && (
        <div
          id={`${id}-listbox`}
          role="listbox"
          className="dashboard-modal-panel-enter absolute left-0 right-0 top-full z-[70] mt-1 overflow-hidden rounded-xl border border-[#2A1814]/12 bg-white shadow-[0_10px_40px_-10px_rgba(42,24,20,0.18)]"
        >
          <div
            className="bg-[#211612] px-4 py-3 text-sm font-medium text-white"
            role="presentation"
            aria-current="true"
          >
            {selected.label}
          </div>
          <div className="py-0.5">
            {others.map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                role="option"
                aria-selected={false}
                className="w-full px-4 py-3 text-left text-sm text-[#2A1814] transition hover:bg-[#faf9f6] active:bg-[#f0ebe3]"
                onClick={() => {
                  onChange(opt.value);
                  setOpenMenu(null);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskTypeToggle({ isBug, onChange }) {
  return (
    <div className="block">
      <span className="mb-2 block text-sm text-[#2a1814]/60">Type</span>
      <div
        className="inline-flex w-full rounded-full border border-[#2A1814]/15 bg-[#faf9f6] p-1 sm:w-auto"
        role="group"
        aria-label="Task type"
      >
        <button
          type="button"
          aria-pressed={!isBug}
          onClick={() => onChange(false)}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition sm:flex-initial ${
            !isBug
              ? 'bg-[#2A1814] text-white shadow-sm'
              : 'text-[#6B6560] hover:text-[#2A1814]'
          }`}
        >
          <ListTodo className="h-4 w-4 shrink-0" aria-hidden />
          Task
        </button>
        <button
          type="button"
          aria-pressed={isBug}
          onClick={() => onChange(true)}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition sm:flex-initial ${
            isBug
              ? 'bg-[#2A1814] text-white shadow-sm'
              : 'text-[#6B6560] hover:text-[#2A1814]'
          }`}
        >
          <Bug className="h-4 w-4 shrink-0" aria-hidden />
          Bug
        </button>
      </div>
    </div>
  );
}

function AddTaskForm({ formData, setFormData, openMenu, setOpenMenu, sprintOptions, onSubmit, isInserting }) {
  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  const priorityOptions = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm text-[#2a1814]/60">Task title</span>
          <span className="flex items-center gap-2 border-0 border-b border-[#2a1814]/20 py-2.5 focus-within:border-[#2a1814]">
            <input
              name="title"
              type="text"
              autoComplete="off"
              value={formData.title}
              onChange={handleChange}
              placeholder={formData.isBug ? 'Fix login redirect' : 'Update API users'}
              className="w-full border-0 bg-transparent text-sm text-[#2a1814] placeholder:text-[#2a1814]/35 focus:outline-none focus:ring-0"
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-[#2a1814]/60">Description</span>
          <span className="flex items-center gap-2 border-0 border-b border-[#2a1814]/20 py-2.5 focus-within:border-[#2a1814]">
            <input
              name="description"
              type="text"
              autoComplete="off"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add details..."
              className="w-full border-0 bg-transparent text-sm text-[#2a1814] placeholder:text-[#2a1814]/35 focus:outline-none focus:ring-0"
            />
          </span>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="mb-2 block text-sm text-[#2a1814]/60">Expected hours</span>
          <span className="flex items-center gap-2 border-0 border-b border-[#2a1814]/20 py-2.5 focus-within:border-[#2a1814]">
            <input
              name="expectedHours"
              type="number"
              min="1"
              step="1"
              autoComplete="off"
              value={formData.expectedHours}
              onChange={handleChange}
              placeholder="2"
              className="w-full border-0 bg-transparent text-sm text-[#2a1814] placeholder:text-[#2a1814]/35 focus:outline-none focus:ring-0"
            />
          </span>
        </label>

        <UnderlineDropdown
          id="priority"
          label="Priority"
          value={formData.priority}
          options={priorityOptions}
          icon={Filter}
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          onChange={(next) => setFormData((prev) => ({ ...prev, priority: next }))}
        />

        <UnderlineDropdown
          id="sprint"
          label="Sprint"
          value={formData.sprintId === '' ? '' : String(formData.sprintId)}
          options={sprintOptions}
          icon={Layers}
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          onChange={(next) =>
            setFormData((prev) => ({ ...prev, sprintId: next === '' ? '' : String(next) }))
          }
        />

        <TaskTypeToggle
          isBug={formData.isBug}
          onChange={(next) => setFormData((prev) => ({ ...prev, isBug: next }))}
        />
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-[#2A1814]/[0.08] pt-5">
        <button
          type="submit"
          disabled={isInserting}
          className="inline-flex items-center gap-2 rounded-full bg-[#2A1814] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#1d110e] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          {isInserting ? 'Adding...' : formData.isBug ? 'Add bug' : 'Add task'}
        </button>
      </div>
    </form>
  );
}

function AddTaskModal({ open, onClose, addItem, isInserting, sprints }) {
  const [openMenu, setOpenMenu] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setFormData(emptyForm);
      setOpenMenu(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !isInserting) onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, isInserting, onClose]);

  if (!open) return null;

  const sprintOptions = [
    { value: '', label: 'No sprint' },
    ...sprints.map((s) => ({ value: String(s.id), label: s.name })),
  ];

  function handleSubmit(event) {
    event.preventDefault();
    if (!formData.title.trim()) return;
    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      expectedHours: Number(formData.expectedHours),
      priority: formData.priority,
      isBug: formData.isBug,
      sprintId: formData.sprintId ? Number(formData.sprintId) : null,
    };

    Promise.resolve(addItem(payload))
      .then(() => onClose())
      .catch(() => {});
  }

  return (
    <div
      className="dashboard-modal-overlay-enter fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-8"
      role="presentation"
      onMouseDown={(event) => {
        if (!isInserting && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-task-modal-title"
        className="dashboard-modal-panel-enter flex max-h-[min(90vh,52rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#2A1814]/10 bg-white shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#2A1814]/[0.08] px-6 py-5">
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                formData.isBug ? 'bg-[#c74634]/10 text-[#c74634]' : 'bg-[#2A1814]/[0.06] text-[#2A1814]'
              }`}
            >
              {formData.isBug ? (
                <Bug className="h-5 w-5" aria-hidden />
              ) : (
                <ListTodo className="h-5 w-5" aria-hidden />
              )}
            </span>
            <div>
              <h2 id="add-task-modal-title" className="text-lg font-semibold text-[#2A1814]">
                {formData.isBug ? 'New bug' : 'New task'}
              </h2>
              <p className="mt-1 text-sm text-[#6B6560]">
                Add work to your backlog and optionally assign it to a sprint.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isInserting}
            className="rounded-full p-2 text-[#6B6560] transition hover:bg-[#faf9f6] hover:text-[#2A1814] disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <AddTaskForm
            formData={formData}
            setFormData={setFormData}
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
            sprintOptions={sprintOptions}
            onSubmit={handleSubmit}
            isInserting={isInserting}
          />
        </div>
      </div>
    </div>
  );
}

function NewItem({ addItem, isInserting, sprints }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="dashboard-section-enter flex flex-wrap items-center justify-between gap-4 border-b border-[#2A1814]/[0.08] pb-6">
        <p className="text-sm text-[#6B6560]">Add tasks or bugs to your sprint backlog.</p>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[#2A1814] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#1d110e]"
        >
          <Plus className="h-4 w-4" />
          Add task
        </button>
      </div>

      <AddTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        addItem={addItem}
        isInserting={isInserting}
        sprints={sprints}
      />
    </>
  );
}

export default NewItem;
