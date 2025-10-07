import React, { useState } from "react";
import PropTypes from "prop-types";
import Modal from "../../../components/common/Modal";
import { createGroup } from "../../../services/groups";
const GroupForm = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const newGroup = await createGroup(formData);
      onSubmit(newGroup);
    } catch (error) {
      setError("Failed to create group. Please try again.");
      console.error("Create group error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Tạo nhóm mới">
      <div className="bg-white p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Thông tin nhóm
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Điền thông tin bên dưới để tạo nhóm mới của bạn.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên nhóm
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter group name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              rows={4}
              placeholder="Describe the purpose of your group"
            />

            <p className="mt-1 text-sm text-gray-500">
              Mô tả ngắn gọn về mục đích và mục tiêu của nhóm.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Tạo
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

GroupForm.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default GroupForm;
