import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const LoadingButton = ({ 
  loading = false, 
  children, 
  loadingText = 'Đang xử lý...',
  disabled = false,
  className = '',
  size = 'md',
  variant = 'primary',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
  };

  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  return (
    <button 
      className={classes}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" color="white" />
          <span className="ml-2">{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default LoadingButton; 