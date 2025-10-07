import React from "react";
import { X } from "lucide-react";
import PropTypes from "prop-types";

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  
  const getRandomOffset = () => {
    const offsets = ["0px", "1px", "-1px", "0.5px", "-0.5px"];
    return offsets[Math.floor(Math.random() * offsets.length)];
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop overlay with blur effect */}
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal container with positioning */}
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Modal content box with subtle decorative elements */}
        <div
          className="inline-block transform overflow-hidden rounded-xl bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle"
          style={{
            transform: `translateY(${getRandomOffset()}) rotate(${getRandomOffset()})`,
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Decorative top border with gradient */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600"></div>

          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-2xl font-semibold text-gray-900 flex items-center">
                {/* Decorative element before title */}
                <div className="h-4 w-1 bg-blue-500 rounded-full mr-2.5"></div>
                {title}
              </h3>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 bg-gray-100 hover:bg-gray-200 transition-colors duration-150 transform active:scale-95"
                aria-label="Close modal"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Content with subtle styling */}
            <div className="mt-4 relative texture-subtle">
              {/* Decorative element */}
              <div
                className="absolute top-0 right-0 w-24 h-24 opacity-5 pointer-events-none"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z' fill='%232563eb' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E\")",
                }}
              ></div>

              {children}
            </div>
          </div>
        </div>
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

export default Modal;
