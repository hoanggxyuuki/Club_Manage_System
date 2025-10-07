import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import { evidenceService } from "../../../services/evidence";
import { format } from "date-fns";
import {
  Folder,
  Search,
  Filter,
  ChevronDown,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  MoreHorizontal,
  SlidersHorizontal,
  RefreshCw,
  CheckSquare,
  Copy,
  Trash2,
  Edit2,
  Tag,
  X,
} from "lucide-react";
import LoadingSpinner from "../../../components/common/LoadingSpinner";

const CATEGORIES = [
  {
    id: "activities",
    name: "Hoạt động câu lạc bộ",
    color: "bg-blue-100 text-blue-800",
  },
  {
    id: "competitions",
    name: "Cuộc thi & Dự án",
    color: "bg-purple-100 text-purple-800",
  },
  {
    id: "community",
    name: "Cống hiến cộng đồng",
    color: "bg-green-100 text-green-800",
  },
  {
    id: "training",
    name: "Đào tạo & Hội thảo",
    color: "bg-amber-100 text-amber-800",
  },
  {
    id: "research",
    name: "Nghiên cứu & Học thuật",
    color: "bg-indigo-100 text-indigo-800",
  },
  { id: "others", name: "Khác", color: "bg-gray-100 text-gray-800" },
];

const EvidenceCategories = () => {
  const [evidences, setEvidences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [bulkSelectedEvidences, setBulkSelectedEvidences] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingCategory, setEditingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const { user } = useAuth();
  const dropdownRef = useRef(null);
  const bulkActionRef = useRef(null);

  useEffect(() => {
    fetchEvidences();
    
    
    const categoryMap = {};
    CATEGORIES.forEach((category) => {
      categoryMap[category.id] = { ...category, evidences: [] };
    });
    setCategories(categoryMap);
  }, []);

  useEffect(() => {
    
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
      if (
        bulkActionRef.current &&
        !bulkActionRef.current.contains(event.target)
      ) {
        setShowBulkActions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    
    if (evidences.length) {
      categorizeEvidences();
    }
  }, [evidences]);

  const fetchEvidences = async () => {
    setRefreshing(true);
    try {
      const data =
        user?.role === "member"
          ? await evidenceService.getMyEvidences()
          : await evidenceService.getAllEvidences();

      setEvidences(data);
    } catch (error) {
      console.error("Error fetching evidences:", error);
      showNotification("Không thể tải minh chứng", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const categorizeEvidences = () => {
    
    

    const newCategories = { ...categories };

    
    Object.keys(newCategories).forEach((catId) => {
      newCategories[catId].evidences = [];
    });

    
    evidences.forEach((evidence) => {
      const title = evidence.title?.toLowerCase() || "";
      const desc = evidence.description?.toLowerCase() || "";
      const content = title + " " + desc;

      
      if (content.includes("hoạt động") || content.includes("sự kiện")) {
        newCategories["activities"].evidences.push(evidence);
      } else if (
        content.includes("thi") ||
        content.includes("dự án") ||
        content.includes("project")
      ) {
        newCategories["competitions"].evidences.push(evidence);
      } else if (
        content.includes("cộng đồng") ||
        content.includes("thiện nguyện")
      ) {
        newCategories["community"].evidences.push(evidence);
      } else if (
        content.includes("đào tạo") ||
        content.includes("hội thảo") ||
        content.includes("workshop")
      ) {
        newCategories["training"].evidences.push(evidence);
      } else if (
        content.includes("nghiên cứu") ||
        content.includes("học thuật") ||
        content.includes("research")
      ) {
        newCategories["research"].evidences.push(evidence);
      } else {
        newCategories["others"].evidences.push(evidence);
      }
    });

    setCategories(newCategories);
  };

  const assignCategory = (evidenceId, categoryId) => {
    
    

    const newCategories = { ...categories };

    
    Object.keys(newCategories).forEach((catId) => {
      newCategories[catId].evidences = newCategories[catId].evidences.filter(
        (e) => e._id !== evidenceId,
      );
    });

    
    const evidence = evidences.find((e) => e._id === evidenceId);
    if (evidence && categoryId !== "none") {
      
      newCategories[categoryId].evidences.push(evidence);
    }

    setCategories(newCategories);
    setShowAssignModal(false);
    setSelectedEvidence(null);

    showNotification(
      `Minh chứng đã được gán vào danh mục ${categories[categoryId]?.name || "Không có"}`,
      "success",
    );
  };

  const handleBulkAssign = (categoryId) => {
    if (!bulkSelectedEvidences.length) return;

    bulkSelectedEvidences.forEach((evidenceId) => {
      assignCategory(evidenceId, categoryId);
    });

    setBulkSelectedEvidences([]);
    setShowBulkActions(false);

    showNotification(
      `${bulkSelectedEvidences.length} minh chứng đã được gán vào danh mục ${categories[categoryId]?.name || "Không có"}`,
      "success",
    );
  };

  const handleSelectEvidence = (evidenceId) => {
    if (bulkSelectedEvidences.includes(evidenceId)) {
      setBulkSelectedEvidences(
        bulkSelectedEvidences.filter((id) => id !== evidenceId),
      );
    } else {
      setBulkSelectedEvidences([...bulkSelectedEvidences, evidenceId]);
    }
  };

  const handleNewCategory = () => {
    
    

    if (!newCategoryName.trim()) return;

    const categoryId = newCategoryName.toLowerCase().replace(/[^a-z0-9]/g, "_");

    if (categories[categoryId]) {
      showNotification("Danh mục đã tồn tại", "error");
      return;
    }

    const newCategories = { ...categories };
    newCategories[categoryId] = {
      id: categoryId,
      name: newCategoryName,
      color: "bg-gray-100 text-gray-800", 
      evidences: [],
    };

    setCategories(newCategories);
    setNewCategoryName("");
    setEditingCategory(false);
    showNotification("Đã tạo danh mục mới", "success");
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

  const filteredEvidences = () => {
    let filtered = [...evidences];

    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (evidence) =>
          evidence.title.toLowerCase().includes(term) ||
          (evidence.description &&
            evidence.description.toLowerCase().includes(term)),
      );
    }

    
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (evidence) => evidence.status === statusFilter,
      );
    }

    
    if (typeFilter !== "all") {
      filtered = filtered.filter((evidence) => evidence.type === typeFilter);
    }

    
    if (selectedCategory !== "all") {
      const categoryEvidences = categories[selectedCategory]?.evidences || [];
      const categoryEvidenceIds = categoryEvidences.map((e) => e._id);
      filtered = filtered.filter((evidence) =>
        categoryEvidenceIds.includes(evidence._id),
      );
    }

    return filtered;
  };

  const getStatusIcon = (status) => {
    if (status === "accepted") {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (status === "rejected") {
      return <XCircle className="w-5 h-5 text-red-500" />;
    } else {
      return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getTypeIcon = (type) => {
    if (type === "image") {
      return <ImageIcon className="w-5 h-5 text-blue-500" />;
    } else if (type === "link") {
      return <LinkIcon className="w-5 h-5 text-purple-500" />;
    } else {
      return <FileText className="w-5 h-5 text-amber-500" />;
    }
  };

  const getCategoryNames = (evidenceId) => {
    const belongsTo = [];

    Object.values(categories).forEach((category) => {
      if (category.evidences.some((e) => e._id === evidenceId)) {
        belongsTo.push(category.name);
      }
    });

    return belongsTo.length ? belongsTo.join(", ") : "Chưa phân loại";
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Phân loại minh chứng
        </h1>

        <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
          <button
            onClick={() => setEditingCategory(!editingCategory)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tạo danh mục
          </button>

          <button
            onClick={fetchEvidences}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Làm mới
          </button>
        </div>
      </div>

      {editingCategory && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
            <Folder className="w-4 h-4 mr-2" />
            Tạo danh mục mới
          </h3>
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-grow">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Tên danh mục"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="mt-3 sm:mt-0 sm:ml-3 flex space-x-3">
              <button
                onClick={handleNewCategory}
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Tạo
              </button>
              <button
                onClick={() => {
                  setEditingCategory(false);
                  setNewCategoryName("");
                }}
                className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        {/* Sidebar - Categories */}
        <div className="md:col-span-1 bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Danh mục</h2>
          </div>
          <nav className="flex flex-col" aria-label="Categories">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`py-2 px-4 text-left flex items-center ${
                selectedCategory === "all"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="flex-1 flex items-center">
                <Folder className="w-5 h-5 mr-2" />
                Tất cả
              </span>
              <span className="text-sm text-gray-500">{evidences.length}</span>
            </button>

            {Object.values(categories).map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`py-2 px-4 text-left flex items-center ${
                  selectedCategory === category.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="flex-1 flex items-center">
                  <Tag
                    className={`w-4 h-4 mr-2 ${category.color.replace("bg-", "text-").replace("text-", "text-")}`}
                  />

                  {category.name}
                </span>
                <span className="text-sm text-gray-500">
                  {category.evidences.length}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="md:col-span-4">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex-grow max-w-md">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Tìm kiếm theo tiêu đề hoặc mô tả"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="relative" ref={dropdownRef}>
                <button
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Lọc
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>

                {showFilterDropdown && (
                  <div className="origin-top-right absolute right-0 mt-2 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1 divide-y divide-gray-200">
                      <div className="px-4 py-3">
                        <h3 className="text-sm font-medium text-gray-900">
                          Trạng thái
                        </h3>
                        <div className="mt-2 space-y-2">
                          <button
                            onClick={() => setStatusFilter("all")}
                            className={`flex items-center ${
                              statusFilter === "all"
                                ? "text-blue-600"
                                : "text-gray-600"
                            } text-sm w-full text-left`}
                          >
                            <span className="h-2 w-2 rounded-full mr-2 bg-gray-400"></span>
                            Tất cả
                          </button>
                          <button
                            onClick={() => setStatusFilter("pending")}
                            className={`flex items-center ${
                              statusFilter === "pending"
                                ? "text-blue-600"
                                : "text-gray-600"
                            } text-sm w-full text-left`}
                          >
                            <span className="h-2 w-2 rounded-full mr-2 bg-yellow-400"></span>
                            Chờ duyệt
                          </button>
                          <button
                            onClick={() => setStatusFilter("accepted")}
                            className={`flex items-center ${
                              statusFilter === "accepted"
                                ? "text-blue-600"
                                : "text-gray-600"
                            } text-sm w-full text-left`}
                          >
                            <span className="h-2 w-2 rounded-full mr-2 bg-green-400"></span>
                            Đã chấp nhận
                          </button>
                          <button
                            onClick={() => setStatusFilter("rejected")}
                            className={`flex items-center ${
                              statusFilter === "rejected"
                                ? "text-blue-600"
                                : "text-gray-600"
                            } text-sm w-full text-left`}
                          >
                            <span className="h-2 w-2 rounded-full mr-2 bg-red-400"></span>
                            Đã từ chối
                          </button>
                        </div>
                      </div>

                      <div className="px-4 py-3">
                        <h3 className="text-sm font-medium text-gray-900">
                          Loại minh chứng
                        </h3>
                        <div className="mt-2 space-y-2">
                          <button
                            onClick={() => setTypeFilter("all")}
                            className={`flex items-center ${
                              typeFilter === "all"
                                ? "text-blue-600"
                                : "text-gray-600"
                            } text-sm w-full text-left`}
                          >
                            <span className="h-2 w-2 rounded-full mr-2 bg-gray-400"></span>
                            Tất cả
                          </button>
                          <button
                            onClick={() => setTypeFilter("image")}
                            className={`flex items-center ${
                              typeFilter === "image"
                                ? "text-blue-600"
                                : "text-gray-600"
                            } text-sm w-full text-left`}
                          >
                            <span className="h-2 w-2 rounded-full mr-2 bg-blue-400"></span>
                            Hình ảnh
                          </button>
                          <button
                            onClick={() => setTypeFilter("document")}
                            className={`flex items-center ${
                              typeFilter === "document"
                                ? "text-blue-600"
                                : "text-gray-600"
                            } text-sm w-full text-left`}
                          >
                            <span className="h-2 w-2 rounded-full mr-2 bg-amber-400"></span>
                            Tài liệu
                          </button>
                          <button
                            onClick={() => setTypeFilter("link")}
                            className={`