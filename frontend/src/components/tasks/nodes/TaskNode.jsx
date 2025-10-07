import React, { useState, useEffect } from "react";
import { Handle } from "reactflow";
import { AppstoreOutlined, SettingOutlined } from "@ant-design/icons";
import { Modal, Form, Input, DatePicker, TimePicker, Select } from "antd";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

const TaskNode = ({ id, data }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [form] = Form.useForm();

  const handleConfigClick = () => {
    const formValues = {
      title: data.title || "Tác vụ mới",
      description: data.description || "",
      priority: data.priority || "medium",
      assignedTo: data.assignedTo || [],
      dueDate: data.dueDate ? dayjs(data.dueDate) : null,
      dueTime: data.dueDate ? dayjs(data.dueDate) : null,
    };

    form.setFieldsValue(formValues);
    setShowConfig(true);
  };

  const handleCancel = () => {
    setShowConfig(false);
  };

  const handleSubmit = () => {
    const values = form.getFieldsValue();

    
    let taskDate = values.dueDate?.clone();
    if (taskDate && values.dueTime) {
      taskDate = taskDate
        .hour(values.dueTime.hour())
        .minute(values.dueTime.minute())
        .second(0);
    }

    const updatedData = {
      ...values,
      dueDate: taskDate ? taskDate.toDate() : null,
    };

    
    data.updateNodeData(id, updatedData);
    setShowConfig(false);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "#10b981",
      medium: "#f59e0b",
      high: "#ef4444",
    };
    return colors[priority] || colors.medium;
  };

  const getPriorityText = (priority) => {
    const texts = {
      low: "Thấp",
      medium: "Trung bình",
      high: "Cao",
    };
    return texts[priority] || priority;
  };

  
  const getAssignedMembers = () => {
    if (!data.members || !data.assignedTo || data.assignedTo.length === 0) {
      return "";
    }

    const assignedMemberNames = data.members
      .filter((member) => data.assignedTo.includes(member.userId._id))
      .map((member) => member.userId.username || member.userId.fullName)
      .join(", ");

    return assignedMemberNames || "";
  };

  return (
    <>
      <div
        className="task-node border rounded p-3 shadow-md min-w-[200px]"
        style={{ backgroundColor: "#f0fdf4", borderColor: "#86efac" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AppstoreOutlined className="text-green-600 text-lg mr-2" />

            <div className="font-medium text-gray-800">
              {data.title || "Tác vụ mới"}
            </div>
          </div>
          <button
            onClick={handleConfigClick}
            className="text-gray-500 hover:text-blue-500 transition-colors"
          >
            <SettingOutlined />
          </button>
        </div>

        {data.description && (
          <div className="text-xs text-gray-600 mt-1 max-h-20 overflow-hidden">
            {data.description}
          </div>
        )}

        {data.priority && (
          <div className="mt-2 flex items-center">
            <div
              className="w-2 h-2 rounded-full mr-1"
              style={{ backgroundColor: getPriorityColor(data.priority) }}
            />

            <span className="text-xs capitalize">
              {getPriorityText(data.priority)}
            </span>
          </div>
        )}

        {data.assignedTo && data.assignedTo.length > 0 && (
          <div className="text-xs text-gray-600 mt-1">
            Người nhận: {getAssignedMembers()}
          </div>
        )}

        {data.dueDate && (
          <div className="text-xs text-gray-500 mt-1">
            Hạn: {dayjs(data.dueDate).format("DD/MM/YYYY HH:mm")}
          </div>
        )}

        {/* Handles for connecting to other nodes */}
        <Handle
          type="target"
          position="top"
          style={{ background: "#86efac", width: "10px", height: "10px" }}
        />

        <Handle
          type="source"
          position="bottom"
          style={{ background: "#86efac", width: "10px", height: "10px" }}
        />
      </div>

      <Modal
        title="Cấu hình tác vụ"
        open={showConfig}
        onCancel={handleCancel}
        onOk={form.submit}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            title: data.title || "Tác vụ mới",
            description: data.description || "",
            priority: data.priority || "medium",
            assignedTo: data.assignedTo || [],
          }}
        >
          <Form.Item
            name="title"
            label="Tiêu đề tác vụ"
            rules={[
              { required: true, message: "Vui lòng nhập tiêu đề tác vụ" },
            ]}
          >
            <Input placeholder="Nhập tiêu đề tác vụ" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <TextArea placeholder="Nhập mô tả tác vụ" rows={4} />
          </Form.Item>

          {/* Chọn thành viên nhận tác vụ */}
          <Form.Item
            name="assignedTo"
            label="Giao cho"
            rules={[{ required: true, message: "Vui lòng chọn thành viên" }]}
          >
            <Select
              mode="multiple"
              placeholder="Chọn thành viên"
              disabled={!data.members || data.members.length === 0}
            >
              {data.members &&
                data.members.map((member) => (
                  <Option key={member.userId._id} value={member.userId._id}>
                    {member.userId.username || member.userId.fullName}
                  </Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item name="priority" label="Độ ưu tiên">
            <Select>
              <Option value="low">Thấp</Option>
              <Option value="medium">Trung bình</Option>
              <Option value="high">Cao</Option>
            </Select>
          </Form.Item>

          <div className="flex gap-4">
            <Form.Item
              name="dueDate"
              label="Ngày hạn"
              className="flex-1"
              rules={[{ required: true, message: "Vui lòng chọn ngày hạn" }]}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="dueTime"
              label="Giờ hạn"
              className="flex-1"
              rules={[{ required: true, message: "Vui lòng chọn giờ hạn" }]}
            >
              <TimePicker format="HH:mm" style={{ width: "100%" }} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default TaskNode;
