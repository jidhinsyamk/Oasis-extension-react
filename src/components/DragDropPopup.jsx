import React, { useEffect, useState } from "react";

const DragDropPopup = ({ onClose }) => {
  const [popupStyle, setPopupStyle] = useState({});

  useEffect(() => {
    const handleDrop = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const files = e.dataTransfer.files;
      const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');

      if (files?.[0]?.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          window.dispatchEvent(
            new CustomEvent("oasisMessage", {
              detail: {
                action: "showPopup",
                imageUrl: evt.target.result,
                tabUrl: window.location.href,
                type: "image",
              },
            })
          );
          setTimeout(onClose, 100);
        };
        reader.readAsDataURL(files[0]);
      } else if (url && /^https?:\/\//.test(url)) {
        try {
          if (!document.getElementById('oasis-extension-root')) {
            await new Promise((resolve) => {
              chrome.runtime.sendMessage({ action: 'injectContentScript' }, resolve);
            });
          }
          await new Promise((resolve) => {
            chrome.runtime.sendMessage({
              action: 'autoDetectCopyUrl',
              url: url,
              pageTitle: document.title || ''
            }, resolve);
          });
          setTimeout(onClose, 100);
        } catch (error) {
          console.error('Error handling URL drop:', error);
          onClose();
        }
      } else {
        onClose();
      }
    };

    const handleDragOver = (e) => e.preventDefault();
    const handleDragLeave = (e) => {
      if (e.relatedTarget === null) onClose();
    };

    const updateSize = () => {
      const defaultWidth = 486;
      const defaultHeight = 620;
      const screenHeight = window.innerHeight;
      const scale = Math.min(1, (screenHeight - 40) / defaultHeight);

      setPopupStyle({
        width: `${defaultWidth}px`,
        height: `${defaultHeight}px`,
        top: "52%",
        right: "20px",
        transform: `translateY(-50%) scale(${scale})`,
        transformOrigin: "top right",
        zIndex: 2147483647,
        borderRadius: "24px",
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    document.addEventListener("drop", handleDrop);
    document.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);

    return () => {
      window.removeEventListener("resize", updateSize);
      document.removeEventListener("drop", handleDrop);
      document.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
    };
  }, [onClose]);

  return (
    <div
      className="fixed top-1/2 right-5 z-[2147483647] bg-[#0E141A] rounded-3xl border border-[#333] overflow-hidden font-['Segoe_UI']"
      style={{
        ...popupStyle,
        transform: `${popupStyle.transform || "translateY(-50%)"}`,
      }}
    >
      <div className="w-[454px] h-[588px] m-4 bg-gray-800 border-2 border-dashed border-gray-500 rounded-lg flex justify-center items-center">
        <div className="w-[304px] h-[106px] flex flex-col items-center justify-center gap-5">
          <div className="text-4xl text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="currentColor"
              className="bi bi-box-arrow-down"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                d="M3.5 10a.5.5 0 0 1-.5-.5v-8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 0 0 1h2A1.5 1.5 0 0 0 14 9.5v-8A1.5 1.5 0 0 0 12.5 0h-9A1.5 1.5 0 0 0 2 1.5v8A1.5 1.5 0 0 0 3.5 11h2a.5.5 0 0 0 0-1z"
              />
              <path
                fillRule="evenodd"
                d="M7.646 15.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 14.293V5.5a.5.5 0 0 0-1 0v8.793l-2.146-2.147a.5.5 0 0 0-.708.708z"
              />
            </svg>
          </div>

          <div className="text-xl text-[#FFFFFF] font-medium text-center leading-snug">
            Drag files here to add
            <br />
            to your library
          </div>
        </div>
      </div>
    </div>
  );
};

export default DragDropPopup;
