import React, { useState } from "react";
import { Handle } from "reactflow";
import { BranchesOutlined, SettingOutlined } from "@ant-design/icons";
import { Modal, Form, Select, Input } from "antd";

const { Option } = Select;

const ConditionNode = ({ id, data }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [form] = Form.useForm();

  const handleConfigClick = () => {
    form.setFieldsValue({
      condition: data.condition || "priority",
      value: data.value || "high",
      customValue: data.customValue || "",
    });
    setShowConfig(true);
  };

  const handleCancel = () => {
    setShowConfig(false);
  };

  const handleSubmit = () => {
    const values = form.getFieldsValue();

    
    data.updateNodeData(id, values);
    setShowConfig(false);
  };

  const getConditionLabel = () => {
    const conditionMap = {
      priority: "Độ ưu tiên",
      status: "Trạng thái",
      assignedTo: "Giao cho",
      dueDate: "Ngày hạn",
    };

    return conditionMap[data.condition] || "Điều kiện";
  };

  const getValueDisplay = () => {
    if (data.condition === "priority") {
      const priorityMap = {
        high: "Cao",
        medium: "Trung bình",
        low: "Thấp",
      };
      return priorityMap[data.value] || data.value;
    } else if (data.condition === "status") {
      const statusMap = {
        pending: "Chờ xử lý",
        in_progress: "Đang thực hiện",
        completed: "Hoàn thành",
        awaiting_confirmation: "Chờ xác nhận",
      };
      return statusMap[data.value] || data.value;
    } else if (data.condition === "dueDate") {
      return data.value === "overdue" ? "Quá hạn" : "Chưa hết hạn";
    } else if (data.condition === "assignedTo") {
      return data.customValue || "Bất kỳ thành viên";
    }

    return data.value;
  };

  return (
    <>
      <div
        className="condition-node border rounded p-3 shadow-md min-w-[200px]"
        style={{ backgroundColor: "#fefce8", borderColor: "#fde047" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BranchesOutlined className="text-yellow-600 text-lg mr-2" />

            <div className="font-medium text-gray-800">Điều kiện</div>
          </div>
          <button
            onClick={handleConfigClick}
            className="text-gray-500 hover:text-blue-500 transition-colors"
          >
            <SettingOutlined />
          </button>
        </div>

        <div className="text-xs text-gray-600 mt-2">
          <div className="font-medium">{getConditionLabel()}:</div>
          <div className="mt-1 p-1 bg-yellow-50 border border-yellow-200 rounded">
            {getValueDisplay()}
          </div>
        </div>

        {/* Handles for connecting to other nodes */}
        <Handle
          type="target"
          position="top"
          style={{ background: "#fde047", width: "10px", height: "10px" }}
        />

        {/* True condition path */}
        <div className="absolute -bottom-5 -left-8 text-xs text-green-600">
          Đúng
        </div>
        <Handle
          type="source"
          position="bottom"
          id="true"
          style={{
            background: "#86efac",
            width: "10px",
            height: "10px",
            left: "30%",
          }}
        />

        {/* False condition path */}
        <div className="absolute -bottom-5 -right-8 text-xs text-red-600">
          Sai
        </div>
        <Handle
          type="source"
          position="bottom"
          id="false"
          style={{
            background: "#fca5a5",
            width: "10px",
            height: "10px",
            left: "70%",
          }}
        />
      </div>

      <Modal
        title="Cấu hình điều kiện"
        open={showConfig}
        onCancel={handleCancel}
        onOk={form.submit}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            condition: data.condition || "priority",
            value: data.value || "high",
            customValue: data.customValue || "",
          }}
        >
          <Form.Item name="condition" label="Loại điều kiện">
            <Select>
              <Option value="priority">Độ ưu tiên tác vụ</Option>
              <Option value="status">Trạng thái tác vụ</Option>
              <Option value="dueDate">Ngày hạn</Option>
              <Option value="assignedTo">Giao cho</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.condition !== currentValues.condition
            }
          >
            {({ getFieldValue }) => {
              const conditionType = getFieldValue("condition");

              if (conditionType === "priority") {
                return (
                  <Form.Item name="value" label="Giá trị độ ưu tiên">
                    <Select>
                      <Option value="high">Cao</Option>
                      <Option value="medium">Trung bình</Option>
                      <Option value="low">Thấp</Option>
                    </Select>
                  </Form.Item>
                );
              } else if (conditionType === "status") {
                return (
                  <Form.Item name="value" label="Giá trị trạng thái">
                    <Select>
                      <Option value="pending">Chờ xử lý</Option>
                      <Option value="in_progress">Đang thực hiện</Option>
                      <Option value="completed">Hoàn thành</Option>
                      <Option value="awaiting_confirmation">
                        Chờ xác nhận
                      </Option>
                    </Select>
                  </Form.Item>
                );
              } else if (conditionType === "dueDate") {
                return (
                  <Form.Item name="value" label="Điều kiện ngày">
                    <Select>
                      <Option value="overdue">Quá hạn</Option>
                      <Option value="not_overdue">Chưa hết hạn</Option>
                    </Select>
                  </Form.Item>
                );
              } else if (conditionType === "assignedTo") {
                return (
                  <Form.Item
                    name="customValue"
                    label="ID người dùng (để trống nếu bất kỳ)"
                  >
                    <Input placeholder="Nhập ID người dùng" />
                  </Form.Item>
                );
              }

              return null;
            }}
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ConditionNode;
