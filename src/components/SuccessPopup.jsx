import React, { useEffect, useState } from "react";

const SuccessPopup = ({ onClose }) => {
  const [popupStyle, setPopupStyle] = useState({});

  useEffect(() => {
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
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleVisit = () => {
    window.open("http://localhost:5173/references", "_blank");
    onClose();
  };

  return (
    <div
      className="fixed bg-[#0E141A] border border-[#333] shadow-lg text-white font-sans overflow-hidden flex flex-col justify-center items-center text-center"
      style={popupStyle}
    >
       
      <div className="flex items-center justify-center w-12 h-12 mb-4 bg-[#25D366] rounded-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6 text-black"
        >
          <path
            fillRule="evenodd"
            d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      
      <h2 className="text-white text-2xl font-semibold mb-2">
        Saved Successfully!
      </h2>
      <p className="text-gray-400 mb-10 text-sm">
        Your image has been saved to Oasis.
      </p>

      
      <div className="flex justify-between">
        <button
          onClick={handleVisit}
          className="w-[214px] h-[40px] text-sm font-normal text-white bg-[#121920] border border-[#FFFFFF1F] rounded-[60px] transition-all duration-200 hover:shadow-[inset_0_0_7px_rgba(255,255,255,0.21),inset_0_-3px_4px_rgba(255,255,255,0)] focus:outline-none focus:shadow-[inset_0_0_7px_rgba(255,255,255,0.21),inset_0_-3px_4px_rgba(255,255,255,0)] active:bg-[#121920] flex items-center justify-center gap-0 px-4"
        >
          <span className="flex items-center">
            Visit reference
            <div className="ml-1 w-[22px] h-[22px] text-[12px] rounded-[8px] bg-[#FFFFFF0D] border border-[#FFFFFF0F] flex items-center justify-center">
              A
            </div>
          </span>
        </button>
      </div>
    </div>
  );
};

export default SuccessPopup;