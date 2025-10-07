import React, { useState } from "react";
import PropTypes from "prop-types";
import Modal from "../../../../components/common/Modal";
import MemberList from "./MemberList";
import TaskList from "./TaskList";
import { deleteGroup } from "../../../../services/api";

const GroupDetail = ({ group, onClose, onUpdate, isLeader }) => {
  const [activeTab, setActiveTab] = useState("info");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleTaskUpdate = () => {
    onUpdate();
  };

  const handleDeleteGroup = async () => {
    try {
      await deleteGroup(group._id);
      onClose();
      onUpdate();
    } catch (error) {
      console.error("Failed to delete group:", error);
    }
  };

  const tabs = [
    {
      id: "info",
      label: "Information",
      icon: (
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
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: "members",
      label: "Members",
      icon: (
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
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
    },
    {
      id: "tasks",
      label: "Tasks",
      icon: (
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
    },
  ];

  const getStatusColor = (status) => {
    return (
      {
        active: "bg-green-100 text-green-800",
        pending: "bg-yellow-100 text-yellow-800",
        completed: "bg-blue-100 text-blue-800",
      }[status.toLowerCase()] || "bg-gray-100 text-gray-800"
    );
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="">
      <div className="bg-white rounded-xl overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white">{group.name}</h2>
              <span
                className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(group.status)}`}
              >
                {group.status}
              </span>
            </div>
            {isLeader && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-white hover:bg-red-500 rounded-lg transition-colors duration-200"
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

        <div className="border-b border-gray-200">
          <nav className="flex -mb-px" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                                    flex-1 inline-flex items-center justify-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                                    ${
                                      activeTab === tab.id
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }
                                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "info" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  About
                </h3>
                <p className="text-gray-600">{group.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Created by</p>
                  <p className="font-medium text-gray-900">
                    {group.createdById.username}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Members</p>
                  <p className="font-medium text-gray-900">
                    {group.members?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "members" && (
            <div className="max-h-96 overflow-y-auto">
              <MemberList
                members={group.members}
                groupId={group._id}
                isLeader={isLeader}
                onUpdate={onUpdate}
              />
            </div>
          )}

          {activeTab === "tasks" && (
            <TaskList
              groupId={group._id}
              isLeader={isLeader}
              onTaskUpdate={handleTaskUpdate}
              members={group.members}
            />
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Group
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this group? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

GroupDetail.propTypes = {
  group: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    createdById: PropTypes.shape({
      username: PropTypes.string.isRequired,
    }).isRequired,
    members: PropTypes.array.isRequired,
    status: PropTypes.string.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  isLeader: PropTypes.bool.isRequired,
};

export default GroupDetail;
