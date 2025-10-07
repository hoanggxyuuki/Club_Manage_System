import React, { useState, useEffect } from "react";
import { evidenceService } from "../../../services/evidence";
import { useAuth } from "../../../context/AuthContext";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  FileText,
  Calendar,
  TrendingUp,
  Download,
  Filter,
  RefreshCw,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";
import LoadingSpinner from "../../../components/common/LoadingSpinner";

const EvidenceDashboard = () => {
  const [evidences, setEvidences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [typeData, setTypeData] = useState([]);
  const [dateRange, setDateRange] = useState("month"); 
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  useEffect(() => {
    fetchEvidencesData();
  }, []);

  const fetchEvidencesData = async () => {
    setRefreshing(true);
    try {
      const data =
        user?.role === "member"
          ? await evidenceService.getMyEvidences()
          : await evidenceService.getAllEvidences();

      setEvidences(data);

      
      const totalCount = data.length;
      const pendingCount = data.filter((e) => e.status === "pending").length;
      const acceptedCount = data.filter((e) => e.status === "accepted").length;
      const rejectedCount = data.filter((e) => e.status === "rejected").length;

      setStats({
        total: totalCount,
        pending: pendingCount,
        accepted: acceptedCount,
        rejected: rejectedCount,
      });

      
      processChartData(data);

      
      const typesCount = {
        image: data.filter((e) => e.type === "image").length,
        document: data.filter((e) => e.type === "document").length,
        link: data.filter((e) => e.type === "link").length,
      };

      setTypeData([
        { name: "Hình ảnh", value: typesCount.image },
        { name: "Tài liệu", value: typesCount.document },
        { name: "Liên kết", value: typesCount.link },
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const processChartData = (data) => {
    
    const dates = {};

    data.forEach((evidence) => {
      
      let dateKey;
      const date = new Date(evidence.createdAt);

      if (dateRange === "week") {
        
        dateKey = format(date, "EEEE"); 
      } else if (dateRange === "month") {
        
        dateKey = format(date, "dd/MM");
      } else {
        
        dateKey = format(date, "MMMM");
      }

      if (!dates[dateKey]) {
        dates[dateKey] = {
          date: dateKey,
          total: 0,
          accepted: 0,
          rejected: 0,
          pending: 0,
        };
      }

      dates[dateKey].total += 1;
      dates[dateKey][evidence.status] += 1;
    });

    
    const chartArray = Object.values(dates);
    setChartData(chartArray);
  };

  const handleChangeRange = (range) => {
    setDateRange(range);
    processChartData(evidences);
  };

  const handleExport = async () => {
    try {
      await evidenceService.exportEvidences();
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Đang tải dữ liệu..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Bảng thống kê minh chứng
          </h1>

          <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
            <button
              onClick={fetchEvidencesData}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Làm mới
            </button>

            {["admin", "leader"].includes(user?.role) && (
              <button
                onClick={handleExport}
                className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="w-4 h-4 mr-2" />
                Xuất Excel
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Tổng số minh chứng
                    </dt>
                    <dd>
                      <div className="text-lg font-semibold text-gray-900">
                        {stats.total}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Đang chờ duyệt
                    </dt>
                    <dd>
                      <div className="text-lg font-semibold text-gray-900">
                        {stats.pending}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Đã chấp nhận
                    </dt>
                    <dd>
                      <div className="text-lg font-semibold text-gray-900">
                        {stats.accepted}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Bị từ chối
                    </dt>
                    <dd>
                      <div className="text-lg font-semibold text-gray-900">
                        {stats.rejected}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Chart 1: Submissions over time */}
        <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Minh chứng theo thời gian
            </h2>

            <div className="relative inline-block text-left">
              <div>
                <button
                  type="button"
                  className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  id="menu-button"
                  aria-expanded="true"
                  aria-haspopup="true"
                >
                  {dateRange === "week"
                    ? "Tuần này"
                    : dateRange === "month"
                      ? "Tháng này"
                      : "Năm này"}
                  <ChevronDown
                    className="-mr-1 ml-2 h-5 w-5"
                    aria-hidden="true"
                  />
                </button>
              </div>

              <div
                className="hidden origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="menu-button"
                tabIndex="-1"
              >
                <div className="py-1" role="none">
                  <button
                    className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
                    onClick={() => handleChangeRange("week")}
                  >
                    Tuần này
                  </button>
                  <button
                    className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
                    onClick={() => handleChangeRange("month")}
                  >
                    Tháng này
                  </button>
                  <button
                    className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
                    onClick={() => handleChangeRange("year")}
                  >
                    Năm này
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="accepted" name="Chấp nhận" fill="#10B981" />

                <Bar dataKey="pending" name="Đang chờ" fill="#F59E0B" />

                <Bar dataKey="rejected" name="Từ chối" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Breakdown by type */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Filter className="w-5 h-5 mr-2 text-blue-600" />
            Phân loại minh chứng
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {typeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} minh chứng`, ""]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {typeData.map((type, index) => (
              <div key={`type-${index}`} className="flex flex-col items-center">
                <div
                  className="w-4 h-4 rounded-full mb-1"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />

                <span className="text-xs text-gray-600">{type.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Hoạt động gần đây
          </h2>
          <a
            href="/evidence"
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
          >
            Xem tất cả
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Tiêu đề
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Người gửi
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Trạng thái
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Ngày gửi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {evidences.slice(0, 5).map((evidence) => (
                <tr key={evidence._id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {evidence.title}
                    </div>
                    <div className="text-xs text-gray-500">{evidence.type}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {evidence.submittedBy?.username || "Không rõ"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        evidence.status === "accepted"
                          ? "bg-green-100 text-green-800"
                          : evidence.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {evidence.status === "accepted" ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : evidence.status === "rejected" ? (
                        <AlertTriangle className="w-3 h-3 mr-1" />
                      ) : (
                        <Clock className="w-3 h-3 mr-1" />
                      )}
                      {evidence.status === "accepted"
                        ? "Chấp nhận"
                        : evidence.status === "rejected"
                          ? "Từ chối"
                          : "Chờ duyệt"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(evidence.createdAt), "dd/MM/yyyy")}
                  </td>
                </tr>
              ))}
              {evidences.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-4 text-sm text-gray-500 text-center"
                  >
                    Chưa có minh chứng nào được gửi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Contributors */}
      {["admin", "leader"].includes(user?.role) && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            Thành viên tích cực
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Thành viên
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Tổng minh chứng
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Đã chấp nhận
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Tỉ lệ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* This would normally be populated with actual data from API */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          NT
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          Nguyễn Thành
                        </div>
                        <div className="text-sm text-gray-500">
                          nguyenthanh@example.com
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">12</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">10</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">83%</div>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          PL
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          Phạm Linh
                        </div>
                        <div className="text-sm text-gray-500">
                          phamlinh@example.com
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">8</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">7</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">88%</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceDashboard;
