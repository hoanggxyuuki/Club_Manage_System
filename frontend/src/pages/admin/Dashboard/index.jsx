import React from "react";
import { useAuth } from "../../../context/AuthContext";
import FeedSection from "../../../components/dashboard/FeedSection";
import TopPerformers from "../../../components/dashboard/TopPerformers";
import { Link } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  FileText, 
  Settings, 
  Activity,
  TrendingUp,
  Database,
  HardDrive
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();

  const adminCards = [
    {
      title: 'Quản lý thành viên',
      description: 'Xem và quản lý tất cả thành viên',
      icon: <Users className="h-6 w-6" />,
      link: '/admin/members',
      color: 'bg-blue-500'
    },
    {
      title: 'Người dùng chờ duyệt',
      description: 'Duyệt đăng ký người dùng mới',
      icon: <UserCheck className="h-6 w-6" />,
      link: '/admin/pending-users',
      color: 'bg-yellow-500'
    },
    {
      title: 'Tin tức câu lạc bộ',
      description: 'Quản lý tin tức và thông báo',
      icon: <FileText className="h-6 w-6" />,
      link: '/admin/club-news',
      color: 'bg-green-500'
    },
    {
      title: 'Cấu hình hệ thống',
      description: 'Thiết lập cấu hình chung',
      icon: <Settings className="h-6 w-6" />,
      link: '/admin/system-config',
      color: 'bg-purple-500'
    },
    {
      title: 'Performance Monitor',
      description: 'Theo dõi hiệu suất hệ thống',
      icon: <Activity className="h-6 w-6" />,
      link: '/admin/performance',
      color: 'bg-red-500'
    },
    {
      title: 'Database Management',
      description: 'Quản lý và tối ưu database',
      icon: <Database className="h-6 w-6" />,
      link: '/admin/database',
      color: 'bg-indigo-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Chào mừng, {user?.username || 'Admin'}!
        </h1>
        <p className="text-blue-100">
          Quản lý hệ thống câu lạc bộ một cách hiệu quả
        </p>
      </div>

      {/* Admin Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminCards.map((card, index) => (
          <Link key={index} to={card.link}>
            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-200">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${card.color} text-white`}>
                  {card.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{card.title}</h3>
                  <p className="text-sm text-gray-600">{card.description}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Existing Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FeedSection />
        <TopPerformers />
      </div>
    </div>
  );
};

export default AdminDashboard;
