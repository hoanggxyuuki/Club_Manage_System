import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { Card } from "antd";
import { getPendingUserNotifications } from "../../../services/demoNotificationService";
import { getPendingUserClubNews } from "../../../services/clubNewsService";
import { getGroupSchedules } from "../../../services/activitySchedule";
import {
  getMemberPerformance,
  getPerformanceStats,
} from "../../../services/memberPerformance";
import { updateProfile } from "../../../services/api";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import LoadingSpinner from "../../../components/common/LoadingSpinner";

import {
  CalendarDays,
  MapPin,
  ArrowRight,
  Target,
  Upload,
  FileText,
  X,
  Calendar,
  Save,
} from "lucide-react";

const CardHeader = ({ children }) => <div className="mb-3">{children}</div>;

const CardTitle = ({ className, children }) => (
  <h3 className={className}>{children}</h3>
);

const CardContent = ({ children }) => <div>{children}</div>;
const Button = ({
  variant,
  className,
  as: Component = "button",
  children,
  ...props
}) => {
  return Component === "button" ? (
    <button className={className} {...props}>
      {children}
    </button>
  ) : (
    <Component className={className} {...props}>
      {children}
    </Component>
  );
};
const Progress = ({ value, className }) => (
  <div className={className}>
    <div
      className="bg-blue-600 h-full rounded-full"
      style={{ width: `${value}%` }}
    ></div>
  </div>
);

const DemoPage = () => {
  const { logout, user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [clubUpdates, setClubUpdates] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [error, setError] = useState(null);
  const [upcomingActivities, setUpcomingActivities] = useState([]);
  const [weeklyGoals, setWeeklyGoals] = useState(null);
  const [performanceStats, setPerformanceStats] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth) : "",
    department: user?.department || "",
    education: user?.education || "",
    skills: user?.skills || "",
    experience: user?.experience || "",
    bio: user?.bio || "",
    interests: user?.interests || [],
  });
  const [updateSuccess, setUpdateSuccess] = useState(false);

  
  const [showFullscreenForm, setShowFullscreenForm] = useState(false);

  
  useEffect(() => {
    
    if (user) {
      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (user.role === "leader" || user.role === "member") {
        navigate("/member", { replace: true });
      }
      
    }
  }, [user, navigate]);

  const [userProfile, setUserProfile] = useState({
    name: user?.username || "Người dùng",
    email: user?.email || "user@example.com",
    department: user?.department || "Chưa có thông tin",
    registrationDate: user?.createdAt
      ? format(new Date(user.createdAt), "dd/MM/yyyy", { locale: vi })
      : format(new Date(), "dd/MM/yyyy", { locale: vi }),
    status: "Đang chờ duyệt",
    completionRate: user?.profileCompletionRate || 80,
    approvalStatus: user?.approvalStatus || "pending",
    interviewDate: user?.interviewDate ? new Date(user.interviewDate) : null,
    interviewLocation: user?.interviewLocation || "",
  });

  const [faq, setFaq] = useState([
    {
      id: 1,
      question: "Quy trình xét duyệt thành viên mất bao lâu?",
      answer:
        "Quy trình xét duyệt thành viên thường mất từ 1-3 ngày làm việc tùy thuộc vào khối lượng đơn đăng ký.",
    },
    {
      id: 2,
      question: "Tôi cần bổ sung thông tin cho hồ sơ làm thế nào?",
      answer:
        'Bạn có thể đăng nhập vào hệ thống, truy cập phần "Hồ sơ cá nhân" và chọn "Chỉnh sửa thông tin" để cập nhật thông tin mới.',
    },
    {
      id: 3,
      question: "Làm thế nào để liên hệ với quản trị viên?",
      answer:
        'Bạn có thể gửi tin nhắn trực tiếp cho quản trị viên thông qua phần "Tin nhắn" hoặc gửi email đến địa chỉ admin@clubmanage.vn.',
    },
    {
      id: 4,
      question: "Khi nào tôi có thể tham gia các hoạt động của CLB?",
      answer:
        "Sau khi hồ sơ của bạn được phê duyệt, bạn sẽ nhận được thông báo và có thể tham gia tất cả các hoạt động dành cho thành viên.",
    },
  ]);

  useEffect(() => {
    fetchNotifications();
    fetchClubNews();
    fetchUpcomingActivities();
    fetchWeeklyGoals();
  }, []);

  const fetchNotifications = async () => {
    setIsLoadingNotifications(true);
    try {
      const response = await getPendingUserNotifications();
      if (response.success && response.data) {
        
        const formattedNotifications = response.data.map((notification) => ({
          ...notification,
          date: format(new Date(notification.createdAt), "dd/MM/yyyy - HH:mm", {
            locale: vi,
          }),
        }));
        setNotifications(formattedNotifications);
      }
      setIsLoadingNotifications(false);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError("Không thể tải thông báo");
      setIsLoadingNotifications(false);
    }
  };

  const fetchClubNews = async () => {
    setIsLoadingNews(true);
    try {
      const response = await getPendingUserClubNews();
      if (response.success && response.data) {
        
        const formattedNews = response.data.map((news) => ({
          ...news,
          date: format(new Date(news.publishDate), "dd/MM/yyyy", {
            locale: vi,
          }),
          img: news.image
            ? `/${news.image}`
            : "https://placehold.co/600x400/2563eb/white?text=Tin+tức+CLB",
        }));
        setClubUpdates(formattedNews);
      }
      setIsLoadingNews(false);
    } catch (error) {
      console.error("Error fetching club news:", error);
      setError("Không thể tải tin tức");
      setIsLoadingNews(false);
    }
  };

  const fetchUpcomingActivities = async () => {
    try {
      const response = await getGroupSchedules();
      if (response.success && response.data) {
        
        const upcoming = response.data
          .filter((activity) => new Date(activity.startTime) > new Date())
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
          .slice(0, 5); 

        
        const formattedActivities = upcoming.map((activity) => ({
          ...activity,
          formattedDate: format(
            new Date(activity.startTime),
            "dd/MM/yyyy - HH:mm",
            { locale: vi },
          ),
          formattedEndTime: format(new Date(activity.endTime), "HH:mm", {
            locale: vi,
          }),
        }));

        setUpcomingActivities(formattedActivities);
      }
    } catch (error) {
      console.error("Error fetching upcoming activities:", error);
    }
  };

  const fetchWeeklyGoals = async () => {
    try {
      
      const performanceResponse = await getMemberPerformance();
      if (performanceResponse.success && performanceResponse.data) {
        setWeeklyGoals(performanceResponse.data);
      }

      
      const statsResponse = await getPerformanceStats();
      if (statsResponse.success && statsResponse.data) {
        setPerformanceStats(statsResponse.data);
      }
    } catch (error) {
      console.error("Error fetching weekly goals:", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    setIsUpdating(true);
    try {
      const response = await updateProfile(profileData);
      if (response.success) {
        setUpdateSuccess(true);
        setUserProfile({
          ...userProfile,
          name: profileData.fullName,
          department: profileData.department,
        });
        setShowProfileForm(false);
      } else {
        console.error("Error updating profile:", response.message);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    
    if (name === "dateOfBirth") {
      setProfileData({
        ...profileData,
        dateOfBirth: value, 
      });
    } else {
      setProfileData({
        ...profileData,
        [name]: value,
      });
    }
  };

  
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "update":
        return "bg-blue-100 text-blue-800";
      case "info":
        return "bg-green-100 text-green-800";
      case "success":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  
  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "update":
        return "📝";
      case "info":
        return "ℹ️";
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      default:
        return "📌";
    }
  };

  
  useEffect(() => {
    if (!isLoadingNotifications && notifications.length === 0) {
      setNotifications([
        {
          id: 1,
          title: "Hồ sơ của bạn đang được xem xét",
          date: format(new Date(), "dd/MM/yyyy - HH:mm", { locale: vi }),
          message:
            "Hồ sơ của bạn đã được gửi đến quản trị viên và đang được xem xét. Chúng tôi sẽ thông báo sau khi quá trình xét duyệt hoàn tất.",
          status: "pending",
        },
      ]);
    }

    if (!isLoadingNews && clubUpdates.length === 0) {
      setClubUpdates([
        {
          id: 1,
          title: "Chào mừng thành viên mới tháng 5",
          date: format(new Date(), "dd/MM/yyyy", { locale: vi }),
          content:
            "CLB đã chào đón 15 thành viên mới trong tháng 5. Buổi giới thiệu sẽ được tổ chức vào cuối tháng.",
          summary:
            "CLB đã chào đón 15 thành viên mới trong tháng 5. Buổi giới thiệu sẽ được tổ chức vào cuối tháng.",
          img: "https://placehold.co/600x400/2563eb/white?text=Chào+mừng+thành+viên+mới",
        },
      ]);
    }
  }, [isLoadingNotifications, isLoadingNews, notifications, clubUpdates]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Top Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <img src="/iuptit_banner.svg" alt="Logo" className="h-8 w-auto" />

              <span className="ml-3 text-xl font-semibold text-blue-600">
                Hệ thống Quản lý CLB
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Xin chào, {userProfile.name}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Sidebar - User Profile */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="text-center mb-6">
                <div className="inline-block rounded-full bg-blue-100 p-3 text-blue-600 mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold">{userProfile.name}</h2>
                <p className="text-gray-600">{userProfile.email}</p>
                <div className="mt-3">
                  <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                    {userProfile.status}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium mb-3">Thông tin hồ sơ</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Khoa/Ngành:</span>
                    <span className="font-medium">
                      {userProfile.department}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày đăng ký:</span>
                    <span className="font-medium">
                      {userProfile.registrationDate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hồ sơ hoàn thiện:</span>
                    <span className="font-medium">
                      {userProfile.completionRate}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${userProfile.completionRate}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  onClick={() => setShowFullscreenForm(true)}
                >
                  Cập nhật hồ sơ
                </button>
              </div>

              {/* Full-screen CV form modal */}
              {showFullscreenForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                    {/* Modal header */}
                    <div className="border-b p-4 flex justify-between items-center">
                      <h2 className="text-xl font-semibold flex items-center">
                        <FileText className="mr-2 h-5 w-5 text-blue-600" />
                        Cập nhật hồ sơ và xem trước CV
                      </h2>
                      <button
                        onClick={() => setShowFullscreenForm(false)}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>

                    {/* Modal content */}
                    <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Form Fields */}
                        <div className="space-y-6">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                            <div className="flex items-center text-blue-700 text-sm">
                              <FileText className="mr-2 h-4 w-4" />

                              <p>
                                Cập nhật thông tin bên trái để xem mẫu CV của
                                bạn bên phải
                              </p>
                            </div>
                          </div>

                          <form onSubmit={handleProfileUpdate}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                              <div className="col-span-2">
                                <label
                                  htmlFor="fullName"
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  Họ và tên
                                </label>
                                <input
                                  type="text"
                                  id="fullName"
                                  name="fullName"
                                  value={profileData.fullName}
                                  onChange={handleInputChange}
                                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                  placeholder="Nhập họ và tên đầy đủ"
                                />
                              </div>

                              <div>
                                <label
                                  htmlFor="phone"
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  Số điện thoại
                                </label>
                                <input
                                  type="text"
                                  id="phone"
                                  name="phone"
                                  value={profileData.phone}
                                  onChange={handleInputChange}
                                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                  placeholder="VD: 0901234567"
                                />
                              </div>

                              <div>
                                <label
                                  htmlFor="dateOfBirth"
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  Ngày sinh
                                </label>
                                <input
                                  type="date"
                                  id="dateOfBirth"
                                  name="dateOfBirth"
                                  value={profileData.dateOfBirth || ""}
                                  onChange={handleInputChange}
                                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                              </div>

                              <div className="col-span-2">
                                <label
                                  htmlFor="department"
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  Khoa/Ngành
                                </label>
                                <input
                                  type="text"
                                  id="department"
                                  name="department"
                                  value={profileData.department}
                                  onChange={handleInputChange}
                                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                  placeholder="VD: Công nghệ thông tin"
                                />
                              </div>

                              <div className="col-span-2">
                                <label
                                  htmlFor="education"
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  Trình độ học vấn
                                </label>
                                <input
                                  type="text"
                                  id="education"
                                  name="education"
                                  value={profileData.education}
                                  onChange={handleInputChange}
                                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                  placeholder="VD: Sinh viên năm 2 ngành CNTT, UIT"
                                />
                              </div>

                              <div className="col-span-2">
                                <label
                                  htmlFor="skills"
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  Kỹ năng
                                </label>
                                <input
                                  type="text"
                                  id="skills"
                                  name="skills"
                                  value={profileData.skills}
                                  onChange={handleInputChange}
                                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                  placeholder="VD: HTML, CSS, JavaScript, React, C++, Python"
                                />

                                <p className="text-xs text-gray-500 mt-1">
                                  Các kỹ năng cách nhau bởi dấu phẩy
                                </p>
                              </div>

                              <div className="col-span-2">
                                <label
                                  htmlFor="experience"
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  Kinh nghiệm
                                </label>
                                <textarea
                                  id="experience"
                                  name="experience"
                                  rows="3"
                                  value={profileData.experience}
                                  onChange={handleInputChange}
                                  placeholder="VD: Dự án website cá nhân, Thực tập tại công ty ABC..."
                                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                              </div>

                              <div className="col-span-2">
                                <label
                                  htmlFor="bio"
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  Giới thiệu bản thân
                                </label>
                                <textarea
                                  id="bio"
                                  name="bio"
                                  rows="4"
                                  value={profileData.bio}
                                  onChange={handleInputChange}
                                  placeholder="Hãy giới thiệu ngắn gọn về bản thân bạn, mục tiêu và định hướng nghề nghiệp..."
                                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                              </div>

                              <div className="col-span-2">
                                <label
                                  htmlFor="interests"
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  Sở thích
                                </label>
                                <input
                                  type="text"
                                  id="interests"
                                  name="interests"
                                  value={profileData.interests.join(", ")}
                                  onChange={(e) =>
                                    setProfileData({
                                      ...profileData,
                                      interests: e.target.value
                                        .split(",")
                                        .map((item) => item.trim()),
                                    })
                                  }
                                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                  placeholder="VD: Đọc sách, Chơi game, Code, Du lịch"
                                />

                                <p className="text-xs text-gray-500 mt-1">
                                  Các sở thích cách nhau bởi dấu phẩy
                                </p>
                              </div>
                            </div>

                            <div className="mt-8 flex justify-end">
                              <button
                                type="button"
                                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition mr-4 flex items-center"
                                onClick={() => setShowFullscreenForm(false)}
                              >
                                <X size={18} className="mr-2" /> Hủy
                              </button>
                              <button
                                type="submit"
                                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center"
                                disabled={isUpdating}
                              >
                                {isUpdating ? (
                                  <>
                                    <svg
                                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      ></circle>
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                      ></path>
                                    </svg>
                                    Đang cập nhật...
                                  </>
                                ) : (
                                  <>
                                    <Save size={18} className="mr-2" /> Lưu hồ
                                    sơ
                                  </>
                                )}
                              </button>
                            </div>
                          </form>
                        </div>

                        {/* CV Preview */}
                        <div
                          className="bg-gray-50 border border-gray-200 rounded-lg shadow-lg p-8 overflow-auto"
                          style={{ maxHeight: "75vh" }}
                        >
                          <h3 className="text-sm uppercase font-semibold text-gray-500 mb-6 flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            Xem trước CV
                          </h3>

                          <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-6">
                            <div className="text-center mb-6 pb-4 border-b border-gray-200">
                              <h2 className="text-2xl font-bold text-gray-800">
                                {profileData.fullName || "Họ và tên"}
                              </h2>
                              <p className="text-gray-600 mt-1">
                                {profileData.department || "Khoa/Ngành học"}
                              </p>
                              <div className="mt-2 flex flex-wrap justify-center items-center text-sm text-gray-500 gap-x-4 gap-y-2">
                                {profileData.phone && (
                                  <span className="flex items-center">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4 mr-1"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                      />
                                    </svg>
                                    {profileData.phone}
                                  </span>
                                )}
                                <span className="flex items-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                  </svg>
                                  {user?.email || "email@example.com"}
                                </span>
                                {profileData.dateOfBirth && (
                                  <span className="flex items-center">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4 mr-1"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                    {profileData.dateOfBirth
                                      ? format(
                                          new Date(profileData.dateOfBirth),
                                          "dd/MM/yyyy",
                                          { locale: vi },
                                        )
                                      : ""}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* CV Sections */}
                            {profileData.bio && (
                              <div className="mb-6">
                                <h3 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-1 mb-2">
                                  GIỚI THIỆU
                                </h3>
                                <p className="text-gray-700 text-sm">
                                  {profileData.bio}
                                </p>
                              </div>
                            )}

                            {profileData.education && (
                              <div className="mb-6">
                                <h3 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-1 mb-2">
                                  HỌC VẤN
                                </h3>
                                <p className="text-gray-700 text-sm">
                                  {profileData.education}
                                </p>
                              </div>
                            )}

                            {profileData.skills && (
                              <div className="mb-6">
                                <h3 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-1 mb-2">
                                  KỸ NĂNG
                                </h3>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {profileData.skills.split(",").map(
                                    (skill, index) =>
                                      skill.trim() && (
                                        <span
                                          key={index}
                                          className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                                        >
                                          {skill.trim()}
                                        </span>
                                      ),
                                  )}
                                </div>
                              </div>
                            )}

                            {profileData.experience && (
                              <div className="mb-6">
                                <h3 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-1 mb-2">
                                  KINH NGHIỆM
                                </h3>
                                <p className="text-gray-700 text-sm whitespace-pre-line">
                                  {profileData.experience}
                                </p>
                              </div>
                            )}

                            {profileData.interests &&
                              profileData.interests.length > 0 &&
                              profileData.interests[0] !== "" && (
                                <div className="mb-4">
                                  <h3 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-1 mb-2">
                                    SỞ THÍCH
                                  </h3>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {profileData.interests.map(
                                      (interest, index) =>
                                        interest.trim() && (
                                          <span
                                            key={index}
                                            className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full"
                                          >
                                            {interest.trim()}
                                          </span>
                                        ),
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Watermark */}
                            <div className="mt-8 pt-4 border-t border-gray-200 text-center">
                              <p className="text-xs text-gray-500">
                                CV được tạo từ Hệ thống Quản lý CLB
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium mb-4">Câu hỏi thường gặp</h3>
              <div className="space-y-4">
                {faq.map((item) => (
                  <div
                    key={item.id}
                    className="border-b border-gray-200 pb-4 last:border-0 last:pb-0"
                  >
                    <h4 className="font-medium text-gray-900 mb-1">
                      {item.question}
                    </h4>
                    <p className="text-gray-600 text-sm">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2">
            {/* Status Banner */}
            <div
              className={`${
                userProfile.approvalStatus === "pending" ||
                userProfile.approvalStatus === "reviewing"
                  ? "bg-yellow-50 border-yellow-400"
                  : userProfile.approvalStatus === "interview"
                    ? "bg-blue-50 border-blue-400"
                    : userProfile.approvalStatus === "approved"
                      ? "bg-green-50 border-green-400"
                      : "bg-red-50 border-red-400"
              } border-l-4 p-4 mb-8 rounded-md shadow-sm`}
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className={`h-5 w-5 ${
                      userProfile.approvalStatus === "pending" ||
                      userProfile.approvalStatus === "reviewing"
                        ? "text-yellow-400"
                        : userProfile.approvalStatus === "interview"
                          ? "text-blue-400"
                          : userProfile.approvalStatus === "approved"
                            ? "text-green-400"
                            : "text-red-400"
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p
                    className={`text-sm ${
                      userProfile.approvalStatus === "pending" ||
                      userProfile.approvalStatus === "reviewing"
                        ? "text-yellow-700"
                        : userProfile.approvalStatus === "interview"
                          ? "text-blue-700"
                          : userProfile.approvalStatus === "approved"
                            ? "text-green-700"
                            : "text-red-700"
                    }`}
                  >
                    {userProfile.approvalStatus === "pending" &&
                      "Hồ sơ của bạn đang được xem xét. Vui lòng kiểm tra thông báo thường xuyên để cập nhật tình trạng."}
                    {userProfile.approvalStatus === "reviewing" &&
                      "Hồ sơ của bạn đang được đánh giá. Quá trình này có thể mất vài ngày."}
                    {userProfile.approvalStatus === "interview" && (
                      <>
                        Chúc mừng! Hồ sơ của bạn đã được chấp nhận và bạn được
                        mời tham gia phỏng vấn.
                        {userProfile.interviewDate && (
                          <strong className="block mt-1">
                            Thời gian phỏng vấn:{" "}
                            {format(
                              new Date(userProfile.interviewDate),
                              "HH:mm - dd/MM/yyyy",
                              { locale: vi },
                            )}
                          </strong>
                        )}
                        {userProfile.interviewLocation && (
                          <strong className="block mt-1">
                            Địa điểm: {userProfile.interviewLocation}
                          </strong>
                        )}
                      </>
                    )}
                    {userProfile.approvalStatus === "approved" &&
                      "Chúc mừng! Bạn đã trở thành thành viên chính thức của CLB. Hệ thống sẽ chuyển hướng bạn đến trang thành viên trong giây lát."}
                    {userProfile.approvalStatus === "rejected" &&
                      "Rất tiếc, đơn đăng ký của bạn chưa được chấp nhận vào thời điểm này. Bạn có thể liên hệ với quản trị viên để biết thêm chi tiết."}
                  </p>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">
                Thông báo và cập nhật
              </h2>
              {isLoadingNotifications ? (
                <div className="flex justify-center items-center py-4">
                  <LoadingSpinner size="md" text="Đang tải thông báo..." />
                </div>
              ) : error ? (
                <p className="text-red-500 text-center py-4">{error}</p>
              ) : notifications.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Không có thông báo nào
                </p>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id || notification.id}
                      className={`p-4 rounded-lg border-l-4 ${getStatusColor(notification.status)} border-l-${notification.status === "pending" ? "yellow" : notification.status === "update" ? "blue" : notification.status === "info" ? "green" : notification.status === "success" ? "green" : notification.status === "warning" ? "yellow" : "red"}-400`}
                    >
                      <div className="flex items-start">
                        <div className="text-2xl mr-3">
                          {getStatusIcon(notification.status)}
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <h3 className="font-medium">
                              {notification.title}
                            </h3>
                            <span className="text-xs text-gray-500">
                              {notification.date}
                            </span>
                          </div>
                          <p className="text-sm">{notification.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Club Updates */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Tin tức từ CLB</h2>
              {isLoadingNews ? (
                <p className="text-gray-500 text-center py-4">
                  Đang tải tin tức...
                </p>
              ) : error ? (
                <p className="text-red-500 text-center py-4">{error}</p>
              ) : clubUpdates.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Không có tin tức nào
                </p>
              ) : (
                <div className="space-y-6">
                  {clubUpdates.map((update) => (
                    <div
                      key={update._id || update.id}
                      className="border-b border-gray-200 pb-6 last:border-0 last:pb-0"
                    >
                      <div className="md:flex">
                        <div className="md:flex-shrink-0 md:w-1/3 mb-4 md:mb-0 md:mr-6">
                          <img
                            src={update.img}
                            alt={update.title}
                            className="h-48 w-full object-cover rounded-md"
                          />
                        </div>
                        <div className="md:w-2/3">
                          <div className="flex items-center mb-2">
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                              {update.date}
                            </span>
                          </div>
                          <h3 className="text-lg font-medium mb-2">
                            {update.title}
                          </h3>
                          <p className="text-gray-600">
                            {update.summary || update.content}
                          </p>
                          <button className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800">
                            Xem chi tiết →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Upcoming Activities section */}
            <Card className="shadow-md border p-4 mb-4">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center">
                  <CalendarDays className="w-5 h-5 mr-2" />
                  Hoạt động sắp tới
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingActivities.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingActivities.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-start p-2 rounded-md border hover:bg-gray-50"
                      >
                        <div className="bg-primary/10 p-2 rounded-md mr-3">
                          <Calendar className="text-primary w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm">
                            {activity.title}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {activity.formattedDate} đến{" "}
                            {activity.formattedEndTime}
                          </p>
                          {activity.location && (
                            <p className="text-xs text-gray-500 flex items-center mt-1">
                              <MapPin className="w-3 h-3 mr-1" />

                              {activity.location}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-2">
                    Không có hoạt động nào sắp tới
                  </p>
                )}
                <div className="mt-3 text-center">
                  <Button
                    variant="link"
                    className="text-primary"
                    as={Link}
                    to="/group/activity-schedule"
                  >
                    Xem tất cả
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Goals section */}
            <Card className="shadow-md border p-4 mb-4">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Mục tiêu tuần
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weeklyGoals ? (
                  <>
                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">
                          Hoàn thành nhiệm vụ
                        </span>
                        <span className="text-sm font-medium">
                          {performanceStats?.completedTasks}/
                          {performanceStats?.totalTasks}
                        </span>
                      </div>
                      <Progress
                        value={
                          performanceStats?.totalTasks
                            ? (performanceStats?.completedTasks /
                                performanceStats?.totalTasks) *
                              100
                            : 0
                        }
                        className="h-2"
                      />
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">
                          Tham gia sự kiện
                        </span>
                        <span className="text-sm font-medium">
                          {performanceStats?.attendedEvents}/
                          {performanceStats?.totalEvents}
                        </span>
                      </div>
                      <Progress
                        value={
                          performanceStats?.totalEvents
                            ? (performanceStats?.attendedEvents /
                                performanceStats?.totalEvents) *
                              100
                            : 0
                        }
                        className="h-2"
                      />
                    </div>

                    <div className="mt-3 text-center">
                      <Button
                        variant="link"
                        className="text-primary"
                        as={Link}
                        to="/profile/performance"
                      >
                        Xem chi tiết
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-gray-500 py-2">
                    Không có dữ liệu hiệu suất
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:justify-between">
            <div className="mb-8 md:mb-0">
              <img
                src="/iuptit_banner.svg"
                alt="Logo"
                className="h-8 w-auto mb-4"
              />

              <p className="text-gray-400 text-sm">
                Hệ thống Quản lý CLB - Nền tảng toàn diện <br />
                cho việc quản lý câu lạc bộ hiệu quả
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase mb-4">
                  Hỗ trợ
                </h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white">
                      Trung tâm trợ giúp
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white">
                      Liên hệ admin
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white">
                      Báo cáo lỗi
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase mb-4">
                  Thông tin
                </h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white">
                      Về chúng tôi
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white">
                      Chính sách
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white">
                      Điều khoản
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 md:flex md:items-center md:justify-between">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Hệ thống Quản lý CLB. Tất cả các
              quyền được bảo lưu.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Facebook</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Instagram</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Twitter</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DemoPage;
