import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getUserPendingById,
  approveUser,
  rejectUser,
  updateApprovalStatus,
  setUserToInterview,
} from "../../../services/userService";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  UserCircleIcon,
  CalendarIcon,
  MapPinIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../../components/common/LoadingSpinner";

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [interviewData, setInterviewData] = useState({
    interviewDate: "",
    interviewTime: "",
    interviewLocation: "",
    interviewNotes: "",
  });

  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const data = await getUserPendingById(id);
        setUser(data);

        
        if (data.interviewDate) {
          const date = new Date(data.interviewDate);
          setInterviewData({
            interviewDate: format(date, "yyyy-MM-dd"),
            interviewTime: format(date, "HH:mm"),
            interviewLocation: data.interviewLocation || "",
            interviewNotes: data.interviewNotes || "",
          });
        }
      } catch (err) {
        setError(err.message || "Failed to fetch user details");
        toast.error(err.message || "Failed to fetch user details");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  const handleApprove = async () => {
    try {
      await approveUser(id);
      toast.success("Người dùng đã được phê duyệt thành công!");
      navigate("/admin/pending-users");
    } catch (err) {
      toast.error(err.message || "Không thể phê duyệt người dùng.");
    }
  };

  const handleReject = async () => {
    if (window.confirm("Bạn có chắc muốn từ chối người dùng này không?")) {
      try {
        await rejectUser(id);
        toast.success("Người dùng đã bị từ chối thành công!");
        navigate("/admin/pending-users");
      } catch (err) {
        toast.error(err.message || "Không thể từ chối người dùng.");
      }
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      await updateApprovalStatus(id, { status });
      toast.success(`Đã cập nhật trạng thái thành: ${status}!`);

      
      const updatedUser = await getUserPendingById(id);
      setUser(updatedUser);
    } catch (err) {
      toast.error(err.message || "Không thể cập nhật trạng thái.");
    }
  };

  const handleInterviewSubmit = async (e) => {
    e.preventDefault();

    const { interviewDate, interviewTime, interviewLocation, interviewNotes } =
      interviewData;

    if (!interviewDate || !interviewTime || !interviewLocation) {
      toast.error("Vui lòng điền đủ ngày, giờ và địa điểm phỏng vấn.");
      return;
    }

    try {
      
      const fullInterviewDate = `${interviewDate}T${interviewTime}:00`;

      await setUserToInterview(id, {
        interviewDate: fullInterviewDate,
        interviewLocation,
        interviewNotes,
      });

      toast.success("Đã lên lịch phỏng vấn thành công!");
      setShowInterviewForm(false);

      
      const updatedUser = await getUserPendingById(id);
      setUser(updatedUser);
    } catch (err) {
      toast.error(err.message || "Không thể lên lịch phỏng vấn.");
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "reviewing":
        return "bg-blue-100 text-blue-800";
      case "interview":
        return "bg-purple-100 text-purple-800";
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
        <LoadingSpinner size="lg" text="Đang tải thông tin người dùng..." />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  if (!user) {
    return <div className="text-center p-4">No user data found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="flex justify-between items-center p-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/admin/pending-users")}
              className="mr-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-2xl font-bold">
              Thông tin chi tiết người dùng
            </h1>
          </div>
          <div className="flex space-x-2">
            {(user.approvalStatus === "pending" ||
              user.approvalStatus === "reviewing") && (
              <button
                onClick={() => setShowInterviewForm(!showInterviewForm)}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-md shadow transition-colors"
              >
                Lên lịch phỏng vấn
              </button>
            )}

            {(user.approvalStatus === "pending" ||
              user.approvalStatus === "reviewing" ||
              user.approvalStatus === "interview") && (
              <>
                <button
                  onClick={handleApprove}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-md shadow transition-colors"
                >
                  Phê duyệt
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-md shadow transition-colors"
                >
                  Từ chối
                </button>
              </>
            )}
          </div>
        </div>

        {showInterviewForm && (
          <div className="p-6 bg-blue-50 border-b border-blue-100">
            <h2 className="text-xl font-semibold mb-4 text-blue-800 flex items-center">
              <CalendarIcon className="h-6 w-6 mr-2" />
              Lên lịch phỏng vấn
            </h2>

            <form onSubmit={handleInterviewSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày phỏng vấn
                  </label>
                  <input
                    type="date"
                    value={interviewData.interviewDate}
                    onChange={(e) =>
                      setInterviewData({
                        ...interviewData,
                        interviewDate: e.target.value,
                      })
                    }
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giờ phỏng vấn
                  </label>
                  <input
                    type="time"
                    value={interviewData.interviewTime}
                    onChange={(e) =>
                      setInterviewData({
                        ...interviewData,
                        interviewTime: e.target.value,
                      })
                    }
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa điểm phỏng vấn
                </label>
                <input
                  type="text"
                  value={interviewData.interviewLocation}
                  onChange={(e) =>
                    setInterviewData({
                      ...interviewData,
                      interviewLocation: e.target.value,
                    })
                  }
                  placeholder="Phòng họp, tầng, địa chỉ,..."
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={interviewData.interviewNotes}
                  onChange={(e) =>
                    setInterviewData({
                      ...interviewData,
                      interviewNotes: e.target.value,
                    })
                  }
                  placeholder="Thêm ghi chú về cuộc phỏng vấn..."
                  rows="3"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowInterviewForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Lưu lịch phỏng vấn
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-gray-300">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserCircleIcon className="w-28 h-28 text-gray-400" />
              )}
            </div>
          </div>

          {/* Trạng thái phê duyệt và phỏng vấn */}
          <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Trạng thái xét duyệt
            </h3>

            <div className="flex items-center mb-4">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(user.approvalStatus || "pending")}`}
              >
                {getStatusText(user.approvalStatus || "pending")}
              </span>

              {/* Dropdown để thay đổi trạng thái */}
              {user.approvalStatus !== "approved" &&
                user.approvalStatus !== "rejected" && (
                  <div className="ml-4">
                    <select
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Thay đổi trạng thái
                      </option>
                      <option value="pending">Chờ duyệt</option>
                      <option value="reviewing">Đang xem xét</option>
                      <option value="interview">Đã lên lịch phỏng vấn</option>
                      <option value="approved">Phê duyệt</option>
                      <option value="rejected">Từ chối</option>
                    </select>
                  </div>
                )}
            </div>

            {/* Hiển thị thông tin phỏng vấn nếu đã lên lịch */}
            {user.interviewDate && (
              <div className="mt-3 border-t border-gray-200 pt-3">
                <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-1 text-blue-600" />
                  Thông tin phỏng vấn
                </h4>

                <div className="bg-white p-3 rounded-md border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-500">Thời gian:</p>
                      <p className="font-medium">
                        {format(
                          new Date(user.interviewDate),
                          "HH:mm - EEEE, dd/MM/yyyy",
                          { locale: vi },
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Địa điểm:</p>
                      <p className="font-medium flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1 text-red-500" />

                        {user.interviewLocation || "Chưa có thông tin"}
                      </p>
                    </div>
                  </div>

                  {user.interviewNotes && (
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <p className="text-sm text-gray-500">Ghi chú:</p>
                      <p className="text-sm italic">{user.interviewNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Tên người dùng
                </label>
                <div className="mt-1 text-lg font-semibold">
                  {user.username}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Họ và tên
                </label>
                <div className="mt-1 text-lg font-semibold">
                  {user.fullName}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Email
                </label>
                <div className="mt-1 text-lg font-semibold">{user.email}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Ngày đăng ký
                </label>
                <div className="mt-1 text-lg">
                  {user.createdAt
                    ? format(new Date(user.createdAt), "dd/MM/yyyy HH:mm")
                    : "N/A"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Số điện thoại
                </label>
                <div className="mt-1 text-lg">
                  {user.phone || "Chưa cung cấp"}
                </div>
              </div>
              {user.dateOfBirth && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Ngày sinh
                  </label>
                  <div className="mt-1 text-lg">
                    {format(new Date(user.dateOfBirth), "dd/MM/yyyy")}
                  </div>
                </div>
              )}
            </div>
          </div>

          {user.bio && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-500">
                Giới thiệu bản thân
              </label>
              <div className="mt-1 text-gray-800 bg-gray-50 p-4 rounded-md border border-gray-200">
                {user.bio}
              </div>
            </div>
          )}

          {user.interests && user.interests.length > 0 && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-500">
                Sở thích
              </label>
              <div className="mt-1 flex flex-wrap gap-2">
                {user.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
