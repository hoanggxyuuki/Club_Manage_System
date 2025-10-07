import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  DocumentTextIcon, 
  CalendarIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { adminApi } from '../../../services/api';
import { useNotification } from '../../../context/NotificationContext';
import { useTableData, useCrudOperations, useDataExport } from '../../../hooks/useAdminData';
import DataTable from '../../../components/admin/DataTable';
import Modal from '../../../components/common/Modal';

const DataManagement = () => {
  const [allData, setAllData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const { showToast } = useNotification();
  const { exportToCSV } = useDataExport();
  
  // Use custom hooks for table operations
  const { 
    data: tableData, 
    loading: tableLoading, 
    pagination, 
    options, 
    updateOptions, 
    refresh: refreshTable 
  } = useTableData(selectedTable);
  
  const { 
    updateRecord, 
    deleteRecord, 
    loading: crudLoading 
  } = useCrudOperations(selectedTable);

  const tableConfig = {
    users: {
      name: 'Người dùng',
      icon: UserGroupIcon,
      color: 'blue',
      columns: ['_id', 'username', 'email', 'role', 'isActive', 'createdAt']
    },
    members: {
      name: 'Thành viên',
      icon: UserGroupIcon,
      color: 'green',
      columns: ['_id', 'name', 'studentId', 'email', 'class', 'createdAt']
    },
    events: {
      name: 'Sự kiện',
      icon: CalendarIcon,
      color: 'purple',
      columns: ['_id', 'title', 'description', 'startDate', 'endDate', 'status']
    },
    achievements: {
      name: 'Thành tích',
      icon: TrophyIcon,
      color: 'yellow',
      columns: ['_id', 'title', 'description', 'type', 'createdAt']
    },
    competitions: {
      name: 'Cuộc thi',
      icon: TrophyIcon,
      color: 'red',
      columns: ['_id', 'name', 'description', 'startDate', 'endDate', 'status']
    },
    clubNews: {
      name: 'Tin tức CLB',
      icon: DocumentTextIcon,
      color: 'indigo',
      columns: ['_id', 'title', 'content', 'author', 'isPublished', 'createdAt']
    },
    chats: {
      name: 'Tin nhắn',
      icon: ChatBubbleLeftRightIcon,
      color: 'pink',
      columns: ['_id', 'sender', 'receiver', 'message', 'timestamp', 'messageType']
    },
    forum: {
      name: 'Diễn đàn',
      icon: ChatBubbleLeftRightIcon,
      color: 'cyan',
      columns: ['_id', 'title', 'content', 'author', 'category', 'createdAt']
    },
    tasks: {
      name: 'Nhiệm vụ',
      icon: DocumentTextIcon,
      color: 'emerald',
      columns: ['_id', 'title', 'description', 'assignedTo', 'status', 'dueDate']
    },
    groups: {
      name: 'Nhóm',
      icon: UserGroupIcon,
      color: 'orange',
      columns: ['_id', 'name', 'description', 'members', 'createdBy', 'createdAt']
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getAllData();
     
      if (response.data) {
        setAllData(response.data);
        
      } else {
        setAllData(response);
      }
      showToast('Tải dữ liệu thành công!', 'success');
    } catch (error) {
      console.error('Error fetching all data:', error);
      showToast('Lỗi khi tải dữ liệu: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = (tableName) => {
    setSelectedTable(tableName);
    // Reset other states when changing table
    setSelectedRecord(null);
    setEditingRecord(null);
    setShowDetailModal(false);
    setShowEditModal(false);
  };

  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  const handleEditRecord = (record) => {
    setEditingRecord({ ...record });
    setShowEditModal(true);
  };

  const handleDeleteRecord = async (record) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) return;
    
    try {
      await deleteRecord(record._id);
      refreshTable(); // Refresh the table data
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleSaveEdit = async () => {
    try {
      const { _id, ...updateData } = editingRecord;
      await updateRecord(_id, updateData);
      refreshTable(); // Refresh the table data
      setShowEditModal(false);
      setEditingRecord(null);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleSearchChange = (search) => {
    updateOptions({ search, page: 1 });
  };

  const handlePageChange = (page) => {
    updateOptions({ page });
  };  const handleExport = (data, filename) => {
    exportToCSV(data, filename);
  };

  const closeDetailModal = () => {
    setSelectedRecord(null);
    setShowDetailModal(false);
  };

  const closeEditModal = () => {
    setEditingRecord(null);
    setShowEditModal(false);
  };

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
    
    return String(value);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Dữ liệu Hệ thống</h1>
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
        <p className="text-gray-600">
          Xem và quản lý toàn bộ dữ liệu trong hệ thống Club Management
        </p>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {allData && !loading && (
        <>
          {/* Overall Statistics */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 mb-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Thống kê tổng quan</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {Object.values(allData).reduce((total, arr) => total + (Array.isArray(arr) ? arr.length : 0), 0)}
                </div>
                <div className="text-blue-100 text-sm">Tổng bản ghi</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {Object.keys(tableConfig).length}
                </div>
                <div className="text-blue-100 text-sm">Bảng dữ liệu</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {allData.users?.filter(u => u.isActive)?.length || 0}
                </div>
                <div className="text-blue-100 text-sm">User hoạt động</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {new Date().toLocaleDateString('vi-VN')}
                </div>
                <div className="text-blue-100 text-sm">Cập nhật lần cuối</div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Object.entries(tableConfig).map(([key, config]) => {
              const count = allData[key]?.length || 0;
              const Icon = config.icon;
              
              const colorClasses = {
                blue: 'border-blue-500 bg-blue-100 text-blue-600',
                green: 'border-green-500 bg-green-100 text-green-600',
                purple: 'border-purple-500 bg-purple-100 text-purple-600',
                yellow: 'border-yellow-500 bg-yellow-100 text-yellow-600',
                red: 'border-red-500 bg-red-100 text-red-600',
                indigo: 'border-indigo-500 bg-indigo-100 text-indigo-600',
                pink: 'border-pink-500 bg-pink-100 text-pink-600',
                cyan: 'border-cyan-500 bg-cyan-100 text-cyan-600',
                emerald: 'border-emerald-500 bg-emerald-100 text-emerald-600',
                orange: 'border-orange-500 bg-orange-100 text-orange-600'
              };
              
              return (
                <div
                  key={key}
                  onClick={() => handleTableSelect(key)}
                  className={`bg-white rounded-xl shadow-lg p-6 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl border-l-4 ${colorClasses[config.color]?.split(' ')[0] || 'border-gray-500'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">{config.name}</p>
                      <p className="text-3xl font-bold text-gray-900">{count}</p>
                    </div>
                    <div className={`p-3 rounded-full ${colorClasses[config.color]?.split(' ')[1] || 'bg-gray-100'}`}>
                      <Icon className={`h-6 w-6 ${colorClasses[config.color]?.split(' ')[2] || 'text-gray-600'}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table Data Display */}
          {selectedTable && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {tableConfig[selectedTable]?.name} ({pagination?.total || 0} bản ghi)
                  </h2>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        value={options.search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                      />
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                    <button
                      onClick={() => handleExport(tableData, selectedTable)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
                      disabled={!tableData || tableData.length === 0}
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                      Xuất CSV
                    </button>
                  </div>
                </div>
              </div>

              <DataTable
                data={tableData}
                columns={tableConfig[selectedTable]?.columns || []}
                loading={tableLoading}
                pagination={pagination}
                onPageChange={handlePageChange}
                onView={handleViewDetails}
                onEdit={handleEditRecord}
                onDelete={handleDeleteRecord}
                formatValue={formatValue}
              />
            </div>
          )}

          {selectedTable && !tableLoading && (!tableData || tableData.length === 0) && (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không có dữ liệu
              </h3>
              <p className="text-gray-600">
                Bảng {tableConfig[selectedTable]?.name} hiện tại không có dữ liệu nào.
              </p>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={closeDetailModal}
        title={`Chi tiết ${tableConfig[selectedTable]?.name}`}
        size="large"
      >
        {selectedRecord && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(selectedRecord).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    {key.includes('Date') || key.includes('timestamp') || key.includes('At') ? (
                      <span className="text-sm text-gray-900">
                        {value ? new Date(value).toLocaleString('vi-VN') : '-'}
                      </span>
                    ) : typeof value === 'object' && value !== null ? (
                      <pre className="text-xs text-gray-900 whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : typeof value === 'boolean' ? (
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {value ? 'Có' : 'Không'}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-900">
                        {value || '-'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDetailModal}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={() => handleExport([selectedRecord], `${selectedTable}_detail`)}
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Xuất CSV
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={closeEditModal}
        title={`Chỉnh sửa ${tableConfig[selectedTable]?.name}`}
        size="large"
      >
        {editingRecord && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(editingRecord)
                .filter(([key]) => key !== '_id' && key !== '__v')
                .map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </label>
                  <div>
                    {key.includes('Date') || key.includes('timestamp') || key.includes('At') ? (
                      <input
                        type="datetime-local"
                        value={value ? new Date(value).toISOString().slice(0, 16) : ''}
                        onChange={(e) => setEditingRecord({
                          ...editingRecord,
                          [key]: e.target.value ? new Date(e.target.value).toISOString() : null
                        })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : typeof value === 'boolean' ? (
                      <select
                        value={value.toString()}
                        onChange={(e) => setEditingRecord({
                          ...editingRecord,
                          [key]: e.target.value === 'true'
                        })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="true">Có</option>
                        <option value="false">Không</option>
                      </select>
                    ) : typeof value === 'object' && value !== null ? (
                      <textarea
                        value={JSON.stringify(value, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsedValue = JSON.parse(e.target.value);
                            setEditingRecord({
                              ...editingRecord,
                              [key]: parsedValue
                            });
                          } catch (error) {
                            // Invalid JSON, don't update
                          }
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                      />
                    ) : (
                      <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => setEditingRecord({
                          ...editingRecord,
                          [key]: e.target.value
                        })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={crudLoading}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <PencilIcon className="h-4 w-4" />
                {crudLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DataManagement;
