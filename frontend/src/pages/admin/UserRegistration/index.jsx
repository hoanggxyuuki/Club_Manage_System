import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  getRegistrationStatus,
  updateRegistrationStatus,
  getPendingUsers,
  approveUser,
  rejectUser,
} from "../../../services/systemConfig";

const UserRegistrationManagement = () => {
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingUsers, setProcessingUsers] = useState(new Set());
  const [stats, setStats] = useState({
    approved: 0,
    rejected: 0,
    pending: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statusResponse, usersResponse] = await Promise.all([
        getRegistrationStatus(),
        getPendingUsers(),
      ]);

      setRegistrationOpen(statusResponse.isOpen);
      setPendingUsers(usersResponse.users || []);

      
      setStats({
        pending: usersResponse.users?.length || 0,
        approved: 0,
        rejected: 0,
      });
    } catch (error) {
      toast.error("Failed to load registration data");
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRegistration = async () => {
    try {
      setLoading(true);
      await updateRegistrationStatus(!registrationOpen);
      setRegistrationOpen(!registrationOpen);
      toast.success(
        `Registration ${!registrationOpen ? "opened" : "closed"} successfully`,
      );
    } catch (error) {
      toast.error("Failed to update registration status");
      console.error("Failed to update registration status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      setProcessingUsers((prev) => new Set(prev).add(userId));
      await approveUser(userId);
      setPendingUsers(pendingUsers.filter((user) => user._id !== userId));
      setStats((prev) => ({
        ...prev,
        approved: prev.approved + 1,
        pending: prev.pending - 1,
      }));
      toast.success("User approved successfully");
    } catch (error) {
      toast.error("Failed to approve user");
      console.error("Failed to approve user:", error);
    } finally {
      setProcessingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleRejectUser = async (userId) => {
    try {
      setProcessingUsers((prev) => new Set(prev).add(userId));
      await rejectUser(userId);
      setPendingUsers(pendingUsers.filter((user) => user._id !== userId));
      setStats((prev) => ({
        ...prev,
        rejected: prev.rejected + 1,
        pending: prev.pending - 1,
      }));
      toast.success("User rejected successfully");
    } catch (error) {
      toast.error("Failed to reject user");
      console.error("Failed to reject user:", error);
    } finally {
      setProcessingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">
          User Registration Management
        </h1>
        <p className="text-gray-600">
          Manage registration status and pending user requests
        </p>
      </div>

      {/* Registration Status Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Registration Status</h2>
            <p className="text-gray-600 mt-1">
              {registrationOpen
                ? "Registration is currently open for new members"
                : "Registration is currently closed"}
            </p>
          </div>
          <div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={registrationOpen}
                onChange={handleToggleRegistration}
                disabled={loading}
              />

              <div
                className={`w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 
                dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full 
                peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 
                after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full 
                after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${loading ? "opacity-50" : ""}`}
              ></div>
              <span className="ml-3 text-sm font-medium text-gray-900">
                {registrationOpen ? "Open" : "Closed"}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-indigo-500 text-2xl font-bold">
            {stats.pending}
          </div>
          <div className="text-gray-600">Pending Approvals</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-green-500 text-2xl font-bold">
            {stats.approved}
          </div>
          <div className="text-gray-600">Approved (This Session)</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-red-500 text-2xl font-bold">
            {stats.rejected}
          </div>
          <div className="text-gray-600">Rejected (This Session)</div>
        </div>
      </div>

      {/* Pending Users Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Pending User Requests</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <svg
              className="animate-spin h-8 w-8 mx-auto text-gray-500"
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
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No pending user requests
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingUsers.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-gray-200 rounded-full flex items-center justify-center">
                          {user.username
                            ? user.username.charAt(0).toUpperCase()
                            : "U"}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.username || "Unknown"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.fullName || "Not provided"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveUser(user._id)}
                          disabled={processingUsers.has(user._id)}
                          className={`px-3 py-1 rounded text-white bg-green-600 hover:bg-green-700 ${
                            processingUsers.has(user._id)
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {processingUsers.has(user._id)
                            ? "Processing..."
                            : "Approve"}
                        </button>
                        <button
                          onClick={() => handleRejectUser(user._id)}
                          disabled={processingUsers.has(user._id)}
                          className={`px-3 py-1 rounded text-white bg-red-600 hover:bg-red-700 ${
                            processingUsers.has(user._id)
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {processingUsers.has(user._id)
                            ? "Processing..."
                            : "Reject"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserRegistrationManagement;
