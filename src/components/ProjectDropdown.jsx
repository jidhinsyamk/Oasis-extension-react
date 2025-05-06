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

    const root = containerRef.current?.getRootNode();
    root.addEventListener('mousedown', handleClickOutside);
    return () => root.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && dropdownRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      
      if (spaceBelow < 150) {
        dropdownRef.current.classList.add('bottom-full', 'top-auto');
        dropdownRef.current.style.maxHeight = `${rect.top - 20}px`;
      } else {
        dropdownRef.current.classList.add('top-full', 'bottom-auto');
        dropdownRef.current.style.maxHeight = `${Math.min(200, spaceBelow - 20)}px`;
      }
    }
  }, [isOpen]);

  const toggleDropdown = () => setIsOpen(!isOpen);
  
  const handleSelect = (projectId) => {
    onSelectProject(projectId);
    setIsOpen(false);
  };
  
  const clearSelection = (e) => {
    e.stopPropagation();
    onSelectProject(null);
  };

  const selectedProjectData = projects.find(p => p._id === selectedProject);

  return (
<div className="relative w-full" ref={containerRef}>
<div 
  className={`w-full h-[38px] text-white px-1 py-1 text-sm outline-none transition-all flex items-center justify-between cursor-pointer ${
    isOpen ? 'shadow-[inset_0_0_7px_rgba(255,255,255,0.21),inset_0_-3px_4px_rgba(255,255,255,0)] backdrop-blur-sm' : ''
  }`}
    onClick={toggleDropdown}
    style={{
      border: '1px solid transparent',
      borderRadius: '9999px',
      background:
        'linear-gradient(#0E141A, #0E141A) padding-box, linear-gradient(360deg, rgba(255,255,255,0.02), rgba(230,246,255,0.1)) border-box',
    }}
  >
    <div className="flex items-center gap-2 overflow-hidden">
      {selectedProject ? (
        <div className="flex items-center bg-[rgba(20,28,36,1)] border border-gray-600 rounded-full px-3 py-[4px] text-sm whitespace-nowrap">

          {selectedProjectData?.name}
          <span 
            className="ml-1.5 text-gray-400 text-sm cursor-pointer hover:text-white"
            onClick={clearSelection}
          >
            ×
          </span>
        </div>
      ) : (
        <div
        className="text-sm truncate px-3"
        style={{ color: 'rgba(139, 155, 171, 1)' }}
      >
        {isLoading ? 'Loading projects...' : 'Select a project...'}
      </div>
      
      )}
    </div>

    <span className="flex-shrink-0 mr-4 mt-1 text-gray-400 transition-transform duration-200">
  {isOpen ? (
    // Up arrow or close icon
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 448 512" 
      width="14" 
      height="14" 
      fill="currentColor"
    >
      <path d="M240.971 130.524L435.314 324.868c9.373 9.373 9.373 24.569 0 33.941l-22.627 22.627c-9.357 9.357-24.522 9.375-33.901.04L224 218.508 69.214 381.476c-9.379 9.335-24.544 9.317-33.901-.04L12.686 358.809c-9.373-9.373-9.373-24.569 0-33.941L207.029 130.524c9.373-9.373 24.569-9.373 33.942 0z"/>
    </svg>
  ) : (
    // Down arrow
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 448 512" 
      width="14" 
      height="14" 
      fill="currentColor"
    >
      <path d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 
                0-33.941l22.627-22.627c9.357-9.357 24.522-9.375 
                33.901-.04L224 293.492l154.786-162.968c9.379-9.335 
                24.544-9.317 33.901.04l22.627 22.627c9.373 9.373 
                9.373 24.569 0 33.941L240.971 381.476c-9.373 
                9.373-24.569 9.373-33.942 0z"/>
    </svg>
  )}
</span>


  </div>

  {isOpen && (
    <div 
      ref={dropdownRef}
      className="absolute left-0 w-full bg-gray-800 border border-gray-600 rounded-lg mt-1 overflow-y-auto z-[2147483647] shadow-lg max-h-[200px]"
    >
      {isLoading ? (
        <div className="px-4 py-2 text-sm text-gray-400 cursor-pointer">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="px-4 py-2 text-sm text-gray-400 cursor-pointer">No projects available</div>
      ) : (
        projects.map(project => (
          <div
            key={project._id}
            className={`px-4 py-2 text-sm cursor-pointer text-gray-200 hover:bg-gray-700 ${
              selectedProject === project._id ? 'bg-gray-600 text-white' : ''
            }`}
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