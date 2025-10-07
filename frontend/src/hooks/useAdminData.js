import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../services/api';
import { useNotification } from '../context/NotificationContext';

// Hook cho quản lý dữ liệu bảng với phân trang và tìm kiếm
export const useTableData = (tableName, initialOptions = {}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });
    
    const [options, setOptions] = useState({
        page: 1,
        limit: 10,
        search: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        filters: {},
        ...initialOptions
    });

    const { showToast } = useNotification();

    const fetchData = useCallback(async () => {
        if (!tableName) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const response = await adminApi.getTableData(tableName, options);
            
            if (response.success) {
                setData(response.data || []);
                setPagination(response.pagination || {});
            } else {
                throw new Error(response.message || 'Lỗi khi lấy dữ liệu');
            }
        } catch (err) {
            setError(err.message);
            showToast('Lỗi khi tải dữ liệu: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [tableName, options, showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const updateOptions = useCallback((newOptions) => {
        setOptions(prev => ({ ...prev, ...newOptions }));
    }, []);

    const refresh = useCallback(() => {
        fetchData();
    }, [fetchData]);

    return {
        data,
        loading,
        error,
        pagination,
        options,
        updateOptions,
        refresh
    };
};

// Hook cho CRUD operations
export const useCrudOperations = (tableName) => {
    const [loading, setLoading] = useState(false);
    const { showToast } = useNotification();

    const createRecord = useCallback(async (recordData) => {
        setLoading(true);
        try {
            const response = await adminApi.createRecord(tableName, recordData);
            if (response.success) {
                showToast('Tạo mới thành công!', 'success');
                return response.data;
            } else {
                throw new Error(response.message || 'Lỗi khi tạo bản ghi');
            }
        } catch (error) {
            showToast('Lỗi khi tạo: ' + error.message, 'error');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [tableName, showToast]);

    const updateRecord = useCallback(async (id, recordData) => {
        setLoading(true);
        try {
            const response = await adminApi.updateRecord(tableName, id, recordData);
            if (response.success) {
                showToast('Cập nhật thành công!', 'success');
                return response.data;
            } else {
                throw new Error(response.message || 'Lỗi khi cập nhật bản ghi');
            }
        } catch (error) {
            showToast('Lỗi khi cập nhật: ' + error.message, 'error');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [tableName, showToast]);

    const deleteRecord = useCallback(async (id) => {
        setLoading(true);
        try {
            const response = await adminApi.deleteRecord(tableName, id);
            if (response.success) {
                showToast('Xóa thành công!', 'success');
                return true;
            } else {
                throw new Error(response.message || 'Lỗi khi xóa bản ghi');
            }
        } catch (error) {
            showToast('Lỗi khi xóa: ' + error.message, 'error');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [tableName, showToast]);

    const getRecordDetail = useCallback(async (id) => {
        setLoading(true);
        try {
            const response = await adminApi.getRecordDetail(tableName, id);
            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.message || 'Lỗi khi lấy chi tiết bản ghi');
            }
        } catch (error) {
            showToast('Lỗi khi lấy chi tiết: ' + error.message, 'error');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [tableName, showToast]);

    return {
        loading,
        createRecord,
        updateRecord,
        deleteRecord,
        getRecordDetail
    };
};

// Hook cho thống kê nâng cao
export const useAdvancedStats = (options = {}) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { showToast } = useNotification();

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await adminApi.getAdvancedStats(options);
            if (response.success) {
                setStats(response.stats);
            } else {
                throw new Error(response.message || 'Lỗi khi lấy thống kê');
            }
        } catch (err) {
            setError(err.message);
            showToast('Lỗi khi tải thống kê: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [options, showToast]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return {
        stats,
        loading,
        error,
        refresh: fetchStats
    };
};

// Hook cho xuất dữ liệu
export const useDataExport = () => {
    const [exporting, setExporting] = useState(false);
    const { showToast } = useNotification();

    const exportToCSV = useCallback((data, filename) => {
        if (!data || data.length === 0) {
            showToast('Không có dữ liệu để xuất', 'warning');
            return;
        }

        setExporting(true);
        
        try {
            const headers = Object.keys(data[0]);
            const csvContent = [
                headers.join(','),
                ...data.map(row => 
                    headers.map(header => {
                        const value = row[header];
                        if (typeof value === 'object' && value !== null) {
                            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
                        }
                        return `"${String(value || '').replace(/"/g, '""')}"`;
                    }).join(',')
                )
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showToast('Xuất file thành công!', 'success');
        } catch (error) {
            showToast('Lỗi khi xuất file: ' + error.message, 'error');
        } finally {
            setExporting(false);
        }
    }, [showToast]);

    const exportToJSON = useCallback((data, filename) => {
        if (!data || data.length === 0) {
            showToast('Không có dữ liệu để xuất', 'warning');
            return;
        }

        setExporting(true);
        
        try {
            const jsonContent = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showToast('Xuất file thành công!', 'success');
        } catch (error) {
            showToast('Lỗi khi xuất file: ' + error.message, 'error');
        } finally {
            setExporting(false);
        }
    }, [showToast]);

    return {
        exporting,
        exportToCSV,
        exportToJSON
    };
};
