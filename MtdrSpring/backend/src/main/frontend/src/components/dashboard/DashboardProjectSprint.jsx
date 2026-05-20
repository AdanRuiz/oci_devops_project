import { useMemo } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { Bug, CircleDot } from 'lucide-react';
import moment from 'moment';

const statusStyles = {
  DONE: 'bg-emerald-50 text-emerald-800 ring-emerald-600/15',
  IN_PROGRESS: 'bg-amber-50 text-amber-900 ring-amber-600/15',
  TODO: 'bg-slate-50 text-slate-700 ring-slate-600/10',
  PENDING: 'bg-slate-50 text-slate-700 ring-slate-600/10',
};

function DashboardProjectSprint() {
  const { sprintId } = useParams();
  const sid = Number(sprintId);
  const { project, teamTasks, orderedSprints, users } = useOutletContext();

  const sprint = useMemo(
    () => orderedSprints.find((s) => s.id === sid) || null,
    [orderedSprints, sid]
  );

  const userName = useMemo(() => {
    const m = {};
    (users || []).forEach((u) => {
      m[u.id] = u.name || u.username || u.email || `User ${u.id}`;
    });
    return (uid) => m[uid] || `User ${uid}`;
  }, [users]);

  const rows = useMemo(
    () => teamTasks.filter((t) => t.sprint?.id === sid),
    [teamTasks, sid]
  );

  if (!sprint) {
    return (
      <div className="rounded-2xl border border-[#2A1814]/[0.06] bg-[#faf9f6] p-8 text-center">
        <p className="text-sm text-[#6B6560]">This sprint is not part of this project.</p>
        <Link
          to={`/dashboard/projects/${project.id}`}
          className="mt-4 inline-block text-sm font-medium text-[#c74634] hover:underline"
        >
          Back to overview
        </Link>
      </div>
    );
  }

  const open = rows.filter((t) => t.status !== 'DONE').length;
  const bugs = rows.filter((t) => t.isBug).length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#2A1814]/[0.06] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#2A1814]">{sprint.name || `Sprint ${sprint.id}`}</h2>
            <p className="mt-1 text-sm text-[#6B6560]">
              {sprint.startDate && `Start ${moment(sprint.startDate).format('MMM D, YYYY')}`}
              {sprint.endDate && ` · End ${moment(sprint.endDate).format('MMM D, YYYY')}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-[#6B6560]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#faf9f6] px-3 py-1 ring-1 ring-[#2A1814]/8">
              <CircleDot className="h-4 w-4 text-[#c74634]" />
              {rows.length} tasks
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#faf9f6] px-3 py-1 ring-1 ring-[#2A1814]/8">
              {open} open
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#faf9f6] px-3 py-1 ring-1 ring-[#2A1814]/8">
              <Bug className="h-4 w-4 text-[#7a2419]" />
              {bugs} bugs
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#2A1814]/[0.06] bg-white shadow-sm">
        <div className="border-b border-[#2A1814]/[0.06] px-4 py-3">
          <h3 className="text-sm font-semibold text-[#2A1814]">Tasks in this sprint</h3>
        </div>
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-[#6B6560]">No tasks for this team in this sprint.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#faf9f6] text-xs font-medium uppercase tracking-wide text-[#6B6560]">
                <tr>
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A1814]/[0.06]">
                {rows.map((t) => (
                  <tr key={t.id} className="hover:bg-[#faf9f6]/80">
                    <td className="px-4 py-3 font-medium text-[#2A1814]">{t.title}</td>
                    <td className="px-4 py-3 text-[#6B6560]">{userName(t.assignedTo)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          statusStyles[t.status] || statusStyles.PENDING
                        }`}
                      >
                        {t.status || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#6B6560]">{t.isBug ? 'Bug' : 'Feature'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardProjectSprint;
