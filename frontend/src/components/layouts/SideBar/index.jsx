import React, { useState, useEffect, useRef } from "react";
import "./styles.css";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import notificationGif from "./14018-2900554931.gif";

import {
  faHome,
  faUsers,
  faUserCircle,
  faLayerGroup,
  faCalendarAlt,
  faFileAlt,
  faAngleRight,
  faComments,
  faEnvelope,
  faPiggyBank,
  faMessage,
  faHeart,
  faTasks,
  faStar,
  faShieldAlt,
  faCog,
  faBell,
  faSearch,
  faDatabase,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";

const SideBar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScreenSmall, setIsScreenSmall] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const sidebarRef = useRef(null);
  const location = useLocation();
  const { user, userData } = useAuth();
  const isAdmin = user?.role === "admin";
  const toggleBtnRef = useRef(null);

  useEffect(() => {
    let resizeTimer;

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const smallScreen = window.innerWidth < 768;
        setIsScreenSmall(smallScreen);

        if (!smallScreen && isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
        }
      }, 100);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
    };
  }, [isMobileMenuOpen]);

  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isScreenSmall &&
        isMobileMenuOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isScreenSmall && isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside, {
        passive: true,
      });
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isScreenSmall, isMobileMenuOpen]);

  
  useEffect(() => {
    if (isScreenSmall) {
      if (isMobileMenuOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen, isScreenSmall]);

  const notificationCounts = {
    chat: 3,
    tasks: 1,
  };

  const adminLinks = [
    { to: "/admin/dashboard", icon: faHome, text: "Trang chủ" },
    { to: "/admin/members", icon: faUsers, text: "Thành viên" },
    {
      to: "/admin/pending-users",
      icon: faUsers,
      text: "Duyệt người dùng",
      badge: true,
    },
    { to: "/admin/demo-notifications", icon: faBell, text: "Thông báo Demo" },
    { to: "/admin/club-news", icon: faFileAlt, text: "Tin tức CLB" },
    
    { to: "/admin/profile", icon: faUserCircle, text: "Hồ sơ" },
    { to: "/admin/groups", icon: faLayerGroup, text: "Nhóm" },
    { to: "/admin/events", icon: faCalendarAlt, text: "Sự kiện", badge: 2 },
    { to: "/admin/evidence", icon: faFileAlt, text: "Minh chứng" },
    { to: "/admin/forum", icon: faComments, text: "Diễn đàn" },
    ...(user?.role === "admin"
      ? [{ to: "/admin/anonymous", icon: faEnvelope, text: "Ẩn danh" }]
      : []),
    
    {
      to: "/admin/chat",
      icon: faMessage,
      text: "Nhắn tin",
      badge: notificationCounts.chat,
    },
    {
      to: "/admin/tasks",
      icon: faTasks,
      text: "Công việc",
      badge: notificationCounts.tasks,
    },
    { to: "/admin/performance", icon: faStar, text: "Thành tích" },
    { to: "/admin/blacklist", icon: faShieldAlt, text: "Blacklink" },
    { to: "/admin/system-config", icon: faCog, text: "Cấu hình hệ thống" },
    { to: "/admin/data-management", icon: faDatabase, text: "Quản lý dữ liệu" },
    { to: "/admin/performance1", icon: faChartLine , text: "Hiệu suất hệ thống" },
  ]

  const memberLinks = [
    { to: "/member/dashboard", icon: faHome, text: "Trang chủ" },
    { to: "/member/performance", icon: faStar, text: "Thành tích" },
    { to: "/member/groups", icon: faLayerGroup, text: "Nhóm" },
    { to: "/member/events", icon: faCalendarAlt, text: "Sự kiện", badge: 2 },
    { to: "/member/evidence", icon: faFileAlt, text: "Minh chứng" },
    { to: "/member/forum", icon: faComments, text: "Diễn đàn" },
    
    
    
    {
      to: "/member/chat",
      icon: faMessage,
      text: "Nhắn tin",
      badge: notificationCounts.chat,
    },
    {
      to: "/member/tasks",
      icon: faTasks,
      text: "Công việc",
      badge: notificationCounts.tasks,
    },
    { to: "/member/profile", icon: faUserCircle, text: "Hồ sơ" },
    
  ];

  const links = isAdmin ? adminLinks : memberLinks;

  
  const filteredLinks = searchQuery
    ? links.filter((link) =>
        link.text.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : links;

  const toggleMobileMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMobileMenuOpen((prevState) => !prevState);
  };

  const toggleSearch = () => {
    setIsSearchActive(!isSearchActive);
    if (isSearchActive) {
      setSearchQuery("");
    }
  };

  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isSearchActive) {
        setIsSearchActive(false);
        setSearchQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchActive]);

  return (
    <>
      <button
        ref={toggleBtnRef}
        onClick={toggleMobileMenu}
        className={`fixed top-4 left-4 z-[100] md:hidden 
                    flex items-center justify-center
                    w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-500 text-white rounded-lg
                    hover:from-indigo-700 hover:to-blue-600 
                    shadow-lg transition-all duration-200
                    active:scale-95 active:shadow-inner ${isMobileMenuOpen ? "hamburger-active" : ""}`}
        aria-label="Toggle mobile menu"
        aria-expanded={isMobileMenuOpen}
        style={{ touchAction: "manipulation" }}
        type="button"
      >
        <div className="relative w-6 h-6 flex items-center justify-center">
          <span
            className={`hamburger-line absolute block h-0.5 w-5 bg-white transform transition-all duration-300 ease-in-out ${
              isMobileMenuOpen ? "rotate-45 translate-y-0" : "-translate-y-1.5"
            }`}
          ></span>
          <span
            className={`hamburger-line absolute block h-0.5 bg-white transform transition-all duration-300 ease-in-out ${
              isMobileMenuOpen ? "w-0 opacity-0" : "w-5 opacity-100"
            }`}
          ></span>
          <span
            className={`hamburger-line absolute block h-0.5 w-5 bg-white transform transition-all duration-300 ease-in-out ${
              isMobileMenuOpen ? "-rotate-45 translate-y-0" : "translate-y-1.5"
            }`}
          ></span>
        </div>
      </button>

      {isScreenSmall && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[90] backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <div
        ref={sidebarRef}
        className={`
                    fixed inset-y-0 left-0 z-[95]
                    bg-gradient-to-b from-gray-800 via-gray-900 to-gray-950
                    text-white w-72
                    transition-transform duration-300 ease-in-out
                    shadow-2xl
                    ${isScreenSmall ? (isMobileMenuOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"} 
                    md:relative md:translate-x-0 md:z-0
                    overflow-y-auto
                    scrollbar-thin
                    border-r border-gray-800/50
                `}
      >
        {/* Sidebar Header with logo/branding */}
        <div className="sidebar-header sticky top-0 py-6 px-4 z-10 backdrop-blur-sm bg-gray-900/70">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-white flex items-center">
              <span className="inline-flex items-center justify-center p-2 bg-blue-600 rounded-lg shadow-lg mr-3">
                <FontAwesomeIcon
                  icon={isAdmin ? faShieldAlt : faUsers}
                  className="text-white h-4 w-4"
                />
              </span>
              {isAdmin ? "Admin Portal" : "Trang chủ"}
            </h1>
          </div>

          <div className="mt-4 bg-gray-800/70 p-2 rounded-lg flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-2 shadow-md">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="User"
                  className="w-7 h-7 rounded-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "";
                  }}
                />
              ) : (
                <span className="text-xs font-medium text-white">
                  {userData?.fullName?.substring(0, 2) || "U"}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {userData?.fullName
                  ? userData.fullName.split(" ").slice(-1)[0]
                  : "User"}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user?.role || "Member"}
              </p>
            </div>

            {/* Notification bell */}
            {/* <div className="relative">
              <button className="text-gray-300 hover:text-white p-1 rounded-full hover:bg-gray-700/50 overflow-hidden flex items-center justify-center">
                <img
                  src={notificationGif}
                  alt="Animation"
                  className="w-6 h-6 object-cover rounded-full"
                />
              </button>
            </div> */}
          </div>
        </div>

        {/* Menu sections */}
        <div className="mt-2">
          {/* Recently visited section (optional) */}
          {!searchQuery && (
            <div className="px-4 py-2">
              <h2 className="text-xs uppercase text-gray-500 tracking-wider mb-2 font-semibold">
                Menu
              </h2>
            </div>
          )}

          {/* Main navigation */}
          <nav className="px-3 pb-8">
            {searchQuery && filteredLinks.length === 0 && (
              <div className="px-4 py-3 text-gray-400 text-sm">
                Không tìm thấy kết quả nào
              </div>
            )}

            {filteredLinks.map((link) => {
              const isActive = location.pathname === link.to;

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => {
                    if (isScreenSmall) setIsMobileMenuOpen(false);
                    setIsSearchActive(false);
                    setSearchQuery("");
                  }}
                  className={`
                                        flex items-center space-x-3 px-4 py-3 mb-1 rounded-lg
                                        transition-all duration-200 ease-in-out
                                        group relative menu-item-hover
                                        ${
                                          isActive
                                            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg active-menu-item"
                                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                                        }
                                    `}
                >
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={link.icon}
                      className={`
                                                w-5 h-5 transition-transform duration-200
                                                ${isActive ? "scale-110" : "group-hover:scale-110"}
                                            `}
                    />

                    {/* Badge for notifications */}
                    {link.badge && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs min-w-[18px] h-[18px] rounded-full flex items-center justify-center badge-pulse">
                        {link.badge}
                      </span>
                    )}
                  </div>
                  <span className="flex-1 font-medium">{link.text}</span>
                  {isActive && (
                    <FontAwesomeIcon
                      icon={faAngleRight}
                      className="w-4 h-4 menu-indicator"
                    />
                  )}
                  {!isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent group-hover:from-transparent group-hover:to-gray-700/20 rounded-lg transition-all duration-300" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer with version or other info */}
        <div className="px-4 py-3 mt-auto border-t border-gray-800/50 text-center text-xs text-gray-500">
          hoanggxyuuki
        </div>
      </div>
    </>
  );
};

export default SideBar;
