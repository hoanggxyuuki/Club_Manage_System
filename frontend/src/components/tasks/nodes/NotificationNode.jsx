import React, { useState } from "react";
import { Handle } from "reactflow";
import { BellOutlined, SettingOutlined } from "@ant-design/icons";
import { Modal, Form, Input, Select, Avatar } from "antd";

const { Option } = Select;
const { TextArea } = Input;

const NotificationNode = ({ id, data }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [form] = Form.useForm();

  const handleConfigClick = () => {
    form.setFieldsValue({
      title: data.title || "Thông báo mới",
      message: data.message || "",
      notificationType: data.notificationType || "all",
      recipients: data.recipients || [],
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

  
  const getNotificationTypeText = () => {
    const types = {
      all: "Tất cả thành viên",
      specific: `${data.recipients?.length || 0} thành viên được chọn`,
      leader: "Chỉ quản lý nhóm",
    };
    return types[data.notificationType] || "Chưa cấu hình";
  };

  return (
    <>
      <div
        className="notification-node border rounded p-3 shadow-md min-w-[200px]"
        style={{ backgroundColor: "#eff6ff", borderColor: "#93c5fd" }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <BellOutlined className="text-blue-500 text-lg mr-2" />

            <div className="font-medium text-gray-800">Thông Báo</div>
          </div>
          <button
            onClick={handleConfigClick}
            className="text-gray-500 hover:text-blue-500 transition-colors"
          >
            <SettingOutlined />
          </button>
        </div>

        <div className="bg-white p-2 rounded border border-blue-100 mb-3">
          <div
            className="font-medium text-sm truncate"
            title={data.title || "Chưa có tiêu đề"}
          >
            {data.title || "Chưa có tiêu đề"}
          </div>
          <div
            className="text-xs text-gray-500 line-clamp-2"
            title={data.message || "Chưa có nội dung"}
          >
            {data.message || "Chưa có nội dung"}
          </div>
        </div>

        <div className="bg-blue-100 py-1 px-2 rounded-full text-xs font-medium text-blue-600 inline-block">
          {getNotificationTypeText()}
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
          style={{ background: "#93c5fd", width: "10px", height: "10px" }}
        />
      </div>

      <Modal
        title="Cấu hình thông báo"
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
            title: data.title || "Thông báo mới",
            message: data.message || "",
            notificationType: data.notificationType || "all",
            recipients: data.recipients || [],
          }}
        >
          <Form.Item
            name="title"
            label="Tiêu đề thông báo"
            rules={[
              { required: true, message: "Vui lòng nhập tiêu đề thông báo" },
            ]}
          >
            <Input placeholder="Nhập tiêu đề thông báo" />
          </Form.Item>

          <Form.Item
            name="message"
            label="Nội dung thông báo"
            rules={[
              { required: true, message: "Vui lòng nhập nội dung thông báo" },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Nhập nội dung thông báo"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="notificationType"
            label="Gửi đến"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn đối tượng nhận thông báo",
              },
            ]}
          >
            <Select
              onChange={(value) => {
                
                if (value !== "specific") {
                  form.setFieldsValue({ recipients: [] });
                }
              }}
            >
              <Option value="all">Tất cả thành viên nhóm</Option>
              <Option value="specific">Thành viên cụ thể</Option>
              <Option value="leader">Chỉ quản lý nhóm</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.notificationType !== currentValues.notificationType
            }
          >
            {({ getFieldValue }) =>
              getFieldValue("notificationType") === "specific" ? (
                <Form.Item
                  name="recipients"
                  label="Chọn thành viên"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng chọn ít nhất một thành viên",
                    },
                  ]}
                >
                  <Select
                    mode="multiple"
                    placeholder="Chọn thành viên để gửi thông báo"
                    optionLabelProp="label"
                  >
                    {data.members?.map((member) => (
                      <Option
                        key={member.userId._id}
                        value={member.userId._id}
                        label={member.userId.username}
                      >
                        <div className="flex items-center">
                          <Avatar
                            size="small"
                            style={{
                              backgroundColor: "#87d068",
                              marginRight: "8px",
                            }}
                          >
                            {member.userId.username[0].toUpperCase()}
                          </Avatar>
                          {member.userId.username}
                        </div>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default NotificationNode;
