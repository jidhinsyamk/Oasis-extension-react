import React, { useState, useEffect, useRef } from 'react';

const ProjectDropdown = ({ selectedProject, onSelectProject }) => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsData = await new Promise(resolve => {
          chrome.runtime.sendMessage({ action: "getProjects" }, (response) => {
            resolve(response?.data?.data || []);
          });
        });
        setProjects(projectsData);
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && dropdownRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      
      if (spaceBelow < 150) {
        dropdownRef.current.style.top = 'auto';
        dropdownRef.current.style.bottom = '100%';
        dropdownRef.current.style.maxHeight = `${rect.top - 20}px`;
      } else {
        dropdownRef.current.style.top = '100%';
        dropdownRef.current.style.bottom = 'auto';
        dropdownRef.current.style.maxHeight = `${Math.min(200, spaceBelow - 20)}px`;
      }
    }
  }, [isOpen]);

  const toggleDropdown = () => setIsOpen(!isOpen);
  const handleSelect = (projectId) => {
    onSelectProject(projectId);
    setIsOpen(false);
  };
  const clearSelection = () => onSelectProject(null);

  const selectedProjectData = projects.find(p => p._id === selectedProject);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className="w-full min-h-[38px] bg-gray-900 text-white border border-gray-600 rounded-full px-4 py-1 text-sm outline-none transition-all flex flex-wrap items-center gap-1.5 cursor-pointer"
        onClick={toggleDropdown}
      >
        {selectedProject ? (
          <div className="flex items-center bg-gray-800 border border-gray-800 rounded-full px-3 py-1 text-sm">
            {selectedProjectData?.name}
            <span 
              className="ml-1.5 text-gray-400 text-sm cursor-pointer hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                clearSelection();
              }}
            >
              ×
            </span>
          </div>
        ) : (
          <div className="text-gray-500 pl-3">
            {isLoading ? 'Loading projects...' : 'Select a project...'}
          </div>
        )}
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white pointer-events-none">▼</span>
      </div>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute left-0 w-full bg-gray-800 border border-gray-700 rounded-lg mt-1 overflow-y-auto z-50 shadow-lg"
        >
          {isLoading ? (
            <div className="px-4 py-2 text-gray-400 text-sm">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="px-4 py-2 text-gray-400 text-sm">No projects available</div>
          ) : (
            projects.map(project => (
              <div
                key={project._id}
                className={`px-4 py-2 cursor-pointer text-sm ${selectedProject === project._id ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                onClick={() => handleSelect(project._id)}
              >
                {project.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectDropdown;