import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getMemberPerformance } from "../../../services/memberPerformance";
import {
  UserCircleIcon,
  ArrowLeftIcon,
  CalendarIcon,
  TrophyIcon,
  ChartBarIcon,
  CheckBadgeIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import "./index.css";
import LoadingSpinner from "../../../components/common/LoadingSpinner";

const PerformanceDetail = () => {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const { memberId } = useParams();
  const navigate = useNavigate();
  const url = import.meta.env.VITE_PROXY_API_URL;

  useEffect(() => {
    fetchPerformance();
  }, [memberId, selectedYear, selectedMonth]);

  
  const years = [selectedYear - 1, selectedYear];
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `Tháng ${i + 1}`,
  }));

  const handleMonthChange = (e) => {
    setSelectedMonth(parseInt(e.target.value));
  };

  const handleYearChange = (e) => {
    setSelectedYear(parseInt(e.target.value));
  };

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const data = await getMemberPerformance(
        memberId,
        selectedYear,
        selectedMonth,
      );
      setPerformance(data);
    } catch (error) {
      toast.error("Không thể tải chi tiết thành tích");
    } finally {
      setLoading(false);
    }
  };

  
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "2-digit", day: "2-digit" };
    return new Date(dateString).toLocaleDateString("vi-VN", options);
  };

  
  const StatCard = ({ icon, title, value, color, bgColor }) => (
    <div
      className={`${bgColor} p-4 rounded-xl shadow-sm border border-${color}-200`}
    >
      <div className="flex items-center mb-2">
        <div className={`p-2 rounded-md bg-${color}-100 mr-2`}>{icon}</div>
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
      </div>
      <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
    </div>
  );

  
  const ActivityItem = ({ item, type }) => {
    
    let icon, bgColor, textColor, dateLabel;

    if (type === "event") {
      icon = <CalendarIcon className="h-5 w-5 text-blue-500" />;

      bgColor = "bg-blue-50";
      textColor = "text-blue-700";
      dateLabel = "Ngày:";
    } else if (type === "task") {
      icon = <ClipboardDocumentCheckIcon className="h-5 w-5 text-purple-500" />;

      bgColor = "bg-purple-50";
      textColor = "text-purple-700";
      dateLabel = "Hạn:";
    } else if (type === "meeting") {
      icon = <UserGroupIcon className="h-5 w-5 text-green-500" />;

      bgColor = "bg-green-50";
      textColor = "text-green-700";
      dateLabel = "Ngày:";
    }
    return (
      <div
        className={`${bgColor} p-3 rounded-lg mb-2 border border-${textColor.replace("text-", "border-")} hover:shadow-md transition-shadow`}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="mr-3">{icon}</div>
            <h4 className={`font-medium ${textColor}`}>
              {item.name || item.title}
            </h4>
          </div>
          <div className="text-xs text-gray-500">
            <span className="mr-1">{dateLabel}</span>
            {formatDate(
              type === "event"
                ? item.updatedAt
                : type === "task"
                  ? item.dueDate
                  : item.updatedAt,
            )}
          </div>
        </div>
      </div>
    );
  };

  
  const ActivitySection = ({ title, items, type, icon }) => (
    <div className="bg-white shadow-md rounded-xl p-5 mb-6">
      <div className="flex items-center mb-4">
        <div className="mr-2">{icon}</div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="ml-2 px-3 py-1 bg-gray-100 rounded-full text-gray-700 text-sm">
          {items?.length || 0}
        </span>
      </div>

      {items?.length > 0 ? (
        <div>
          {items.map((item) => (
            <ActivityItem key={item._id} item={item} type={type} />
          ))}
        </div>
      ) : (
        <div className="text-gray-500 italic p-3 bg-gray-50 rounded-lg text-center">
          Không có {title.toLowerCase()}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="lg" text="Đang tải dữ liệu..." />
      </div>
    );
  }

  if (!performance) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 p-6 rounded-xl shadow-md border border-red-200 inline-block">
          <div className="text-red-500 text-xl mb-4">
            Không tìm thấy thông tin thành tích
          </div>
          <button
            onClick={() => navigate("/member/performance")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Quay lại trang thành tích
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Back button */}
      <button
        onClick={() => navigate("/member/performance")}
        className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-6"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-1" />
        <span>Quay lại bảng xếp hạng</span>
      </button>

      {/* Header card with member info */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-8 text-white">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="mr-5">
                {performance.member.avatar ? (
                  <img
                    src={`${url}${performance.member.avatar}`}
                    alt={performance.member.name}
                    className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-md"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-md">
                    <UserCircleIcon className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  {performance.member.name}
                </h1>
                <p className="text-blue-100 flex items-center mt-1">
                  <CheckBadgeIcon className="h-5 w-5 mr-1" />
                  Hạng {performance.rank}
                </p>
              </div>
            </div>

            <div className="flex items-center bg-white bg-opacity-20 rounded-lg p-2">
              <div className="p-2">
                <select
                  value={selectedYear}
                  onChange={handleYearChange}
                  className="bg-white px-3 py-2 rounded-md text-sm text-gray-800 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm appearance-none custom-select"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="p-2">
                <select
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  className="bg-white px-3 py-2 rounded-md text-sm text-gray-800 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm appearance-none custom-select"
                >
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <TrophyIcon className="h-6 w-6 text-yellow-500 mr-2" />
              Tổng quan thành tích
            </h2>
            <div className="text-sm text-gray-500">
              Cập nhật: {formatDate(performance.lastUpdated)}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="col-span-1 sm:col-span-2 md:col-span-1">
              <StatCard
                icon={<TrophyIcon className="h-6 w-6 text-blue-600" />}
                title="Tổng điểm"
                value={performance.totalScore}
                color="blue"
                bgColor="bg-blue-50"
              />
            </div>
            <StatCard
              icon={<ChartBarIcon className="h-6 w-6 text-purple-600" />}
              title="Xếp hạng"
              value={`#${performance.rank}`}
              color="purple"
              bgColor="bg-purple-50"
            />

            <StatCard
              icon={<UserGroupIcon className="h-6 w-6 text-green-600" />}
              title="Tỷ lệ tham dự"
              value={`${performance.statistics.attendanceRate.toFixed(1)}%`}
              color="green"
              bgColor="bg-green-50"
            />
          </div>

          {/* Activity stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <div className="text-amber-500 mb-1">Sự kiện tham gia</div>
              <div className="text-2xl font-bold text-amber-700">
                {performance.statistics.eventCount}
              </div>
            </div>
            <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 text-center">
              <div className="text-pink-500 mb-1">Công việc hoàn thành</div>
              <div className="text-2xl font-bold text-pink-700">
                {performance.statistics.taskCount}
              </div>
            </div>
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-center">
              <div className="text-teal-500 mb-1">Buổi sinh hoạt</div>
              <div className="text-2xl font-bold text-teal-700">
                {performance.statistics.meetingCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActivitySection
          title="Sự kiện đã tham gia"
          items={performance.metrics.eventsParticipated}
          type="event"
          icon={<CalendarIcon className="h-6 w-6 text-blue-500" />}
        />

        <ActivitySection
          title="Công việc đã hoàn thành"
          items={performance.metrics.tasksCompleted}
          type="task"
          icon={
            <ClipboardDocumentCheckIcon className="h-6 w-6 text-purple-500" />
          }
        />
      </div>

      <div className="mt-6">
        <ActivitySection
          title="Buổi sinh hoạt đã tham dự"
          items={performance.metrics.meetingsAttended}
          type="meeting"
          icon={<UserGroupIcon className="h-6 w-6 text-green-500" />}
        />
      </div>

      {/* Score breakdown card */}
      <div className="bg-white shadow-md rounded-xl p-5 mb-6 mt-6">
        <div className="flex items-center mb-4">
          <ChartBarIcon className="h-6 w-6 text-blue-500 mr-2" />

          <h3 className="text-lg font-semibold">Chi tiết điểm thành tích</h3>
        </div>

        <div className="overflow-hidden bg-gray-50 rounded-xl">
          <div className="flex">
            <div
              className="bg-amber-500 h-6"
              style={{
                width: `${(performance.statistics.eventCount * 10 * 100) / performance.totalScore}%`,
              }}
            ></div>
            <div
              className="bg-pink-500 h-6"
              style={{
                width: `${(performance.statistics.taskCount * 15 * 100) / performance.totalScore}%`,
              }}
            ></div>
            <div
              className="bg-teal-500 h-6"
              style={{
                width: `${(performance.statistics.meetingCount * 5 * 100) / performance.totalScore}%`,
              }}
            ></div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-3">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-amber-500 rounded mr-1"></div>
            <span className="text-sm">
              Sự kiện: {performance.statistics.eventCount * 10} điểm
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-pink-500 rounded mr-1"></div>
            <span className="text-sm">
              Công việc: {performance.statistics.taskCount * 15} điểm
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-teal-500 rounded mr-1"></div>
            <span className="text-sm">
              Sinh hoạt: {performance.statistics.meetingCount * 5} điểm
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDetail;
