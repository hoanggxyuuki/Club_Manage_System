import React, { useState, useEffect } from "react";
import { AlertOctagon, X } from "lucide-react";

const ErrorDisplay = ({ error }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setVisible(true);

      
      const timer = setTimeout(() => {
        setVisible(false);
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!error || !visible) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
      <div className="bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md">
        <AlertOctagon className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm flex-1">{error}</p>
        <button
          onClick={() => setVisible(false)}
          className="text-white/80 hover:text-white p-1 rounded-full hover:bg-red-700/50 transition-colors"
          aria-label="Close error message"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ErrorDisplay;
