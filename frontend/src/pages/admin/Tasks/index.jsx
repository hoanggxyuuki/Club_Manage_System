import React, { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Progress,
} from "antd";
import { useAuth } from "../../../context/AuthContext";
import {
  getTasks,
  createTask,
  updateTaskProgress,
  deleteTask,
} from "../../../services/task";
import { getMyGroups } from "../../../services/groups";
import { getMemberList as getMembers } from "../../../services/api";
import dayjs from "dayjs";

const TasksAdminPage = () => {
  const [tasks, setTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form] = Form.useForm();
  const { user } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksData, groupsData, membersData] = await Promise.all([
        getTasks(),
        getMyGroups(),
        getMembers(),
      ]);
      setTasks(tasksData);
      setGroups(groupsData);
      setMembers(membersData);
    } catch (error) {
      message.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (values) => {
    try {
      await createTask({
        ...values,
        dueDate: values.dueDate.toISOString(),
      });
      message.success("Tạo công việc thành công");
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error("Không thể tạo công việc");
    }
  };

  const handleUpdate = async (values) => {
    try {
      await updateTaskProgress(editingTask._id, {
        ...values,
        dueDate: values.dueDate.toISOString(),
      });
      message.success("Cập nhật công việc thành công");
      setModalVisible(false);
      setEditingTask(null);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error("Không thể cập nhật công việc");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      message.success("Xóa công việc thành công");
      fetchData();
    } catch (error) {
      message.error("Không thể xóa công việc");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "blue",
      inProgress: "orange",
      completed: "green",
      expired: "red",
    };
    return colors[status] || "default";
  };

  const columns = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div className="text-sm text-gray-500">
            Nhóm: {record.groupId?.name}
          </div>
        </div>
      ),
    },
    {
      title: "Người thực hiện",
      dataIndex: "assignedTo",
      key: "assignedTo",
      render: (assignedTo) => (
        <Space>
          {assignedTo?.map((member) => (
            <Tag key={member._id}>{member.username}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Hạn",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status === "pending"
            ? "Chờ xử lý"
            : status === "inProgress"
              ? "Đang thực hiện"
              : status === "completed"
                ? "Hoàn thành"
                : status === "expired"
                  ? "Hết hạn"
                  : status}
        </Tag>
      ),
    },
    {
      title: "Tiến độ",
      key: "progress",
      render: (_, record) => (
        <Progress percent={record.progress} size="small" />
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            onClick={() => {
              setEditingTask(record);
              form.setFieldsValue({
                ...record,
                dueDate: dayjs(record.dueDate),
                groupId: record.groupId?._id,
                assignedTo: record.assignedTo?.map((m) => m._id),
              });
              setModalVisible(true);
            }}
          >
            Sửa
          </Button>
          <Button danger onClick={() => handleDelete(record._id)}>
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Quản lý công việc</h1>
        <Button
          type="primary"
          onClick={() => {
            setEditingTask(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          Tạo công việc mới
        </Button>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={tasks}
        rowKey="_id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} công việc`,
        }}
      />

      <Modal
        title={editingTask ? "Chỉnh sửa công việc" : "Tạo công việc mới"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingTask(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingTask ? handleUpdate : handleCreate}
        >
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea />
          </Form.Item>

          <Form.Item
            name="groupId"
            label="Nhóm"
            rules={[{ required: true, message: "Vui lòng chọn nhóm" }]}
          >
            <Select>
              {groups?.map((group) => (
                <Select.Option key={group._id} value={group._id}>
                  {group.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="assignedTo"
            label="Người thực hiện"
            rules={[
              { required: true, message: "Vui lòng chọn người thực hiện" },
            ]}
          >
            <Select mode="multiple">
              {Array.isArray(members) &&
                members.map((member) => (
                  <Select.Option key={member?._id} value={member?._id}>
                    {member.username}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="dueDate"
            label="Hạn"
            rules={[{ required: true, message: "Vui lòng chọn hạn" }]}
          >
            <DatePicker showTime format="DD/MM/YYYY HH:mm" />
          </Form.Item>

          <Form.Item name="status" label="Trạng thái" initialValue="pending">
            <Select>
              <Select.Option value="pending">Chờ xử lý</Select.Option>
              <Select.Option value="inProgress">Đang thực hiện</Select.Option>
              <Select.Option value="completed">Hoàn thành</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingTask ? "Cập nhật" : "Tạo mới"}
              </Button>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setEditingTask(null);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TasksAdminPage;
