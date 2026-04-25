import { createContext, useContext, useState } from 'react';

const ProjectContext = createContext(null);

function loadFromStorage() {
  try {
    const stored = localStorage.getItem('activeProject');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function ProjectProvider({ children }) {
  const [activeProject, setActiveProject] = useState(loadFromStorage);

  const selectProject = (project) => {
    setActiveProject(project);
    localStorage.setItem('activeProject', JSON.stringify(project));
  };

  const clearProject = () => {
    setActiveProject(null);
    localStorage.removeItem('activeProject');
  };

  return (
    <ProjectContext.Provider value={{ activeProject, selectProject, clearProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export const useActiveProject = () => useContext(ProjectContext);
