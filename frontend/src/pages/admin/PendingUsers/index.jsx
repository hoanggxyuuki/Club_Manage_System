import React, { useState, useEffect, useCallback } from "react";
import {
  getPendingUsers,
  approveUser,
  rejectUser,
  setUserToInterview,
} from "../../../services/userService";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const PendingUsersPage = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("pending"); 
  const [isNoData, setIsNoData] = useState(false);

  
  const [showModal, setShowModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [interviewDate, setInterviewDate] = useState(new Date());
  const [interviewLocation, setInterviewLocation] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");

  const fetchPendingUsers = useCallback(async () => {
    try {
      setLoading(true);
      setIsNoData(false); 

      console.log("Đang gọi API pending users");

      try {
        const data = await getPendingUsers();
        console.log("Dữ liệu từ getPendingUsers:", data);

        
        if (Array.isArray(data)) {
          console.log(`Có ${data.length} người dùng được tìm thấy`);
          setPendingUsers(data);

          
          filterUsers(data, filterStatus);

          setError(null);
        } else {
          console.error("Dữ liệu nhận về không phải là mảng:", data);
          setPendingUsers([]);
          setFilteredUsers([]);
          setIsNoData(true);
          setError("Định dạng dữ liệu không đúng");
        }
      } catch (err) {
        console.error("Error in getPendingUsers:", err);
        setPendingUsers([]);
        setFilteredUsers([]);
        setIsNoData(true);
        setError(err.message || "Failed to fetch pending users.");
      }
    } catch (err) {
      console.error("Error fetching pending users:", err);
      setError(err.message || "Failed to fetch pending users.");
      setPendingUsers([]);
      setFilteredUsers([]);
      setIsNoData(true);
    } finally {
      setLoading(false);
    }
  }, []);

  
  const filterUsers = useCallback((users, status) => {
    if (!status) {
      setFilteredUsers(users);
      setIsNoData(users.length === 0);
      return;
    }

    const filtered = users.filter(
      (user) => (user.approvalStatus || "pending") === status,
    );

    console.log(
      `Lọc theo trạng thái "${status}": ${filtered.length} người dùng`,
    );
    setFilteredUsers(filtered);
    setIsNoData(filtered.length === 0);
  }, []);

  
  useEffect(() => {
    if (pendingUsers.length > 0) {
      filterUsers(pendingUsers, filterStatus);
    }
  }, [filterStatus, pendingUsers, filterUsers]);

  useEffect(() => {
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  const handleApprove = async (userId) => {
    try {
      await approveUser(userId);
      toast.success("Người dùng đã được phê duyệt thành công!");
      fetchPendingUsers(); 
    } catch (err) {
      toast.error(err.message || "Không thể phê duyệt người dùng.");
    }
  };

  const handleReject = async (userId) => {
    try {
      await rejectUser(userId);
      toast.success("Đã từ chối người dùng thành công!");
      fetchPendingUsers(); 
    } catch (err) {
      toast.error(err.message || "Không thể từ chối người dùng.");
    }
  };

  const openInterviewModal = (userId) => {
    setSelectedUserId(userId);
    setInterviewDate(new Date());
    setInterviewLocation("");
    setInterviewNotes("");
    setShowModal(true);
  };

  const closeInterviewModal = () => {
    setShowModal(false);
    setSelectedUserId(null);
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();

    if (!selectedUserId || !interviewDate || !interviewLocation) {
      toast.error("Vui lòng điền đầy đủ thông tin phỏng vấn");
      return;
    }

    try {
      await setUserToInterview(selectedUserId, {
        interviewDate,
        interviewLocation,
        interviewNotes:
          interviewNotes ||
          `Phỏng vấn được lên lịch lúc: ${new Date().toLocaleString()}`,
      });
      toast.success("Đã lên lịch phỏng vấn thành công!");
      closeInterviewModal();
      fetchPendingUsers();
    } catch (err) {
      toast.error(err.message || "Không thể lên lịch phỏng vấn.");
    }
  };

  
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "reviewing":
        return "bg-blue-100 text-blue-800";
      case "interview":
        return "bg-indigo-100 text-indigo-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  
  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Chờ duyệt";
      case "reviewing":
        return "Đang xem xét";
      case "interview":
        return "Đã lên lịch phỏng vấn";
      case "approved":
        return "Đã phê duyệt";
      case "rejected":
        return "Đã từ chối";
      default:
        return "Chờ duyệt";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl text-gray-700">
          <div role="status">
            <svg
              aria-hidden="true"
              className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />

              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
          Loading pending users...
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Quản lý người dùng đang chờ duyệt
      </h1>

      {/* Filter controls */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div>
          <label
            htmlFor="status-filter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Lọc theo trạng thái:
          </label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="reviewing">Đang xem xét</option>
            <option value="interview">Đã lên lịch phỏng vấn</option>
            <option value="approved">Đã phê duyệt</option>
            <option value="rejected">Đã từ chối</option>
          </select>
        </div>

        <button
          onClick={fetchPendingUsers}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Làm mới danh sách
        </button>
      </div>

      {isNoData ? (
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Không có người dùng nào{" "}
            {filterStatus
              ? getStatusText(filterStatus).toLowerCase()
              : "đang chờ duyệt"}
            !
          </h3>
          <p className="mt-1 text-gray-500">
            {filterStatus
              ? `Hiện tại không có người dùng nào ở trạng thái "${getStatusText(filterStatus).toLowerCase()}".`
              : "Hiện tại không có người dùng mới nào đang chờ duyệt."}
          </p>
          <div className="mt-6">
            <button
              onClick={() => (window.location.href = "/admin/dashboard")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Quay lại Dashboard
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên người dùng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên đầy đủ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày đăng ký
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phỏng vấn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr
                  key={user._id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {user.fullName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {user.createdAt
                      ? format(new Date(user.createdAt), "dd/MM/yyyy", {
                          locale: vi,
                        })
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(user.approvalStatus || "pending")}`}
                    >
                      {getStatusText(user.approvalStatus || "pending")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {user.interviewDate ? (
                      <div>
                        <div>
                          {format(
                            new Date(user.interviewDate),
                            "dd/MM/yyyy HH:mm",
                            { locale: vi },
                          )}
                        </div>
                        {user.interviewLocation && (
                          <div className="text-xs text-gray-500">
                            {user.interviewLocation}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">Chưa lên lịch</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() =>
                        (window.location.href = `/admin/pending-users/${user._id}`)
                      }
                      className="mr-2 px-3 py-1 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Xem
                    </button>

                    {(!user.approvalStatus ||
                      user.approvalStatus === "pending" ||
                      user.approvalStatus === "reviewing") && (
                      <button
                        onClick={() => openInterviewModal(user._id)}
                        className="mr-2 px-3 py-1 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-md shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Lên lịch phỏng vấn
                      </button>
                    )}

                    {(!user.approvalStatus ||
                      user.approvalStatus === "pending" ||
                      user.approvalStatus === "reviewing" ||
                      user.approvalStatus === "interview") && (
                      <button
                        onClick={() => handleApprove(user._id)}
                        className="mr-2 px-3 py-1 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-md shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Phê duyệt
                      </button>
                    )}

                    {(!user.approvalStatus ||
                      user.approvalStatus === "pending" ||
                      user.approvalStatus === "reviewing" ||
                      user.approvalStatus === "interview") && (
                      <button
                        onClick={() => handleReject(user._id)}
                        className="px-3 py-1 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Từ chối
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Lên lịch phỏng vấn */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative bg-white rounded-lg shadow-lg mx-4 md:mx-auto w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-medium text-gray-900">
                Lên lịch phỏng vấn
              </h3>
              <button
                onClick={closeInterviewModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleScheduleInterview}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thời gian phỏng vấn:
                </label>
                <DatePicker
                  selected={interviewDate}
                  onChange={(date) => setInterviewDate(date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="dd/MM/yyyy HH:mm"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholderText="Chọn ngày và giờ"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa điểm phỏng vấn:
                </label>
                <select
                  value={interviewLocation}
                  onChange={(e) => setInterviewLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">-- Chọn địa điểm --</option>
                  <option value="Phòng họp A - Tòa nhà IT">
                    Phòng họp A - Tòa nhà IT
                  </option>
                  <option value="Phòng họp B - Tòa nhà IT">
                    Phòng họp B - Tòa nhà IT
                  </option>
                  <option value="Phòng CLB - Tầng 3 Tòa nhà IT">
                    Phòng CLB - Tầng 3 Tòa nhà IT
                  </option>
                  <option value="Phòng Zoom Online">Phòng Zoom Online</option>
                  <option value="Google Meet Online">Google Meet Online</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú:
                </label>
                <textarea
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Thông tin bổ sung cho buổi phỏng vấn..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeInterviewModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Lưu lịch phỏng vấn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingUsersPage;
