import React, { useState } from "react";
import PropTypes from "prop-types";
import Modal from "../../../../components/common/Modal";
import { createTask } from "../../../../services/task";

const TaskForm = ({ groupId, members, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    assignedTo: [],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createTask({ ...formData, groupId });
      onSubmit();
      onClose();
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const getPriorityColor = (priority) => {
    return {
      low: "text-green-600 bg-green-50 ring-green-600/20",
      medium: "text-yellow-600 bg-yellow-50 ring-yellow-600/20",
      high: "text-red-600 bg-red-50 ring-red-600/20",
    }[priority];
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Create New Task">
      <div className="bg-white p-6 rounded-lg max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Task Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter task title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              rows={4}
              placeholder="Describe the task details"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${getPriorityColor(formData.priority)}`}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Assign Team Members
            </label>
            <div className="relative">
              <select
                multiple
                value={formData.assignedTo}
                onChange={(e) => {
                  const selected = Array.from(
                    e.target.selectedOptions,
                    (option) => option.value,
                  );
                  setFormData({ ...formData, assignedTo: selected });
                }}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                size={4}
              >
                {members.map((member) => (
                  <option
                    key={member.userId._id}
                    value={member.userId._id}
                    className="py-2 px-4 hover:bg-gray-100"
                  >
                    {member.userId.username}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Hold Ctrl/Cmd to select multiple members
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

TaskForm.propTypes = {
  groupId: PropTypes.string.isRequired,
  members: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default TaskForm;
