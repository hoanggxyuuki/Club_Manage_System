import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { evidenceService } from "../../../services/evidence";
import { useAuth } from "../../../context/AuthContext";
import { format } from "date-fns";
import {
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  MessageCircle,
  ArrowLeft,
  ExternalLink,
  Download,
  Edit,
  Trash,
  Share2,
  AlertTriangle,
  Info,
  Printer,
} from "lucide-react";
import LoadingSpinner from "../../../components/common/LoadingSpinner";

const EvidenceDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [evidence, setEvidence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState(null);
  const proxyUrl = import.meta.env.VITE_PROXY_API_URL;

  useEffect(() => {
    fetchEvidenceDetails();
  }, [id]);

  const fetchEvidenceDetails = async () => {
    try {
      setLoading(true);
      
      
      let data;

      if (user.role === "member") {
        data = await evidenceService.getMyEvidences();
      } else {
        data = await evidenceService.getAllEvidences();
      }

      const evidenceData = data.find((e) => e._id === id);

      if (!evidenceData) {
        setError("Minh chứng không tìm thấy hoặc bạn không có quyền truy cập");
        return;
      }

      setEvidence(evidenceData);
    } catch (err) {
      console.error("Error fetching evidence:", err);
      setError("Không thể tải thông tin minh chứng");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await evidenceService.deleteEvidence(id);
      showNotification("Xóa minh chứng thành công", "success");
      navigate("/evidence");
    } catch (error) {
      console.error("Error deleting evidence:", error);
      showNotification("Không thể xóa minh chứng", "error");
    }
  };

  const handleEdit = () => {
    
    
    navigate("/evidence", { state: { editEvidence: evidence } });
  };

  const showNotification = (message, type = "info") => {
    const notificationEl = document.createElement("div");
    notificationEl.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
      type === "success"
        ? "bg-green-500"
        : type === "error"
          ? "bg-red-500"
          : "bg-blue-500"
    } text-white z-50 animate-fade-in-down`;

    notificationEl.textContent = message;
    document.body.appendChild(notificationEl);
    setTimeout(() => {
      notificationEl.classList.add("animate-fade-out");
      setTimeout(() => notificationEl.remove(), 300);
    }, 3000);
  };

  const canEdit = () => {
    if (!evidence || !user) return false;
    return (
      (user._id === evidence.submittedBy?._id ||
        user._id === evidence.submittedBy) &&
      evidence.status === "pending"
    );
  };

  const canDelete = () => {
    if (!evidence || !user) return false;
    return (
      user.role === "admin" ||
      user.role === "leader" ||
      ((user._id === evidence.submittedBy?._id ||
        user._id === evidence.submittedBy) &&
        evidence.status === "pending")
    );
  };

  const renderContent = () => {
    if (!evidence) return null;

    if (evidence.type === "link") {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center text-sm font-medium text-blue-700 mb-2">
            <LinkIcon className="w-4 h-4 mr-2" />
            Liên kết
          </div>
          <a
            href={evidence.content}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center">
              <ExternalLink className="w-5 h-5 mr-2 flex-shrink-0" />

              <span className="break-all">{evidence.content}</span>
            </div>
          </a>
          <div className="mt-4 flex justify-end">
            <a
              href={evidence.content}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Mở liên kết
            </a>
          </div>
        </div>
      );
    }

    if (evidence.type === "image") {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center text-sm font-medium text-blue-700 mb-3">
            <ImageIcon className="w-4 h-4 mr-2" />
            Hình ảnh
          </div>
          <div className="bg-gray-50 border border-gray-200 p-1 rounded-lg">
            <img
              src={`${proxyUrl}${evidence.content}`}
              alt={evidence.title}
              className="max-w-full h-auto max-h-[500px] mx-auto rounded"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <a
              href={`${proxyUrl}${evidence.content}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="w-4 h-4 mr-2" />
              Tải xuống
            </a>
          </div>
        </div>
      );
    }

    if (evidence.type === "document") {
      
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center text-sm font-medium text-blue-700 mb-3">
            <FileText className="w-4 h-4 mr-2" />
            Tài liệu
          </div>

          <div className="flex items-center justify-center bg-gray-50 py-8 border border-gray-200 rounded-lg">
            {renderFileIcon(evidence.fileType)}

            <div className="ml-4">
              <p className="text-lg font-medium text-gray-900">
                {evidence.title}
              </p>
              <p className="text-sm text-gray-500">
                {getFileExtensionFromMimeType(evidence.fileType)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <a
              href={`${proxyUrl}${evidence.content}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="w-4 h-4 mr-2" />
              Tải xuống
            </a>
          </div>
        </div>
      );
    }

    return null;
  };

  const getFileExtensionFromMimeType = (mimeType) => {
    if (!mimeType) return "";

    const mimeMap = {
      "application/pdf": "PDF",
      "application/msword": "DOC",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "DOCX",
      "application/vnd.ms-excel": "XLS",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        "XLSX",
      "application/vnd.ms-powerpoint": "PPT",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        "PPTX",
    };

    return mimeMap[mimeType] || "Không xác định";
  };

  const renderFileIcon = (fileType) => {
    if (!fileType) return <FileText className="h-16 w-16 text-gray-400" />;

    if (fileType.includes("pdf")) {
      return <FileText className="h-16 w-16 text-red-500" />;
    } else if (fileType.includes("word")) {
      return <FileText className="h-16 w-16 text-blue-500" />;
    } else if (fileType.includes("excel") || fileType.includes("spreadsheet")) {
      return <FileText className="h-16 w-16 text-green-500" />;
    } else if (
      fileType.includes("powerpoint") ||
      fileType.includes("presentation")
    ) {
      return <FileText className="h-16 w-16 text-orange-500" />;
    } else {
      return <FileText className="h-16 w-16 text-gray-500" />;
    }
  };

  const getStatusDetails = (status) => {
    if (!status)
      return {
        label: "Đang chờ",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <Clock className="w-5 h-5 text-yellow-500" />,
      };

    const statusConfig = {
      accepted: {
        label: "Đã chấp nhận",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      },
      rejected: {
        label: "Đã từ chối",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: <XCircle className="w-5 h-5 text-red-500" />,
      },
      pending: {
        label: "Đang chờ duyệt",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <Clock className="w-5 h-5 text-yellow-500" />,
      },
    };

    return statusConfig[status] || statusConfig.pending;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "dd/MM/yyyy HH:mm");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Đang tải minh chứng..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />

          <h3 className="text-lg font-medium text-red-800">Lỗi</h3>
          <p className="mt-2 text-red-600">{error}</p>
          <button
            onClick={() => navigate("/evidence")}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!evidence) {
    return null;
  }

  const statusDetails = getStatusDetails(evidence.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate("/evidence")}
        className="mb-6 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Quay lại danh sách
      </button>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
              {evidence.title}
            </h1>
            <div
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${statusDetails.color}`}
            >
              {statusDetails.icon}
              <span className="ml-1.5">{statusDetails.label}</span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side - Content */}
            <div className="lg:col-span-2">
              {/* Description */}
              {evidence.description && (
                <div className="mb-8">
                  <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                    <Info className="w-4 h-4 mr-2 text-gray-500" />
                    Mô tả
                  </h2>
                  <p className="text-gray-600 whitespace-pre-line bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {evidence.description}
                  </p>
                </div>
              )}

              {/* Evidence Content */}
              <div className="mb-8">
                <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-gray-500" />
                  Nội dung minh chứng
                </h2>
                {renderContent()}
              </div>

              {/* Review Comment */}
              {evidence.reviewComment && (
                <div className="mb-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                    <MessageCircle className="w-4 h-4 mr-2 text-gray-500" />
                    Nhận xét của người duyệt
                  </h2>
                  <div
                    className={`p-4 rounded-lg ${
                      evidence.status === "accepted"
                        ? "bg-green-50 border border-green-200"
                        : evidence.status === "rejected"
                          ? "bg-red-50 border border-red-200"
                          : "bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <p className="text-gray-700 whitespace-pre-line">
                      {evidence.reviewComment}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right side - Metadata */}
            <div>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <h2 className="font-medium text-gray-900 mb-4">Thông tin</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start">
                    <User className="w-4 h-4 text-gray-500 mr-2 mt-0.5" />

                    <div>
                      <p className="text-gray-500">Người gửi</p>
                      <p className="font-medium text-gray-900">
                        {evidence.submittedBy?.username || "Không rõ"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Calendar className="w-4 h-4 text-gray-500 mr-2 mt-0.5" />

                    <div>
                      <p className="text-gray-500">Ngày gửi</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(evidence.createdAt)}
                      </p>
                    </div>
                  </div>

                  {evidence.reviewedBy && (
                    <div className="flex items-start">
                      <User className="w-4 h-4 text-gray-500 mr-2 mt-0.5" />

                      <div>
                        <p className="text-gray-500">Người duyệt</p>
                        <p className="font-medium text-gray-900">
                          {evidence.reviewedBy?.username || "Không rõ"}
                        </p>
                      </div>
                    </div>
                  )}

                  {evidence.reviewDate && (
                    <div className="flex items-start">
                      <Calendar className="w-4 h-4 text-gray-500 mr-2 mt-0.5" />

                      <div>
                        <p className="text-gray-500">Ngày duyệt</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(evidence.reviewDate)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start">
                    <FileText className="w-4 h-4 text-gray-500 mr-2 mt-0.5" />

                    <div>
                      <p className="text-gray-500">Loại minh chứng</p>
                      <p className="font-medium text-gray-900 capitalize">
                        {evidence.type === "image"
                          ? "Hình ảnh"
                          : evidence.type === "document"
                            ? "Tài liệu"
                            : "Liên kết"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 space-y-2">
                  {canEdit() && (
                    <button
                      onClick={handleEdit}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Chỉnh sửa
                    </button>
                  )}

                  {canDelete() && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <Trash className="w-4 h-4 mr-2" />
                      Xóa minh chứng
                    </button>
                  )}

                  <button
                    onClick={() => window.print()}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    In minh chứng
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      showNotification("Đã sao chép đường dẫn", "success");
                    }}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Chia sẻ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <div className="mb-4 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mt-3 text-lg leading-6 font-medium text-gray-900">
                Xóa minh chứng?
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Bạn có chắc chắn muốn xóa minh chứng này? Hành động này không
                  thể hoàn tác.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceDetail;
