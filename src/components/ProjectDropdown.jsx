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
      // Check if click is outside the dropdown container
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    // Use shadowRoot if available
    const root = containerRef.current?.getRootNode();
    root.addEventListener('mousedown', handleClickOutside);
    return () => root.removeEventListener('mousedown', handleClickOutside);
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
  
  const clearSelection = (e) => {
    e.stopPropagation();
    onSelectProject(null);
  };

  const selectedProjectData = projects.find(p => p._id === selectedProject);

  // Inline styles for better isolation
  const styles = {
    container: {
      position: 'relative',
      width: '100%'
    },
    trigger: {
      width: '100%',
      minHeight: '38px',
      backgroundColor: '',
      color: 'white',
      border: '1px solid #4A5568',
      borderRadius: '9999px',
      padding: '4px 16px',
      fontSize: '14px',
      outline: 'none',
      transition: 'all 0.2s',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '6px',
      cursor: 'pointer'
    },
    selectedItem: {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#1F2937',
      border: '1px solid #1F2937',
      borderRadius: '9999px',
      padding: '4px 12px',
      fontSize: '14px'
    },
    placeholder: {
      color: '#9CA3AF',
      paddingLeft: '12px'
    },
    dropdown: {
      position: 'absolute',
      left: 0,
      width: '100%',
      backgroundColor: '#1F2937',
      border: '1px solid #374151',
      borderRadius: '8px',
      marginTop: '4px',
      overflowY: 'auto',
      zIndex: 2147483647,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    dropdownItem: {
      padding: '8px 16px',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#E5E7EB'
    },
    dropdownItemHover: {
      backgroundColor: '#374151'
    },
    dropdownItemSelected: {
      backgroundColor: '#4B5563',
      color: 'white'
    },
    clearButton: {
      marginLeft: '6px',
      color: '#9CA3AF',
      cursor: 'pointer',
      fontSize: '14px'
    },
    arrow: {
      position: 'absolute',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: 'white',
      pointerEvents: 'none'
    }
  };

  return (
    <div style={styles.container} ref={containerRef}>
      <div 
        style={styles.trigger}
        onClick={toggleDropdown}
      >
        {selectedProject ? (
          <div style={styles.selectedItem}>
            {selectedProjectData?.name}
            <span 
              style={styles.clearButton}
              onClick={clearSelection}
            >
              ×
            </span>
          </div>
        ) : (
          <div style={styles.placeholder}>
            {isLoading ? 'Loading projects...' : 'Select a project...'}
          </div>
        )}
        <span style={styles.arrow}>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="12" height="12" fill="white">
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
          style={styles.dropdown}
        >
          {isLoading ? (
            <div style={{ ...styles.dropdownItem, color: '#9CA3AF' }}>Loading projects...</div>
          ) : projects.length === 0 ? (
            <div style={{ ...styles.dropdownItem, color: '#9CA3AF' }}>No projects available</div>
          ) : (
            projects.map(project => (
              <div
                key={project._id}
                style={{
                  ...styles.dropdownItem,
                  ...(selectedProject === project._id ? styles.dropdownItemSelected : {}),
                  ':hover': styles.dropdownItemHover
                }}
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