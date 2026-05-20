import ProjectListRow from './ProjectListRow';

function ProjectListSection({ title, count, projects, emptyMessage }) {
  if (projects.length === 0) {
    return emptyMessage ? (
      <section className="py-8">
        <h2 className="text-sm font-semibold text-[#2A1814]">{title}</h2>
        <p className="mt-2 text-sm text-[#6B6560]">{emptyMessage}</p>
      </section>
    ) : null;
  }

  return (
    <section>
      <div className="flex items-baseline justify-between gap-4 border-b border-[#2A1814]/[0.08] pb-3">
        <h2 className="text-sm font-semibold text-[#2A1814]">{title}</h2>
        <span className="text-xs font-medium text-[#6B6560]">
          {count} {count === 1 ? 'project' : 'projects'}
        </span>
      </div>
      <div>
        {projects.map((project, index) => (
          <ProjectListRow
            key={project.id}
            project={project}
            isLast={index === projects.length - 1}
            rowIndex={index}
          />
        ))}
      </div>
    </section>
  );
}

export default ProjectListSection;
