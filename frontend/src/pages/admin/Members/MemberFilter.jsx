import React from "react";
import PropTypes from "prop-types";

const MemberFilter = ({ filters, onFilterChange }) => {
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4">
      {/* Search Filter */}
      <div className="w-full md:w-auto flex-1 min-w-[200px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Search
        </label>
        <input
          type="text"
          name="search"
          value={filters.search || ""}
          onChange={handleFilterChange}
          placeholder="Search by name, email, etc."
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      {/* Role Filter */}
      <div className="w-full md:w-auto flex-1 min-w-[150px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Role
        </label>
        <select
          name="role"
          value={filters.role || ""}
          onChange={handleFilterChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Roles</option>
          <option value="member">Member</option>
          <option value="leader">Leader</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </select>
      </div>

      {/* Approval Status Filter */}
      <div className="w-full md:w-auto flex-1 min-w-[150px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Approval Status
        </label>
        <select
          name="approvalStatus"
          value={filters.approvalStatus || ""}
          onChange={handleFilterChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="reviewing">Reviewing</option>
          <option value="interview">Interview Scheduled</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Sort Filter */}
      <div className="w-full md:w-auto flex-1 min-w-[150px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sort By
        </label>
        <select
          name="sortBy"
          value={filters.sortBy || "createdAt"}
          onChange={handleFilterChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="createdAt">Join Date</option>
          <option value="username">Username</option>
          <option value="fullName">Full Name</option>
          <option value="updatedAt">Last Updated</option>
        </select>
      </div>

      {/* Sort Direction */}
      <div className="w-full md:w-auto flex-1 min-w-[150px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sort Direction
        </label>
        <select
          name="sortDir"
          value={filters.sortDir || "desc"}
          onChange={handleFilterChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>
    </div>
  );
};

MemberFilter.propTypes = {
  filters: PropTypes.shape({
    search: PropTypes.string,
    role: PropTypes.string,
    approvalStatus: PropTypes.string,
    sortBy: PropTypes.string,
    sortDir: PropTypes.string,
  }),
  onFilterChange: PropTypes.func.isRequired,
};

MemberFilter.defaultProps = {
  filters: {
    search: "",
    role: "",
    approvalStatus: "",
    sortBy: "createdAt",
    sortDir: "desc",
  },
};

export default MemberFilter;
