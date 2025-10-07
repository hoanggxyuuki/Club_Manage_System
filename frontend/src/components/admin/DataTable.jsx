import React, { useState, useMemo } from 'react';
import {
    EyeIcon,
    PencilIcon,
    TrashIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    MagnifyingGlassIcon,
    ArrowDownTrayIcon,
    FunnelIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';

const DataTable = ({
    data = [],
    columns = [],
    pagination = {},
    loading = false,
    searchTerm = '',
    onSearchChange,
    onPageChange,
    onView,
    onEdit,
    onDelete,
    onExport,
    tableName = '',
    showActions = true,
    customActions = []
}) => {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const formatValue = (value, key) => {
        if (value === null || value === undefined) return '-';
        
        if (key.includes('Date') || key.includes('timestamp') || key.includes('At')) {
            return new Date(value).toLocaleString('vi-VN');
        }
        
        if (typeof value === 'object') {
            if (Array.isArray(value)) {
                return `[${value.length} items]`;
            }
            return JSON.stringify(value, null, 2);
        }
        
        if (typeof value === 'boolean') {
            return value ? 'Có' : 'Không';
        }
        
        if (typeof value === 'string' && value.length > 50) {
            return value.substring(0, 50) + '...';
        }
        
        return String(value);
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = React.useMemo(() => {
        if (!sortConfig.key) return data;
        
        return [...data].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];
            
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;
            
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortConfig.direction === 'asc' 
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }
            
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    const getSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey) {
            return <span className="text-gray-400">↕️</span>;
        }
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex justify-center items-center">
                    <LoadingSpinner size="lg" text="Đang tải dữ liệu..." />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header with search and actions */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {tableName} ({data.length} bản ghi)
                        </h3>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                value={searchTerm}
                                onChange={(e) => onSearchChange?.(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                            />
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        </div>
                        
                        {/* Export button */}
                        {onExport && (
                            <button
                                onClick={() => onExport(data, tableName)}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
                            >
                                <ArrowDownTrayIcon className="h-5 w-5" />
                                Xuất CSV
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            {data.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {columns.map((column) => (
                                    <th
                                        key={column}
                                        onClick={() => handleSort(column)}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>{column}</span>
                                            <span className="text-sm">{getSortIcon(column)}</span>
                                        </div>
                                    </th>
                                ))}
                                {(showActions || customActions.length > 0) && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedData.map((row, index) => (
                                <tr key={row._id || index} className="hover:bg-gray-50">
                                    {columns.map((column) => (
                                        <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div 
                                                className="max-w-xs truncate" 
                                                title={formatValue(row[column], column)}
                                            >
                                                {formatValue(row[column], column)}
                                            </div>
                                        </td>
                                    ))}
                                    {(showActions || customActions.length > 0) && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                {showActions && (
                                                    <>
                                                        {onView && (
                                                            <button
                                                                onClick={() => onView(row)}
                                                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                                title="Xem chi tiết"
                                                            >
                                                                <EyeIcon className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        {onEdit && (
                                                            <button
                                                                onClick={() => onEdit(row)}
                                                                className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                                                title="Chỉnh sửa"
                                                            >
                                                                <PencilIcon className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        {onDelete && (
                                                            <button
                                                                onClick={() => onDelete(row)}
                                                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                                                title="Xóa"
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                                {customActions.map((action, actionIndex) => (
                                                    <button
                                                        key={actionIndex}
                                                        onClick={() => action.onClick(row)}
                                                        className={`p-1 rounded ${action.className || 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                                                        title={action.title}
                                                    >
                                                        {action.icon}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-8 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <FunnelIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Không có dữ liệu
                    </h3>
                    <p className="text-gray-600">
                        {searchTerm ? 'Không tìm thấy kết quả phù hợp với từ khóa tìm kiếm.' : 'Hiện tại không có dữ liệu nào.'}
                    </p>
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                    <div className="text-sm text-gray-700">
                        Hiển thị {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total} bản ghi
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => onPageChange?.(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className="px-3 py-2 rounded-md bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors flex items-center gap-1"
                        >
                            <ChevronLeftIcon className="h-4 w-4" />
                            Trước
                        </button>
                        
                        <div className="flex space-x-1">
                            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                let pageNum;
                                if (pagination.pages <= 5) {
                                    pageNum = i + 1;
                                } else if (pagination.page <= 3) {
                                    pageNum = i + 1;
                                } else if (pagination.page >= pagination.pages - 2) {
                                    pageNum = pagination.pages - 4 + i;
                                } else {
                                    pageNum = pagination.page - 2 + i;
                                }
                                
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => onPageChange?.(pageNum)}
                                        className={`px-3 py-2 rounded-md transition-colors ${
                                            pageNum === pagination.page
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        
                        <button
                            onClick={() => onPageChange?.(pagination.page + 1)}
                            disabled={pagination.page >= pagination.pages}
                            className="px-3 py-2 rounded-md bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors flex items-center gap-1"
                        >
                            Sau
                            <ChevronRightIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataTable;
