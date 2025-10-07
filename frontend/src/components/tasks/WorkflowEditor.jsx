import React, { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { message, Select } from "antd";
import { createTask, updateTask } from "../../services/task";
import { getMyGroups } from "../../services/groups";
import { useAuth } from "../../context/AuthContext";
import TaskNode from "./nodes/TaskNode";
import StartNode from "./nodes/StartNode";
import ConditionNode from "./nodes/ConditionNode";
import NotificationNode from "./nodes/NotificationNode";
import ApprovalNode from "./nodes/ApprovalNode";
import TimerNode from "./nodes/TimerNode";
import NodeToolbar from "./NodeToolbar";


const nodeTypes = {
  taskNode: TaskNode,
  startNode: StartNode,
  conditionNode: ConditionNode,
  notificationNode: NotificationNode,
  approvalNode: ApprovalNode,
  timerNode: TimerNode,
};

const { Option } = Select;

const WorkflowEditor = ({ visible, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(false);

  
  useEffect(() => {
    if (visible) {
      fetchGroups();
    }
  }, [visible]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const userGroups = await getMyGroups();
      setGroups(userGroups);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      message.error("Không thể tải danh sách nhóm");
    } finally {
      setLoading(false);
    }
  };

  
  React.useEffect(() => {
    if (visible) {
      const initialNodes = [
        {
          id: "start-node",
          type: "startNode",
          data: {
            label: "Bắt đầu",
            description: "Khởi đầu quy trình tại đây",
          },
          position: { x: 250, y: 50 },
        },
      ];

      setNodes(initialNodes);
      setEdges([]);
    }
  }, [visible, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges],
  );

  const addNode = (nodeType, position) => {
    const id = `${nodeType}-${Date.now()}`;
    let newNode = {
      id,
      type: `${nodeType}Node`,
      position,
      data: {
        label: getNodeLabel(nodeType),
        updateNodeData: (id, data) => {
          setNodes((nodes) =>
            nodes.map((node) =>
              node.id === id
                ? { ...node, data: { ...node.data, ...data } }
                : node,
            ),
          );
        },
        groups,
        selectedGroup: selectedGroup,
        members: selectedGroup
          ? groups.find((g) => g._id === selectedGroup)?.members || []
          : [],
      },
    };

    if (nodeType === "task") {
      newNode.data = {
        ...newNode.data,
        title: "Tác vụ mới",
        description: "",
        dueDate: null,
        priority: "medium",
        assignedTo: [],
        groupId: selectedGroup,
        updateNodeData: newNode.data.updateNodeData,
        groups,
        members: selectedGroup
          ? groups.find((g) => g._id === selectedGroup)?.members || []
          : [],
      };
    } else if (nodeType === "condition") {
      newNode.data = {
        ...newNode.data,
        condition: "priority",
        value: "high",
        updateNodeData: newNode.data.updateNodeData,
      };
    } else if (nodeType === "notification") {
      newNode.data = {
        ...newNode.data,
        title: "Thông báo mới",
        message: "",
        notificationType: "all",
        updateNodeData: newNode.data.updateNodeData,
        members: selectedGroup
          ? groups.find((g) => g._id === selectedGroup)?.members || []
          : [],
      };
    } else if (nodeType === "approval") {
      newNode.data = {
        ...newNode.data,
        approvalTitle: "Yêu cầu phê duyệt",
        approvalDescription: "",
        approvers: [],
        updateNodeData: newNode.data.updateNodeData,
        members: selectedGroup
          ? groups.find((g) => g._id === selectedGroup)?.members || []
          : [],
      };
    } else if (nodeType === "timer") {
      newNode.data = {
        ...newNode.data,
        duration: 1,
        timeUnit: "days",
        updateNodeData: newNode.data.updateNodeData,
      };
    }

    setNodes((nds) => nds.concat(newNode));
    return id;
  };

  const getNodeLabel = (nodeType) => {
    const labels = {
      task: "Tác vụ",
      start: "Bắt đầu",
      condition: "Điều kiện",
      notification: "Thông báo",
      approval: "Phê duyệt",
      timer: "Hẹn giờ",
    };
    return labels[nodeType] || nodeType;
  };

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData("application/reactflow");

      
      if (
        !selectedGroup &&
        ["task", "notification", "approval"].includes(nodeType)
      ) {
        message.warning("Vui lòng chọn nhóm trước khi thêm thành phần này");
        return;
      }

      
      if (!nodeType) {
        return;
      }

      const reactFlowBounds = event.target.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      addNode(nodeType, position);
    },
    [addNode, selectedGroup],
  );

  const executeWorkflow = async () => {
    try {
      setIsExecuting(true);

      
      const startNode = nodes.find((node) => node.type === "startNode");
      if (!startNode) {
        message.error("Quy trình phải có điểm bắt đầu");
        return;
      }

      
      const startEdges = edges.filter((edge) => edge.source === startNode.id);

      
      for (const edge of startEdges) {
        const targetNode = nodes.find((node) => node.id === edge.target);
        if (targetNode && targetNode.type === "taskNode") {
          
          const taskData = {
            title: targetNode.data.title,
            description: targetNode.data.description,
            dueDate: targetNode.data.dueDate,
            priority: targetNode.data.priority,
            assignedTo: targetNode.data.assignedTo,
            groupId: targetNode.data.groupId,
          };

          
          await createTask(taskData);
        }
      }

      message.success("Thực hiện quy trình thành công");
      onSuccess();
    } catch (error) {
      message.error("Không thể thực hiện quy trình: " + error.message);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleGroupChange = (groupId) => {
    setSelectedGroup(groupId);

    
    setNodes((nds) =>
      nds.map((node) => {
        if (
          ["taskNode", "notificationNode", "approvalNode"].includes(node.type)
        ) {
          const groupMembers =
            groups.find((g) => g._id === groupId)?.members || [];
          return {
            ...node,
            data: {
              ...node.data,
              groupId: groupId,
              assignedTo: [], 
              members: groupMembers,
            },
          };
        }
        return node;
      }),
    );
  };

  return (
    <div
      className="workflow-editor"
      style={{
        display: visible ? "flex" : "none",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        flexDirection: "column",
      }}
    >
      <div className="workflow-header bg-white p-4 flex flex-col border-b">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Trình Thiết Kế Quy Trình Tác Vụ
          </h2>

          <div className="flex gap-2">
            <button
              onClick={executeWorkflow}
              disabled={isExecuting || !selectedGroup}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isExecuting ? "Đang thực hiện..." : "Chạy quy trình"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Đóng
            </button>
          </div>
        </div>

        {/* Group selector - Highlighted and more prominent */}
        <div className="group-selector bg-blue-50 p-3 rounded-lg flex items-center border border-blue-200 animate-pulse">
          <div className="mr-3 flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div className="flex-grow">
            <div className="text-blue-800 font-medium mb-1">
              Bước 1: Chọn nhóm để tạo quy trình tác vụ
            </div>
            <Select
              className="w-full"
              placeholder="-- Chọn nhóm --"
              value={selectedGroup}
              onChange={handleGroupChange}
              loading={loading}
              showSearch
              optionFilterProp="children"
              style={{ fontSize: "16px" }}
            >
              {groups.map((group) => (
                <Option key={group._id} value={group._id}>
                  {group.name}
                </Option>
              ))}
            </Select>
          </div>
        </div>

        {!selectedGroup && (
          <div className="mt-3 bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-yellow-700">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>
                Bạn phải chọn nhóm trước khi có thể thêm các tác vụ vào quy
                trình.
              </span>
            </div>
          </div>
        )}

        {selectedGroup && (
          <div className="mt-3 bg-green-50 p-3 rounded-lg border border-green-200 text-green-700">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>
                Bước 2: Kéo các thành phần từ thanh công cụ bên trái và kết nối
                chúng với nhau.
              </span>
            </div>
          </div>
        )}
      </div>

      <div
        className="workflow-container flex"
        style={{ height: "calc(100vh - 180px)" }}
      >
        <NodeToolbar selectedGroup={selectedGroup} />
        <div className="reactflow-wrapper flex-grow" style={{ height: "100%" }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background variant="dots" gap={12} size={1} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

export default WorkflowEditor;
