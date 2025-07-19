import React, { useEffect, useState } from "react";
import MainPopup from "./MainPopup";
import DragDropPopup from "./DragDropPopup";
import ErrorPopup from "./ErrorPopup";
import SuccessPopup from "./SuccessPopup";

const App = ({ tagsManager }) => {
  const [popupType, setPopupType] = useState(null);
  const [popupData, setPopupData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.detail?.action === "showPopup") {
        setPopupData({
          imageUrl: event.detail.imageUrl,
          tabUrl: event.detail.tabUrl,
          type: event.detail.type,
          pageTitle: event.detail.pageTitle,
          author: event.detail.author,
          description: event.detail.description,
          loading: event.detail.loading || false,
        });
        setPopupType("main");
      } else if (event.detail?.action === "updatePopup") {
        setPopupData((prev) => ({
          ...prev,
          ...event.detail,
          loading: false,
        }));
        setPopupType("main");
      } else if (event.detail?.action === "showError") {
        setError(event.detail.message);
        setPopupType("error");
      }
    };

    window.addEventListener("oasisMessage", handleMessage);

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!document.getElementById("oasis-dragdrop-popup")) {
        setPopupType("dragdrop");
      }
    };

    window.addEventListener("dragover", handleDragOver);

    return () => {
      window.removeEventListener("oasisMessage", handleMessage);
      window.removeEventListener("dragover", handleDragOver);
    };
  }, []);

  const handleClose = () => {
    setPopupType(null);
    setPopupData(null);
    setError(null);
  };

  const showSuccess = () => {
    setPopupType("success");
    setTimeout(handleClose, 3000);
  };

  switch (popupType) {
    case "main":
      return (
        <MainPopup
          {...popupData}
          loading={popupData?.loading}
          onClose={handleClose}
          onSuccess={showSuccess}
        />
      );
    case "dragdrop":
      return <DragDropPopup onClose={handleClose} />;
    case "error":
      return <ErrorPopup message={error} onClose={handleClose} />;
    case "success":
      return <SuccessPopup onClose={handleClose} />;
    default:
      return null;
  }
};

export default App;
