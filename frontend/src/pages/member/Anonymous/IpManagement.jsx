import { useState, useEffect } from 'react';
import { getBlockedIps, blockIp, unblockIp } from '../../../services/anonymous';

const IpManagement = () => {
  const [blockedIps, setBlockedIps] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [newIp, setNewIp] = useState('');
  const [reason, setReason] = useState('');

  const fetchBlockedIps = async () => {
    try {
      const response = await getBlockedIps();
      if (response.blockedIps) {
        setBlockedIps(response.blockedIps);
        setPagination(response.pagination);
      }
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedIps();
  }, []);

  const handleBlockIp = async (e) => {
    e.preventDefault();
    if (!newIp.trim()) return;

    try {
      await blockIp({ ipAddress: newIp.trim(), reason: reason.trim() });
      setNewIp('');
      setReason('');
      setShowBlockForm(false);
      await fetchBlockedIps();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUnblockIp = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn bỏ chặn IP này?')) {
      try {
        await unblockIp(id);
        await fetchBlockedIps();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Quản lý IP bị chặn</h2>
        <button
          onClick={() => setShowBlockForm(!showBlockForm)}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Chặn IP mới
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
          {error}
        </div>
      )}

      {showBlockForm && (
        <form onSubmit={handleBlockIp} className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-medium mb-3">Chặn IP mới</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ IP
              </label>
              <input
                type="text"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                placeholder="192.168.1.1"
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lý do (tùy chọn)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Vi phạm quy định..."
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Chặn IP
            </button>
            <button
              type="button"
              onClick={() => setShowBlockForm(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Địa chỉ IP
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Lý do
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Người chặn
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Thời gian
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {blockedIps && blockedIps.length > 0 ? (
              blockedIps.map((ip) => (
                <tr key={ip._id}>
                  <td className="px-6 py-4 whitespace-nowrap font-mono">
                    {ip.ipAddress}
                  </td>
                  <td className="px-6 py-4">
                    {ip.reason}
                  </td>
                  <td className="px-6 py-4">
                    {ip.blockedBy?.username || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(ip.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleUnblockIp(ip._id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Bỏ chặn
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  Không có IP nào bị chặn
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Trang {pagination.page} / {pagination.pages} · Tổng {pagination.total} IP
          </div>
        </div>
      )}
    </div>
  );
};

export default IpManagement;
