import React from "react";
import PropTypes from "prop-types";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

const ConfirmationModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning", 
}) => {
  if (!isOpen) return null;

  let IconComponent = AlertTriangle;
  let iconColorClass = "text-yellow-500";
  let confirmButtonClass = "bg-yellow-500 hover:bg-yellow-600";

  if (type === "danger") {
    IconComponent = AlertTriangle; 
    iconColorClass = "text-red-500";
    confirmButtonClass = "bg-red-600 hover:bg-red-700";
  } else if (type === "info") {
    IconComponent = CheckCircle; 
    iconColorClass = "text-blue-500";
    confirmButtonClass = "bg-blue-600 hover:bg-blue-700";
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-[100] flex justify-center items-center px-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-auto">
        <div className="flex items-start mb-4">
          <IconComponent
            size={24}
            className={`${iconColorClass} mr-3 flex-shrink-0 mt-1`}
          />

          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        </div>
        {typeof message === "string" ? (
          <p className="text-gray-600 mb-6 ml-9">{message}</p>
        ) : (
          <div className="text-gray-600 mb-6 ml-9">{message}</div>
        )}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 transition duration-150 flex items-center"
          >
            <XCircle size={16} className="mr-2" />
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white ${confirmButtonClass} rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${type === "danger" ? "focus:ring-red-500" : type === "warning" ? "focus:ring-yellow-500" : "focus:ring-blue-500"} transition duration-150 flex items-center`}
          >
            <CheckCircle size={16} className="mr-2" />
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

ConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  type: PropTypes.oneOf(["warning", "danger", "info"]),
};

export default ConfirmationModal;
