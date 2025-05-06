import React, { useState, useEffect, useRef } from "react";
import ProjectDropdown from "./ProjectDropdown";
import TagsInput from "./TagsInput";

const MainPopup = ({ imageUrl, tabUrl, type, onClose, onSuccess }) => {
  const [name, setName] = useState(
    type === "screenshot"
      ? `Screenshot of ${new URL(tabUrl).hostname}`
      : "Saved Image"
  );
  const [notes, setNotes] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const notesRef = useRef(null);
  const [tags, setTags] = useState([]);
  const [autoDetectLinks, setAutoDetectLinks] = useState(false);
  const popupRef = useRef(null);

  useEffect(() => {
    const adjustScale = () => {
      if (!popupRef.current) return;
      const maxHeight = window.innerHeight - 40;
      const originalHeight = 620;
      const scale = Math.min(1, maxHeight / originalHeight);
      popupRef.current.style.transform = `translateY(-50%) scale(${scale})`;
    };

    adjustScale();
    window.addEventListener("resize", adjustScale);
    return () => window.removeEventListener("resize", adjustScale);
  }, []);

  useEffect(() => {
    if (notesRef.current) {
      notesRef.current.style.height = "auto";
      notesRef.current.style.height = `${notesRef.current.scrollHeight}px`;
    }
  }, [notes]);

  useEffect(() => {
    console.log("Selected Project Updated:", selectedProject);
  }, [selectedProject]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      if (!selectedProject) throw new Error("Please select a project");

      const {
        token,
        userId,
        error: authError,
      } = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "getToken" }, resolve);
      });

      if (authError || !token || !userId) {
        throw new Error(
          authError || "Unauthorized! Please log in to the Oasis app."
        );
      }

      const result = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          {
            action: "saveImage",
            data: {
              token,
              imageUrl,
              name:
                name.trim() ||
                (type === "screenshot"
                  ? `Screenshot of ${new URL(tabUrl).hostname}`
                  : "Saved Image"),
              notes,
              tags,
              tabUrl,
              projectId: selectedProject,
              userId,
            },
          },
          resolve
        );
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
    <div
      ref={popupRef}
      className="fixed"
      style={{
        display: "flex",
        flexDirection: "column",
        top: "52%",
        right: "20px",
        transform: "translateY(-50%)",
        width: "486px",
        maxHeight: "620px",
        zIndex: 2147483647,
        backgroundColor: "#0E141A",
        borderRadius: "24px",
        border: "1px solid #333",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        fontFamily: '"Segoe UI", sans-serif',
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transformOrigin: "top right",
      }}
    >
      <div
        className="flex flex-col p-5 text-white relative"
        style={{
          flex: "1",
          overflow: "hidden",
        }}
      >
        {/* Close Button - positioned at top right */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-0 bg-transparent border-none outline-none hover:text-gray-300 text-gray-400"
          style={{
            width: "16px",
            height: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13 1L1 13M1 1L13 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="flex-grow overflow-y-auto pr-2">
          {/* Preview Section */}
          <div className="flex gap-3 mb-4">
            <img
              src={imageUrl}
              alt="Preview"
              className="w-[175px] h-[108px] object-cover rounded-lg"
            />
            <div className="relative w-[249px] h-[108px] p-[1px] rounded-xl before:content-[''] before:absolute before:inset-0 before:rounded-xl before:bg-[linear-gradient(360deg,rgba(255,255,255,0.1),rgba(230,246,255,0.5))] before:z-[-1]">
              <div className="w-full h-full rounded-[10px] bg-gray-800 p-5 flex flex-col justify-center gap-3">
                <p className="text-xs text-gray-400 m-0">
                  Saving {type === "screenshot" ? "Page" : "Image"} from
                </p>
                <p className="text-sm font-bold m-0">
                  {new URL(tabUrl).hostname}
                </p>
              </div>
            </div>
          </div>

          {/* Input Fields */}
          <div className="mb-4">
            <label className="block text-sm mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[38px] text-white px-6 py-2 text-sm outline-none transition-all focus:shadow-[inset_0_0_7px_rgba(255,255,255,0.21),inset_0_-3px_4px_rgba(255,255,255,0.1)] placeholder-rgba(139, 155, 171, 1)"
              style={{
                border: "1px solid transparent",
                borderRadius: "9999px",
                background:
                  "linear-gradient(#0E141A, #0E141A) padding-box, linear-gradient(360deg, rgba(255,255,255,0.02), rgba(230,246,255,0.1)) border-box",
              }}
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
            <TagsInput tags={tags} setTags={setTags} />
          </div>

          <div className="mt-4 mb-4">
            <label className="block text-sm mb-1.5">Notes</label>
            <textarea
              ref={notesRef}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                // Auto-resize and update rounded corners
                if (notesRef.current) {
                  notesRef.current.style.height = "auto";
                  notesRef.current.style.height = `${notesRef.current.scrollHeight}px`;
                  // Toggle rounded classes based on content height
                  if (notesRef.current.scrollHeight > 38) {
                    notesRef.current.classList.remove("rounded-full");
                    notesRef.current.classList.add("rounded-lg");
                  } else {
                    notesRef.current.classList.add("rounded-full");
                    notesRef.current.classList.remove("rounded-lg");
                  }
                }
              }}
              className="w-full min-h-[38px] bg-[#0E141A] text-white px-6 py-2 text-sm outline-none transition-all resize-none overflow-hidden leading-normal focus:shadow-[inset_0_0_7px_rgba(255,255,255,0.21),inset_0_-3px_4px_rgba(255,255,255,0)] focus:backdrop-blur-sm custom-placeholder rounded-full"
              style={{
                border: "1px solid transparent",
                background:
                  "linear-gradient(#0E141A, #0E141A) padding-box, linear-gradient(360deg, rgba(255,255,255,0.02), rgba(230,246,255,0.1)) border-box",
                transition: "border-radius 0.2s ease",
              }}
              placeholder="Add Notes"
              rows={1}
              onFocus={() => {
                if (notesRef.current && notesRef.current.scrollHeight > 38) {
                  notesRef.current.classList.remove("rounded-full");
                  notesRef.current.classList.add("rounded-lg");
                }
              }}
              onBlur={() => {
                if (notesRef.current && notesRef.current.scrollHeight <= 38) {
                  notesRef.current.classList.add("rounded-full");
                  notesRef.current.classList.remove("rounded-lg");
                }
              }}
            />
          </div>

          {error && <div className="text-red-400 text-sm mt-4">{error}</div>}
        </div>

        {/* Toggle Section - now full width */}
        {/* Toggle Section */}
        {/* Toggle Section */}
        <div
          className="flex items-center justify-between px-5 -mx-5 mb-3"
          style={{
            height: "50px",
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <p className="w-[251px] h-[18px] opacity-80 font-[400] text-[13px] leading-[140%] tracking-[0px] align-middle  text-[#FFFFFF]">
            Oasis auto-detects when you copy a link.
          </p>

          {/* WORKING TOGGLE BUTTON */}
          <label className="relative inline-flex items-center cursor-pointer w-8 h-[18px]">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={autoDetectLinks}
              onChange={() => setAutoDetectLinks(!autoDetectLinks)}
            />
            <div
              className={`w-full h-full rounded-full transition-colors duration-200 ease-in-out bg-gray-400 peer-checked:bg-blue-600`}
            />
            <div
              className={`absolute top-[2px] h-[14px] w-[14px] bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${
                autoDetectLinks ? "right-[2px]" : "left-[2px]"
              }`}
            />
          </label>
        </div>

        {/* Buttons - spaced between with exact styling */}
        <div className="flex justify-between mt-5">
          <button
            onClick={handleGoToApp}
            className="text-white text-sm transition-colors hover:opacity-90 flex items-center gap-2 justify-center"
            style={{
              width: "214px",
              height: "40px",
              borderRadius: "66px",
              border: "1px solid transparent",
              background:
                "linear-gradient(#141C24, #141C24) padding-box, linear-gradient(360deg, rgba(255,255,255,0.1), rgba(230,246,255,0.5)) border-box",
              padding: "4px 16px",
              boxShadow: "inset 0px 4px 14px 0px rgba(255, 255, 255, 0.12)",
            }}
          >
            <span>Go to App</span>
            <div className="w-[22px] h-[22px] text-[12px] rounded-[8px] bg-[#FFFFFF0D] border border-[#FFFFFF0F] flex items-center justify-center">
              A
            </div>
          </button>

          <button
            onClick={handleSave}
            disabled={!selectedProject || isSaving}
            className={`text-sm transition-colors hover:opacity-90 ${
              !selectedProject || isSaving
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "text-black"
            }`}
            style={{
              width: "214px",
              height: "40px",
              borderRadius: "66px",
              border: "1px solid transparent",
              padding: "4px 16px",
              background:
                !selectedProject || isSaving
                  ? "gray" // fallback color when disabled
                  : "linear-gradient(183.56deg, rgba(255, 255, 255, 0.9) 2.92%, #C2C2C2 85.35%)",
            }}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainPopup;
