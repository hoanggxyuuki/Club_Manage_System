import React, { useState, useEffect } from "react";
import {
  getPendingApprovalUsers,
  approveUser,
  rejectUser,
  getUserById,
} from "../../../services/api";
import { toast } from "react-toastify";
import { format } from "date-fns";
import {
  CheckCircle,
  XCircle,
  Eye,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  School,
  Briefcase,
  Award,
  BookOpen,
  Heart,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

const PendingApproval = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(false);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchUserDetails(selectedUser._id);
    }
  }, [selectedUser]);

  const loadPendingUsers = async () => {
    setLoading(true);
    try {
      const data = await getPendingApprovalUsers();
      setPendingUsers(data || []);
    } catch (error) {
      toast.error(
        "Failed to load pending users: " + (error.message || "Unknown error"),
      );
      console.error("Failed to load pending users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      const data = await getUserById(userId);
      setUserDetails(data);
    } catch (error) {
      toast.error(
        "Failed to load user details: " + (error.message || "Unknown error"),
      );
      console.error("Failed to load user details:", error);
    }
  };

  const handleApprove = async (userId) => {
    if (window.confirm("Are you sure you want to approve this user?")) {
      try {
        await approveUser(userId);
        toast.success("User approved successfully");
        loadPendingUsers();
        setSelectedUser(null);
        setViewingProfile(false);
      } catch (error) {
        toast.error(
          "Failed to approve user: " + (error.message || "Unknown error"),
        );
        console.error("Failed to approve user:", error);
      }
    }
  };

  const handleReject = async (userId) => {
    if (
      window.confirm(
        "Are you sure you want to reject this user? This action will delete their account.",
      )
    ) {
      try {
        await rejectUser(userId);
        toast.success("User rejected successfully");
        loadPendingUsers();
        setSelectedUser(null);
        setViewingProfile(false);
      } catch (error) {
        toast.error(
          "Failed to reject user: " + (error.message || "Unknown error"),
        );
        console.error("Failed to reject user:", error);
      }
    }
  };

  const viewProfile = (user) => {
    setSelectedUser(user);
    setViewingProfile(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not provided";
    return format(new Date(dateString), "dd/MM/yyyy");
  };

  const UserList = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 shadow-sm rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Username
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Full Name
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Email
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Registration Date
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {pendingUsers.map((user) => (
            <tr key={user._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {user.username}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {user.fullName || "N/A"}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{user.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">
                  {formatDate(user.createdAt)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() => viewProfile(user)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    aria-label="View Profile"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleApprove(user._id)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                    aria-label="Approve"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleReject(user._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    aria-label="Reject"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {pendingUsers.length === 0 && !loading && (
            <tr>
              <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                No pending users to approve
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );

  const UserProfile = () => {
    if (!userDetails)
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      );

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-600 text-white p-6">
          <button
            onClick={() => setViewingProfile(false)}
            className="mb-4 inline-flex items-center text-white hover:underline"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to list
          </button>

          <div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-blue-600 text-3xl font-semibold">
              {userDetails.fullName?.charAt(0) ||
                userDetails.username?.charAt(0) ||
                "U"}
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                {userDetails.fullName || userDetails.username}
              </h1>
              <p className="text-blue-100 flex items-center mt-1">
                <Mail className="w-4 h-4 mr-2" />
                {userDetails.email}
              </p>
              {userDetails.phone && (
                <p className="text-blue-100 flex items-center mt-1">
                  <Phone className="w-4 h-4 mr-2" />
                  {userDetails.phone}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
                Personal Information
              </h2>

              <div className="space-y-4">
                {userDetails.dateOfBirth && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                      Date of Birth
                    </h3>
                    <p className="mt-1">
                      {formatDate(userDetails.dateOfBirth)}
                    </p>
                  </div>
                )}

                {(userDetails.city || userDetails.province) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                      Location
                    </h3>
                    <p className="mt-1">
                      {[userDetails.city, userDetails.province]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                )}

                {userDetails.department && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 flex items-center">
                      <School className="w-4 h-4 mr-2 text-blue-500" />
                      Department
                    </h3>
                    <p className="mt-1">{userDetails.department}</p>
                  </div>
                )}

                {userDetails.education && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 flex items-center">
                      <School className="w-4 h-4 mr-2 text-blue-500" />
                      Education
                    </h3>
                    <p className="mt-1">{userDetails.education}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
                Skills & Experience
              </h2>

              <div className="space-y-4">
                {userDetails.skills && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 flex items-center">
                      <Award className="w-4 h-4 mr-2 text-blue-500" />
                      Skills
                    </h3>
                    <p className="mt-1">{userDetails.skills}</p>
                  </div>
                )}

                {userDetails.experience && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 flex items-center">
                      <Briefcase className="w-4 h-4 mr-2 text-blue-500" />
                      Experience
                    </h3>
                    <p className="mt-1">{userDetails.experience}</p>
                  </div>
                )}

                {userDetails.bio && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 flex items-center">
                      <User className="w-4 h-4 mr-2 text-blue-500" />
                      Bio
                    </h3>
                    <p className="mt-1">{userDetails.bio}</p>
                  </div>
                )}

                {userDetails.interests && userDetails.interests.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 flex items-center">
                      <Heart className="w-4 h-4 mr-2 text-blue-500" />
                      Interests
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {Array.isArray(userDetails.interests) ? (
                        userDetails.interests.map((interest, index) => (
                          <span
                            key={index}
                            className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {interest}
                          </span>
                        ))
                      ) : (
                        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {userDetails.interests.toString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <button
              onClick={() => handleReject(userDetails._id)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
            >
              <XCircle className="w-5 h-5 mr-2" />
              Reject
            </button>
            <button
              onClick={() => handleApprove(userDetails._id)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Approve
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Demo User Applications</h1>
        <div className="flex items-center">
          <button
            onClick={loadPendingUsers}
            className="flex items-center px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
          >
            <ArrowRight className="w-4 h-4 mr-1" />
            Refresh
          </button>
        </div>
      </div>

      {viewingProfile ? <UserProfile /> : <UserList />}
    </div>
  );
};

export default PendingApproval;
