import React, { useState } from 'react';
import { Plus, Archive, ArchiveRestore, ChevronDown, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

export const ProjectsView: React.FC = () => {
  const activeProjects = useAppStore((state) => state.activeProjects);
  const archivedProjects = useAppStore((state) => state.archivedProjects);
  const setActiveProject = useAppStore((state) => state.setActiveProject);
  const archiveProject = useAppStore((state) => state.archiveProject);
  const unarchiveProject = useAppStore((state) => state.unarchiveProject);
  const addProject = useAppStore((state) => state.addProject);

  const [isActiveExpanded, setIsActiveExpanded] = useState(true);
  const [isArchivedExpanded, setIsArchivedExpanded] = useState(false);

  const handleCreateProject = () => {
    const name = prompt('Enter project name:');
    if (!name) return;

    const newProject = {
      id: `project-${Date.now()}`,
      name,
      path: `/projects/${name}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isArchived: false,
    };

    addProject(newProject);
    setActiveProject(newProject);
  };

  const handleProjectClick = (project: typeof activeProjects[0]) => {
    setActiveProject(project);
  };

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      {/* Create Project Button */}
      <button
        onClick={handleCreateProject}
        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
      >
        <Plus className="w-5 h-5" />
        Create Project
      </button>

      {/* Active Projects */}
      <div className="flex flex-col">
        <button
          onClick={() => setIsActiveExpanded(!isActiveExpanded)}
          className="flex items-center gap-2 px-2 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
        >
          {isActiveExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          Active Projects ({activeProjects.length})
        </button>

        {isActiveExpanded && (
          <div className="flex flex-col gap-1 mt-2">
            {activeProjects.length === 0 ? (
              <div className="px-2 py-3 text-sm text-gray-500 italic">
                No active projects
              </div>
            ) : (
              activeProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-800 group"
                >
                  <button
                    onClick={() => handleProjectClick(project)}
                    className="flex-1 text-left text-sm text-gray-300 hover:text-white"
                  >
                    {project.name}
                  </button>
                  <button
                    onClick={() => archiveProject(project.id)}
                    className="p-1 text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                    title="Archive project"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Archived Projects */}
      <div className="flex flex-col">
        <button
          onClick={() => setIsArchivedExpanded(!isArchivedExpanded)}
          className="flex items-center gap-2 px-2 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
        >
          {isArchivedExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          Archived Projects ({archivedProjects.length})
        </button>

        {isArchivedExpanded && (
          <div className="flex flex-col gap-1 mt-2">
            {archivedProjects.length === 0 ? (
              <div className="px-2 py-3 text-sm text-gray-500 italic">
                No archived projects
              </div>
            ) : (
              archivedProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-800 group"
                >
                  <button
                    onClick={() => handleProjectClick(project)}
                    className="flex-1 text-left text-sm text-gray-400 hover:text-gray-300"
                  >
                    {project.name}
                  </button>
                  <button
                    onClick={() => unarchiveProject(project.id)}
                    className="p-1 text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                    title="Unarchive project"
                  >
                    <ArchiveRestore className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
