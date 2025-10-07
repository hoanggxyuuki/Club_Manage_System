import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const LoadingOverlay = ({ 
  loading = false, 
  children, 
  text = 'Đang xử lý...',
  backdrop = true,
  size = 'md',
  className = ''
}) => {
  if (!loading) {
    return children;
  }

  return (
    <div className={`relative ${className}`}>
      {children}
      <div className={`absolute inset-0 flex items-center justify-center ${backdrop ? 'bg-white bg-opacity-75' : ''} z-10`}>
        <div className="flex flex-col items-center">
          <LoadingSpinner size={size} />
          {text && (
            <p className="mt-2 text-sm text-gray-600">{text}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay; 