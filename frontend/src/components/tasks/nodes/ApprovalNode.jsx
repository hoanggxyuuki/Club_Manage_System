import React, { useState } from "react";
import { Handle } from "reactflow";
import { CheckCircleOutlined, SettingOutlined } from "@ant-design/icons";
import { Modal, Form, Input, Select, Avatar, Typography } from "antd";

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const ApprovalNode = ({ id, data }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [form] = Form.useForm();

  const handleConfigClick = () => {
    form.setFieldsValue({
      approvalTitle: data.approvalTitle || "Yêu cầu phê duyệt",
      approvalDescription: data.approvalDescription || "",
      approvers: data.approvers || [],
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

  return (
    <>
      <div
        className="approval-node border rounded p-3 shadow-md min-w-[220px]"
        style={{ backgroundColor: "#faf5ff", borderColor: "#d8b4fe" }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <CheckCircleOutlined className="text-purple-500 text-lg mr-2" />

            <div className="font-medium text-gray-800">Phê Duyệt</div>
          </div>
          <button
            onClick={handleConfigClick}
            className="text-gray-500 hover:text-purple-500 transition-colors"
          >
            <SettingOutlined />
          </button>
        </div>

        <div className="bg-white p-2 rounded border border-purple-100 mb-3">
          <div
            className="font-medium text-sm truncate"
            title={data.approvalTitle || "Chưa có tiêu đề"}
          >
            {data.approvalTitle || "Chưa có tiêu đề"}
          </div>
          <div
            className="text-xs text-gray-500 line-clamp-2"
            title={data.approvalDescription || "Chưa có mô tả"}
          >
            {data.approvalDescription || "Chưa có mô tả"}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="bg-purple-100 py-1 px-2 rounded-full text-xs font-medium text-purple-600 inline-block">
            {data.approvers?.length || 0} người phê duyệt
          </div>
        </div>

        <div className="mt-3 flex justify-between text-xs">
          <div className="text-green-500 flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
            Đồng ý
          </div>
          <div className="text-red-500 flex items-center">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
            Từ chối
          </div>
        </div>

        {/* Handles for connecting to other nodes */}
        <Handle
          type="target"
          position="top"
          style={{ background: "#d8b4fe", width: "10px", height: "10px" }}
        />

        <Handle
          type="source"
          position="bottom"
          id="approval-yes"
          style={{
            background: "#22c55e",
            width: "10px",
            height: "10px",
            left: "30%",
          }}
        />

        <Handle
          type="source"
          position="bottom"
          id="approval-no"
          style={{
            background: "#ef4444",
            width: "10px",
            height: "10px",
            left: "70%",
          }}
        />
      </div>

      <Modal
        title="Cấu hình yêu cầu phê duyệt"
        open={showConfig}
        onCancel={handleCancel}
        onOk={form.submit}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            approvalTitle: data.approvalTitle || "Yêu cầu phê duyệt",
            approvalDescription: data.approvalDescription || "",
            approvers: data.approvers || [],
          }}
        >
          <Form.Item
            name="approvalTitle"
            label="Tiêu đề yêu cầu phê duyệt"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input placeholder="Nhập tiêu đề yêu cầu phê duyệt" />
          </Form.Item>

          <Form.Item
            name="approvalDescription"
            label="Mô tả chi tiết yêu cầu"
            rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
          >
            <TextArea
              rows={4}
              placeholder="Nhập mô tả chi tiết về yêu cầu phê duyệt"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="approvers"
            label="Người phê duyệt"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn ít nhất một người phê duyệt",
              },
            ]}
            extra="Chỉ các quản lý nhóm mới có thể phê duyệt"
          >
            <Select
              mode="multiple"
              placeholder="Chọn người phê duyệt"
              optionLabelProp="label"
            >
              {data.members
                ?.filter(
                  (member) =>
                    member.role === "leader" || member.role === "owner",
                )
                .map((member) => (
                  <Option
                    key={member.userId._id}
                    value={member.userId._id}
                    label={member.userId.username}
                  >
                    <div className="flex items-center">
                      <Avatar
                        size="small"
                        style={{
                          backgroundColor: "#722ed1",
                          marginRight: "8px",
                        }}
                      >
                        {member.userId.username[0].toUpperCase()}
                      </Avatar>
                      <span>{member.userId.username}</span>
                      <Text type="secondary" style={{ marginLeft: 8 }}>
                        ({member.role === "owner" ? "Chủ nhóm" : "Quản lý"})
                      </Text>
                    </div>
                  </Option>
                ))}
            </Select>
          </Form.Item>

          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-xs text-yellow-800 mb-3">
            <div className="font-medium mb-1">Hướng dẫn:</div>
            <ul className="list-disc pl-4">
              <li>
                Luồng "Đồng ý" sẽ được kích hoạt khi ít nhất một người phê duyệt
                chấp nhận yêu cầu
              </li>
              <li>
                Luồng "Từ chối" sẽ được kích hoạt khi tất cả người phê duyệt từ
                chối hoặc hết thời gian chờ
              </li>
            </ul>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default ApprovalNode;
