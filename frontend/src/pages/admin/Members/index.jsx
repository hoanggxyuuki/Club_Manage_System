import React, { useState, useEffect, useMemo, useCallback } from "react";
import MemberForm from "./MemberForm";
import MemberList from "../../../components/members/MemberList";
import {
  createUser,
  updateUser,
  deleteUser,
  getAllUsers,
} from "../../../services/api";
import { toast } from "react-toastify";

const MemberManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filters, setFilters] = useState({
    role: "all",
    status: "all",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      toast.error(
        "Failed to load users: " + (error.message || "Unknown error"),
      );
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      return (
        (filters.role === "all" || user.role === filters.role) &&
        (filters.status === "all" || user.approvalStatus === filters.status)
      );
    });
  }, [users, filters]);

  
  const handleSubmit = useCallback(
    async (data) => {
      try {
        if (selectedUser) {
          await updateUser(selectedUser._id, data);
          toast.success("User updated successfully");
        } else {
          await createUser(data);
          toast.success("User created successfully");
        }
        await loadUsers();
        setShowForm(false);
        setSelectedUser(null);
      } catch (error) {
        toast.error("Failed to save user: " + (error.message || "Unknown error"));
        console.error("Failed to save user:", error);
      }
    },
    [selectedUser],
  );

  const handleDelete = useCallback(
    async (id) => {
      if (window.confirm("Are you sure you want to delete this user?")) {
        try {
          await deleteUser(id);
          await loadUsers();
          toast.success("User deleted successfully");
        } catch (error) {
          toast.error(
            "Failed to delete user: " + (error.message || "Unknown error"),
          );
          console.error("Failed to delete user:", error);
        }
      }
    },
    [],
  );

  const handleFilterChange = useCallback(
    (name, value) => {
      setFilters((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setSelectedUser(null);
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Quản lý thành viên</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-primary-700"
        >
          Thêm thành viên mới
        </button>
      </div>

      <MemberList
        showAdminControls={true}
        onEdit={setSelectedUser}
        onDelete={handleDelete}
        users={filteredUsers}
        loading={loading}
        onApprove={loadUsers}
        onReject={loadUsers}
        onScheduleInterview={loadUsers}
      />

      {(showForm || selectedUser) && (
        <MemberForm
          member={selectedUser}
          onClose={handleCloseForm}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default MemberManagement;
