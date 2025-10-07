import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { evidenceService } from "../../../services/evidence";
import { useAuth } from "../../../context/AuthContext";
import { format } from "date-fns";
import {
  Upload,
  FileText,
  Link as LinkIcon,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Edit2,
  Eye,
  Filter,
  RefreshCw,
  Search,
  Plus,
  X,
  AlertTriangle,
  HelpCircle,
  Image as ImageIcon,
  FileType,
  ExternalLink,
  Share2,
  SlidersHorizontal,
} from "lucide-react";

const EvidenceForm = ({ visible, onClose, onSubmit, initialData }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("document");
  const [file, setFile] = useState(null);
  const [link, setLink] = useState("");
  const [filePreview, setFilePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const proxyUrl = import.meta.env.VITE_PROXY_API_URL;

  useEffect(() => {
    
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || "");
      setType(initialData.type);
      setEditingId(initialData._id);

      if (initialData.type === "link") {
        setLink(initialData.content);
      }
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const evidenceData = {
        title,
        description,
        type,
      };

      if (type === "link") {
        evidenceData.link = link;
      } else if (file) {
        evidenceData.file = file;
      } else if (!editingId) {
        showNotification("Vui lòng chọn tệp hoặc nhập liên kết", "error");
        setSubmitting(false);
        return;
      }

      if (onSubmit) {
        
        await onSubmit(evidenceData);
      } else {
        
        if (editingId) {
          await evidenceService.updateEvidence(editingId, evidenceData);
          showNotification("Cập nhật minh chứng thành công", "success");
        } else {
          await evidenceService.submitEvidence(evidenceData);
          showNotification("Gửi minh chứng thành công", "success");
        }
      }

      resetForm();
      if (onClose) onClose();
    } catch (error) {
      console.error("Error submitting evidence:", error);
      showNotification(error.message || "Không thể gửi minh chứng", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("document");
    setFile(null);
    setFilePreview(null);
    setLink("");
    setEditingId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }

    
    if (selectedFile.type.startsWith("image/")) {
      setType("image");
    } else {
      setType("document");
    }
  };

  const cancelEdit = () => {
    resetForm();
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

  
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden mx-4 shadow-xl border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">
            {editingId ? "Chỉnh sửa minh chứng" : "Nộp minh chứng mới"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form Content - Scrollable */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="bg-white">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-base font-medium text-gray-900">
                Thông tin minh chứng
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Nhập tiêu đề minh chứng"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Mô tả
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="4"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Mô tả chi tiết về minh chứng này"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại minh chứng <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-4">
                  <div
                    onClick={() => setType("document")}
                    className={`inline-flex items-center px-4 py-2 border ${
                      type === "document"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                    } rounded-md cursor-pointer transition-colors`}
                  >
                    <input
                      type="radio"
                      value="document"
                      checked={type === "document"}
                      onChange={() => setType("document")}
                      className="sr-only"
                      tabIndex={-1}
                    />
                    <FileText className="w-5 h-5 mr-2" />
                    Tài liệu
                  </div>

                  <div
                    onClick={() => setType("image")}
                    className={`inline-flex items-center px-4 py-2 border ${
                      type === "image"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                    } rounded-md cursor-pointer transition-colors`}
                  >
                    <input
                      type="radio"
                      value="image"
                      checked={type === "image"}
                      onChange={() => setType("image")}
                      className="sr-only"
                      tabIndex={-1}
                    />
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Hình ảnh
                  </div>

                  <div
                    onClick={() => setType("link")}
                    className={`inline-flex items-center px-4 py-2 border ${
                      type === "link"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                    } rounded-md cursor-pointer transition-colors`}
                  >
                    <input
                      type="radio"
                      value="link"
                      checked={type === "link"}
                      onChange={() => setType("link")}
                      className="sr-only"
                      tabIndex={-1}
                    />
                    <LinkIcon className="w-5 h-5 mr-2" />
                    Liên kết
                  </div>
                </div>
              </div>

              {/* Upload field or Link field based on type */}
              {type !== "link" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tải lên tệp{" "}
                    {!editingId && <span className="text-red-500">*</span>}
                  </label>

                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <div className="flex flex-col items-center">
                        {filePreview ? (
                          <div className="mb-3">
                            <img
                              src={filePreview}
                              alt="Preview"
                              className="h-24 w-auto object-contain"
                            />
                          </div>
                        ) : file ? (
                          <div className="mb-3 flex flex-col items-center">
                            <FileText className="h-12 w-12 text-gray-400" />

                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              {file.name}
                            </span>
                          </div>
                        ) : (
                          <Upload className="h-12 w-12 text-gray-400" />
                        )}

                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                          >
                            <span>Chọn tệp</span>
                            <input
                              id="file-upload"
                              ref={fileInputRef}
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              onChange={handleFileChange}
                              accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                            />
                          </label>
                          <p className="pl-1">hoặc kéo và thả vào đây</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF, PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX -
                          tối đa 10MB
                        </p>
                      </div>

                      {file && (
                        <button
                          type="button"
                          onClick={() => {
                            setFile(null);
                            setFilePreview(null);
                            if (fileInputRef.current)
                              fileInputRef.current.value = "";
                          }}
                          className="mt-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Xóa
                        </button>
                      )}
                    </div>
                  </div>

                  {editingId && type !== "link" && (
                    <p className="mt-2 text-sm text-gray-500">
                      {file
                        ? "Bạn đã chọn tệp mới để thay thế tệp hiện tại"
                        : "Giữ nguyên tệp hiện tại nếu không muốn thay đổi"}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="link"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Liên kết <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LinkIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="url"
                      id="link"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      required={type === "link"}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 sm:text-sm border-gray-300 rounded-md"
                      placeholder="https://example.com/evidence"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Nhập đường dẫn đến tài liệu trực tuyến của bạn (Google
                    Drive, Dropbox, v.v.)
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    disabled={submitting}
                  >
                    Hủy
                  </button>
                )}

                <button
                  type="submit"
                  className={`inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    submitting ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                  disabled={submitting}
                >
                  {submitting && (
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
                  )}
                  {editingId ? "Cập nhật minh chứng" : "Gửi minh chứng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvidenceForm;
