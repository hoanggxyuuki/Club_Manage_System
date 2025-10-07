import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import { evidenceService } from "../../../services/evidence";
import { format } from "date-fns";
import EvidenceForm from "./EvidenceForm";
import EvidenceReview from "./EvidenceReview";
import {
  Calendar,
  FileText,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Plus,
  Clock,
  ChevronDown,
  ChevronUp,
  Download,
  Search,
  Filter,
  BarChart,
  RefreshCw,
  X,
} from "lucide-react";
import LoadingSpinner from "../../../components/common/LoadingSpinner";

const VITE_PROXY_API_URL = import.meta.env.VITE_PROXY_API_URL;

const Evidence = () => {
  const { user } = useAuth();
  const [evidences, setEvidences] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [evidenceToDelete, setEvidenceToDelete] = useState(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const evidenceFormRef = useRef(null); 
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageSrc, setPreviewImageSrc] = useState(null);

  const toggleDescription = (id) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const truncateText = (text, maxLength = 80) => {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  const handleEdit = (evidence) => {
    setSelectedEvidence(evidence);
    setShowForm(true);
  };

  const handleSubmit = async (formData) => {
    try {
      if (selectedEvidence) {
        await evidenceService.updateEvidence(selectedEvidence._id, formData);
        showNotification("Cập nhật minh chứng thành công", "success");
      } else {
        await evidenceService.submitEvidence(formData);
        showNotification("Gửi minh chứng thành công", "success");
      }
      setShowForm(false);
      setSelectedEvidence(null);
      fetchEvidences();
    } catch (error) {
      showNotification("Không thể gửi minh chứng", "error");
      console.error(error);
    }
  };

  const handleReviewSubmit = async (evidenceId, reviewData) => {
    try {
      await evidenceService.reviewEvidence(evidenceId, reviewData);
      showNotification("Gửi đánh giá thành công", "success");
      setShowReview(false);
      setSelectedEvidence(null);
      fetchEvidences();
    } catch (error) {
      showNotification("Không thể gửi đánh giá", "error");
      console.error(error);
    }
  };

  const fetchEvidences = async () => {
    setRefreshing(true);
    try {
      const data =
        user?.role === "member"
          ? await evidenceService.getMyEvidences()
          : await evidenceService.getAllEvidences();
      setEvidences(data);
    } catch (error) {
      console.error("Lỗi khi tải minh chứng:", error);
      showNotification("Không thể tải minh chứng", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleExport = async () => {
    try {
      showNotification("Đang xuất file excel...", "info");
      await evidenceService.exportEvidences();
      showNotification("Xuất file excel thành công", "success");
    } catch (error) {
      console.error("Lỗi khi xuất file excel:", error);
      showNotification("Không thể xuất file excel", "error");
    }
  };

  const showNotification = (message, type = "info") => {
    const notificationEl = document.createElement("div");
    notificationEl.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
      type === "success"
        ? "bg-green-500"
        : type === "error"
          ? "bg-red-500"
          : type === "info"
            ? "bg-blue-500"
            : "bg-yellow-500"
    } text-white z-50 animate-fade-in-down`;

    notificationEl.textContent = message;
    document.body.appendChild(notificationEl);
    setTimeout(() => {
      notificationEl.classList.add("animate-fade-out");
      setTimeout(() => notificationEl.remove(), 300);
    }, 3000);
  };

  const handleDelete = async (evidenceId) => {
    try {
      await evidenceService.deleteEvidence(evidenceId);
      showNotification("Xóa minh chứng thành công", "success");
      fetchEvidences();
      setShowDeleteConfirm(false);
      setEvidenceToDelete(null);
    } catch (error) {
      showNotification("Không thể xóa minh chứng", "error");
    }
  };

  const confirmDelete = (evidence) => {
    setEvidenceToDelete(evidence);
    setShowDeleteConfirm(true);
  };

  useEffect(() => {
    fetchEvidences();
  }, []);

  const handleReview = (evidence) => {
    setSelectedEvidence(evidence);
    setShowReview(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      accepted: {
        icon: <CheckCircle className="w-4 h-4" />,
        class: "bg-green-100 text-green-800 border border-green-200",
        label: "Đã chấp nhận",
      },
      rejected: {
        icon: <AlertCircle className="w-4 h-4" />,
        class: "bg-red-100 text-red-800 border border-red-200",
        label: "Bị từ chối",
      },
      pending: {
        icon: <Clock className="w-4 h-4" />,
        class: "bg-yellow-100 text-yellow-800 border border-yellow-200",
        label: "Đang chờ",
      },
      revision_requested: {
        icon: <RefreshCw className="w-4 h-4" />,
        class: "bg-blue-100 text-blue-800 border border-blue-200",
        label: "Cần chỉnh sửa",
      },
    };
    return badges[status] || badges.pending;
  };

  const getStatusClassNameDesktop = (status) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "revision_requested":
        return "bg-blue-100 text-blue-800";
      case "pending":
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };
  const filteredEvidences = evidences.filter((evidence) => {
    const matchesSearch =
      evidence.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evidence.description &&
        evidence.description.toLowerCase().includes(searchTerm.toLowerCase()));

    if (activeFilter === "all") return matchesSearch;
    return matchesSearch && evidence.status === activeFilter;
  });

  const statusCounts = {
    all: evidences.length,
    pending: evidences.filter((e) => e.status === "pending").length,
    accepted: evidences.filter((e) => e.status === "accepted").length,
    rejected: evidences.filter((e) => e.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <LoadingSpinner size="xl" text="Đang tải minh chứng..." />
      </div>
    );
  }

  
  const handleScrollToEvidenceForm = () => {
    
    setShowForm(true);
    
  };

  
  const handleImagePreview = (imageSrc) => {
    setPreviewImageSrc(`${VITE_PROXY_API_URL}${imageSrc}`);
    setShowImagePreview(true);
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        {/* Header Section */}
        <div className="relative bg-gradient-to-r from-blue-700 to-blue-500 rounded-xl p-6 mb-8 text-white shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-pattern opacity-10"></div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                Minh chứng hoạt động
              </h1>
              <p className="mt-1 text-sm text-blue-100">
                Quản lý và theo dõi các hoạt động và đóng góp của thành viên
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {["admin", "leader"].includes(user?.role) && (
                <button
                  onClick={handleExport}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium bg-white text-blue-700 rounded-md hover:bg-blue-50 transition-all shadow-sm flex items-center justify-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Xuất Excel
                </button>
              )}
              <button
                onClick={handleScrollToEvidenceForm}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Gửi minh chứng
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
            <div
              onClick={() => setActiveFilter("all")}
              className={`bg-white bg-opacity-15 hover:bg-opacity-25 cursor-pointer rounded-lg p-3 border border-white border-opacity-20 transition-all ${activeFilter === "all" ? "bg-opacity-25 border-opacity-50" : ""}`}
            >
              <div className="text-lg sm:text-2xl font-bold">
                {statusCounts.all}
              </div>
              <div className="text-xs sm:text-sm font-medium text-blue-100 flex items-center gap-1">
                <BarChart className="w-3 h-3" /> Tổng số
              </div>
            </div>
            <div
              onClick={() => setActiveFilter("pending")}
              className={`bg-white bg-opacity-15 hover:bg-opacity-25 cursor-pointer rounded-lg p-3 border border-white border-opacity-20 transition-all ${activeFilter === "pending" ? "bg-opacity-25 border-opacity-50" : ""}`}
            >
              <div className="text-lg sm:text-2xl font-bold">
                {statusCounts.pending}
              </div>
              <div className="text-xs sm:text-sm font-medium text-blue-100 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Đang chờ
              </div>
            </div>
            <div
              onClick={() => setActiveFilter("accepted")}
              className={`bg-white bg-opacity-15 hover:bg-opacity-25 cursor-pointer rounded-lg p-3 border border-white border-opacity-20 transition-all ${activeFilter === "accepted" ? "bg-opacity-25 border-opacity-50" : ""}`}
            >
              <div className="text-lg sm:text-2xl font-bold">
                {statusCounts.accepted}
              </div>
              <div className="text-xs sm:text-sm font-medium text-blue-100 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Chấp nhận
              </div>
            </div>
            <div
              onClick={() => setActiveFilter("rejected")}
              className={`bg-white bg-opacity-15 hover:bg-opacity-25 cursor-pointer rounded-lg p-3 border border-white border-opacity-20 transition-all ${activeFilter === "rejected" ? "bg-opacity-25 border-opacity-50" : ""}`}
            >
              <div className="text-lg sm:text-2xl font-bold">
                {statusCounts.rejected}
              </div>
              <div className="text-xs sm:text-sm font-medium text-blue-100 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Từ chối
              </div>
            </div>
          </div>
        </div>

        {/* Search & Timeline Section */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Tìm kiếm minh chứng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
            />

            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchEvidences}
              className="px-3 py-2 flex items-center gap-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />

              <span className="hidden sm:inline">Làm mới</span>
            </button>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="bg-white rounded-lg shadow-sm p-5 mb-8 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Lịch trình
          </h2>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 sm:left-5 top-0 h-full w-0.5 bg-blue-100"></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="relative pl-10 sm:pl-12">
                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Giai đoạn nộp minh chứng
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    06/02/2025 - 31/07/2025
                  </p>
                  <p className="text-xs text-gray-500 mt-1.5">
                    Thành viên có thể nộp các minh chứng hoạt động trong thời
                    gian này
                  </p>
                </div>
              </div>

              <div className="relative pl-10 sm:pl-12">
                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Giai đoạn đánh giá
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    01/08/2025 - 15/08/2025
                  </p>
                  <p className="text-xs text-gray-500 mt-1.5">
                    Ban quản trị sẽ xem xét và đánh giá các minh chứng đã nộp
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* No evidence message */}
        {filteredEvidences.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-100">
            <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              Chưa có minh chứng nào
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mt-2">
              {searchTerm
                ? `Không tìm thấy minh chứng phù hợp với từ khóa "${searchTerm}".`
                : "Hãy bắt đầu bằng cách tạo minh chứng đầu tiên của bạn."}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}

        {/* Mobile View */}
        {filteredEvidences.length > 0 && (
          <div className="block md:hidden space-y-4">
            {filteredEvidences.map((evidence) => {
              const statusBadge = getStatusBadge(evidence.status);
              const isExpanded = expandedDescriptions[evidence._id];
              const hasLongDescription =
                evidence.description && evidence.description.length > 80;

              return (
                <div
                  key={evidence._id}
                  className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:border-gray-200 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {evidence.title}
                      </h3>
                      <div className="text-sm text-gray-600 mt-1">
                        {isExpanded
                          ? evidence.description
                          : truncateText(evidence.description)}
                        {hasLongDescription && (
                          <button
                            onClick={() => toggleDescription(evidence._id)}
                            className="ml-1 text-blue-500 inline-flex items-center"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-3 h-3" /> Thu gọn
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3" /> Xem thêm
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.class} ml-2`}
                    >
                      {statusBadge.icon}
                      <span className="ml-1.5">{statusBadge.label}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 border-t pt-3">
                    {evidence.type === "link" ? (
                      
                      <a
                        href={evidence.content}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-900 hover:underline transition-all"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />

                        <span>Mở liên kết</span>
                      </a>
                    ) : evidence.type === "image" ? (
                      
                      <button
                        onClick={() => handleImagePreview(evidence.content)}
                        className="flex items-center text-blue-600 hover:text-blue-900 hover:underline transition-all"
                      >
                        <img
                          src={`${VITE_PROXY_API_URL}${evidence.content}`}
                          alt={evidence.title}
                          className="w-8 h-8 object-cover rounded-md mr-1 border border-gray-200"
                        />

                        <span>Xem ảnh</span>
                      </button>
                    ) : (
                      <a
                        href={`${VITE_PROXY_API_URL}${evidence.content}`}
                        target="_blank"
                        className="flex items-center text-blue-600 hover:text-blue-900 hover:underline transition-all"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        <span>Tải tài liệu</span>
                      </a>
                    )}

                    {(user.role === "member" || user.role === "leader") &&
                      evidence.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleEdit(evidence)}
                            className="flex items-center text-indigo-600 hover:text-indigo-900 hover:underline transition-all"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />

                            <span>Sửa</span>
                          </button>
                          <button
                            onClick={() => confirmDelete(evidence)}
                            className="flex items-center text-red-600 hover:text-red-900 hover:underline transition-all"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />

                            <span>Xóa</span>
                          </button>
                        </>
                      )}

                    {["admin", "leader"].includes(user.role) &&
                      evidence.status === "pending" && (
                        <button
                          onClick={() => handleReview(evidence)}
                          className="flex items-center text-green-600 hover:text-green-900 hover:underline transition-all"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />

                          <span>Đánh giá</span>
                        </button>
                      )}
                  </div>
                  <div className="text-sm mb-2">
                    <span className="font-semibold">Points:</span>{" "}
                    {evidence.points || 0}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Desktop View */}
        {filteredEvidences.length > 0 && (
          <div className="hidden md:block bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-dark"
                    >
                      Title & Description
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-dark"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      Points
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Ngày gửi
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEvidences.map((evidence) => {
                    const statusBadge = getStatusBadge(evidence.status);
                    return (
                      <tr
                        key={evidence._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col">
                            <strong className="text-gray-900 truncate max-w-xs">
                              {evidence.title}
                            </strong>
                            <span className="text-gray-500 truncate max-w-xs">
                              {evidence.description}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                          {evidence.type === "image" ? (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              Image
                            </span>
                          ) : evidence.type === "link" ? (
                            <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              Link
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                              Document
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                          {evidence.points}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusClassNameDesktop(
                              evidence.status,
                            )}`}
                          >
                            {evidence.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {format(
                            new Date(evidence.createdAt),
                            "dd/MM/yyyy HH:mm",
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            {evidence.type === "link" ? (
                              <a
                                href={evidence.content}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-900 inline-flex items-center group"
                              >
                                <ExternalLink className="w-4 h-4" />

                                <span className="sr-only md:not-sr-only md:ml-1.5 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                  Mở liên kết
                                </span>
                              </a>
                            ) : evidence.type === "image" ? (
                              <button
                                onClick={() =>
                                  handleImagePreview(evidence.content)
                                }
                                className="text-blue-600 hover:text-blue-900 inline-flex items-center group"
                              >
                                <img
                                  src={`${VITE_PROXY_API_URL}${evidence.content}`}
                                  alt={evidence.title}
                                  className="w-6 h-6 object-cover rounded border border-gray-200 hover:border-blue-300 transition-all"
                                />

                                <span className="sr-only md:not-sr-only md:ml-1.5 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                  Xem ảnh
                                </span>
                              </button>
                            ) : (
                              <a
                                href={`${VITE_PROXY_API_URL}${evidence.content}`}
                                target="_blank"
                                className="text-blue-600 hover:text-blue-900 inline-flex items-center group"
                              >
                                <FileText className="w-4 h-4" />

                                <span className="sr-only md:not-sr-only md:ml-1.5 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                  Tải tài liệu
                                </span>
                              </a>
                            )}

                            {(user.role === "member" ||
                              user.role === "leader") &&
                              evidence.status === "pending" && (
                                <>
                                  <button
                                    onClick={() => handleEdit(evidence)}
                                    className="text-indigo-600 hover:text-indigo-900 group"
                                  >
                                    <Edit2 className="w-4 h-4" />

                                    <span className="sr-only md:not-sr-only md:ml-1.5 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                      Sửa
                                    </span>
                                  </button>
                                  <button
                                    onClick={() => confirmDelete(evidence)}
                                    className="text-red-600 hover:text-red-900 group"
                                  >
                                    <Trash2 className="w-4 h-4" />

                                    <span className="sr-only md:not-sr-only md:ml-1.5 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                      Xóa
                                    </span>
                                  </button>
                                </>
                              )}

                            {["admin", "leader"].includes(user.role) &&
                              evidence.status === "pending" && (
                                <button
                                  onClick={() => handleReview(evidence)}
                                  className="text-green-600 hover:text-green-900 inline-flex items-center group"
                                >
                                  <CheckCircle className="w-4 h-4" />

                                  <span className="sr-only md:not-sr-only md:ml-1.5 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    Đánh giá
                                  </span>
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <EvidenceForm
          visible={showForm}
          onClose={() => {
            
            setShowForm(false);
            setSelectedEvidence(null);
          }}
          onSubmit={(formData) => {
            
            handleSubmit(formData);
          }}
          initialData={selectedEvidence}
        />
      )}

      <EvidenceReview
        visible={showReview}
        onClose={() => {
          setShowReview(false);
          setSelectedEvidence(null);
        }}
        onSubmit={handleReviewSubmit}
        evidence={selectedEvidence}
      />

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full mx-4 p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
              Xóa minh chứng
            </h3>
            <p className="text-center text-sm text-gray-500 mb-6">
              Bạn chắc chắn muốn xóa minh chứng này? Hành động này không thể
              hoàn tác.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setEvidenceToDelete(null);
                }}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => handleDelete(evidenceToDelete._id)}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showImagePreview && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setShowImagePreview(false)}
        >
          <div
            className="relative max-w-3xl w-full h-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImageSrc}
              alt="Preview"
              className="max-w-full max-h-[85vh] mx-auto object-contain rounded-lg shadow-lg"
            />

            <button
              onClick={() => setShowImagePreview(false)}
              className="absolute top-2 right-2 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            {/* <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <button
                onClick={() => window.open(previewImageSrc, "_blank")}
                className="px-4 py-2 bg-white bg-opacity-75 rounded-lg text-gray-800 hover:bg-opacity-100 transition-all flex items-center shadow-lg"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Mở trong tab mới
              </button>
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default Evidence;
