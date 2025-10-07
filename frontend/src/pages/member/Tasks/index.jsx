import React, { useState, useEffect } from "react";
import { Tag, Space, Progress, Button, message, Card, Modal } from "antd";
import {
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TeamOutlined,
  EditOutlined,
  DeleteOutlined,
  CodeOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../../context/AuthContext";
import {
  getTasks,
  updateTaskProgress,
  confirmTask,
  deleteTask,
} from "../../../services/task";
import { getMyGroups } from "../../../services/groups";
import CreateTaskModal from "../../../components/tasks/CreateTaskModal";
import EditTaskModal from "../../../components/tasks/EditTaskModal";
import WorkflowEditor from "../../../components/tasks/WorkflowEditor";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
};

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [workflowEditorVisible, setWorkflowEditorVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [groups, setGroups] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const isLeader = user?.role === "leader" || user?.role === "admin";

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await getTasks();
      setTasks(data);
    } catch (error) {
      message.error("Không thể tải danh sách công việc");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const userGroups = await getMyGroups();
      setGroups(userGroups);

      
      const allMembers = [];
      userGroups.forEach((group) => {
        group.members.forEach((member) => {
          allMembers.push({
            userId: member.userId,
            groupId: group._id,
            role: member.role,
          });
        });
      });

      setGroupMembers(allMembers);
    } catch (error) {
      console.error("Failed to load groups:", error);
      message.error("Không thể tải danh sách nhóm");
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchGroups();
  }, []);

  const handleUpdateProgress = async (taskId, newProgress) => {
    try {
      await updateTaskProgress(taskId, { progress: newProgress });
      message.success("Cập nhật tiến độ thành công");
      fetchTasks();
    } catch (error) {
      message.error("Không thể cập nhật tiến độ");
    }
  };

  const handleConfirmTask = async (taskId) => {
    try {
      await confirmTask(taskId);
      message.success("Đã xác nhận hoàn thành công việc");
      fetchTasks();
    } catch (error) {
      message.error("Không thể xác nhận công việc");
    }
  };

  const handleDeleteTask = async (taskId) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa công việc này?",
      okText: "Xóa",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteTask(taskId);
          message.success("Xóa công việc thành công");
          fetchTasks();
        } catch (error) {
          message.error("Không thể xóa công việc");
        }
      },
    });
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setEditModalVisible(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "blue",
      in_progress: "orange",
      completed: "green",
      expired: "red",
      awaiting_confirmation: "gold",
    };
    return colors[status] || "default";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "blue",
      medium: "orange",
      high: "red",
    };
    return colors[priority] || "default";
  };

  const getStatusText = (status) => {
    const texts = {
      pending: "Chờ xử lý",
      in_progress: "Đang thực hiện",
      completed: "Hoàn thành",
      expired: "Hết hạn",
      awaiting_confirmation: "Chờ xác nhận",
    };
    return texts[status] || status;
  };

  const getPriorityText = (priority) => {
    const texts = {
      low: "Thấp",
      medium: "Trung bình",
      high: "Cao",
    };
    return texts[priority] || priority;
  };

  const columns = {
    pending: {
      title: "Chờ xử lý",
      items: tasks.filter((task) => task.status === "pending"),
    },
    in_progress: {
      title: "Đang thực hiện",
      items: tasks.filter((task) => task.status === "in_progress"),
    },
    awaiting_confirmation: {
      title: "Chờ xác nhận",
      items: tasks.filter((task) => task.status === "awaiting_confirmation"),
    },
    completed: {
      title: "Hoàn thành",
      items: tasks.filter((task) => task.status === "completed"),
    },
    expired: {
      title: "Hết hạn",
      items: tasks.filter((task) => task.status === "expired"),
    },
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const sourceStatus = result.source.droppableId;
    const destinationStatus = result.destination.droppableId;

    if (sourceStatus === destinationStatus) return;

    const taskId = result.draggableId;
    try {
      await updateTaskProgress(taskId, { status: destinationStatus });
      fetchTasks();
    } catch (error) {
      message.error("Không thể cập nhật trạng thái công việc");
    }
  };

  const TaskCard = ({ task, index }) => {
    const isTaskCreator = task.assignedBy?._id === user._id;

    return (
      <Draggable draggableId={task._id} index={index}>
        {(provided) => (
          <Card
            className="mb-4 shadow-sm"
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            extra={
              (isLeader || isTaskCreator) && (
                <Space>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditTask(task);
                    }}
                  />

                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTask(task._id);
                    }}
                    danger
                  />
                </Space>
              )
            }
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-medium">{task.title}</h3>
              <Tag color={getPriorityColor(task.priority)}>
                {getPriorityText(task.priority)}
              </Tag>
            </div>

            <p className="text-sm mb-2">
              <TeamOutlined className="mr-1" /> Nhóm:{" "}
              {task.groupId?.name || "Không xác định"}
            </p>

            <p className="text-sm mb-2">
              <UserOutlined className="mr-1" /> Người giao:{" "}
              {task.assignedBy?.username || "Không xác định"}
            </p>

            <p className="text-sm mb-2">
              <UserOutlined className="mr-1" /> Người đảm nhận:{" "}
              {Array.isArray(task.assignedTo) && task.assignedTo.length > 0
                ? task.assignedTo.map((user) => user?.username).join(", ")
                : "Không xác định"}
            </p>

            <p className="text-sm mb-2">
              <span className="font-medium">Mô tả: </span>
              {task.description}
            </p>

            <p className="text-sm mb-3">
              <ClockCircleOutlined className="mr-1" />
              <span className="font-medium">Hạn: </span>
              {new Date(task.dueDate).toLocaleString("vi-VN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </p>

            <div className="mb-3">
              <Progress percent={task.progress} size="small" />
            </div>

            {task.status === "awaiting_confirmation" && isLeader && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                block
                onClick={() => handleConfirmTask(task._id)}
                size="large"
              >
                Xác nhận hoàn thành
              </Button>
            )}

            {task.status !== "completed" &&
              task.status !== "expired" &&
              task.status !== "awaiting_confirmation" && (
                <div className="flex justify-between mt-3">
                  <Button
                    size="middle"
                    style={{ flex: 1, marginRight: 8 }}
                    onClick={() =>
                      handleUpdateProgress(
                        task._id,
                        Math.min(100, task.progress + 10),
                      )
                    }
                    disabled={task.progress >= 100}
                  >
                    +10%
                  </Button>
                  <Button
                    size="middle"
                    style={{ flex: 1 }}
                    onClick={() =>
                      handleUpdateProgress(
                        task._id,
                        Math.max(0, task.progress - 10),
                      )
                    }
                    disabled={task.progress <= 0}
                  >
                    -10%
                  </Button>
                </div>
              )}
          </Card>
        )}
      </Draggable>
    );
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className={`${isMobile ? "p-3" : "p-6"}`}>
        <div
          className={`${isMobile ? "flex flex-col" : "flex justify-between items-center"} mb-6`}
        >
          <div>
            <h1 className="text-2xl font-semibold">Danh sách công việc</h1>
            <p className="text-gray-500 mt-1">
              {isLeader
                ? "Quản lý công việc của nhóm"
                : "Xem và cập nhật tiến độ công việc được giao"}
            </p>
          </div>
          {isLeader && (
            <div className="flex gap-3 mt-4 sm:mt-0">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
                style={isMobile ? { flex: 1 } : {}}
                size={isMobile ? "large" : "middle"}
              >
                Tạo công việc mới
              </Button>

              <Button
                type="default"
                icon={<CodeOutlined />}
                onClick={() => setWorkflowEditorVisible(true)}
                style={isMobile ? { flex: 1 } : {}}
                size={isMobile ? "large" : "middle"}
              >
                Quy Trình Tác Vụ
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(columns).map(([status, column]) => (
            <div key={status} className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-4 flex items-center">
                <span
                  className={`w-3 h-3 rounded-full mr-2 bg-${getStatusColor(status)}-500`}
                ></span>
                {column.title}
                <span className="ml-2 text-gray-500">
                  ({column.items.length})
                </span>
              </h3>
              <Droppable droppableId={status}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-[200px]"
                  >
                    {column.items.map((task, index) => (
                      <TaskCard key={task._id} task={task} index={index} />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>

        <CreateTaskModal
          visible={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          onSuccess={() => {
            setCreateModalVisible(false);
            fetchTasks();
          }}
        />

        <EditTaskModal
          visible={editModalVisible}
          onCancel={() => {
            setEditModalVisible(false);
            setSelectedTask(null);
          }}
          onSuccess={() => {
            setEditModalVisible(false);
            setSelectedTask(null);
            fetchTasks();
          }}
          task={selectedTask}
        />

        <WorkflowEditor
          visible={workflowEditorVisible}
          onClose={() => setWorkflowEditorVisible(false)}
          onSuccess={() => {
            setWorkflowEditorVisible(false);
            fetchTasks();
            message.success("Các tác vụ đã được tạo từ quy trình!");
          }}
          groups={groups}
          members={groupMembers}
        />
      </div>
    </DragDropContext>
  );
};

export default TasksPage;
