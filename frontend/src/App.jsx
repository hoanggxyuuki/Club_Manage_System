import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import PrivateRoute from "./components/auth/PrivateRoute";
import GoogleCallback from "./components/auth/GoogleCallback";
import MicrosoftCallback from "./components/auth/MicrosoftCallback";
import Toast from "./components/common/Toast";
import NotFound from "./components/common/NotFound";
import DashboardLayout from "./components/layouts/Dashboard";
import NavigationSetup from "./components/common/NavigationSetup";
import AdminDashboard from "./pages/admin/Dashboard";
import MemberDashboard from "./pages/member/Dashboard";
import MemberManagement from "./pages/admin/Members";
import DemoNotificationsAdmin from "./pages/admin/DemoNotifications"; 
import ClubNewsAdmin from "./pages/admin/ClubNews"; 
import Login from "./components/auth/Login";
import Register from "./components/auth/Register"; 
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";
import Profile from "./components/profile/Profile";
import Groups from "./pages/member/Group";
import Events from "./pages/member/Events";
import Evidence from "./pages/member/Evidence";
import Anonymous from "./pages/member/Anonymous";
import Forum from "./pages/member/Forum";
import SinglePostView from "./pages/member/Forum/SinglePostView";
import BankDeposits from "./pages/member/Bank";
import AdminBank from "./pages/admin/Bank";
import Chat from "./pages/member/Chat";
import Match from "./pages/member/Match";
import TasksAdminPage from "./pages/admin/Tasks";
import TasksPage from "./pages/member/Tasks";
import Performance from "./pages/member/Performance";
import PerformanceDetail from "./pages/member/Performance/PerformanceDetail";
import BlacklistedUrls from "./components/admin/BlacklistedUrls";
import GlobalCallHandler from "./components/chat/GlobalCallHandler";
import { useEffect } from "react";
import { VideoCallProvider } from "./context/VideoCallContext";
import VideoCallManager from "./components/chat/VideoCallManager";
import SystemConfigManagement from "./pages/admin/SystemConfig"; 
import DemoPage from "./pages/Demo/DemoPage"; 
import PendingUsersPage from "./pages/admin/PendingUsers"; 
import UserDetail from "./pages/admin/PendingUsers/UserDetail";
import DataManagement from "./pages/admin/DataManagement"; 
import PerformanceDashboard from './pages/admin/Performance';

const App = () => {
  const { user } = useAuth();

  useEffect(() => {}, []);
  return (
    <>
      <NavigationSetup />
      <Toast />
      <VideoCallProvider>
        {user && <GlobalCallHandler />}{" "}
        {/* This makes call dialogs available site-wide */}
        <Routes>
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          <Route
            path="/auth/microsoft/callback"
            element={<MicrosoftCallback />}
          />
          <Route
            path="/login"
            element={
              
              user ? (
                <Navigate
                  to={
                    user.role === "admin"
                      ? "/admin"
                      : user.role === "demo"
                        ? "/demo"
                        : "/member"
                  }
                  replace
                />
              ) : (
                <Login />
              )
            }
          />
          {/* Add Route for Register page */}
          <Route
            path="/register"
            element={
              user ? (
                <Navigate
                  to={
                    user.role === "admin"
                      ? "/admin"
                      : user.role === "demo"
                        ? "/demo"
                        : "/member"
                  }
                  replace
                />
              ) : (
                <Register />
              )
            }
          />
          <Route
            path="/forgot-password"
            element={
              user ? (
                <Navigate
                  to={
                    user.role === "admin"
                      ? "/admin"
                      : user.role === "demo"
                        ? "/demo"
                        : "/member"
                  }
                  replace
                />
              ) : (
                <ForgotPassword />
              )
            }
          />
          <Route
            path="/reset-password"
            element={
              user ? (
                <Navigate
                  to={
                    user.role === "admin"
                      ? "/admin"
                      : user.role === "demo"
                        ? "/demo"
                        : "/member"
                  }
                  replace
                />
              ) : (
                <ResetPassword />
              )
            }
          />
          <Route path="/demo" element={<DemoPage />} /> {/* Add this line */}
          <Route
            path="/admin"
            element={
              <PrivateRoute requiredRoles={["admin"]}>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route path="dashboard" index element={<MemberDashboard />} />
            <Route index element={<MemberDashboard />} />
            <Route path="members" element={<MemberManagement />} />
            <Route
              path="demo-notifications"
              element={<DemoNotificationsAdmin />}
            />{" "}
            {/* Thêm route quản lý thông báo demo */}
            <Route path="club-news" element={<ClubNewsAdmin />} />{" "}
            {/* Thêm route quản lý tin tức CLB */}
            <Route path="bankmanager" element={<AdminBank />} />
            <Route path="profile" element={<Profile />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="groups" element={<Groups />} />
            <Route path="events" element={<Events />} />
            <Route path="evidence" element={<Evidence />} />
            <Route path="forum" element={<Forum />} />
            <Route path="forum/:postId" element={<SinglePostView />} />
            <Route path="anonymous" element={<Anonymous />} />
            <Route path="bank" element={<BankDeposits />} />
            <Route path="chat" element={<Chat />} />
            <Route path="match" element={<Match />} />
            <Route path="performance" element={<Performance />} />
            <Route path="blacklist" element={<BlacklistedUrls />} />
            <Route
              path="system-config"
              element={<SystemConfigManagement />}
            />{" "}
            {/* Add route for system config */}
            <Route path="pending-users" element={<PendingUsersPage />} />{" "}
            {/* Add this line */}
            <Route path="pending-users/:id" element={<UserDetail />} />{" "}
            {/* Add route for pending user detail */}
            <Route path="data-management" element={<DataManagement />} />{" "}
            {/* Add route for data management */}
            <Route path="performance1" element={<PerformanceDashboard />} />
          </Route>
          <Route
            path="/member"
            element={
              <PrivateRoute requiredRoles={["member", "leader", "owner"]}>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<MemberDashboard />} />

            <Route path="dashboard" index element={<MemberDashboard />} />

            <Route path="groups" element={<Groups />} />

            <Route path="events" element={<Events />} />

            <Route
              path="events/attendance/:eventId/:code"
              element={<Events />}
            />

            <Route path="evidence" element={<Evidence />} />

            <Route path="forum" element={<Forum />} />

            <Route path="forum/:postId" element={<SinglePostView />} />

            <Route path="anonymous" element={<Anonymous />} />

            <Route path="bank" element={<BankDeposits />} />

            <Route path="chat" element={<Chat />} />

            <Route path="match" element={<Match />} />

            <Route path="tasks" element={<TasksPage />} />

            <Route path="profile" element={<Profile />} />

            <Route path="performance" element={<Performance />} />

            <Route
              path="performance/:memberId"
              element={<PerformanceDetail />}
            />
          </Route>
          <Route
            path="/"
            element={
              <Navigate
                to={
                  user?.role === "admin"
                    ? "/admin"
                    : user?.role === "demo"
                      ? "/demo"
                      : "/member"
                }
                replace
              />
            }
          />
          {/* Catch all unmatched routes */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <VideoCallManager />
      </VideoCallProvider>
    </>
  );
};

export default App;
