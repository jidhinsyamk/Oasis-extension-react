import React, { useState, useEffect, useRef } from 'react';

const ProjectDropdown = ({ selectedProjects = [], onSelectProjects }) => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

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
      
      if (spaceBelow < 200) {
        dropdownRef.current.classList.add('bottom-full', 'top-auto');
        dropdownRef.current.style.maxHeight = `${rect.top - 20}px`;
      } else {
        dropdownRef.current.classList.add('top-full', 'bottom-auto');
        dropdownRef.current.style.maxHeight = `${Math.min(300, spaceBelow - 20)}px`;
      }

      // Focus the input when dropdown opens
      if (inputRef.current) {
        setTimeout(() => inputRef.current.focus(), 100);
      }
    }
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    setSearchQuery('');
  };

  const handleSelectProject = (project) => {
    const isSelected = selectedProjects.some(p => p._id === project._id);
    const newSelectedProjects = isSelected
      ? selectedProjects.filter(p => p._id !== project._id)
      : [...selectedProjects, project];
    
    onSelectProjects(newSelectedProjects);
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
  
    try {
      // First get the auth token and userId
      const { token, userId, error: authError } = await new Promise(resolve => {
        chrome.runtime.sendMessage({ action: "getToken" }, resolve);
      });
  
      if (authError || !token || !userId) {
        throw new Error(authError || "Unauthorized! Please log in to the Oasis app.");
      }
  
      // Then send the create project request
      const response = await new Promise(resolve => {
        chrome.runtime.sendMessage({
          action: "createProject",
          data: {
            name: newProjectName.trim(),
            userId: userId,
            isOwned: true
          }
        }, resolve);
      });
  
      if (response.error) {
        throw new Error(response.error);
      }
  
      // Update local state if successful
      setProjects(prev => [...prev, response.data]);
      onSelectProjects([...selectedProjects, response.data]);
      setNewProjectName('');
      setSearchQuery('');
    } catch (error) {
      console.error('Error creating project:', error);
      alert(`Failed to create project: ${error.message}`);
    }
  };
  

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showCreateOption = searchQuery &&
    !projects.some(p => p.name.toLowerCase() === searchQuery.toLowerCase());

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className={`w-full min-h-[38px] bg-[#0E141A] text-white px-2 py-[2px] text-sm outline-none transition-all flex items-center justify-between cursor-pointer ${
          isOpen ? 'shadow-[inset_0_0_7px_rgba(255,255,255,0.21),inset_0_-3px_4px_rgba(255,255,255,0)]' : ''
        }`}
        onClick={toggleDropdown}
        style={{
          border: '1px solid transparent',
          borderRadius: '9999px',
          background: 'linear-gradient(#0E141A, #0E141A) padding-box, linear-gradient(360deg, rgba(255,255,255,0.02), rgba(230,246,255,0.1)) border-box',
        }}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-wrap">
          {selectedProjects.length > 0 ? (
            selectedProjects.map(project => (
              <div 
                key={project._id} 
                className="flex items-center bg-[#141C24] border border-[#141C24] rounded-full px-3 py-1 text-sm"
              >
                {project.name}
                <span 
                  className="ml-1.5 text-gray-400 text-sm cursor-pointer hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectProject(project);
                  }}
                >
                  ×
                </span>
              </div>
            ))
          ) : (
            <span className="text-[#8B9BAB] text-sm">
              {isLoading ? 'Loading projects...' : 'Select projects...'}
            </span>
          )}
        </div>

        <span className="flex-shrink-0 ml-2 text-gray-400 transition-transform duration-200">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 448 512" 
            width="14" 
            height="14" 
            fill="currentColor"
            className={`transform ${isOpen ? 'rotate-180' : ''}`}
          >
            <path d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 
                     0-33.941l22.627-22.627c9.357-9.357 24.522-9.375 
                     33.901-.04L224 293.492l154.786-162.968c9.379-9.335 
                     24.544-9.317 33.901.04l22.627 22.627c9.373 9.373 
                     9.373 24.569 0 33.941L240.971 381.476c-9.373 
                     9.373-24.569 9.373-33.942 0z"/>
          </svg>
        </span>
      </div>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute left-0 w-full bg-[#141C24] border border-[#374151] rounded-lg mt-1 overflow-y-auto z-[2147483647] shadow-lg"
          style={{
            maxHeight: '300px'
          }}
        >
          <div className="p-2 border-b border-[#374151]">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or create project"
              className="w-full bg-[#141C24] text-white p-2 text-sm outline-none border-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && showCreateOption) {
                  handleCreateProject();
                }
              }}
            />
          </div>

          {showCreateOption && (
            <div
              className="flex items-center px-4 py-2 text-sm cursor-pointer text-[#96A6B6] hover:text-white hover:bg-[#374151]"
              onClick={() => {
                setNewProjectName(searchQuery);
                handleCreateProject();
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4 mr-2"
              >
                <path
                  fillRule="evenodd"
                  d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z"
                  clipRule="evenodd"
                />
              </svg>
              Create "{searchQuery}"
            </div>
          )}

          {isLoading ? (
            <div className="px-4 py-2 text-sm text-[#8B9BAB]">Loading projects...</div>
          ) : filteredProjects.length === 0 ? (
            <div className="px-4 py-2 text-sm text-[#8B9BAB]">No projects found</div>
          ) : (
            filteredProjects.map(project => (
              <label
                key={project._id}
                className="flex items-center px-4 py-2 text-sm cursor-pointer hover:bg-[#374151]"
              >
                <input
                  type="checkbox"
                  checked={selectedProjects.some(p => p._id === project._id)}
                  onChange={() => handleSelectProject(project)}
                  className="mr-2 rounded border-[#828389] text-[#2566E5] focus:ring-[#2566E5]"
                />
                <span className={selectedProjects.some(p => p._id === project._id) ? 'text-white' : 'text-[#96A6B6]'}>
                  {project.name}
                </span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectDropdown;