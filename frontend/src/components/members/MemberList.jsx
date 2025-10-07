import React, { useState, useEffect } from "react";
import {
  getAllMembers,
  updateMemberSecondaryRole,
} from "../../services/members";
import { useAuth } from "../../context/AuthContext";
import { Search, UserPlus, Clock, UserCircle } from "lucide-react";


const Notification = ({ message, type }) => {
  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg transition-all duration-500 transform translate-x-0
      ${type === "success" ? "bg-green-500" : "bg-red-500"} text-white`}
    >
      {message}
    </div>
  );
};

const MemberList = ({
  showAdminControls = false,
  onEdit = null,
  onDelete = null,
  filters = null,
  handleFilter = null,
}) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState(null);
  const [newSecondaryRole, setNewSecondaryRole] = useState("");
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredMembers = members.filter((member) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      member.fullName.toLowerCase().includes(searchLower) ||
      member.email.toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    const init = async () => {
      try {
        const data = await getAllMembers();
        setMembers(data);
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleEditRole = (member) => {
    setEditingMember(member);
    setNewSecondaryRole(member.secondaryRole || "");
  };

  const handleSaveRole = async () => {
    try {
      await updateMemberSecondaryRole(editingMember._id, newSecondaryRole);
      const updatedMembers = members.map((member) =>
        member._id === editingMember._id
          ? { ...member, secondaryRole: newSecondaryRole }
          : member,
      );
      setMembers(updatedMembers);
      setEditingMember(null);
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const renderFriendAction = (member) => {
    switch (member.friendStatus) {
      case "friend":
        return (
          <button
            className="p-1.5 text-green-600 hover:bg-green-50 rounded-full transition-colors"
            title="Bạn bè"
          >
            <UserCircle className="w-5 h-5" />
          </button>
        );

      case "pending":
        return (
          <button
            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors"
            title="Chờ phản hồi"
          >
            <Clock className="w-5 h-5" />
          </button>
        );

      case "received":
        return (
          <button
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Nhận lời mời"
          >
            <Clock className="w-5 h-5" />
          </button>
        );

      case "none":
        return (
          <button
            onClick={async () => {
              try {
                await sendFriendRequest(member._id);
                showNotification("Gửi lời mời kết bạn thành công", "success");
                setMembers(
                  members.map((m) =>
                    m._id === member._id
                      ? { ...m, friendStatus: "pending" }
                      : m,
                  ),
                );
              } catch (error) {
                showNotification(
                  error.message || "Không thể gửi lời mời kết bạn",
                  "error",
                );
              }
            }}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Gửi lời mời kết bạn"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg shadow">
      {notification && (
        <Notification message={notification.message} type={notification.type} />
      )}
      <div className="mb-4 flex items-center bg-white rounded-lg border border-gray-300 p-2">
        <Search className="w-5 h-5 text-gray-500 mr-2" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full outline-none"
        />
      </div>
      <table className="min-w-full bg-white border border-gray-300 table-fixed">
        <thead className="sticky top-0 z-10">
          <tr className="bg-gray-100">
            <th className="px-6 py-3 border-b text-left w-1/6">Tên</th>
            <th className="px-6 py-3 border-b text-left w-1/5">Email</th>
            <th className="px-6 py-3 border-b text-left w-1/8">
              Vai trò chính
            </th>
            <th className="px-6 py-3 border-b text-left w-1/8">Vai trò phụ</th>
            {/* <th className="px-6 py-3 border-b text-left w-1/6">Thao tác</th> */}
            {(user?.role === "admin" || showAdminControls) && (
              <th className="px-6 py-3 border-b text-left w-1/4">Thao tác</th>
            )}
          </tr>
        </thead>
        <tbody>
          {filteredMembers.map((member) => (
            <tr key={member._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 border-b">{member.fullName}</td>
              <td className="px-6 py-4 border-b">{member.email}</td>
              <td className="px-6 py-4 border-b">{member.role}</td>
              <td className="px-6 py-4 border-b">
                {editingMember?._id === member._id ? (
                  <input
                    type="text"
                    value={newSecondaryRole}
                    onChange={(e) => setNewSecondaryRole(e.target.value)}
                    className="border rounded px-2 py-1"
                    placeholder="Nhập vai trò phụ"
                  />
                ) : (
                  member.secondaryRole || "-"
                )}
              </td>
              {/* <td className="px-6 py-4 border-b">
                <div className="flex space-x-2 items-center">
                  {member.friendStatus === "pending" && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm font-medium">
                      Chờ phản hồi
                    </span>
                  )}
                  {member.friendStatus === "received" && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">
                      Nhận lời mời
                    </span>
                  )}
                  {member.friendStatus === "friend" && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm font-medium">
                      Bạn bè
                    </span>
                  )}
                  {renderFriendAction(member)}
                </div>
              </td> */}
              {(user?.role === "admin" || showAdminControls) && (
                <td className="px-6 py-4 border-b">
                  {editingMember?._id === member._id ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveRole}
                        className="text-white bg-green-500 px-3 py-1 rounded hover:bg-green-600"
                      >
                        Lưu
                      </button>
                      <button
                        onClick={() => setEditingMember(null)}
                        className="text-white bg-gray-500 px-3 py-1 rounded hover:bg-gray-600"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleEditRole(member)}
                        className="text-white bg-blue-500 px-3 py-1 rounded hover:bg-blue-600"
                      >
                        Sửa vai trò
                      </button>
                      {onEdit && (
                        <button
                          onClick={() => onEdit(member)}
                          className="text-white bg-yellow-500 px-3 py-1 rounded hover:bg-yellow-600"
                        >
                          Sửa thông tin
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(member._id)}
                          className="text-white bg-red-500 px-3 py-1 rounded hover:bg-red-600"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MemberList;
