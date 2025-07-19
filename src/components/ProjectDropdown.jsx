import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

const ProjectDropdown = ({ selectedProjects = [], onSelectProjects, className = '' }) => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);


  const fetchProjects = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);


  const handleClickOutside = useCallback((event) => {
    if (containerRef.current && !containerRef.current.contains(event.target)) {
      setIsOpen(false);
      setSearchQuery('');
    }
  }, []);

  useEffect(() => {
    const root = containerRef.current?.getRootNode();
    root.addEventListener('mousedown', handleClickOutside);
    return () => root.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  const positionDropdown = useCallback(() => {
    if (!isOpen || !dropdownRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;

    if (spaceBelow < 200) {
      dropdownRef.current.classList.add('bottom-full', 'top-auto');
      dropdownRef.current.style.maxHeight = `${rect.top - 20}px`;
    } else {
      dropdownRef.current.classList.add('top-full', 'bottom-auto');
      dropdownRef.current.style.maxHeight = '300px';
    }

    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    positionDropdown();
  }, [isOpen, positionDropdown]);

  const toggleDropdown = useCallback(() => {
    setIsOpen(prev => !prev);
    setSearchQuery('');
  }, []);

  useEffect(() => {
    const innerContainer = containerRef.current?.firstChild;
    if (innerContainer) {
      innerContainer.style.borderRadius = selectedProjects.length > 4 ? "12px" : "30px";
    }
  }, [selectedProjects]);


  const handleSelectProject = useCallback((project) => {
    const isSelected = selectedProjects.some(p => p._id === project._id);
    const newSelectedProjects = isSelected
      ? selectedProjects.filter(p => p._id !== project._id)
      : [...selectedProjects, project];

    onSelectProjects(newSelectedProjects);
  }, [selectedProjects, onSelectProjects]);


  const handleCreateProject = useCallback(async () => {
    if (!newProjectName.trim()) return;

    try {
      const { token, userId, error: authError } = await new Promise(resolve => {
        chrome.runtime.sendMessage({ action: "getToken" }, resolve);
      });

      if (authError || !token || !userId) {
        throw new Error(authError || "Unauthorized! Please log in to the Oasis app.");
      }

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

      setProjects(prev => [...prev, response.data]);
      onSelectProjects([...selectedProjects, response.data]);
      setNewProjectName('');
      setSearchQuery('');
    } catch (error) {
      console.error('Error creating project:', error);
      alert(`Failed to create project: ${error.message}`);
    }
  }, [newProjectName, selectedProjects, onSelectProjects]);


  const filteredProjects = useMemo(() =>
    projects.filter(project =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [projects, searchQuery]
  );


  const showCreateOption = useMemo(() =>
    searchQuery && !projects.some(p =>
      p.name.toLowerCase() === searchQuery.toLowerCase()
    ),
    [searchQuery, projects]
  );


  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && showCreateOption) {
      handleCreateProject();
    }
  }, [showCreateOption, handleCreateProject]);


  const renderProjectList = () => {
    if (isLoading) {
      return <div className="px-4 py-2 text-sm text-[#8B9BAB]">Loading projects...</div>;
    }

    if (filteredProjects.length === 0 && !showCreateOption) {
      return <div className="px-4 py-2 text-sm text-[#8B9BAB]">No projects found</div>;
    }

    return (
      <>
        {filteredProjects.map(project => (
          <label
            key={project._id}
            className="flex items-center px-4 py-2 text-sm cursor-pointer hover:bg-[#374151]"
          >
            <input
              type="checkbox"
              checked={selectedProjects.some(p => p._id === project._id)}
              onChange={() => handleSelectProject(project)}
              className="mr-2 w-3 h-3 accent-[#2566E5] text-[#0E141A] rounded border border-[#2566E5] focus:ring-[#2566E5]"
            />
            <span className={selectedProjects.some(p => p._id === project._id) ? 'text-white' : 'text-[#96A6B6]'}>
              {project.name}
            </span>
          </label>
        ))}
      </>
    );
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        className={`w-full min-h-[38px] bg-[#0E141A] text-white px-[4px] py-[2px] text-sm outline-none transition-all flex items-center justify-between cursor-pointer ${isOpen ? 'shadow-[inset_0_0_7px_rgba(255,255,255,0.21),inset_0_-3px_4px_rgba(255,255,255,0)]' : ''
          } ${className}`}
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
            <span className="text-[#8B9BAB] text-sm ml-5">
              {isLoading ? 'Loading projects...' : 'Select projects...'}
            </span>
          )}
        </div>

        <span className="flex-shrink-0 ml-2 text-gray-400 transition-transform duration-200 px-2">
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
          className="absolute left-0 w-full rounded-xl mt-1 overflow-y-auto z-[2147483647] shadow-[0_4px_30px_rgba(0,0,0,0.45)] backdrop-blur-md custom-scrollbar"
          style={{
            background: 'linear-gradient(180deg, #0D1117 0%, #0F1621 100%)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            maxHeight: '300px', // Fixed height with scroll
          }}
        >
          <div className="sticky top-0 z-20 border-b border-gray-500 bg-[#0F1621]">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search or create project"
              className="w-full bg-[#0E141A] text-white p-2 text-sm outline-none border-none"
            />
          </div>

          {showCreateOption && (
            <div
              className="flex items-center px-4 py-2 text-sm cursor-pointer text-[#96A6B6] rounded-[12px] hover:text-white hover:bg-[#374151] border-b border-white"
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

          {renderProjectList()}
        </div>
      )}
    </div>
  );
};

export default React.memo(ProjectDropdown);