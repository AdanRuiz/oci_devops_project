import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bug, ChevronDown, Filter, Layers, ListTodo } from 'lucide-react';

export const emptyTaskForm = {
  title: '',
  description: '',
  expectedHours: '',
  priority: 'MEDIUM',
  isBug: false,
  sprintId: '',
};

export function taskToFormData(task) {
  return {
    title: task.title ?? '',
    description: task.description ?? '',
    expectedHours: task.expectedHours ?? '',
    priority: task.priority ?? 'MEDIUM',
    isBug: Boolean(task.isBug),
    sprintId: task.sprint?.id ? String(task.sprint.id) : '',
  };
}

function UnderlineDropdown({ id, label, value, options, onChange, icon, openMenu, setOpenMenu }) {
  const isOpen = openMenu === id;
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [menuPosition, setMenuPosition] = React.useState(null);
  const selected = options.find((o) => o.value === value) ?? options[0];
  const others = options.filter((o) => o.value !== value);

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const menuHeight = menuRef.current?.offsetHeight ?? (others.length + 1) * 44 + 52;
    const gap = 6;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const openUpward = spaceBelow < menuHeight && rect.top > menuHeight + gap;
    setMenuPosition({
      left: rect.left,
      width: rect.width,
      top: openUpward ? Math.max(gap, rect.top - menuHeight - gap) : rect.bottom + gap,
    });
  };

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      return undefined;
    }
    updateMenuPosition();
    const raf = requestAnimationFrame(updateMenuPosition);
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isOpen, others.length, value]);

  useEffect(() => {
    if (!isOpen) return undefined;
    function handlePointerDown(event) {
      const target = event.target;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpenMenu(null);
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setOpenMenu(null);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setOpenMenu]);

  const menu = isOpen
    ? createPortal(
        <div
          ref={menuRef}
          id={`${id}-listbox`}
          role="listbox"
          style={{
            position: 'fixed',
            left: menuPosition?.left ?? 0,
            top: menuPosition?.top ?? 0,
            width: menuPosition?.width ?? 200,
            zIndex: 120,
            visibility: menuPosition ? 'visible' : 'hidden',
          }}
          className="add-task-dropdown-enter max-h-[min(16rem,calc(100vh-1.5rem))] overflow-y-auto rounded-xl border border-[#2A1814]/12 bg-white shadow-[0_12px_48px_-12px_rgba(42,24,20,0.22)]"
        >
          <div className="bg-[#211612] px-4 py-3 text-sm font-medium text-white">{selected.label}</div>
          <div className="py-1">
            {others.map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                role="option"
                className="w-full px-4 py-3 text-left text-sm text-[#2A1814] transition hover:bg-[#faf9f6]"
                onClick={() => {
                  onChange(opt.value);
                  setOpenMenu(null);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="relative block min-w-0">
      <span className="mb-2 block text-sm text-[#2a1814]/60">{label}</span>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setOpenMenu(isOpen ? null : id)}
        className="flex w-full items-center gap-2 border-0 border-b border-[#2A1814]/25 bg-transparent py-2.5 text-left transition hover:border-[#2A1814] focus:outline-none"
      >
        {React.createElement(icon, { className: 'h-4 w-4 shrink-0 text-[#2A1814]/55', 'aria-hidden': true })}
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#2A1814]">{selected.label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#2A1814]/45 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {menu}
    </div>
  );
}

function TaskTypeToggle({ isBug, onChange }) {
  return (
    <div className="block min-w-0">
      <span className="mb-2 block text-sm text-[#2a1814]/60">Type</span>
      <div
        className={`task-type-toggle relative grid w-full grid-cols-2 rounded-full border border-[#2A1814]/15 bg-[#faf9f6] p-1.5 ${
          isBug ? 'task-type-toggle--bug' : ''
        }`}
        role="group"
        aria-label="Task type"
      >
        <span className="task-type-toggle__pill pointer-events-none absolute rounded-full bg-[#2A1814] shadow-sm" aria-hidden />
        <button
          type="button"
          aria-pressed={!isBug}
          onClick={() => onChange(false)}
          className={`relative z-10 inline-flex min-h-[2.5rem] items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
            !isBug ? 'text-white' : 'text-[#6B6560] hover:text-[#2A1814]'
          }`}
        >
          <ListTodo className="h-4 w-4 shrink-0" aria-hidden />
          Task
        </button>
        <button
          type="button"
          aria-pressed={isBug}
          onClick={() => onChange(true)}
          className={`relative z-10 inline-flex min-h-[2.5rem] items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
            isBug ? 'text-white' : 'text-[#6B6560] hover:text-[#2A1814]'
          }`}
        >
          <Bug className="h-4 w-4 shrink-0" aria-hidden />
          Bug
        </button>
      </div>
    </div>
  );
}

export default function DevTaskForm({
  formId,
  formData,
  setFormData,
  openMenu,
  setOpenMenu,
  sprintOptions,
  onSubmit,
  priorityDropdownId = 'priority',
  sprintDropdownId = 'sprint',
}) {
  const priorityOptions = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
  ];

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm text-[#2a1814]/60">Task title</span>
          <span className="flex items-center gap-2 border-0 border-b border-[#2a1814]/20 py-2.5 focus-within:border-[#2a1814]">
            <input
              name="title"
              type="text"
              required
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
              value={formData.description}
              onChange={handleChange}
              placeholder="Add details..."
              className="w-full border-0 bg-transparent text-sm text-[#2a1814] placeholder:text-[#2a1814]/35 focus:outline-none focus:ring-0"
            />
          </span>
        </label>
      </div>
      <div className="grid min-w-0 gap-5 sm:grid-cols-2">
        <label className="block min-w-0">
          <span className="mb-2 block text-sm text-[#2a1814]/60">Expected hours</span>
          <span className="flex items-center gap-2 border-0 border-b border-[#2a1814]/20 py-2.5 focus-within:border-[#2a1814]">
            <input
              name="expectedHours"
              type="number"
              min="1"
              step="1"
              value={formData.expectedHours}
              onChange={handleChange}
              placeholder="2"
              className="w-full border-0 bg-transparent text-sm text-[#2a1814] focus:outline-none focus:ring-0"
            />
          </span>
        </label>
        <UnderlineDropdown
          id={priorityDropdownId}
          label="Priority"
          value={formData.priority}
          options={priorityOptions}
          icon={Filter}
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          onChange={(next) => setFormData((prev) => ({ ...prev, priority: next }))}
        />
        <UnderlineDropdown
          id={sprintDropdownId}
          label="Sprint"
          value={formData.sprintId === '' ? '' : String(formData.sprintId)}
          options={sprintOptions}
          icon={Layers}
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          onChange={(next) => setFormData((prev) => ({ ...prev, sprintId: next === '' ? '' : String(next) }))}
        />
        <TaskTypeToggle isBug={formData.isBug} onChange={(next) => setFormData((prev) => ({ ...prev, isBug: next }))} />
      </div>
    </form>
  );
}
