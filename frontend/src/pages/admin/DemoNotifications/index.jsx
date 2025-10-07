import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Table,
  Space,
  Switch,
  Tag,
  message,
  Modal,
  Popconfirm,
  Select,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  getAllDemoNotifications,
  createDemoNotification,
  updateDemoNotification,
  deleteDemoNotification,
} from "../../../services/demoNotificationService";

const { TextArea } = Input;

const DemoNotificationsAdmin = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  
  useEffect(() => {
    fetchNotifications();
  }, []);

  
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await getAllDemoNotifications();
      if (response.success) {
        setNotifications(response.data);
        setPagination({
          ...pagination,
          total: response.pagination?.total || response.data.length,
        });
      }
    } catch (error) {
      message.error("Không thể tải danh sách thông báo");
    } finally {
      setLoading(false);
    }
  };

  
  const showCreateModal = () => {
    setEditingNotification(null);
    form.resetFields();
    form.setFieldsValue({
      status: "info",
      showToAllPending: true,
      isActive: true,
    });
    setModalVisible(true);
  };

  
  const showEditModal = (record) => {
    setEditingNotification(record);
    form.setFieldsValue({
      title: record.title,
      content: record.content,
      status: record.status,
      showToAllPending: record.showToAllPending,
      isActive: record.isActive || true,
    });
    setModalVisible(true);
  };

  
  const handleSubmit = async (values) => {
    try {
      if (editingNotification) {
        
        await updateDemoNotification(editingNotification._id, values);
        message.success("Cập nhật thông báo thành công");
      } else {
        
        await createDemoNotification(values);
        message.success("Tạo thông báo mới thành công");
      }
      setModalVisible(false);
      fetchNotifications();
    } catch (error) {
      message.error(
        editingNotification
          ? "Không thể cập nhật thông báo"
          : "Không thể tạo thông báo mới",
      );
    }
  };

  
  const handleDelete = async (id) => {
    try {
      await deleteDemoNotification(id);
      message.success("Xóa thông báo thành công");
      fetchNotifications();
    } catch (error) {
      message.error("Không thể xóa thông báo");
    }
  };

  
  const columns = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Nội dung",
      dataIndex: "content",
      key: "content",
      ellipsis: true,
      render: (text) => <span>{text}</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        if (!status) {
          return <Tag color="default">KHÔNG XÁC ĐỊNH</Tag>;
        }

        let color = "blue";
        if (status === "success") color = "green";
        if (status === "warning") color = "orange";
        if (status === "error") color = "red";
        if (status === "update") color = "purple";
        if (status === "pending") color = "gold";

        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Hiển thị cho tất cả",
      dataIndex: "showToAllPending",
      key: "showToAllPending",
      render: (showToAllPending) => (
        <Tag color={showToAllPending ? "green" : "orange"}>
          {showToAllPending ? "Có" : "Không"}
        </Tag>
      ),
    },
    {
      title: "Đang hoạt động",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Hoạt động" : "Tạm dừng"}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => showEditModal(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa thông báo này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Có"
            cancelText="Không"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý thông báo trang Demo</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={showCreateModal}
        >
          Thêm thông báo mới
        </Button>
      </div>

      <Table
        dataSource={notifications}
        columns={columns}
        rowKey="_id"
        loading={loading}
        pagination={pagination}
        onChange={(pagination) => setPagination(pagination)}
      />

      <Modal
        title={
          editingNotification ? "Chỉnh sửa thông báo" : "Thêm thông báo mới"
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung"
            rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          >
            <Select>
              <Select.Option value="info">Thông tin</Select.Option>
              <Select.Option value="success">Thành công</Select.Option>
              <Select.Option value="warning">Cảnh báo</Select.Option>
              <Select.Option value="error">Lỗi</Select.Option>
              <Select.Option value="update">Cập nhật</Select.Option>
              <Select.Option value="pending">Chờ xử lý</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="showToAllPending"
            label="Hiển thị cho tất cả người dùng chờ duyệt"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Đang hoạt động"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex justify-end space-x-2">
              <Button onClick={() => setModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                {editingNotification ? "Cập nhật" : "Tạo mới"}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DemoNotificationsAdmin;
