import React, { useEffect } from 'react';

const DragDropPopup = ({ onClose }) => {
  useEffect(() => {
    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const files = e.dataTransfer.files;
      
      if (files?.[0]?.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          // Dispatch event to show main popup with the dropped image
          window.dispatchEvent(new CustomEvent('oasisMessage', {
            detail: {
              action: "showPopup",
              imageUrl: evt.target.result,
              tabUrl: window.location.href,
              type: "image"
            }
          }));
        };
        reader.readAsDataURL(files[0]);
      }
      onClose();
    };

    document.addEventListener('drop', handleDrop);
    document.addEventListener('dragover', (e) => e.preventDefault());
    
    const handleDragLeave = (e) => {
      if (e.relatedTarget === null) {
        onClose();
      }
    };
    window.addEventListener('dragleave', handleDragLeave);

    return () => {
      document.removeEventListener('drop', handleDrop);
      document.removeEventListener('dragover', (e) => e.preventDefault());
      window.removeEventListener('dragleave', handleDragLeave);
    };
  }, [onClose]);

  return (
    <div className="fixed top-1/2 left-4/5 transform -translate-x-1/2 -translate-y-1/2 z-[9999] w-[486px] h-[620px] rounded-2xl border border-gray-700 bg-gray-900 text-white font-sans overflow-hidden">
      <div className="w-[454px] h-[588px] m-4 bg-gray-800 border-2 border-dashed border-gray-500 rounded-lg flex justify-center items-center">
        <div className="w-[304px] h-[106px] flex flex-col items-center justify-center gap-5">
          <div className="text-4xl text-gray-400">↓</div>
          <div className="text-xl text-gray-400 font-medium text-center leading-snug">
            Drag files here to add<br />to your library
          </div>
        </div>
      </div>
    </div>
  );
};

export default DragDropPopup;