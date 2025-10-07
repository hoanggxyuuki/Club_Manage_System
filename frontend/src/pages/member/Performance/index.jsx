import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { toast } from "react-toastify";
import { getAllPerformances } from "../../../services/memberPerformance";
import {
  UserCircleIcon,
  ChartBarIcon,
  TrophyIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import "./index.css";
import LoadingSpinner from "../../../components/common/LoadingSpinner";

const Performance = () => {
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const { user } = useAuth();
  const url = import.meta.env.VITE_PROXY_API_URL;

  
  const years = [selectedYear - 1, selectedYear];
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `Tháng ${i + 1}`,
  }));

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getAllPerformances(selectedYear, selectedMonth);
      setPerformances(data);
    } catch (error) {
      console.error("Error fetching performances:", error);
      toast.error("Không thể tải dữ liệu thành tích");
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(parseInt(e.target.value));
  };

  const handleYearChange = (e) => {
    setSelectedYear(parseInt(e.target.value));
  };

  const getUserPerformance = () => {
    return performances.find((p) => p.member._id === user.userId);
  };

  const userPerformance = getUserPerformance();

  
  const topPerformers = performances.slice(0, 3);

  
  const leaderboardRankings = performances.slice(3);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="lg" text="Đang tải dữ liệu..." />
      </div>
    );
  }

  
  const StatCard = ({ icon, title, value, color, bgColor }) => (
    <div
      className={`${bgColor} p-2 xs:p-3 sm:p-4 rounded-lg xs:rounded-xl shadow-sm border border-${color}-200 flex flex-col sm:flex-row items-center sm:items-center`}
    >
      <div className={`p-1.5 xs:p-2 sm:p-3 rounded-md xs:rounded-lg bg-${color}-100 mb-1.5 xs:mb-2 sm:mb-0 sm:mr-3`}>{icon}</div>
      <div className="text-center sm:text-left flex-grow min-w-0">
        <h3 className="text-xs font-medium text-gray-600 truncate">{title}</h3>
        <p className={`text-base xs:text-lg sm:text-xl font-bold text-${color}-600 truncate`}>{value}</p>
      </div>
    </div>
  );

  
  const Medal = ({ position, performance }) => {
    const medalColors = {
      1: {
        bgGradient: "from-amber-300 to-yellow-500",
        textColor: "text-yellow-800",
        borderColor: "border-yellow-400",
        icon: "👑",
      },
      2: {
        bgGradient: "from-gray-300 to-gray-400",
        textColor: "text-gray-700",
        borderColor: "border-gray-300",
        icon: "🥈",
      },
      3: {
        bgGradient: "from-amber-600 to-amber-700",
        textColor: "text-amber-900",
        borderColor: "border-amber-500",
        icon: "🥉",
      },
    };

    const color = medalColors[position];

    
    return (
      <div
        className={`flex flex-col items-center w-24 md:w-32 ${
          position === 1
            ? "order-2 transform hover:scale-105"
            : position === 2
              ? "order-1 mt-8"
              : "order-3 mt-8"
        } transition-all duration-300`}
      >
        <div className="mb-2 text-xl md:text-2xl">{color.icon}</div>
        <div
          className={`relative w-20 h-20 md:w-28 md:h-28 rounded-full bg-gradient-to-br ${color.bgGradient} shadow-lg border-2 ${color.borderColor} flex items-center justify-center mb-2 transform transition-transform duration-300 hover:rotate-3`}
        >
          {/* Fixed position number by removing # and centering properly */}
          <span
            className={`text-2xl md:text-4xl font-bold ${color.textColor} absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2`}
          >
            {position}
          </span>
          {performance.member.avatar ? (
            <div className="absolute -bottom-2 -right-2 w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white overflow-hidden shadow-md">
              <img
                className="w-full h-full object-cover"
                src={`${url}${performance.member.avatar}`}
                alt=""
              />
            </div>
          ) : (
            <div className="absolute -bottom-2 -right-2 w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white bg-gray-200 shadow-md">
              <UserCircleIcon className="h-full w-full text-gray-400" />
            </div>
          )}
        </div>
        <h3 className="text-sm md:text-base font-medium text-center">
          {performance.member.name}
        </h3>
        <p className="text-lg md:text-xl font-bold text-blue-600">
          {performance.totalScore} điểm
        </p>
        <div className="mt-1 flex space-x-2 text-xs text-gray-500">
          <span>🎯 {performance.statistics.eventCount}</span>
          <span>📝 {performance.statistics.taskCount}</span>
          <span>📅 {performance.statistics.meetingCount}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header section */}
      <div className="bg-white rounded-xl shadow-md p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
              <TrophyIcon className="h-8 w-8 mr-2 text-yellow-500" />
              Bảng thành tích
            </h1>
            <p className="text-gray-600 mt-2">
              Theo dõi và so sánh thành tích của các thành viên trong câu lạc bộ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-blue-50 rounded-lg px-4 py-2 flex items-center">
              <CalendarIcon className="h-5 w-5 text-blue-500 mr-2" />

              <div className="flex space-x-2">
                <select
                  value={selectedYear}
                  onChange={handleYearChange}
                  className="bg-white px-3 py-2 rounded-md text-sm border border-blue-200 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors appearance-none"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  className="bg-white px-3 py-2 rounded-md text-sm border border-blue-200 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors appearance-none"
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

        <div className="mt-4 flex items-center">
          <ChartBarIcon className="h-5 w-5 text-blue-500 mr-2" />

          <h2 className="text-lg font-semibold text-gray-700">
            Cách tính điểm:
          </h2>
        </div>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-green-50 rounded-lg p-2 text-sm border border-green-100">
            <span className="font-medium text-green-700">
              Tham gia sự kiện:{" "}
            </span>
            <span className="text-gray-700">10 điểm</span>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-sm border border-blue-100">
            <span className="font-medium text-blue-700">
              Hoàn thành công việc:{" "}
            </span>
            <span className="text-gray-700">15 điểm</span>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 text-sm border border-purple-100">
            <span className="font-medium text-purple-700">
              Tham dự sinh hoạt:{" "}
            </span>
            <span className="text-gray-700">5 điểm</span>
          </div>
        </div>
      </div>

      {/* User's performance section */}
      {userPerformance && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-md p-5 mb-6 border border-blue-100">
          <div className="flex items-center mb-4">
            <div className="mr-3 bg-blue-500 rounded-full p-2">
              <UserCircleIcon className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              Thành tích cá nhân của bạn
            </h2>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-5 gap-2 xs:gap-3">
            <StatCard
              icon={<TrophyIcon className="h-4 w-4 xs:h-5 xs:w-5 text-blue-600" />}
              title="Tổng điểm"
              value={userPerformance.totalScore}
              color="blue"
              bgColor="bg-blue-50"
            />

            <StatCard
              icon={<ChartBarIcon className="h-4 w-4 xs:h-5 xs:w-5 text-purple-600" />}
              title="Xếp hạng"
              value={`#${userPerformance.rank}`}
              color="purple"
              bgColor="bg-purple-50"
            />

            <StatCard
              icon={<CalendarIcon className="h-4 w-4 xs:h-5 xs:w-5 text-yellow-600" />}
              title="Sự kiện"
              value={userPerformance.statistics.eventCount}
              color="yellow"
              bgColor="bg-yellow-50"
            />

            <StatCard
              icon={<CalendarIcon className="h-4 w-4 xs:h-5 xs:w-5 text-pink-600" />}
              title="Công việc"
              value={userPerformance.statistics.taskCount}
              color="pink"
              bgColor="bg-pink-50"
            />

            <StatCard
              icon={<CalendarIcon className="h-4 w-4 xs:h-5 xs:w-5 text-teal-600" />}
              title="Sinh hoạt"
              value={`${userPerformance.statistics.meetingCount} (${userPerformance.statistics.attendanceRate.toFixed(1)}%)`}
              color="teal"
              bgColor="bg-teal-50"
            />
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {performances.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-5 mb-6 overflow-hidden">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <TrophyIcon className="h-6 w-6 text-yellow-500 mr-2" />
            Bảng thành tích hàng đầu
          </h2>

          {/* Desktop Podium View */}
          <div className="hidden md:block relative">
            {/* Decorative elements */}
            <div className="absolute inset-0 flex justify-center pointer-events-none opacity-10">
              <div className="w-full h-full bg-gradient-radial from-yellow-300 to-transparent"></div>
            </div>

            {/* Use fixed widths with justify-around instead of space-x for better separation */}
            <div className="relative flex justify-around items-end py-4 mb-6 px-4">
              {topPerformers.map((performer, index) => (
                <Medal
                  key={performer.member._id}
                  position={index + 1}
                  performance={performer}
                />
              ))}
            </div>

            {/* Adjust podium platforms to match the spacing */}
            <div className="flex justify-around items-end h-20 mb-2 px-4">
              <div className="w-24 md:w-28 h-16 bg-gray-300 rounded-t-lg shadow-inner"></div>
              <div className="w-24 md:w-28 h-24 bg-yellow-400 rounded-t-lg shadow-inner"></div>
              <div className="w-24 md:w-28 h-10 bg-amber-700 rounded-t-lg shadow-inner"></div>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 xs:space-y-4">
            {topPerformers.map((performer, index) => {
              const position = index + 1;
              const medalInfo = {
                1: { 
                  bg: "from-gradient-to-r from-amber-400 via-yellow-400 to-amber-500", 
                  text: "text-yellow-900", 
                  icon: "👑",
                  border: "border-yellow-400",
                  shadow: "shadow-yellow-200"
                },
                2: { 
                  bg: "from-gradient-to-r from-gray-300 via-gray-400 to-gray-500", 
                  text: "text-gray-700", 
                  icon: "🥈",
                  border: "border-gray-400",
                  shadow: "shadow-gray-200"
                },
                3: { 
                  bg: "from-gradient-to-r from-amber-600 via-orange-500 to-amber-700", 
                  text: "text-amber-900", 
                  icon: "🥉",
                  border: "border-amber-500",
                  shadow: "shadow-amber-200"
                }
              };
              
              const medal = medalInfo[position];
              
              return (
                <div 
                  key={performer.member._id}
                  className={`relative overflow-hidden rounded-xl xs:rounded-2xl ${position === 1 ? 'bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-100 border-2 border-yellow-200' : position === 2 ? 'bg-gradient-to-r from-gray-50 to-slate-100 border-2 border-gray-200' : 'bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200'} shadow-lg ${medal.shadow} transform transition-all duration-300 hover:scale-[1.02]`}
                >
                  {/* Decorative background pattern */}
                  <div className="absolute top-0 right-0 opacity-5">
                    <div className="text-4xl xs:text-6xl transform rotate-12 translate-x-2 xs:translate-x-4 -translate-y-2 xs:-translate-y-4">
                      {medal.icon}
                    </div>
                  </div>
                  
                  <div className="relative p-3 xs:p-4">
                    {/* For very small screens, stack vertically */}
                    <div className="flex flex-col xs:flex-row xs:items-center">
                      {/* Position Badge */}
                      <div className={`flex-shrink-0 w-12 h-12 xs:w-16 xs:h-16 rounded-xl xs:rounded-2xl bg-gradient-to-br ${position === 1 ? 'from-amber-300 to-yellow-500' : position === 2 ? 'from-gray-300 to-gray-500' : 'from-amber-600 to-orange-700'} flex items-center justify-center mb-3 xs:mb-0 xs:mr-4 shadow-lg ${medal.border} border-2 self-center xs:self-auto`}>
                        <div className="text-center">
                          <div className="text-lg xs:text-2xl mb-0.5 xs:mb-1">{medal.icon}</div>
                          <div className={`text-sm xs:text-lg font-bold ${position <= 3 ? 'text-white' : 'text-gray-700'}`}>
                            {position}
                          </div>
                        </div>
                      </div>

                      {/* Member Info */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-center xs:justify-start mb-2 xs:mb-2">
                          {performer.member.avatar ? (
                            <img
                              className="w-10 h-10 xs:w-12 xs:h-12 rounded-full object-cover border-2 border-white shadow-md mr-2 xs:mr-3"
                              src={`${url}${performer.member.avatar}`}
                              alt={performer.member.name}
                            />
                          ) : (
                            <div className="w-10 h-10 xs:w-12 xs:h-12 rounded-full bg-gray-200 border-2 border-white shadow-md flex items-center justify-center mr-2 xs:mr-3">
                              <UserCircleIcon className="h-6 w-6 xs:h-8 xs:w-8 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1 text-center xs:text-left">
                            <h3 className="font-bold text-base xs:text-lg text-gray-900 truncate">
                              {performer.member.name}
                            </h3>
                            
                            {/* Score - Show on small screens right under name */}
                            <div className="xs:hidden mt-1">
                              <span className={`text-xl font-bold ${position === 1 ? 'text-yellow-600' : position === 2 ? 'text-gray-600' : 'text-amber-600'}`}>
                                {performer.totalScore} điểm
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Stats */}
                        <div className="flex items-center justify-center xs:justify-start space-x-2 xs:space-x-3 text-xs xs:text-sm text-gray-600">
                          <span className="flex items-center">
                            🎯 <span className="ml-0.5 xs:ml-1">{performer.statistics.eventCount}</span>
                          </span>
                          <span className="flex items-center">
                            📝 <span className="ml-0.5 xs:ml-1">{performer.statistics.taskCount}</span>
                          </span>
                          <span className="flex items-center">
                            📅 <span className="ml-0.5 xs:ml-1">{performer.statistics.meetingCount}</span>
                          </span>
                        </div>
                      </div>

                      {/* Score - Show on larger screens */}
                      <div className="hidden xs:block flex-shrink-0 text-right">
                        <div className={`text-2xl font-bold ${position === 1 ? 'text-yellow-600' : position === 2 ? 'text-gray-600' : 'text-amber-600'}`}>
                          {performer.totalScore}
                        </div>
                        <div className="text-sm text-gray-500 font-medium">điểm</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leaderboard table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <ChartBarIcon className="h-6 w-6 text-blue-500 mr-2" />
            Bảng xếp hạng thành tích
          </h2>
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Xếp hạng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thành viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sự kiện
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Công việc
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sinh hoạt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Điểm
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chi tiết
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {performances.map((perf) => (
                <tr
                  key={perf.member?._id}
                  className={`${perf.member._id === user.userId ? "bg-blue-50" : ""} hover:bg-gray-50 transition-colors`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        perf.rank <= 3
                          ? `bg-gradient-to-br ${
                              perf.rank === 1
                                ? "from-amber-300 to-yellow-500"
                                : perf.rank === 2
                                  ? "from-gray-300 to-gray-400"
                                  : "from-amber-600 to-amber-700"
                            }`
                          : "bg-gray-100"
                      }`}
                    >
                      <span
                        className={`text-sm font-bold ${
                          perf.rank <= 3 ? "text-white" : "text-gray-700"
                        }`}
                      >
                        {perf.rank}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 mr-3">
                        {perf.member?.avatar ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover border border-gray-200"
                            src={`${url}${perf.member.avatar}`}
                            alt={perf.member?.name.charAt(0)}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserCircleIcon className="h-10 w-10 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {perf.member?.name}
                        </div>
                        {perf.member._id === user.userId && (
                          <span className="text-xs inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            Bạn
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {perf.statistics.eventCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {perf.statistics.taskCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {perf.statistics.meetingCount}
                    <span className="text-xs text-gray-500 ml-1">
                      ({perf.statistics.attendanceRate.toFixed(1)}%)
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-base font-semibold rounded-full bg-blue-100 text-blue-800">
                      {perf.totalScore}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/member/performance/${perf.member._id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Xem chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="md:hidden p-3 xs:p-4 space-y-3 xs:space-y-4">
          {performances.map((perf) => (
            <div
              key={perf.member?._id}
              className={`p-3 xs:p-4 rounded-lg shadow-sm border ${
                perf.member._id === user.userId
                  ? "bg-blue-50 border-blue-200"
                  : "bg-white border-gray-200"
              }`}
            >
              {/* Mobile layout: Stack vertically on very small screens, horizontal on xs+ */}
              <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between mb-3 space-y-2 xs:space-y-0">
                <div className="flex items-center min-w-0 flex-1">
                  <div
                    className={`w-6 h-6 xs:w-8 xs:h-8 flex items-center justify-center rounded-full mr-2 xs:mr-3 flex-shrink-0 ${
                      perf.rank <= 3
                        ? `bg-gradient-to-br ${
                            perf.rank === 1
                              ? "from-amber-300 to-yellow-500"
                              : perf.rank === 2
                                ? "from-gray-300 to-gray-400"
                                : "from-amber-600 to-amber-700"
                          }`
                        : "bg-gray-100"
                    }`}
                  >
                    <span
                      className={`text-xs xs:text-sm font-bold ${perf.rank <= 3 ? "text-white" : "text-gray-700"}`}
                    >
                      {perf.rank}
                    </span>
                  </div>
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="mr-1.5 xs:mr-2 flex-shrink-0">
                      {perf.member?.avatar ? (
                        <img
                          className="h-6 w-6 xs:h-8 xs:w-8 rounded-full object-cover"
                          src={`${url}${perf.member.avatar}`}
                          alt={perf.member?.name}
                        />
                      ) : (
                        <UserCircleIcon className="h-6 w-6 xs:h-8 xs:w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between xs:block">
                        <h3 className="font-medium text-sm xs:text-base text-gray-900 truncate">
                          {perf.member?.name}
                        </h3>
                        {/* Score on very small screens - inline with name */}
                        <div className="xs:hidden ml-2 flex-shrink-0">
                          <span className="px-1.5 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                            {perf.totalScore}
                          </span>
                        </div>
                      </div>
                      {perf.member._id === user.userId && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded mt-1 inline-block">
                          Bạn
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Score on xs+ screens */}
                <div className="hidden xs:block flex-shrink-0">
                  <span className="px-2 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                    {perf.totalScore} điểm
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1 xs:gap-2 my-3">
                <div className="bg-yellow-50 p-1 xs:p-2 rounded text-center">
                  <div className="text-xs text-gray-500 truncate">Sự kiện</div>
                  <div className="font-semibold text-yellow-700 text-xs xs:text-sm">
                    {perf.statistics.eventCount}
                  </div>
                </div>
                <div className="bg-pink-50 p-1 xs:p-2 rounded text-center">
                  <div className="text-xs text-gray-500 truncate">Công việc</div>
                  <div className="font-semibold text-pink-700 text-xs xs:text-sm">
                    {perf.statistics.taskCount}
                  </div>
                </div>
                <div className="bg-teal-50 p-1 xs:p-2 rounded text-center">
                  <div className="text-xs text-gray-500 truncate">Sinh hoạt</div>
                  <div className="font-semibold text-teal-700 text-xs xs:text-sm">
                    {perf.statistics.meetingCount}
                    <span className="text-xs text-gray-500 block truncate">
                      {perf.statistics.attendanceRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <Link
                  to={`/member/performance/${perf.member._id}`}
                  className="text-xs xs:text-sm text-blue-600 hover:text-blue-900"
                >
                  Xem chi tiết →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Performance;
