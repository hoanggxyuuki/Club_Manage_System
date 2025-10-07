import React from 'react';

const Skeleton = ({ 
  type = 'text', 
  lines = 1, 
  className = '',
  width = 'full',
  height = 'h-4'
}) => {
  const widthClasses = {
    full: 'w-full',
    '1/2': 'w-1/2',
    '1/3': 'w-1/3',
    '1/4': 'w-1/4',
    '2/3': 'w-2/3',
    '3/4': 'w-3/4'
  };

  const renderSkeleton = () => {
    switch (type) {
      case 'text':
        return (
          <div className={`${widthClasses[width]} ${className}`}>
            {Array.from({ length: lines }).map((_, index) => (
              <div
                key={index}
                className={`${height} bg-gray-200 rounded animate-pulse mb-2 ${
                  index === lines - 1 ? 'w-3/4' : 'w-full'
                }`}
              />
            ))}
          </div>
        );

      case 'avatar':
        return (
          <div className={`${widthClasses[width]} ${className}`}>
            <div className={`${height} bg-gray-200 rounded-full animate-pulse`} />
          </div>
        );

      case 'card':
        return (
          <div className={`${widthClasses[width]} ${className}`}>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-5/6" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-4/6" />
              </div>
            </div>
          </div>
        );

      case 'table':
        return (
          <div className={`${widthClasses[width]} ${className}`}>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
              </div>
              <div className="divide-y divide-gray-200">
                {Array.from({ length: lines }).map((_, index) => (
                  <div key={index} className="px-4 py-3">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded animate-pulse" />
                        <div className="h-2 bg-gray-200 rounded animate-pulse w-2/3" />
                      </div>
                      <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'list':
        return (
          <div className={`${widthClasses[width]} ${className}`}>
            <div className="space-y-3">
              {Array.from({ length: lines }).map((_, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-1" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className={`${widthClasses[width]} ${height} bg-gray-200 rounded animate-pulse ${className}`} />
        );
    }
  };

  return renderSkeleton();
};

// Skeleton cho các component cụ thể
export const CardSkeleton = ({ className = '' }) => (
  <Skeleton type="card" className={className} />
);

export const TableSkeleton = ({ rows = 5, className = '' }) => (
  <Skeleton type="table" lines={rows} className={className} />
);

export const ListSkeleton = ({ items = 3, className = '' }) => (
  <Skeleton type="list" lines={items} className={className} />
);

export const AvatarSkeleton = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };
  
  return (
    <div className={`${sizeClasses[size]} bg-gray-200 rounded-full animate-pulse ${className}`} />
  );
};

export default Skeleton; 