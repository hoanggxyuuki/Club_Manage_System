import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import {
  getMyGroups,
  getGroupById,
  deleteGroup,
} from "../../../services/groups";
import GroupForm from "./GroupForm";
import GroupDetail from "./GroupDetail";
import { FixedSizeGrid as Grid } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import "./Groups.css";
import LoadingSpinner from "../../../components/common/LoadingSpinner";


const GroupCard = memo(
  ({
    group,
    canDeleteGroup,
    onDelete,
    onClick,
    hoveredGroup,
    setHoveredGroup,
  }) => {
    
    if (!group || !group._id) {
      return null;
    }

    
    const getGroupColor = useMemo(() => {
      const colors = [
        "from-rose-200 to-rose-100",
        "from-sky-200 to-sky-100",
        "from-amber-200 to-amber-100",
        "from-emerald-200 to-emerald-100",
        "from-violet-200 to-violet-100",
        "from-pink-200 to-pink-100",
        "from-cyan-200 to-cyan-100",
        "from-lime-200 to-lime-100",
      ];

      
      const sum = group._id
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return colors[sum % colors.length];
    }, [group._id]);

    const getRandomPattern = useMemo(() => {
      const patterns = [
        "radial-gradient(circle at 10% 20%, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.1) 99.8%)",
        "repeating-linear-gradient(45deg, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 2px, transparent 2px, transparent 4px)",
        "repeating-linear-gradient(-45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 5px, transparent 5px, transparent 10px)",
        "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%)",
        "radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.1), rgba(0, 0, 0, 0) 70%)",
        "linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px) 0 0 / 20px 20px",
      ];

      
      const lastChar = group._id.charCodeAt(group._id.length - 1);
      return patterns[lastChar % patterns.length];
    }, [group._id]);

    const getStatusColor = useMemo(() => {
      const statusMap = {
        active: "bg-emerald-100 text-emerald-700",
        completed: "bg-blue-100 text-blue-700",
        pending: "bg-amber-100 text-amber-700",
        inactive: "bg-gray-100 text-gray-700",
      };
      return (
        statusMap[group.status?.toLowerCase()] || "bg-blue-100 text-blue-800"
      );
    }, [group.status]);

    const handleDelete = useCallback(
      (e) => {
        e.stopPropagation();
        onDelete(e, group._id);
      },
      [onDelete, group._id],
    );

    const handleGroupClick = useCallback(() => {
      onClick(group._id);
    }, [onClick, group._id]);

    const handleMouseEnter = useCallback(() => {
      setHoveredGroup(group._id);
    }, [setHoveredGroup, group._id]);

    const handleMouseLeave = useCallback(() => {
      setHoveredGroup(null);
    }, [setHoveredGroup]);

    return (
      <div
        onClick={handleGroupClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group-card relative rounded-xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
        style={{ contain: "content" }}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br ${getGroupColor} opacity-80`}
          style={{ backgroundImage: getRandomPattern }}
        ></div>

        <div className="relative h-full flex flex-col p-6 bg-white bg-opacity-80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-gray-900 line-clamp-1 tracking-tight">
              {group.name}
            </h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor}`}
            >
              {group.status || "Unknown"}
            </span>
          </div>

          <p className="text-gray-600 mb-4 line-clamp-3 text-sm flex-grow">
            {group.description || "Không có mô tả"}
          </p>

          <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-200/70">
            <div className="flex items-center">
              <div className="flex -space-x-2 overflow-hidden">
                {/* This would show member avatars if available */}
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-indigo-100 text-indigo-500 flex items-center justify-center font-medium text-xs">
                  {(group.members?.[0]?.userId?.username || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                {group.members?.length > 1 && (
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-purple-100 text-purple-500 flex items-center justify-center font-medium text-xs">
                    {(group.members?.[1]?.userId?.username || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                {group.members?.length > 2 && (
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-blue-100 text-blue-500 flex items-center justify-center font-medium text-xs">
                    +{group.members.length - 2}
                  </div>
                )}
              </div>
              <span className="ml-2 text-sm text-gray-500">
                {group.members?.length || 0}{" "}
                {group.members?.length === 1 ? "thành viên" : "thành viên"}
              </span>
            </div>

            {canDeleteGroup && (
              <button
                onClick={handleDelete}
                className={`text-gray-400 hover:text-red-600 transition-colors duration-200 p-1.5 rounded-full hover:bg-red-50 ${hoveredGroup === group._id ? "opacity-100" : "opacity-0"} group-hover:opacity-100`}
                title="Xóa nhóm"
                aria-label="Delete group"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  },
);


const GridCell = memo(({ data, columnIndex, rowIndex, style }) => {
  const {
    groups,
    columnCount,
    canDeleteGroup,
    hoveredGroup,
    handleDelete,
    handleGroupClick,
    setHoveredGroup,
  } = data;
  const index = rowIndex * columnCount + columnIndex;

  
  if (index >= groups.length) {
    return null;
  }

  const group = groups[index];

  
  if (!group) {
    return null;
  }

  return (
    <div style={{ ...style, padding: "0.75rem" }}>
      <GroupCard
        group={group}
        canDeleteGroup={canDeleteGroup}
        onDelete={handleDelete}
        onClick={handleGroupClick}
        hoveredGroup={hoveredGroup}
        setHoveredGroup={setHoveredGroup}
      />
    </div>
  );
});


const Groups = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [filterValue, setFilterValue] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredGroup, setHoveredGroup] = useState(null);

  
  const canCreateGroup = useMemo(
    () => ["admin", "leader"].includes(user?.role),
    [user?.role],
  );

  const canDeleteGroup = useMemo(
    () => ["owner", "leader", "admin"].includes(user?.role),
    [user?.role],
  );

  
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyGroups();
      
      const formattedData = data.map((group) => ({
        ...group,
        membersCount: group.members?.length || 0,
        statusLowercase: group.status.toLowerCase(),
      }));
      setGroups(formattedData);
    } catch (error) {
      console.error("Failed to load groups:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();

    
    return () => {
      
    };
  }, [loadGroups]);

  const handleGroupClick = useCallback(async (groupId) => {
    try {
      const groupData = await getGroupById(groupId);
      setSelectedGroup(groupData);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Failed to load group details:", error);
    }
  }, []);

  const handleDelete = useCallback(async (e, groupId) => {
    e.stopPropagation(); 
    setGroupToDelete(groupId);
  }, []);

  const confirmDelete = useCallback(async () => {
    try {
      await deleteGroup(groupToDelete);
      await loadGroups();
      setGroupToDelete(null);
    } catch (error) {
      console.error("Failed to delete group:", error);
    }
  }, [groupToDelete, loadGroups]);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleFilterChange = useCallback((e) => {
    setFilterValue(e.target.value);
  }, []);

  const handleCreateGroup = useCallback(() => {
    setShowForm(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
  }, []);

  const handleFormSubmit = useCallback(() => {
    loadGroups();
    setShowForm(false);
  }, [loadGroups]);

  const handleCloseDetail = useCallback(() => {
    setShowDetailModal(false);
    setSelectedGroup(null);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setGroupToDelete(null);
  }, []);

  
  const filteredGroups = useMemo(() => {
    if (!groups || !Array.isArray(groups)) {
      return [];
    }

    return groups.filter((group) => {
      if (!group) return false;

      
      if (filterValue !== "all" && group.statusLowercase !== filterValue) {
        return false;
      }

      
      if (debouncedSearchTerm) {
        const search = debouncedSearchTerm.toLowerCase();
        return (
          (group.name && group.name.toLowerCase().includes(search)) ||
          (group.description &&
            group.description.toLowerCase().includes(search))
        );
      }

      return true;
    });
  }, [groups, filterValue, debouncedSearchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 group-page">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Nhóm của bạn
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Quản lý nhóm và các thành viên trong câu lạc bộ
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Tìm kiếm nhóm..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <svg
              className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <select
            value={filterValue}
            onChange={handleFilterChange}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="pending">Đang chờ</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="inactive">Không hoạt động</option>
          </select>

          {canCreateGroup && (
            <button
              onClick={handleCreateGroup}
              className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-300 shadow-sm hover:shadow transform hover:-translate-y-0.5"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Tạo nhóm
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner size="lg" text="Đang tải dữ liệu..." />
        </div>
      ) : (
        <>
          {filteredGroups.length > 0 ? (
            <div
              className="grid-container"
              style={{
                height: Math.min(
                  800,
                  Math.max(250, filteredGroups.length * 180),
                ),
              }}
            >
              <AutoSizer>
                {({ height, width }) => {
                  
                  const columnCount = width >= 1024 ? 3 : width >= 640 ? 2 : 1;
                  const rowCount = Math.ceil(
                    filteredGroups.length / columnCount,
                  );
                  const columnWidth = width / columnCount;

                  return (
                    <Grid
                      columnCount={columnCount}
                      columnWidth={columnWidth}
                      height={height}
                      rowCount={rowCount}
                      rowHeight={250}
                      width={width}
                      itemData={{
                        groups: filteredGroups,
                        columnCount,
                        canDeleteGroup,
                        hoveredGroup,
                        handleDelete,
                        handleGroupClick,
                        setHoveredGroup,
                      }}
                    >
                      {GridCell}
                    </Grid>
                  );
                }}
              </AutoSizer>
            </div>
          ) : (
            <div className="col-span-full rounded-xl border-2 border-dashed border-gray-300 p-12">
              <div className="text-center">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  Không tìm thấy nhóm nào
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || filterValue !== "all"
                    ? "Không có nhóm nào phù hợp với tiêu chí tìm kiếm của bạn."
                    : "Bạn chưa tham gia hoặc tạo nhóm nào."}
                </p>
                {canCreateGroup && (
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={handleCreateGroup}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg
                        className="-ml-1 mr-2 h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Tạo nhóm mới
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {showForm && (
        <GroupForm onClose={handleCloseForm} onSubmit={handleFormSubmit} />
      )}

      {showDetailModal && selectedGroup && (
        <GroupDetail
          group={selectedGroup}
          onClose={handleCloseDetail}
          onUpdate={loadGroups}
          isLeader={canCreateGroup}
        />
      )}

      {/* Delete Confirmation Modal */}
      {groupToDelete && (
        <div className="fixed inset-0 bg-gray-600/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl animate-fadeScale">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Xác nhận xóa nhóm
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Bạn có chắc chắn muốn xóa nhóm này không? Hành động này không thể
              hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Xóa nhóm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
