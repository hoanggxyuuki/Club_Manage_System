import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllPerformances } from "../../services/memberPerformance";
import {
  TrophyIcon,
  ArrowRightIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { UserCircleIcon } from "@heroicons/react/24/solid";

const TopPerformers = () => {
  const [topPerformers, setTopPerformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      const data = await getAllPerformances(currentYear, currentMonth);

      setTopPerformers(data.slice(0, 3));
      setError(null);
    } catch (error) {
      console.error("Error fetching top performers:", error);
      setError("Không thể tải dữ liệu thành viên tiêu biểu");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg xs:rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <div className="px-3 xs:px-4 sm:px-5 py-2.5 xs:py-3 sm:py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 xs:space-x-2">
              <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <TrophyIcon className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
              </div>
              <h2 className="text-sm xs:text-base sm:text-lg font-semibold text-gray-800">
                Top thành viên
              </h2>
            </div>
          </div>
        </div>
        <div className="p-2.5 xs:p-3 sm:p-5">
          <div className="animate-pulse space-y-2.5 xs:space-y-3 sm:space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-2.5 xs:space-x-3 sm:space-x-4">
                <div className="h-9 w-9 xs:h-10 xs:w-10 sm:h-12 sm:w-12 rounded-full bg-gray-200"></div>
                <div className="flex-1">
                  <div className="h-3 xs:h-3.5 sm:h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="mt-1 xs:mt-1.5 sm:mt-2 h-2 xs:h-2.5 sm:h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-4 xs:h-5 sm:h-6 bg-gray-200 rounded w-8 xs:w-10 sm:w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg xs:rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <div className="px-3 xs:px-4 sm:px-5 py-2.5 xs:py-3 sm:py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 xs:space-x-2">
              <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <TrophyIcon className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
              </div>
              <h2 className="text-sm xs:text-base sm:text-lg font-semibold text-gray-800">
                Top thành viên
              </h2>
            </div>
          </div>
        </div>
        <div className="p-4 xs:p-6 sm:p-8 text-center">
          <p className="text-gray-500 mb-2.5 xs:mb-3 text-xs xs:text-sm sm:text-base">{error}</p>
          <button
            onClick={fetchData}
            className="px-2.5 py-1 xs:px-3 xs:py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!topPerformers.length) {
    return (
      <div className="bg-white rounded-lg xs:rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <div className="px-3 xs:px-4 sm:px-5 py-2.5 xs:py-3 sm:py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 xs:space-x-2">
              <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <TrophyIcon className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
              </div>
              <h2 className="text-sm xs:text-base sm:text-lg font-semibold text-gray-800">
                Top thành viên
              </h2>
            </div>
          </div>
        </div>
        <div className="p-4 xs:p-6 sm:p-8 text-center">
          <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-2 sm:mb-3">
            <TrophyIcon className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 text-gray-300" />
          </div>
          <p className="text-xs xs:text-sm sm:text-base text-gray-500">
            Chưa có dữ liệu thành viên
          </p>
        </div>
      </div>
    );
  }

  const getRankColor = (rank) => {
    switch (rank) {
      case 1:
        return {
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          text: "text-yellow-700",
          icon: "bg-yellow-500",
          score: "text-amber-600",
        };
      case 2:
        return {
          bg: "bg-gray-50",
          border: "border-gray-200",
          text: "text-gray-700",
          icon: "bg-gray-400",
          score: "text-gray-600",
        };
      case 3:
        return {
          bg: "bg-orange-50",
          border: "border-orange-200",
          text: "text-orange-700",
          icon: "bg-orange-400",
          score: "text-orange-600",
        };
      default:
        return {
          bg: "bg-white",
          border: "border-gray-100",
          text: "text-gray-700",
          icon: "bg-blue-400",
          score: "text-blue-600",
        };
    }
  };

  const getRankEmoji = (rank) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return "";
    }
  };

  const renderMiniProgress = (value, total, colorClass) => {
    const percentage = Math.min(100, Math.max(0, (value / total) * 100));
    return (
      <div className="h-1 xs:h-1.5 w-full bg-gray-100 rounded overflow-hidden">
        <div
          className={`h-full ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg xs:rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      <div className="px-3 xs:px-4 sm:px-5 py-2.5 xs:py-3 sm:py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 xs:space-x-2">
            <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full bg-yellow-100 flex items-center justify-center">
              <TrophyIcon className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
            </div>
            <h2 className="text-sm xs:text-base sm:text-lg font-semibold text-gray-800">
              Top thành viên
            </h2>
          </div>
          <button
            onClick={() => navigate("/member/performance")}
            className="flex items-center gap-0.5 xs:gap-1 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Xem tất cả
            <ArrowRightIcon className="h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-3.5 sm:w-3.5" />
          </button>
        </div>
      </div>
      <div className="p-2 xs:p-3 sm:p-4">
        {topPerformers.map((performer, index) => {
          const colorScheme = getRankColor(performer.rank);
          const maxScore = topPerformers[0]?.totalScore || 100;

          
          let primaryStat, primaryStatText;
          if (performer.rank === 1) {
            primaryStat = performer.statistics.eventCount;
            primaryStatText = "sự kiện";
          } else if (performer.rank === 2) {
            primaryStat = performer.statistics.taskCount;
            primaryStatText = "công việc";
          } else {
            primaryStat = performer.statistics.meetingCount;
            primaryStatText = "buổi sinh hoạt";
          }

          return (
            <div
              key={performer.member._id}
              className={`p-2.5 xs:p-3 sm:p-4 rounded-lg xs:rounded-xl ${colorScheme.bg} border ${colorScheme.border} mb-1.5 xs:mb-2 sm:mb-3 group hover:shadow-md transition-all duration-200`}
            >
              <div className="flex items-center space-x-2 xs:space-x-2.5 sm:space-x-3">
                <div className="flex-shrink-0 relative">
                  {performer.member.avatar ? (
                    <img
                      src={`${import.meta.env.VITE_PROXY_API_URL}${performer.member.avatar}`}
                      alt={performer.member.name.charAt(0)}
                      className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 text-gray-400" />
                  )}
                  <div
                    className={`absolute -top-0.5 -right-0.5 xs:-top-1 xs:-right-1 w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full text-xs font-bold text-white ${colorScheme.icon} shadow-sm group-hover:scale-110 transition-transform`}
                  >
                    {performer.rank}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate text-xs xs:text-sm sm:text-base group-hover:text-blue-700 transition-colors">
                        {performer.member.name}
                      </h4>
                      <div className="flex items-center text-xs xs:text-[10px] sm:text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center">
                          <SparklesIcon className="h-2 w-2 xs:h-2.5 xs:w-2.5 sm:h-3 sm:w-3 mr-0.5 xs:mr-1 text-blue-400" />
                          <span className="font-medium">{primaryStat}</span>{" "}
                          <span className="hidden xs:inline">{primaryStatText}</span>
                          <span className="xs:hidden">{primaryStatText.slice(0, 3)}</span>
                        </span>
                      </div>
                    </div>
                    <div
                      className={`font-bold ${colorScheme.score} px-1 xs:px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md xs:rounded-lg bg-white bg-opacity-70 text-xs xs:text-sm sm:text-base group-hover:scale-105 transition-transform flex-shrink-0 ml-2`}
                    >
                      {performer.totalScore}
                    </div>
                  </div>

                  <div className="mt-1 xs:mt-1.5 sm:mt-2">
                    {renderMiniProgress(
                      performer.totalScore,
                      maxScore,
                      colorScheme.icon.replace("bg-", "bg-"),
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopPerformers;
