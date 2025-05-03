import React from 'react';

const ErrorPopup = ({ message, onClose }) => {
  return (
    <div className="fixed top-1/2 left-4/5 transform -translate-x-1/2 -translate-y-1/2 z-[9999] w-[486px] h-[620px] rounded-2xl border border-gray-700 bg-gray-900 text-white font-sans overflow-hidden">
      <div className="flex flex-col h-full p-5">
        <div className="flex-grow flex items-center justify-center">
          <div className="text-red-400 text-center">
            {message}
          </div>
        </div>
        <div className="flex justify-center">
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

export default ErrorPopup;