import React, { useState } from "react";
import PropTypes from "prop-types";
import Modal from "../../../components/common/Modal";

const UserForm = ({ member: user, onClose, onSubmit }) => {
  const [formData, setFormData] = useState(
    user || {
      username: "",
      email: "",
      fullName: "",
      phone: "",
      password: "",
      role: "member",
    },
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (user && !formData.password) {
      const submitData = { ...formData };
      delete submitData.password;
      onSubmit(submitData);
    } else {
      onSubmit(formData);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={user ? "Edit User" : "Add New User"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {user ? "New Password (leave blank to keep current)" : "Password"}
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            required={!user}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Role
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="member">Member</option>
            <option value="leader">Leader</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
          >
            {user ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

UserForm.propTypes = {
  member: PropTypes.shape({
    _id: PropTypes.string,
    username: PropTypes.string,
    email: PropTypes.string,
    fullName: PropTypes.string,
    phone: PropTypes.string,
    role: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

UserForm.defaultProps = {
  member: null,
};

export default UserForm;
