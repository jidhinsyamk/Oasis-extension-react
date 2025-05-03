import React from 'react';

const SuccessPopup = ({ onClose }) => {
  const handleVisit = () => {
    window.open('http://localhost:5173/references', '_blank');
    onClose();
  };

  return (
    <div className="fixed top-1/2 left-4/5 transform -translate-x-1/2 -translate-y-1/2 z-[9999] w-[486px] h-[620px] rounded-2xl border border-gray-700 bg-gray-900 text-white font-sans overflow-hidden">
      <div className="flex flex-col items-center justify-center h-full p-10 text-center">
        <div className="bg-green-500 text-black text-2xl w-12 h-12 rounded-full flex items-center justify-center mb-6">
          ✓
        </div>
        <div className="text-xl font-medium mb-8 leading-snug">
          Your Reference Has Been<br />Successfully Saved!
        </div>
        <button
          onClick={handleVisit}
          className="bg-gray-800 text-white border-none w-[214px] h-10 rounded-full px-6 py-2 font-normal text-sm hover:bg-green-400 hover:text-black transition-colors"
        >
          Visit reference
        </button>
      </div>
    </div>
  );
};

export default SuccessPopup;