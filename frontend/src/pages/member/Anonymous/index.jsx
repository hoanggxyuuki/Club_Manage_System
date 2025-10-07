import { useState, useEffect } from "react";
import {
  getAnonymousEmails,
  deleteAnonymousEmail,
  blockIp,
} from "../../../services/anonymous";
import { useAuth } from "../../../context/AuthContext";
import IpManagement from "./IpManagement";

const AnonymousMailsPage = () => {
  const [mails, setMails] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("mails");
  const { user } = useAuth();
  const isAdminOrLeader = user?.role === "admin" || user?.role === "leader";
  const url = import.meta.env.VITE_PROXY_API_URL;

  const fetchMails = async () => {
    try {
      const response = await getAnonymousEmails();
      if (Array.isArray(response)) {
        setMails(response);
      } else if (response && Array.isArray(response.mails)) {
        setMails(response.mails);
        setPagination(response.pagination);
      } else {
        setMails([]);
        console.error("Unexpected response format:", response);
      }
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMails();
  }, []);

  const handleMailDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa thư này?")) {
      try {
        await deleteAnonymousEmail(id);
        await fetchMails(); 
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleBlockIp = async (ipAddress) => {
    if (window.confirm(`Bạn có chắc chắn muốn chặn IP ${ipAddress}?`)) {
      try {
        await blockIp({
          ipAddress,
          reason: "Blocked from anonymous mail management",
        });
        alert("IP đã được chặn thành công");
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Thư ẩn danh</h1>

      {isAdminOrLeader && (
        <div className="mb-6">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab("mails")}
              className={`px-4 py-2 rounded ${
                activeTab === "mails"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Danh sách thư
            </button>
            <button
              onClick={() => setActiveTab("ips")}
              className={`px-4 py-2 rounded ${
                activeTab === "ips"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Quản lý IP
            </button>
          </nav>
        </div>
      )}

      {activeTab === "ips" && isAdminOrLeader ? (
        <IpManagement />
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tiêu đề
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nội dung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ảnh/File
                  </th>
                  {isAdminOrLeader && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  {isAdminOrLeader && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mails && mails.length > 0 ? (
                  mails.map((mail) => (
                    <tr key={mail._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {mail.title}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-md">
                          <div className="line-clamp-3 hover:line-clamp-none transition-all duration-200 cursor-pointer">
                            {mail.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-2">
                          {mail.files?.map((file, index) => (
                            <a
                              key={`${url}uploads/anonymous/anonymous-${index}`}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src={`${url}uploads/anonymous/${file.filename}`}
                                alt={`Attachment ${index + 1}`}
                                className="h-20 w-20 object-cover rounded cursor-pointer hover:opacity-80"
                              />
                            </a>
                          ))}
                          {mail.imageUrls?.map((url, index) => (
                            <a
                              key={`url-${index}`}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src={url}
                                alt={`External image ${index + 1}`}
                                className="h-20 w-20 object-cover rounded cursor-pointer hover:opacity-80"
                              />
                            </a>
                          ))}
                        </div>
                      </td>
                      {isAdminOrLeader && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-mono">
                            <div>Req: {mail.ipAddress}</div>
                            <div>API: {mail.ipAddressFromApi}</div>
                            <button
                              onClick={() => handleBlockIp(mail.ipAddress)}
                              className="mt-1 text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                            >
                              Chặn IP
                            </button>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(mail.createdAt).toLocaleString()}
                        </div>
                      </td>
                      {isAdminOrLeader && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleMailDelete(mail._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Xóa
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={isAdminOrLeader ? 6 : 4}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Không có thư ẩn danh nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination && (
            <div className="px-6 py-4 flex justify-between items-center border-t">
              <div className="text-sm text-gray-700">
                Trang {pagination.page} / {pagination.pages} · Tổng{" "}
                {pagination.total} thư
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnonymousMailsPage;
