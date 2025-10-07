import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  X,
  Trash2,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Clock,
  Check,
  AlertCircle,
  UserCircle,
  Calendar,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { evidenceService } from "../../../services/evidence";
import { format } from "date-fns";

const EvidenceReview = ({
  visible,
  onClose,
  onSubmit,
  evidence,
  onDelete = () => {},
}) => {
  const [review, setReview] = useState({
    status: "pending",
    comment: "",
  });
  const [previewImage, setPreviewImage] = useState(false);
  const { user } = useAuth();
  const url = import.meta.env.VITE_PROXY_API_URL;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    if (evidence) {
      setReview({
        status: evidence.status || "pending",
        comment: evidence.comment || "",
      });
      
      setIsSubmitting(false);
    }
  }, [evidence]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!evidence?._id) {
      console.error("No evidence ID found");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(evidence._id, review);
      
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error submitting review:", error);
      setIsSubmitting(false);
    }
  };

  const getSubmitterInfo = () => {
    if (!evidence?.submittedBy) return "Không rõ";
    return evidence.submittedBy.username || "Không rõ";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Không rõ";
    return format(new Date(dateString), "dd/MM/yyyy HH:mm");
  };

  const canDelete = user?.role === "admin" || user?.role === "leader";

  const renderStatusIndicator = () => {
    if (!evidence) return null;

    const statuses = {
      accepted: {
        icon: <CheckCircle className="w-5 h-5 text-green-500" />,

        label: "Đã chấp nhận",
        color: "bg-green-50 text-green-800 border-green-100",
      },
      rejected: {
        icon: <XCircle className="w-5 h-5 text-red-500" />,
        label: "Đã từ chối",
        color: "bg-red-50 text-red-800 border-red-100",
      },
      pending: {
        icon: <Clock className="w-5 h-5 text-amber-500" />,
        label: "Đang chờ duyệt",
        color: "bg-amber-50 text-amber-800 border-amber-100",
      },
    };

    const status = statuses[evidence.status] || statuses.pending;

    return (
      <div
        className={`px-3 py-1.5 rounded-full inline-flex items-center ${status.color} border`}
      >
        {status.icon}
        <span className="ml-1.5 text-sm font-medium">{status.label}</span>
      </div>
    );
  };

  const renderContent = () => {
    if (!evidence) return null;

    if (evidence.type === "link") {
      return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
          <div className="mb-2 text-sm font-medium text-indigo-700">
            Liên kết
          </div>
          <a
            href={evidence.content}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 border border-blue-200 bg-white rounded-lg text-blue-700 hover:bg-blue-50 hover:text-blue-900 hover:border-blue-300 transition-all shadow-sm"
          >
            <ExternalLink className="w-5 h-5 flex-shrink-0" />

            <span className="truncate flex-1">{evidence.content}</span>
          </a>
        </div>
      );
    }

    if (!evidence.fileType) return null;

    if (evidence.fileType.startsWith("image/")) {
      return (
        <div className="mb-6">
          <div className="mb-2 text-sm font-medium text-indigo-700">
            Hình ảnh
          </div>
          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-inner flex items-center justify-center border border-gray-200">
            <img
              src={`${url}${evidence.content}`}
              alt={evidence.title}
              className={`${previewImage ? "max-h-full w-auto" : "h-full w-full object-contain"}`}
              onClick={() => setPreviewImage(!previewImage)}
            />

            {evidence.fileType.includes("gif") && (
              <span className="absolute top-2 right-2 px-1.5 py-0.5 text-xs bg-black bg-opacity-70 text-white rounded">
                GIF
              </span>
            )}
            <button
              onClick={() => window.open(`${url}${evidence.content}`, "_blank")}
              className="absolute bottom-2 right-2 p-1.5 bg-white bg-opacity-90 rounded-full text-gray-700 hover:bg-opacity-100 shadow-sm"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    
    const getFileIcon = () => {
      if (evidence.fileType.includes("pdf")) {
        return (
          <div className="w-10 h-12 rounded flex items-center justify-center bg-red-100 text-red-600">
            <FileText className="w-6 h-6" />
          </div>
        );
      }
      if (evidence.fileType.includes("word")) {
        return (
          <div className="w-10 h-12 rounded flex items-center justify-center bg-blue-100 text-blue-600">
            <FileText className="w-6 h-6" />
          </div>
        );
      }
      if (
        evidence.fileType.includes("excel") ||
        evidence.fileType.includes("spreadsheet")
      ) {
        return (
          <div className="w-10 h-12 rounded flex items-center justify-center bg-green-100 text-green-600">
            <FileText className="w-6 h-6" />
          </div>
        );
      }
      if (
        evidence.fileType.includes("powerpoint") ||
        evidence.fileType.includes("presentation")
      ) {
        return (
          <div className="w-10 h-12 rounded flex items-center justify-center bg-orange-100 text-orange-600">
            <FileText className="w-6 h-6" />
          </div>
        );
      }

      return (
        <div className="w-10 h-12 rounded flex items-center justify-center bg-gray-100 text-gray-600">
          <FileText className="w-6 h-6" />
        </div>
      );
    };

    return (
      <div className="mb-6">
        <div className="mb-2 text-sm font-medium text-indigo-700">Tài liệu</div>
        <a
          href={`${url}${evidence.content}`}
          download
          className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-blue-300 hover:from-blue-50 hover:to-blue-50 transition-colors group"
        >
          {getFileIcon()}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors">
              {evidence.title}
            </p>
            <p className="text-xs text-gray-500 truncate mt-0.5 group-hover:text-blue-600 transition-colors">
              Nhấn để tải xuống
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:bg-blue-50 transition-colors">
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
        </a>
      </div>
    );
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden mx-4 shadow-xl border border-gray-200">
        <div className="sticky top-0 bg-white px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <div className="inline-flex items-center justify-center w-7 h-7 bg-indigo-100 text-indigo-800 rounded-full mr-2">
              <FileText className="w-4 h-4" />
            </div>
            Xem xét minh chứng
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 rounded-full p-1.5 hover:bg-gray-100 transition-all"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-60px)] p-4 sm:p-6">
          {/* Phần thông tin minh chứng */}
          <div className="lg:flex gap-4 mb-6">
            <div className="lg:w-2/3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 p-3 rounded-t-lg border border-gray-200">
                <h3 className="font-medium text-gray-900">{evidence?.title}</h3>
                {renderStatusIndicator()}
              </div>

              <div className="p-4 border-l border-r border-b border-gray-200 rounded-b-lg">
                {evidence?.description && (
                  <p className="text-sm text-gray-600 mb-4">
                    {evidence.description}
                  </p>
                )}

                {renderContent()}
              </div>
            </div>

            <div className="lg:w-1/3 mt-4 lg:mt-0">
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <h4 className="font-medium text-indigo-900 mb-3 flex items-center">
                  <Calendar className="w-4 h-4 mr-1.5" /> Thông tin chi tiết
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">
                      Người gửi
                    </div>
                    <div className="text-sm flex items-center">
                      <UserCircle className="w-4 h-4 text-gray-400 mr-1" />

                      <span>{getSubmitterInfo()}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">
                      Ngày gửi
                    </div>
                    <div className="text-sm flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-1" />

                      <span>{formatDate(evidence?.createdAt)}</span>
                    </div>
                  </div>
                  {evidence?.reviewedBy && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">
                        Đánh giá bởi
                      </div>
                      <div className="text-sm flex items-center">
                        <UserCircle className="w-4 h-4 text-gray-400 mr-1" />

                        <span>{evidence.reviewedBy.username}</span>
                      </div>
                    </div>
                  )}
                  {evidence?.reviewedAt && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">
                        Ngày đánh giá
                      </div>
                      <div className="text-sm flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-1" />

                        <span>{formatDate(evidence.reviewedAt)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-1.5" /> Đánh giá
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setReview({ ...review, status: "accepted" })}
                    className={`flex items-center justify-center p-3.5 rounded-md border shadow-sm ${
                      review.status === "accepted"
                        ? "border-green-400 bg-green-50 text-green-700 ring-2 ring-green-200"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    } transition-all`}
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                          review.status === "accepted"
                            ? "bg-green-100"
                            : "bg-gray-100"
                        }`}
                      >
                        <Check
                          className={`w-5 h-5 ${
                            review.status === "accepted"
                              ? "text-green-500"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                      <span className="text-sm font-medium">Chấp nhận</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setReview({ ...review, status: "revision_requested" })
                    }
                    className={`flex items-center justify-center p-3.5 rounded-md border shadow-sm ${
                      review.status === "revision_requested"
                        ? "border-amber-400 bg-amber-50 text-amber-700 ring-2 ring-amber-200"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    } transition-all`}
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                          review.status === "revision_requested"
                            ? "bg-amber-100"
                            : "bg-gray-100"
                        }`}
                      >
                        <RefreshCw
                          className={`w-5 h-5 ${
                            review.status === "revision_requested"
                              ? "text-amber-500"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                      <span className="text-sm font-medium">Yêu cầu sửa</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReview({ ...review, status: "rejected" })}
                    className={`flex items-center justify-center p-3.5 rounded-md border shadow-sm ${
                      review.status === "rejected"
                        ? "border-red-400 bg-red-50 text-red-700 ring-2 ring-red-200"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    } transition-all`}
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                          review.status === "rejected"
                            ? "bg-red-100"
                            : "bg-gray-100"
                        }`}
                      >
                        <XCircle
                          className={`w-5 h-5 ${
                            review.status === "rejected"
                              ? "text-red-500"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                      <span className="text-sm font-medium">Từ chối</span>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="comment"
                  className="block text-sm font-medium text-gray-700 mb-2 flex items-center"
                >
                  Bình luận đánh giá
                </label>
                <textarea
                  id="comment"
                  value={review.comment}
                  onChange={(e) =>
                    setReview({ ...review, comment: e.target.value })
                  }
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    review.status === "accepted"
                      ? "border-green-300 focus:ring-green-500 focus:border-green-500"
                      : review.status === "rejected"
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  } text-base transition-all`}
                  placeholder="Nhập bình luận của bạn..."
                />
              </div>
            </div>

            {canDelete && (
              <div className="pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => onDelete(evidence?._id)}
                  className="inline-flex items-center text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Xóa minh chứng
                </button>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white ${
                  review.status === "accepted"
                    ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                    : review.status === "rejected"
                      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                      : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                } rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all flex justify-center items-center`}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Đang gửi...
                  </>
                ) : (
                  <>
                    {review.status === "accepted" ? (
                      <Check className="w-4 h-4 mr-1" />
                    ) : review.status === "rejected" ? (
                      <X className="w-4 h-4 mr-1" />
                    ) : null}
                    Gửi đánh giá
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EvidenceReview;
