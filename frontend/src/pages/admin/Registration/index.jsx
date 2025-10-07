import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Switch,
  Modal,
  Card,
  Badge,
  Tooltip,
  message,
  Space,
  Input,
} from "antd";
import {
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  getPendingUsers,
  approveUser,
  rejectUser,
  updateRegistrationStatus,
  getRegistrationStatus,
} from "../../../services/systemConfig";

const { confirm } = Modal;

const RegistrationManagement = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  useEffect(() => {
    fetchRegistrationStatus();
    fetchPendingUsers();
  }, []);

  const fetchRegistrationStatus = async () => {
    try {
      setStatusLoading(true);
      const response = await getRegistrationStatus();
      setRegistrationOpen(response.isOpen);
      setRegistrationMessage(response.message || "");
    } catch (error) {
      message.error("Failed to fetch registration status");
      console.error("Error:", error);
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const users = await getPendingUsers();
      setPendingUsers(users);
    } catch (error) {
      message.error("Failed to fetch pending users");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRegistration = async (checked) => {
    try {
      setStatusLoading(true);
      await updateRegistrationStatus(checked, registrationMessage);
      setRegistrationOpen(checked);
      message.success(`Registration is now ${checked ? "open" : "closed"}`);
    } catch (error) {
      message.error("Failed to update registration status");
      console.error("Error:", error);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleRegistrationMessageChange = (e) => {
    setRegistrationMessage(e.target.value);
  };

  const handleSaveMessage = async () => {
    try {
      setStatusLoading(true);
      await updateRegistrationStatus(registrationOpen, registrationMessage);
      message.success("Registration message updated successfully");
    } catch (error) {
      message.error("Failed to update registration message");
      console.error("Error:", error);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleApproveUser = (userId) => {
    confirm({
      title: "Are you sure you want to approve this user?",
      icon: <CheckCircleOutlined style={{ color: "green" }} />,

      content: "This will give the user access to the system.",
      okText: "Yes",
      okType: "primary",
      cancelText: "No",
      async onOk() {
        try {
          await approveUser(userId);
          message.success("User approved successfully");
          fetchPendingUsers(); 
        } catch (error) {
          message.error("Failed to approve user");
          console.error("Error:", error);
        }
      },
    });
  };

  const handleRejectUser = (userId) => {
    confirm({
      title: "Are you sure you want to reject this user?",
      icon: <ExclamationCircleOutlined style={{ color: "red" }} />,

      content: "This action cannot be undone.",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      async onOk() {
        try {
          await rejectUser(userId);
          message.success("User rejected successfully");
          fetchPendingUsers(); 
        } catch (error) {
          message.error("Failed to reject user");
          console.error("Error:", error);
        }
      },
    });
  };

  const columns = [
    {
      title: "User",
      dataIndex: "username",
      key: "username",
      render: (text, record) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          {record.avatar ? (
            <img
              src={record.avatar}
              alt={text}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                marginRight: 8,
              }}
            />
          ) : (
            <UserOutlined style={{ fontSize: 18, marginRight: 8 }} />
          )}
          <div>
            <div>{text}</div>
            <div style={{ fontSize: "12px", color: "rgba(0, 0, 0, 0.45)" }}>
              {record.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "fullName",
    },
    {
      title: "Registered At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: "Status",
      key: "status",
      render: () => <Badge status="warning" text="Pending Approval" />,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleApproveUser(record._id)}
          >
            Approve
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => handleRejectUser(record._id)}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-4">Registration Management</h1>
        <Card className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Registration Status</h3>
              <p className="text-gray-500">
                When registration is open, new users can sign up for an account.
                All registrations still require admin approval.
              </p>
            </div>
            <div className="flex items-center">
              <span className="mr-3">
                {registrationOpen ? "Open" : "Closed"}
              </span>
              <Tooltip
                title={
                  registrationOpen
                    ? "Click to close registration"
                    : "Click to open registration"
                }
              >
                <Switch
                  checked={registrationOpen}
                  onChange={handleToggleRegistration}
                  loading={statusLoading}
                />
              </Tooltip>
            </div>
          </div>
          <div className="mt-4">
            <Input.TextArea
              value={registrationMessage}
              onChange={handleRegistrationMessageChange}
              placeholder="Enter registration message"
              rows={4}
            />

            <Button
              type="primary"
              onClick={handleSaveMessage}
              loading={statusLoading}
              className="mt-2"
            >
              Save Message
            </Button>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Pending Users</h2>
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-gray-500">
              {pendingUsers.length}{" "}
              {pendingUsers.length === 1 ? "user" : "users"} waiting for
              approval
            </span>
          </div>
          <Button type="primary" onClick={fetchPendingUsers} loading={loading}>
            Refresh
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={pendingUsers}
          rowKey="_id"
          loading={loading}
          locale={{ emptyText: "No pending users" }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
          }}
        />
      </div>
    </div>
  );
};

export default RegistrationManagement;
