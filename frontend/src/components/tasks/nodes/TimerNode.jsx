import React, { useState } from "react";
import { Handle } from "reactflow";
import { ClockCircleOutlined, SettingOutlined } from "@ant-design/icons";
import { Modal, Form, InputNumber, Select } from "antd";

const { Option } = Select;

const TimerNode = ({ id, data }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [form] = Form.useForm();

  const handleConfigClick = () => {
    form.setFieldsValue({
      duration: data.duration || 1,
      durationUnit: data.durationUnit || "hours",
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

  const getDurationText = () => {
    const duration = data.duration || 1;
    const unit = data.durationUnit || "hours";

    switch (unit) {
      case "minutes":
        return `${duration} phút`;
      case "hours":
        return `${duration} giờ`;
      case "days":
        return `${duration} ngày`;
      default:
        return `${duration} giờ`;
    }
  };

  return (
    <>
      <div
        className="timer-node border rounded p-3 shadow-md min-w-[180px]"
        style={{ backgroundColor: "#f0f9ff", borderColor: "#93c5fd" }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <ClockCircleOutlined className="text-blue-500 text-lg mr-2" />

            <div className="font-medium text-gray-800">Hẹn giờ</div>
          </div>
          <button
            onClick={handleConfigClick}
            className="text-gray-500 hover:text-blue-500 transition-colors"
          >
            <SettingOutlined />
          </button>
        </div>

        <div className="flex justify-center items-center bg-white p-2 rounded border border-blue-100 min-h-[60px]">
          <div className="text-center">
            <div className="text-2xl font-semibold text-blue-600">
              {getDurationText()}
            </div>
            <div className="text-xs text-gray-500">Thời gian chờ</div>
          </div>
        </div>

        <div className="flex justify-center items-center mt-3">
          <div className="bg-blue-100 py-1 px-3 rounded-full text-xs font-medium text-blue-600">
            Tự động kích hoạt sau {getDurationText()}
          </div>
        </div>

        {/* Handles for connecting to other nodes */}
        <Handle
          type="target"
          position="top"
          style={{ background: "#93c5fd", width: "10px", height: "10px" }}
        />

        <Handle
          type="source"
          position="bottom"
          style={{ background: "#3b82f6", width: "10px", height: "10px" }}
        />
      </div>

      <Modal
        title="Cấu hình thời gian chờ"
        open={showConfig}
        onCancel={handleCancel}
        onOk={form.submit}
        width={400}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            duration: data.duration || 1,
            durationUnit: data.durationUnit || "hours",
          }}
        >
          <div className="flex gap-4">
            <Form.Item
              name="duration"
              label="Thời lượng"
              rules={[
                { required: true, message: "Vui lòng nhập thời lượng" },
                {
                  type: "number",
                  min: 1,
                  message: "Thời lượng phải lớn hơn 0",
                },
              ]}
              className="flex-1"
            >
              <InputNumber
                min={1}
                max={1000}
                className="w-full"
                placeholder="Nhập thời lượng"
              />
            </Form.Item>

            <Form.Item
              name="durationUnit"
              label="Đơn vị"
              rules={[{ required: true, message: "Vui lòng chọn đơn vị" }]}
              className="flex-1"
            >
              <Select placeholder="Chọn đơn vị">
                <Option value="minutes">Phút</Option>
                <Option value="hours">Giờ</Option>
                <Option value="days">Ngày</Option>
              </Select>
            </Form.Item>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800">
            <div className="font-medium mb-1">Lưu ý:</div>
            <ul className="list-disc pl-4">
              <li>
                Node sẽ chờ đủ thời gian đã cấu hình trước khi kích hoạt node
                tiếp theo
              </li>
              <li>Chức năng hẹn giờ chỉ hoạt động khi quy trình đang chạy</li>
            </ul>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default TimerNode;
