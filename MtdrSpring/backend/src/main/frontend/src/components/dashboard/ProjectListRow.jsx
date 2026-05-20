import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';

function ProjectListRow({ project, isLast }) {
  const isCompleted = project.status === 'Completed';

  return (
    <Link
      to={`/dashboard/projects/${project.id}`}
      className={`group flex flex-col gap-4 py-5 transition-colors hover:bg-[#2A1814]/[0.02] sm:flex-row sm:items-center sm:justify-between sm:gap-6 ${
        isLast ? '' : 'border-b border-[#2A1814]/[0.06]'
      }`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            isCompleted
              ? 'bg-[#2A1814]/[0.05] text-[#2A1814]'
              : 'bg-[#c74634]/10 text-[#c74634]'
          }`}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
          ) : (
            <Circle className="h-5 w-5" strokeWidth={1.75} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-[#2A1814]">{project.name}</h3>
            {project.activeSprintName && (
              <span className="truncate text-xs text-[#6B6560]">· {project.activeSprintName}</span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#6B6560]">
            <span>
              {project.taskCount} {project.taskCount === 1 ? 'task' : 'tasks'}
            </span>
            <span>{project.openTasks} open</span>
            <span>{project.doneTasks} done</span>
            {project.inProgress > 0 && <span>{project.inProgress} in progress</span>}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {project.members.map((member) => (
                <div
                  key={member.id}
                  title={member.name}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[#c74634]/15 text-[9px] font-semibold text-[#c74634]"
                >
                  {member.initials}
                </div>
              ))}
            </div>
            <span className="text-xs text-[#6B6560]">
              {project.memberCount} {project.memberCount === 1 ? 'member' : 'members'}
            </span>
          </div>
        </div>
      </div>

      <span className="inline-flex shrink-0 items-center gap-1.5 self-start text-sm font-medium text-[#6B6560] transition group-hover:text-[#c74634] sm:self-center">
        View
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export default ProjectListRow;
