import React, { useEffect, useRef, useState } from 'react';
import { Bug, ChevronDown, Filter, Layers, Plus } from 'lucide-react';

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
          className="dashboard-modal-panel-enter absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-[#2A1814]/12 bg-white shadow-[0_10px_40px_-10px_rgba(42,24,20,0.18)]"
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

function NewItem(props) {
  const [openMenu, setOpenMenu] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    expectedHours: '',
    priority: 'MEDIUM',
    isBug: false,
    sprintId: '',
  });

  const priorityOptions = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
  ];

  const sprintOptions = [
    { value: '', label: 'No sprint' },
    ...props.sprints.map((s) => ({ value: String(s.id), label: s.name })),
  ];

  function handleSubmit(event) {
    event.preventDefault();
    if (!formData.title.trim()) return;
    props.addItem({
      title: formData.title.trim(),
      description: formData.description.trim(),
      expectedHours: Number(formData.expectedHours),
      priority: formData.priority,
      isBug: formData.isBug,
      sprintId: formData.sprintId ? Number(formData.sprintId) : null,
    });
    setFormData({
      title: '',
      description: '',
      expectedHours: '',
      priority: 'MEDIUM',
      isBug: false,
      sprintId: '',
    });
    setOpenMenu(null);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="dashboard-section-enter border-b border-[#2A1814]/[0.08] pb-6"
    >
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
              placeholder="Update API users"
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

      <div className="mt-4 grid gap-4 md:grid-cols-4">
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

        <div className="flex items-end">
          <label className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#2A1814]/15 bg-white px-3 py-2.5 text-sm text-[#2A1814] transition hover:bg-[#f5f2ec]">
            <input
              type="checkbox"
              name="isBug"
              checked={formData.isBug}
              onChange={(e) => setFormData((prev) => ({ ...prev, isBug: e.target.checked }))}
              className="sr-only"
            />
            <Bug className={`h-4 w-4 ${formData.isBug ? 'text-[#c74634]' : 'text-[#6B6560]'}`} />
            <span>{formData.isBug ? 'Bug task' : 'Normal task'}</span>
          </label>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={props.isInserting}
          className="inline-flex items-center gap-2 rounded-full bg-[#2A1814] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#1d110e] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          {props.isInserting ? 'Adding...' : 'Add task'}
        </button>
      </div>
    </form>
  );
}

export default NewItem;
