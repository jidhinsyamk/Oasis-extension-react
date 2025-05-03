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
            tags, // Use local state
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

  return (
    <div style={{
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
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    }}>
      <div className="flex flex-col h-full p-5">
        <div className="flex-grow overflow-y-auto pr-2">
          <div className="flex gap-3 mb-4">
            <img 
              src={imageUrl} 
              alt="Preview" 
              className="w-[175px] h-[108px] object-cover rounded-lg"
            />
            <div className="w-[249px] h-[108px] rounded-xl border border-gray-700 p-5 bg-gray-800 flex flex-col justify-center gap-3">
              <p className="text-xs text-gray-400 m-0">Saving {type === "screenshot" ? "Page" : "Image"} from</p>
              <p className="text-sm font-bold m-0">{new URL(tabUrl).hostname}</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[38px] bg-gray-900 text-white border border-gray-600 rounded-full px-6 py-2 text-sm outline-none transition-all"
              placeholder="Enter name"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm mb-1.5">Project</label>
            <ProjectDropdown 
              selectedProject={selectedProject}
              onSelectProject={setSelectedProject}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm mb-1.5">Tags</label>
            <TagsInput 
              tags={tags}
              setTags={setTags}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm mb-1.5">Notes</label>
            <textarea
              ref={notesRef}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-[38px] bg-gray-900 text-white border border-gray-600 rounded-full px-6 py-2 text-sm outline-none transition-all resize-none overflow-hidden"
              placeholder="Add Notes"
              rows={1}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 mt-3">
            <label className="flex items-center gap-2">
              Oasis auto-detects when you copy a link.
              <input type="checkbox" defaultChecked className="hidden" />
              <span className="w-8 h-4 bg-gray-600 rounded-full relative cursor-pointer">
                <span className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform"></span>
              </span>
            </label>
          </div>

          {error && <div className="mt-4 text-red-400 text-sm">{error}</div>}
        </div>

        <div className="flex justify-between mt-5">
          <button
            onClick={handleGoToApp}
            className="border border-gray-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors"
          >
            Go to App
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedProject || isSaving}
            className={`bg-white text-black px-5 py-2 rounded-lg text-sm ${!selectedProject || isSaving ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-200'} transition-colors`}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={onClose}
            className="border border-gray-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainPopup;