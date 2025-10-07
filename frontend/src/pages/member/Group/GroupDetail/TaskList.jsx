import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  getGroupTasks,
  deleteTask,
  updateTaskProgress,
} from "../../../../services/task";
import TaskForm from "./TaskForm";
import TaskProgress from "./TaskProgress";
import moment from "moment";
import "./TaskList.css";

const TaskList = ({ groupId, isLeader, onTaskUpdate, members }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [showTaskDetails, setShowTaskDetails] = useState(null);

  useEffect(() => {
    loadTasks();
  }, [groupId]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const handleDeleteClick = (e, task) => {
    e.preventDefault();
    e.stopPropagation();
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const toggleDropdown = (taskId, e) => {
    e.stopPropagation();
    setOpenDropdowns((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleUpdateProgress = async (taskId, progress) => {
    try {
      await updateTaskProgress(taskId, { progress });
      loadTasks();
      setShowProgressModal(false);
    } catch (error) {
      console.error("Failed to update progress:", error);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await getGroupTasks(groupId);
      setTasks(data);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task) => {
    if (taskToDelete) return;
    setSelectedTask(task);
    setShowProgressModal(true);
  };

  const handleDeleteConfirm = async (e) => {
    e && e.stopPropagation();
    if (!taskToDelete) return;

    setDeletingTaskId(taskToDelete._id);
    try {
      await deleteTask(taskToDelete._id);
      await loadTasks();
    } catch (error) {
      console.error("Failed to delete task:", error);
    } finally {
      setDeletingTaskId(null);
      setShowDeleteModal(false);
      setTaskToDelete(null);
    }
  };

  const toggleTaskDetails = (e, taskId) => {
    e.preventDefault();
    e.stopPropagation();
    setShowTaskDetails(showTaskDetails === taskId ? null : taskId);
  };

  const getPriorityStyles = (priority) => {
    const styles = {
      high: "bg-red-50 text-red-700 ring-red-600/20",
      medium: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
      low: "bg-green-50 text-green-700 ring-green-600/20",
    };
    return `${styles[priority]} inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset`;
  };

  const getAssignedMembersCount = (task) => {
    const assignedMembers = task.assignedTo || [];
    return assignedMembers.length > 0
      ? `${assignedMembers.length} member${assignedMembers.length > 1 ? "s" : ""}`
      : "No members";
  };

  const renderAssignedMembers = (task) => {
    const assignedMembers = task.assignedTo;

    if (!assignedMembers?.length) return "No members assigned";

    return (
      <div className="relative">
        <div className="flex -space-x-2 flex-shrink-0">
          {assignedMembers.slice(0, 3).map((member) => (
            <div
              key={member._id}
              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 ring-2 ring-white"
              title={member.username}
            >
              {member.username[0].toUpperCase()}
            </div>
          ))}
          {assignedMembers.length > 3 && (
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 ring-2 ring-white">
              +{assignedMembers.length - 3}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTaskDetails = (task) => {
    if (showTaskDetails !== task._id) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm space-y-3 animate-fadeIn">
        {task.description && (
          <div>
            <h4 className="font-medium text-gray-700">Description:</h4>
            <p className="text-gray-600 mt-1 whitespace-pre-line">
              {task.description}
            </p>
          </div>
        )}

        <div>
          <h4 className="font-medium text-gray-700">Assigned Members:</h4>
          <div className="mt-1">
            {task.assignedTo && task.assignedTo.length > 0 ? (
              <div className="space-y-1">
                {task.assignedTo.map((member) => (
                  <div key={member._id} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                      {member.username[0].toUpperCase()}
                    </div>
                    <span>{member.username}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No members assigned</p>
            )}
          </div>
        </div>

        {task.dueDate && (
          <div>
            <h4 className="font-medium text-gray-700">Due Date:</h4>
            <p className="text-gray-600 mt-1">
              {moment(task.dueDate).format("MMM DD, YYYY - HH:mm")}
            </p>
          </div>
        )}

        <div>
          <h4 className="font-medium text-gray-700">Status:</h4>
          <p className="text-gray-600 mt-1 capitalize">
            {task.status.replace("_", " ")}
          </p>
        </div>

        <div>
          <h4 className="font-medium text-gray-700">Created:</h4>
          <p className="text-gray-600 mt-1">
            {moment(task.createdAt).format("MMM DD, YYYY")}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] max-h-full">
      <div className="flex justify-between items-center mb-6 px-4">
        <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
        {isLeader && (
          <button
            onClick={() => setShowTaskForm(true)}
            className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Create Task
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4">
          <div className="space-y-4 pb-4">
            {tasks.map((task) => (
              <div
                key={task._id}
                className={`group relative bg-white rounded-xl shadow-sm ring-1 ring-gray-200 
                                    hover:shadow-md hover:ring-gray-300 transition-all duration-200
                                    ${deletingTaskId === task._id ? "task-delete-animation" : ""}`}
              >
                {isLeader && (
                  <button
                    onClick={(e) => handleDeleteClick(e, task)}
                    className="absolute top-0 right-0 p-2 text-gray-400 hover:text-red-600 
                                            transition-all duration-200 transform hover:scale-110 hover:rotate-12"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
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

                {showDeleteModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full m-4 transform transition-all duration-300 scale-100">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Confirm Delete
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Are you sure you want to delete this task? This action
                        cannot be undone.
                      </p>
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setShowDeleteModal(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeleteConfirm}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div
                  className="p-4 cursor-pointer"
                  onClick={() => handleTaskClick(task)}
                >
                  <div className="flex items-center justify-between gap-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {task.title}
                    </h3>
                    <span
                      className={`${getPriorityStyles(task.priority)} flex-shrink-0`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span className="text-xs text-gray-500 flex items-center">
                      <svg
                        className="w-4 h-4 mr-1 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      {getAssignedMembersCount(task)}
                    </span>
                    {task.dueDate && (
                      <div className="text-xs flex items-center">
                        <svg
                          className="w-4 h-4 mr-1 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Due: {moment(task.dueDate).format("MMM DD")}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">
                        Progress
                      </span>
                      <span className="text-xs font-medium text-gray-900">
                        {task.progress || 0}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          task.progress >= 70
                            ? "bg-green-500"
                            : task.progress >= 30
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${task.progress || 0}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={(e) => toggleTaskDetails(e, task._id)}
                    className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-all duration-200"
                  >
                    {showTaskDetails === task._id
                      ? "Hide details"
                      : "View details"}
                    <svg
                      className={`w-4 h-4 transform transition-transform duration-200 ${showTaskDetails === task._id ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {renderTaskDetails(task)}
                </div>
              </div>
            ))}

            {tasks.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-semibold text-gray-900">
                  No tasks
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new task.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {showTaskForm && (
        <TaskForm
          groupId={groupId}
          members={members}
          onClose={() => setShowTaskForm(false)}
          onSubmit={() => {
            loadTasks();
            setShowTaskForm(false);
          }}
        />
      )}

      {showProgressModal && selectedTask && (
        <TaskProgress
          task={selectedTask}
          onClose={() => setShowProgressModal(false)}
          onUpdate={(progress) => {
            loadTasks();
            handleUpdateProgress(selectedTask._id, progress);
          }}
        />
      )}
    </div>
  );
};

TaskList.propTypes = {
  groupId: PropTypes.string.isRequired,
  isLeader: PropTypes.bool.isRequired,
  onTaskUpdate: PropTypes.func.isRequired,
  members: PropTypes.array.isRequired,
};

export default TaskList;
