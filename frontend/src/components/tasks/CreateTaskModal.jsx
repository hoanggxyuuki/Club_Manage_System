import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  message,
} from "antd";
import { createTask } from "../../services/task";
import { getMyGroups } from "../../services/groups";
import { useAuth } from "../../context/AuthContext";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

const CreateTaskModal = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [currentMembers, setCurrentMembers] = useState([]);

  useEffect(() => {
    if (visible) {
      fetchGroups();
    }
    return () => {
      form.resetFields();
      setSelectedGroup(null);
      setCurrentMembers([]);
    };
  }, [visible, form]);

  const fetchGroups = async () => {
    try {
      const myGroups = await getMyGroups();

      
      const leaderGroups = myGroups.filter((group) =>
        group.members.some(
          (m) =>
            m.userId._id === user._id &&
            (m.role === "leader" || m.role === "owner"),
        ),
      );
      setGroups(myGroups);
    } catch (error) {
      message.error("Không thể tải danh sách nhóm");
    }
  };

  const handleGroupChange = (groupId) => {
    setSelectedGroup(groupId);
    const group = groups.find((g) => g._id === groupId);
    if (group) {
      
      const regularMembers = group.members.filter((m) => m.role === "member");
      setCurrentMembers(regularMembers);
      form.setFieldsValue({ assignedTo: [] });
    } else {
      setCurrentMembers([]);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      
      let taskDate = values.dueDate.clone();
      if (values.dueTime) {
        taskDate = taskDate
          .hour(values.dueTime.hour())
          .minute(values.dueTime.minute())
          .second(0);
      }

      const taskData = {
        ...values,
        dueDate: taskDate.toDate(),
        dueTime: undefined, 
      };

      await createTask(taskData);
      message.success("Tạo công việc thành công");
      form.resetFields();
      onSuccess();
    } catch (error) {
      message.error("Không thể tạo công việc");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Tạo công việc mới"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="groupId"
          label="Chọn nhóm"
          rules={[{ required: true, message: "Vui lòng chọn nhóm" }]}
        >
          <Select placeholder="Chọn nhóm" onChange={handleGroupChange}>
            {groups.map((group) => (
              <Option key={group._id} value={group._id}>
                {group.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="assignedTo"
          label="Giao cho thành viên"
          rules={[{ required: true, message: "Vui lòng chọn thành viên" }]}
        >
          <Select
            mode="multiple"
            placeholder="Chọn thành viên"
            disabled={!selectedGroup}
          >
            {currentMembers.map((member) => (
              <Option
                key={member.userId._id}
                value={member.userId._id}
                label={member.userId.fullName}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <img
                    src={`${import.meta.env.VITE_PROXY_API_URL}${member.userId.avatar}`}
                    alt={`${member.userId.fullName.charAt(0)}`}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      marginRight: 8,
                    }}
                  />

                  <span>{member.userId.fullName}</span>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="title"
          label="Tiêu đề"
          rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
        >
          <Input placeholder="Nhập tiêu đề công việc" />
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <TextArea placeholder="Nhập mô tả công việc" rows={4} />
        </Form.Item>

        <Form.Item name="priority" label="Độ ưu tiên" initialValue="medium">
          <Select>
            <Option value="low">Thấp</Option>
            <Option value="medium">Trung bình</Option>
            <Option value="high">Cao</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="dueDate"
          label="Ngày hoàn thành"
          rules={[{ required: true, message: "Vui lòng chọn ngày hoàn thành" }]}
        >
          <DatePicker
            format="DD/MM/YYYY"
            placeholder="Chọn ngày"
            disabledDate={(current) =>
              current && current < dayjs().startOf("day")
            }
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          name="dueTime"
          label="Giờ hoàn thành"
          rules={[{ required: true, message: "Vui lòng chọn giờ hoàn thành" }]}
        >
          <TimePicker
            format="HH:mm"
            placeholder="Chọn giờ"
            style={{ width: "100%" }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateTaskModal;
