import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import DeleteIcon from '@mui/icons-material/Delete';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import BarChartIcon from '@mui/icons-material/BarChart';
import PersonIcon from '@mui/icons-material/Person';
import BoltIcon from '@mui/icons-material/Bolt';
import { CircularProgress } from '@mui/material';
import Moment from 'react-moment';

const STATUS_COLORS = {
  'NEW':         '#6B7280',
  'TODO':        '#6B7280',
  'IN_PROGRESS': '#F59E0B',
  'BLOCKED':     '#EF4444',
  'DONE':        '#22C55E',
  'COMPLETED':   '#22C55E',
  'CANCELED':    '#9CA3AF',
  'CLOSED':      '#14B8A6',
};

const PRIORITY_COLORS = {
  'LOW':    '#14B8A6',
  'MEDIUM': '#F59E0B',
  'HIGH':   '#EF4444',
};

const CARD_COLORS = ['#7C3AED', '#F59E0B', '#14B8A6', '#EC4899', '#3B82F6', '#EF4444'];

function App() {
  const [activeTab, setActiveTab]   = useState('tasks');
  const [isLoading, setLoading]     = useState(false);
  const [isCreating, setCreating]   = useState(false);
  const [items, setItems]           = useState([]);
  const [users, setUsers]           = useState([]);
  const [sprints, setSprints]       = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [hoursModal, setHoursModal] = useState(null); // { workItemId, assigneeId }
  const [hoursInput, setHoursInput] = useState('');

  const [form, setForm] = useState({
    title: '', description: '', priority: 'MEDIUM',
    workType: 'TASK', sprintId: '', assigneeUserId: '', dueDateStr: '',
  });

  // ── Cargar tasks, users y sprints ────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/workitems').then(r => r.json()),
      fetch('/appusers').then(r => r.json()),
      fetch('/sprints').then(r => r.json()),
    ]).then(([workItems, appUsers, sprintList]) => {
      setItems(workItems);
      setUsers(appUsers);
      setSprints(sprintList);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // ── Crear task ───────────────────────────────────────────────────────────────
  function createItem(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setCreating(true);
    fetch('/workitems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
      .then(r => r.json())
      .then(() => {
        setForm({ title: '', description: '', priority: 'MEDIUM',
                  workType: 'TASK', sprintId: '', assigneeUserId: '', dueDateStr: '' });
        setShowForm(false);
        return fetch('/workitems').then(r => r.json());
      })
      .then(updated => { setItems(updated); setCreating(false); })
      .catch(() => setCreating(false));
  }

  // ── Cambiar status ───────────────────────────────────────────────────────────
  function updateStatus(id, newStatus) {
    fetch(`/workitems/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    }).then(() =>
      fetch('/workitems').then(r => r.json()).then(setItems)
    );
  }

  // ── Marcar DONE con horas ────────────────────────────────────────────────────
  function confirmDone() {
    const { workItemId, assigneeId } = hoursModal;
    const minutes = Math.round(parseFloat(hoursInput || '0') * 60);

    const markDone = fetch(`/workitems/${workItemId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DONE' }),
    });

    const logTime = minutes > 0 && assigneeId
      ? fetch('/time-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workItemId, userId: assigneeId, minutes }),
        })
      : Promise.resolve();

    Promise.all([markDone, logTime])
      .then(() => fetch('/workitems').then(r => r.json()).then(setItems))
      .finally(() => { setHoursModal(null); setHoursInput(''); });
  }

  // ── Eliminar task ────────────────────────────────────────────────────────────
  function deleteItem(id) {
    fetch(`/workitems/${id}`, { method: 'DELETE' })
      .then(() => fetch('/workitems').then(r => r.json()).then(setItems));
  }

  const todoItems = items.filter(i => ['NEW','TODO','IN_PROGRESS','BLOCKED'].includes(i.STATUS));
  const doneItems = items.filter(i => ['DONE','COMPLETED','CLOSED','CANCELED'].includes(i.STATUS));
  const donePercent = items.length > 0 ? Math.round((doneItems.length / items.length) * 100) : 0;

  return (
    <>
    <div className="app-wrapper">
      <div className="layout">

        {/* Left panel */}
        <div className="left-panel">
          <header className="app-header">
            <div className="header-logo"><TaskAltIcon /></div>
            <h1>My Tasks</h1>
            <p className="subtitle">Stay organized, stay focused</p>
            <div className="stats-row">
              <div className="stat-chip">
                <span className="dot dot-pending" />
                {todoItems.length} pending
              </div>
              <div className="stat-chip">
                <span className="dot dot-done" />
                {doneItems.length} completed
              </div>
            </div>
          </header>

          {items.length > 0 && (
            <div className="progress-wrap">
              <div className="progress-label">
                <span>{doneItems.length} of {items.length} tasks completed</span>
                <span className="pct">{donePercent}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${donePercent}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="right-panel">
          <div className="tabs">
            <button className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => setActiveTab('tasks')}>
              <FormatListBulletedIcon style={{ fontSize: 16 }} /> Tasks
            </button>
            <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}>
              <BarChartIcon style={{ fontSize: 16 }} /> Analytics
            </button>
          </div>

          {activeTab === 'analytics' ? <Dashboard /> : (
            <div className="app-body">

              {/* ── Botón + Formulario crear task ── */}
              <div style={{ marginBottom: 16 }}>
                <button
                  onClick={() => setShowForm(f => !f)}
                  style={{
                    background: '#7C3AED', color: '#fff', border: 'none',
                    borderRadius: 8, padding: '8px 18px', fontFamily: 'Poppins',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {showForm ? '✕ Cancel' : '+ New Task'}
                </button>

                {showForm && (
                  <form onSubmit={createItem} style={{
                    marginTop: 12, background: '#F9FAFB', borderRadius: 12,
                    padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
                    border: '1px solid #EDE9FE',
                  }}>
                    <input
                      placeholder="Task title *"
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      required
                      style={inputStyle}
                    />
                    <textarea
                      placeholder="Description (optional)"
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      rows={2}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <select value={form.priority}
                        onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                        style={selectStyle}>
                        <option value="LOW">Low priority</option>
                        <option value="MEDIUM">Medium priority</option>
                        <option value="HIGH">High priority</option>
                      </select>
                      <select value={form.workType}
                        onChange={e => setForm(f => ({ ...f, workType: e.target.value }))}
                        style={selectStyle}>
                        <option value="TASK">Task</option>
                        <option value="BUG">Bug</option>
                        <option value="FEATURE">Feature</option>
                        <option value="ISSUE">Issue</option>
                        <option value="TRAINING">Training</option>
                      </select>
                      <select value={form.sprintId}
                        onChange={e => setForm(f => ({ ...f, sprintId: e.target.value }))}
                        style={selectStyle}>
                        <option value="">No sprint</option>
                        {sprints.map(s => (
                          <option key={s.sprintId} value={s.sprintId}>{s.name}</option>
                        ))}
                      </select>
                      <select value={form.assigneeUserId}
                        onChange={e => setForm(f => ({ ...f, assigneeUserId: e.target.value }))}
                        style={selectStyle}>
                        <option value="">Unassigned</option>
                        {users.map(u => (
                          <option key={u.userId} value={u.userId}>{u.name}</option>
                        ))}
                      </select>
                      <input type="date" value={form.dueDateStr}
                        onChange={e => setForm(f => ({ ...f, dueDateStr: e.target.value }))}
                        style={selectStyle}
                      />
                    </div>
                    <button type="submit" disabled={isCreating} style={{
                      background: '#7C3AED', color: '#fff', border: 'none',
                      borderRadius: 8, padding: '8px 18px', fontFamily: 'Poppins',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start',
                    }}>
                      {isCreating ? 'Creating...' : 'Create Task'}
                    </button>
                  </form>
                )}
              </div>

              {isLoading ? (
                <div className="loading-wrap">
                  <CircularProgress size={28} style={{ color: '#7C3AED' }} />
                </div>
              ) : (
                <>
                  {/* ── Pending / In Progress ── */}
                  <section className="tasks-section">
                    <div className="section-header">
                      <h2>To Do</h2>
                      <span className="count-badge">{todoItems.length}</span>
                    </div>
                    {todoItems.length === 0 ? (
                      <div className="empty-state">All caught up — nothing left to do!</div>
                    ) : (
                      todoItems.map((item, i) => (
                        <div key={item.WORK_ITEM_ID} className="task-card"
                          style={{ '--card-accent': CARD_COLORS[i % CARD_COLORS.length] }}>
                          <button className="task-checkbox"
                            onClick={() => setHoursModal({ workItemId: item.WORK_ITEM_ID, assigneeId: item.ASSIGNEE_ID })}
                            title="Mark as done" />
                          <div className="task-body">
                            <span className="task-description">{item.TITLE}</span>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                              {item.ASSIGNEE_NAME && (
                                <span style={tagStyle('#7C3AED', '#EDE9FE')}>
                                  <PersonIcon style={{ fontSize: 11, verticalAlign: 'middle', marginRight: 2 }} />{item.ASSIGNEE_NAME}
                                </span>
                              )}
                              {item.SPRINT_NAME && (
                                <span style={tagStyle('#1D4ED8', '#EFF6FF')}>
                                  <BoltIcon style={{ fontSize: 11, verticalAlign: 'middle', marginRight: 2 }} />{item.SPRINT_NAME}
                                </span>
                              )}
                              <span style={tagStyle(PRIORITY_COLORS[item.PRIORITY] || '#6B7280', '#F3F4F6')}>
                                {item.PRIORITY}
                              </span>
                              <span style={tagStyle(STATUS_COLORS[item.STATUS] || '#6B7280', '#F3F4F6')}>
                                {item.STATUS}
                              </span>
                            </div>
                            {item.CREATED_AT && (
                              <span className="task-date">
                                <Moment format="MMM D, h:mm a">{item.CREATED_AT}</Moment>
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </section>

                  {/* ── Completed ── */}
                  {doneItems.length > 0 && (
                    <section className="tasks-section">
                      <div className="section-header">
                        <h2>Completed</h2>
                        <span className="count-badge">{doneItems.length}</span>
                      </div>
                      {doneItems.map(item => (
                        <div key={item.WORK_ITEM_ID} className="task-card is-done">
                          <button className="task-checkbox checked"
                            onClick={() => updateStatus(item.WORK_ITEM_ID, 'NEW')}
                            title="Mark as to do" />
                          <div className="task-body">
                            <span className="task-description">{item.TITLE}</span>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                              {item.ASSIGNEE_NAME && (
                                <span style={tagStyle('#7C3AED', '#EDE9FE')}>
                                  <PersonIcon style={{ fontSize: 11, verticalAlign: 'middle', marginRight: 2 }} />{item.ASSIGNEE_NAME}
                                </span>
                              )}
                              {item.SPRINT_NAME && (
                                <span style={tagStyle('#1D4ED8', '#EFF6FF')}>
                                  <BoltIcon style={{ fontSize: 11, verticalAlign: 'middle', marginRight: 2 }} />{item.SPRINT_NAME}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="task-actions">
                            <button className="action-btn delete"
                              onClick={() => deleteItem(item.WORK_ITEM_ID)}
                              title="Delete task">
                              <DeleteIcon style={{ fontSize: 16 }} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </section>
                  )}
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </div>

    {/* ── Modal de horas ── */}
    {hoursModal && (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}>
        <div style={{
          background: '#fff', borderRadius: 16, padding: 28, width: 320,
          boxShadow: '0 8px 32px rgba(124,58,237,0.18)', fontFamily: 'Poppins',
        }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 16, color: '#1F2937' }}>Mark as Done</h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6B7280' }}>
            How many hours did this task take?
          </p>
          <input
            type="number" min="0" step="0.5" placeholder="e.g. 2.5"
            value={hoursInput}
            onChange={e => setHoursInput(e.target.value)}
            autoFocus
            style={{ ...inputStyle, marginBottom: 16 }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => { setHoursModal(null); setHoursInput(''); }}
              style={{
                background: '#F3F4F6', color: '#374151', border: 'none',
                borderRadius: 8, padding: '8px 16px', fontFamily: 'Poppins',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
              Cancel
            </button>
            <button onClick={confirmDone}
              style={{
                background: '#7C3AED', color: '#fff', border: 'none',
                borderRadius: 8, padding: '8px 16px', fontFamily: 'Poppins',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
              Confirm Done
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

const inputStyle = {
  padding: '8px 12px', borderRadius: 8, border: '1px solid #DDD6FE',
  fontFamily: 'Poppins', fontSize: 13, outline: 'none', width: '100%',
  boxSizing: 'border-box',
};

const selectStyle = {
  padding: '7px 10px', borderRadius: 8, border: '1px solid #DDD6FE',
  fontFamily: 'Poppins', fontSize: 12, outline: 'none', background: '#fff',
  cursor: 'pointer',
};

function tagStyle(color, bg) {
  return {
    fontSize: 11, fontWeight: 600, color, background: bg,
    borderRadius: 6, padding: '2px 7px', fontFamily: 'Poppins',
  };
}

export default App;
