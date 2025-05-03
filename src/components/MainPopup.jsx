import React, { useState, useEffect, useRef } from 'react';
import ProjectDropdown from './ProjectDropdown';
import TagsInput from './TagsInput';

const MainPopup = ({ imageUrl, tabUrl, type, onClose, onSuccess }) => {
  const [name, setName] = useState(type === "screenshot" ? `Screenshot of ${new URL(tabUrl).hostname}` : "Saved Image");
  const [notes, setNotes] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const notesRef = useRef(null);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    if (notesRef.current) {
      notesRef.current.style.height = 'auto';
      notesRef.current.style.height = `${notesRef.current.scrollHeight}px`;
    }
  }, [notes]);

  useEffect(() => {
    console.log('Selected Project Updated:', selectedProject);
  }, [selectedProject]);


  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      if (!selectedProject) throw new Error('Please select a project');

      const { token, userId, error: authError } = await new Promise(resolve => {
        chrome.runtime.sendMessage({ action: "getToken" }, resolve);
      });

      if (authError || !token || !userId) {
        throw new Error(authError || 'Unauthorized! Please log in to the Oasis app.');
      }

      const result = await new Promise(resolve => {
        chrome.runtime.sendMessage({
          action: "saveImage",
          data: {
            token,
            imageUrl,
            name: name.trim() || (type === "screenshot" ? `Screenshot of ${new URL(tabUrl).hostname}` : "Saved Image"),
            notes,
            tags,
            tabUrl,
            projectId: selectedProject,
            userId
          }
        }, resolve);
      });

      if (result?.error) throw new Error(result.error);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoToApp = () => {
    chrome.runtime.sendMessage({ action: "goToApp" });
  };

  // Inline styles for complete isolation
  const styles = {
    popup: {
      position: 'fixed',
      top: '50%',
      right: '20px',
      transform: 'translateY(-50%)',
      width: '486px',
      height: '620px',
      zIndex: 2147483647,
      backgroundColor: '#0E141A',
      borderRadius: '24px',
      border: '1px solid #333',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      fontFamily: '"Segoe UI", sans-serif',
      overflow: 'hidden'
    },
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '20px',
      color: 'white'
    },
    previewContainer: {
      display: 'flex',
      gap: '12px',
      marginBottom: '16px'
    },
    imagePreview: {
      width: '175px',
      height: '108px',
      objectFit: 'cover',
      borderRadius: '8px'
    },
    sourceInfo: {
      width: '249px',
      height: '108px',
      borderRadius: '12px',
      border: '1px solid #374151',
      padding: '20px',
      backgroundColor: '#1F2937',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: '12px'
    },
    sourceLabel: {
      fontSize: '12px',
      color: '#9CA3AF',
      margin: 0
    },
    sourceName: {
      fontSize: '14px',
      fontWeight: 'bold',
      margin: 0
    },
    inputLabel: {
      display: 'block',
      fontSize: '14px',
      marginBottom: '6px'
    },
    textInput: {
      width: '100%',
      minHeight: '38px',
      backgroundColor: ' ',
      color: 'white',
      border: '1px solid #4A5568',
      borderRadius: '9999px',
      padding: '8px 24px',
      fontSize: '14px',
      outline: 'none',
      transition: 'all 0.2s',
      marginBottom: '16px'
    },
    textarea: {
      width: '100%',
      minHeight: '38px',
      backgroundColor: ' ',
      color: 'white',
      border: '1px solid #4A5568',
      borderRadius: '9999px',
      padding: '8px 24px',
      fontSize: '14px',
      outline: 'none',
      transition: 'all 0.2s',
      resize: 'none',
      overflow: 'hidden',
      marginBottom: '16px',
       
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '20px'
    },
    button: {
      border: '1px solid #4B5563',
      color: 'white',
      padding: '8px 20px',
      borderRadius: '8px',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    primaryButton: {
      backgroundColor: 'white',
      color: 'black',
      padding: '8px 20px',
      borderRadius: '8px',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    disabledButton: {
      backgroundColor: '#4B5563',
      color: '#9CA3AF',
      cursor: 'not-allowed'
    },
    errorText: {
      color: '#F87171',
      fontSize: '14px',
      marginTop: '16px'
    },
    dropdownContainer: {
      marginBottom: '16px'
    }
  };

  return (
    <div style={styles.popup}>
      <div style={styles.container}>
        <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '8px' }}>
          <div style={styles.previewContainer}>
            <img 
              src={imageUrl} 
              alt="Preview" 
              style={styles.imagePreview}
            />
            <div style={styles.sourceInfo}>
              <p style={styles.sourceLabel}>
                Saving {type === "screenshot" ? "Page" : "Image"} from
              </p>
              <p style={styles.sourceName}>{new URL(tabUrl).hostname}</p>
            </div>
          </div>

          <div>
            <label style={styles.inputLabel}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.textInput}
              placeholder="Enter name"
            />
          </div>

          <div style={styles.dropdownContainer}>
          <label style={styles.inputLabel}>Project</label>
          <ProjectDropdown 
            selectedProject={selectedProject}
            onSelectProject={setSelectedProject}
          />
        </div>


          <div>
            <label style={styles.inputLabel}>Tags</label>
            <TagsInput 
              tags={tags}
              setTags={setTags}
            />
          </div>

          <div className='mt-[16px]'>
            <label style={styles.inputLabel}>Notes</label>
            <textarea
              ref={notesRef}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={styles.textarea}
              placeholder="Add Notes"
              rows={1}
            />
          </div>

          {error && <div style={styles.errorText}>{error}</div>}
        </div>

        <div style={styles.buttonGroup}>
          <button
            onClick={handleGoToApp}
            style={styles.button}
          >
            Go to App
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedProject || isSaving}
            style={{
              ...styles.primaryButton,
              ...(!selectedProject || isSaving ? styles.disabledButton : {})
            }}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={onClose}
            style={styles.button}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainPopup;