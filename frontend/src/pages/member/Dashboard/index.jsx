import { useAuth } from "../../../context/AuthContext";
import FeedSection from "../../../components/dashboard/FeedSection";
import TopPerformers from "../../../components/dashboard/TopPerformers";
import React, { useEffect, useState, useRef } from "react";
import { getProfile } from "../../../services/api";
import { useNotification } from "../../../context/NotificationContext";
import { getTodayBirthdays } from "../../../services/users";
import { eventService } from "../../../services/events";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import {
  UserCircleIcon,
  BellIcon,
  UsersIcon,
  CalendarIcon,
  ClockIcon,
  EnvelopeIcon,
  CakeIcon,
  FireIcon,
  ChartBarIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { BellIcon as BellIconSolid } from "@heroicons/react/24/solid";
import LoadingSpinner from "../../../components/common/LoadingSpinner";

const url = import.meta.env.VITE_PROXY_API_URL;

const WelcomeBanner = ({ userData, onScrollToTopPerformers }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg mb-4 sm:mb-6 overflow-hidden">
      <div className="px-4 py-6 sm:px-6 md:py-10 md:px-10 relative">
        {/* Abstract shapes - visible on larger screens */}
        <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-white opacity-10 rounded-full translate-x-1/3 -translate-y-1/3 hidden sm:block"></div>
        <div className="absolute bottom-0 left-16 sm:left-24 w-24 h-24 md:w-32 md:h-32 bg-white opacity-10 rounded-full -translate-x-1/2 translate-y-1/2 hidden sm:block"></div>

        <div className="relative z-10">
          <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
            {userData?.avatar ? (
              <img
                src={`${url}${userData?.avatar}`}
                alt={userData?.fullName?.charAt(0)}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-4 border-white/20 object-cover"
              />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 flex items-center justify-center">
                <UserCircleIcon className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
            )}
            <div>
              <h2 className="text-white text-xl sm:text-2xl font-bold">
                {getGreeting()}, {userData?.fullName || userData?.username}!
              </h2>
              <p className="text-blue-100 mt-1 text-sm sm:text-base">
                Chúc bạn một ngày tuyệt vời
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mt-5 sm:mt-6">
            <a
              href="/member/events"
              className="bg-white/10 hover:bg-white/15 p-2 sm:p-3 rounded-lg flex items-center space-x-1.5 sm:space-x-2 transition-all group"
            >
              <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-100 group-hover:scale-110 transition-transform" />

              <span className="text-white text-xs sm:text-sm font-medium">
                Sự kiện
              </span>
            </a>
            <a
              href="/member/groups"
              className="bg-white/10 hover:bg-white/15 p-2 sm:p-3 rounded-lg flex items-center space-x-1.5 sm:space-x-2 transition-all group"
            >
              <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-100 group-hover:scale-110 transition-transform" />

              <span className="text-white text-xs sm:text-sm font-medium">
                Nhóm
              </span>
            </a>
            <a
              href="/member/chat"
              className="bg-white/10 hover:bg-white/15 p-2 sm:p-3 rounded-lg flex items-center space-x-1.5 sm:space-x-2 transition-all group"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-100 group-hover:scale-110 transition-transform" />

              <span className="text-white text-xs sm:text-sm font-medium">
                Tin nhắn
              </span>
            </a>
            <a
              href="/member/performance"
              onClick={(e) => {
                if (window.innerWidth < 1024) { 
                  e.preventDefault();
                  if (onScrollToTopPerformers) {
                    onScrollToTopPerformers();
                  }
                }
              }}
              className="bg-white/10 hover:bg-white/15 p-2 sm:p-3 rounded-lg flex items-center space-x-1.5 sm:space-x-2 transition-all group"
            >
              <ChartBarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-100 group-hover:scale-110 transition-transform" />

              <span className="text-white text-xs sm:text-sm font-medium">
                Thành tích
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const BirthdaysWidget = () => {
  const [birthdays, setBirthdays] = useState([]);

  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        const data = await getTodayBirthdays();
        setBirthdays(data);
      } catch (error) {
        console.error("Error fetching birthdays:", error);
      }
    };
    fetchBirthdays();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden mb-4 sm:mb-6">
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-pink-100 flex items-center justify-center">
              <CakeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-pink-500" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">
              Sinh nhật hôm nay
            </h2>
          </div>
          <span className="text-xs font-medium text-pink-500 bg-pink-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
            {birthdays.length} người
          </span>
        </div>
      </div>

      <div className="p-3 sm:p-5">
        {birthdays.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {birthdays.map((user) => (
              <div
                key={user._id}
                className="flex items-center p-2 rounded-lg hover:bg-pink-50 transition-colors"
              >
                {user.avatar ? (
                  <img
                    src={`${url}${user.avatar}`}
                    alt={user.fullName}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover mr-2 sm:mr-3"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-pink-100 flex items-center justify-center mr-2 sm:mr-3">
                    <span className="font-semibold text-pink-500 text-sm sm:text-base">
                      {user.fullName.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900 text-sm sm:text-base">
                    {user.fullName}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Chúc mừng sinh nhật! 🎉
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-5 sm:py-6 text-center">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-pink-50 flex items-center justify-center mb-2 sm:mb-3">
              <CakeIcon className="h-6 w-6 sm:h-8 sm:w-8 text-pink-300" />
            </div>
            <p className="text-gray-500 text-xs sm:text-sm">
              Không có sinh nhật nào hôm nay
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const UpcomingEventsWidget = () => {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await eventService.getCurrentMonthEvents();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingEvents = data
          .filter((event) => new Date(event.startDate) >= today)
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
          .slice(0, 3);

        setEvents(upcomingEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };
    fetchEvents();
  }, []);

  const handleEventClick = (eventId) => {
    navigate(`/member/events?selected=${eventId}`);
  };

  const getDateString = (dateString) => {
    const date = moment(dateString);
    const now = moment();

    if (date.isSame(now, "day")) {
      return `Hôm nay, ${date.format("HH:mm")}`;
    } else if (date.isSame(now.clone().add(1, "day"), "day")) {
      return `Ngày mai, ${date.format("HH:mm")}`;
    } else {
      return date.format("DD/MM/YYYY HH:mm");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">
              Sự kiện sắp tới
            </h2>
          </div>
          <button
            onClick={() => navigate("/member/events")}
            className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            Xem tất cả
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14"></path>
              <path d="M12 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-5">
        {events.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {events.map((event) => (
              <div
                key={event._id}
                onClick={() => handleEventClick(event._id)}
                className="p-3 sm:p-4 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-lg cursor-pointer transition-all duration-200 group"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-1 text-sm sm:text-base">
                    {event.name}
                  </h3>
                  {event.type && (
                    <span className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white text-blue-600 rounded-full border border-blue-200 ml-1 flex-shrink-0">
                      {event.type}
                    </span>
                  )}
                </div>
                <div className="mt-2 sm:mt-3 flex items-center text-xs sm:text-sm text-gray-500">
                  <ClockIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 text-blue-400" />

                  <span>{getDateString(event.startDate)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-5 sm:py-6 text-center">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-50 flex items-center justify-center mb-2 sm:mb-3">
              <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-300" />
            </div>
            <p className="text-gray-500 text-xs sm:text-sm">
              Không có sự kiện nào sắp tới
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const NotificationsWidget = () => {
  const { notifications, markAsRead } = useNotification();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 sm:p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
      >
        {unreadCount > 0 ? (
          <BellIconSolid className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
        ) : (
          <BellIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
        )}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] sm:text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[1rem] sm:min-w-[1.25rem]">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-0 top-14 sm:top-16 mx-3 sm:mx-4 md:mx-0 md:absolute md:right-0 md:top-auto md:w-80 bg-white rounded-lg shadow-lg z-50 max-h-[70vh] sm:max-h-[80vh] overflow-y-auto">
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between border-b pb-2 mb-2 sm:mb-3">
              <h3 className="text-base sm:text-lg font-semibold">Thông báo</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            {notifications.length > 0 ? (
              <div className="space-y-1.5 sm:space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-2.5 sm:p-3 rounded-lg cursor-pointer ${notification.read ? "bg-white hover:bg-gray-50" : "bg-blue-50 hover:bg-blue-100"} transition-colors`}
                    onClick={() => {
                      markAsRead(notification._id);
                      setIsOpen(false);
                    }}
                  >
                    <p className="text-xs sm:text-sm">{notification.content}</p>
                    <span className="text-[10px] sm:text-xs text-gray-500 mt-1 block">
                      {moment(notification.createdAt).fromNow()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 sm:py-6">
                <BellIcon className="h-7 w-7 sm:h-8 sm:w-8 mx-auto text-gray-300 mb-2" />

                <p className="text-xs sm:text-sm text-gray-500">
                  Không có thông báo mới
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const MemberCard = ({ profile, user }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden mb-4 sm:mb-6">
      <div className="h-16 sm:h-20 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
      <div className="px-4 sm:px-5 py-4 sm:py-5 relative">
        <div className="absolute -top-8 sm:-top-10 left-4 sm:left-5">
          {profile.avatar ? (
            <img
              src={`${url}${profile.avatar}`}
              alt={profile.username}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-white object-cover"
            />
          ) : (
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-white bg-blue-100 flex items-center justify-center">
              <span className="text-lg sm:text-xl font-semibold text-blue-500">
                {profile.username?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="pt-4 sm:pt-6">
          <h3 className="font-semibold text-base sm:text-lg text-gray-800">
            {profile.username}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
            Thành viên từ {moment(profile.createdAt).format("MM/YYYY")}
          </p>

          <div className="flex space-x-2">
            <a
              href="/member/profile"
              className="text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Hồ sơ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickLinks = () => {
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
};
const MemberDashboard = () => {
  const { userData, user } = useAuth();
  const [profile, setProfile] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const topPerformersRef = React.useRef(null);
  useEffect(() => {
    loadProfile();
  }, []);
  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const response = await getProfile();
      setProfile(response);
    } catch (error) {
      setError("Failed to load profile data");
      console.error("Failed to fetch profile", error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToTopPerformers = () => {
    if (topPerformersRef.current) {
      topPerformersRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>{error}</p>
        <button
          onClick={loadProfile}
          className="mt-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-4 sm:py-6">
        {/* Show welcome banner on all screen sizes */}
        <WelcomeBanner userData={userData} onScrollToTopPerformers={scrollToTopPerformers} />

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Left Sidebar */}
          <div className="hidden lg:block lg:w-1/4">
            <div className="space-y-5 sticky top-6">
              <MemberCard profile={profile} user={user} />
              {/* <QuickLinks /> */}
              <TopPerformers />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Feed Section */}
            <FeedSection />
          </div>

          {/* Right Sidebar */}
          <div className="hidden xl:block w-1/4">
            <div className="sticky top-6 space-y-5">
              <BirthdaysWidget />
              <UpcomingEventsWidget />
            </div>
          </div>

          {/* Mobile Widgets (after feed) */}
          <div className="lg:hidden mt-5 sm:mt-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div ref={topPerformersRef}>
                <TopPerformers />
              </div>
              <BirthdaysWidget />
            </div>
            <UpcomingEventsWidget />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
