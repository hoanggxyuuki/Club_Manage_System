import React, { useEffect, useCallback, memo } from "react";
import PropTypes from "prop-types";
import "./modal.css";

const Modal = ({ isOpen, onClose, title, children }) => {
  
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  
  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (e) => {
      if (e.key === "Escape") handleClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscKey);

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, handleClose]);

  
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">
            {title}
          </h2>
          <button
            onClick={handleClose}
            className="modal-close-button"
            aria-label="Close modal"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};


export default memo(Modal);
