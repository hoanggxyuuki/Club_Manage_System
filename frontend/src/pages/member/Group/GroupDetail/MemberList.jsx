import React, { useState } from "react";
import PropTypes from "prop-types";
import { addMemberToGroup } from "../../../../services/api";
import Modal from "../../../../components/common/Modal";

const MemberList = ({ members, groupId, isLeader, onUpdate }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [emails, setEmails] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  
  const removeDiacritics = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  
  const filteredMembers = members.filter((member) => {
    if (!searchQuery) return true;

    const search = searchQuery.toLowerCase();
    const searchWithoutDiacritics = removeDiacritics(search);

    const username = member.userId.username.toLowerCase();
    const usernameWithoutDiacritics = removeDiacritics(username);

    const email = member.userId.email.toLowerCase();
    const emailWithoutDiacritics = removeDiacritics(email);

    return (
      username.includes(search) ||
      usernameWithoutDiacritics.includes(searchWithoutDiacritics) ||
      email.includes(search) ||
      emailWithoutDiacritics.includes(searchWithoutDiacritics)
    );
  });

  const handleAddMembers = async () => {
    try {
      const emailList = emails.split(",").map((email) => email.trim());
      await addMemberToGroup(groupId, emailList);
      onUpdate();
      setShowAddModal(false);
      setEmails("");
      setError("");
    } catch (error) {
      setError(error.message);
    }
  };

  const getRoleColor = (role) => {
    return (
      {
        leader: "bg-purple-100 text-purple-700 ring-purple-600/20",
        member: "bg-blue-100 text-blue-700 ring-blue-600/20",
      }[role.toLowerCase()] || "bg-gray-100 text-gray-700 ring-gray-600/20"
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Team Members</h3>
            <p className="text-sm text-gray-500 mt-1">
              Total members: {members.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members..."
                className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
            {isLeader && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add Members
              </button>
            )}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto pr-2">
          <div className="divide-y divide-gray-200">
            {filteredMembers.map((member) => (
              <div
                key={member.userId._id}
                className="py-4 flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-600">
                      {member.userId.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      {member.userId.username}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {member.userId.email}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${getRoleColor(member.role)}`}
                >
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {filteredMembers.length === 0 && searchQuery && (
          <div className="text-center py-8 text-gray-500">
            No members found matching "{searchQuery}"
          </div>
        )}
      </div>

      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEmails("");
            setError("");
          }}
          title="Add Team Members"
        >
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Email Addresses
                </label>
                <textarea
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  rows={4}
                  placeholder="Enter email addresses separated by commas&#10;example1@email.com, example2@email.com"
                />

                <p className="mt-2 text-sm text-gray-500">
                  Separate multiple email addresses with commas
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEmails("");
                    setError("");
                  }}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMembers}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Add Members
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

MemberList.propTypes = {
  members: PropTypes.arrayOf(
    PropTypes.shape({
      userId: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        username: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
      }),
      role: PropTypes.string.isRequired,
    }),
  ).isRequired,
  groupId: PropTypes.string.isRequired,
  isLeader: PropTypes.bool.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default MemberList;
