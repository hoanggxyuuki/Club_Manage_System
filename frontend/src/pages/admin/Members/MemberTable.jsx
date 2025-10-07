import React, { useState } from "react";
import PropTypes from "prop-types";
import { format } from "date-fns";

const MemberTable = ({
  members: users,
  onEdit,
  onDelete,
  onScheduleInterview,
  loading,
}) => {
  const [interviewData, setInterviewData] = useState({
    userId: "",
    date: "",
    location: "",
    notes: "",
  });
  const [showInterviewModal, setShowInterviewModal] = useState(false);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (users.length === 0) {
    return <div className="text-center py-8 text-gray-500">No users found</div>;
  }

  const getApprovalStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "reviewing":
        return "bg-blue-100 text-blue-800";
      case "interview":
        return "bg-indigo-100 text-indigo-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getApprovalStatusDisplay = (status) => {
    switch (status) {
      case "interview":
        return "Interview Scheduled";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const openInterviewModal = (user) => {
    setInterviewData({
      userId: user._id,
      date: user.interviewDate
        ? new Date(user.interviewDate).toISOString().split("T")[0]
        : "",
      location: user.interviewLocation || "",
      notes: user.interviewNotes || "",
    });
    setShowInterviewModal(true);
  };

  const handleScheduleInterview = () => {
    onScheduleInterview(interviewData);
    setShowInterviewModal(false);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Full Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Approval Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.fullName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      user.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : user.role === "leader"
                          ? "bg-blue-100 text-blue-800"
                          : user.role === "owner"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${getApprovalStatusClass(user.approvalStatus)}`}
                  >
                    {getApprovalStatusDisplay(user.approvalStatus)}
                  </span>
                  {user.approvalStatus === "interview" &&
                    user.interviewDate && (
                      <div className="text-xs text-gray-500 mt-1">
                        <div>{format(new Date(user.interviewDate), "PPP")}</div>
                        <div>{user.interviewLocation}</div>
                      </div>
                    )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.phone || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => onEdit(user)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Edit
                  </button>
                  {(user.approvalStatus === "pending" ||
                    user.approvalStatus === "reviewing") && (
                    <button
                      onClick={() => openInterviewModal(user)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Schedule
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(user._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Interview Scheduling Modal */}
      {showInterviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Schedule Interview</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={interviewData.date}
                  onChange={(e) =>
                    setInterviewData({ ...interviewData, date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={interviewData.location}
                  onChange={(e) =>
                    setInterviewData({
                      ...interviewData,
                      location: e.target.value,
                    })
                  }
                  placeholder="Interview location"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={interviewData.notes}
                  onChange={(e) =>
                    setInterviewData({
                      ...interviewData,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Any additional notes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowInterviewModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleInterview}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Schedule Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

MemberTable.propTypes = {
  members: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      username: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      fullName: PropTypes.string.isRequired,
      role: PropTypes.string.isRequired,
      approvalStatus: PropTypes.string,
      interviewDate: PropTypes.string,
      interviewLocation: PropTypes.string,
      interviewNotes: PropTypes.string,
      phone: PropTypes.string,
    }),
  ).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onScheduleInterview: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

MemberTable.defaultProps = {
  loading: false,
};

export default MemberTable;
