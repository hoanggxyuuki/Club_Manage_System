import React, { useState, useEffect } from "react";
import { Modal, Input, DatePicker, TimePicker, Select } from "antd";
import moment from "moment";
import { useAuth } from "../../../context/AuthContext";
import * as userService from "../../../services/api";

const CreateEvent = ({ visible, onClose, onSubmit, initialData }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    startDate: null,
    endDate: null,
    location: "",
    eventType: "optional",
    managingUnit: {
      name: "",
      description: "",
    },
    supervisors: [],
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await userService.getAllUsers();
        
        const usersList = Array.isArray(data) ? data : data.users || [];
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        description: initialData.description || "",
        location: initialData.location || "",
        startDate: moment(initialData.startDate),
        endDate: moment(initialData.endDate),
        eventType: initialData.eventType || "optional",
        managingUnit: initialData.managingUnit || { name: "", description: "" },
        supervisors: initialData.supervisors || [],
      });
    } else {
      setForm({
        name: "",
        description: "",
        startDate: null,
        endDate: null,
        location: "",
        eventType: "optional",
        managingUnit: { name: "", description: "" },
        supervisors: [],
      });
    }
  }, [initialData]);
  const handleSubmit = async () => {
    setError("");
    
    
    if (!form.name || !form.startDate || !form.endDate) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    
    if (form.name.trim().length < 3) {
      setError("Tên sự kiện phải có ít nhất 3 ký tự");
      return;
    }

    if (form.name.length > 100) {
      setError("Tên sự kiện không được vượt quá 100 ký tự");
      return;
    }

    
    if (!form.location || form.location.trim().length === 0) {
      setError("Vui lòng nhập địa điểm tổ chức");
      return;
    }

    if (form.location.length > 200) {
      setError("Địa điểm không được vượt quá 200 ký tự");
      return;
    }

    
    if (form.description && form.description.length > 1000) {
      setError("Mô tả không được vượt quá 1000 ký tự");
      return;
    }

    
    if (form.endDate && form.startDate && form.endDate.isBefore(form.startDate)) {
      setError("Thời gian kết thúc không thể sớm hơn thời gian bắt đầu");
      return;
    }

    
    if (form.startDate && form.startDate.isBefore(moment())) {
      setError("Thời gian bắt đầu không thể là thời điểm trong quá khứ");
      return;
    }

    
    if (form.managingUnit.name && form.managingUnit.name.trim().length > 0) {
      if (form.managingUnit.name.trim().length < 2) {
        setError("Tên đơn vị quản lý phải có ít nhất 2 ký tự");
        return;
      }
      if (form.managingUnit.name.length > 100) {
        setError("Tên đơn vị quản lý không được vượt quá 100 ký tự");
        return;
      }
    }

    if (form.managingUnit.description && form.managingUnit.description.length > 500) {
      setError("Mô tả đơn vị quản lý không được vượt quá 500 ký tự");
      return;
    }

    
    if (form.supervisors.length > 10) {
      setError("Không thể chọn quá 10 người giám sát");
      return;
    }

    try {
      await onSubmit({
        ...form,
        startDate: form.startDate.toISOString(),
        endDate: form.endDate.toISOString(),
      });
    } catch (error) {
      setError(error.message || "Có lỗi xảy ra khi tạo sự kiện");
    }
  };

  const isEditMode = Boolean(initialData);

  return (
    <Modal
      title={isEditMode ? "Chỉnh sửa" : "Tạo sự kiện mới"}
      open={visible}
      onCancel={() => {
        setError("");
        onClose();
      }}
      onOk={handleSubmit}
      okText={isEditMode ? "Update" : "Create"}
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên sự kiện *
          </label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nhập tên sự kiện"
            maxLength={100}
            showCount
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả
          </label>
          <Input.TextArea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Nhập mô tả"
            rows={4}
            maxLength={1000}
            showCount
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Địa điểm *
          </label>
          <Input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Nhập địa điểm"
            maxLength={200}
            showCount
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Loại sự kiện
          </label>
          <Select
            value={form.eventType}
            onChange={(value) => setForm({ ...form, eventType: value })}
            className="w-full"
          >
            <Select.Option value="optional">Tùy chọn tham gia</Select.Option>
            <Select.Option value="required">Bắt buộc tham gia</Select.Option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Đơn vị quản lý
          </label>
          <Input
            value={form.managingUnit.name}
            onChange={(e) =>
              setForm({
                ...form,
                managingUnit: { ...form.managingUnit, name: e.target.value },
              })
            }
            placeholder="Tên đơn vị quản lý"
            className="mb-2"
            maxLength={100}
            showCount
          />

          <Input.TextArea
            value={form.managingUnit.description}
            onChange={(e) =>
              setForm({
                ...form,
                managingUnit: {
                  ...form.managingUnit,
                  description: e.target.value,
                },
              })
            }
            placeholder="Mô tả đơn vị quản lý"
            rows={2}
            maxLength={500}
            showCount
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Người giám sát
          </label>
          <Select
            mode="multiple"
            value={form.supervisors.map((s) => s.userId)}
            onChange={(values) => {
              const supervisors = values.map((userId) => ({
                userId,
                role: "supervisor",
              }));
              setForm({ ...form, supervisors });
            }}
            className="w-full"
            placeholder="Chọn người giám sát"
          >
            {users.map((user) => (
              <Select.Option key={user._id} value={user._id}>
                {user.username}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày bắt đầu *
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <DatePicker
                value={form.startDate}
                onChange={(date) => {
                  const currentTime = form.startDate
                    ? form.startDate
                    : moment();
                  const newDate = date
                    ? date.hour(currentTime.hour()).minute(currentTime.minute())
                    : null;
                  setForm({ ...form, startDate: newDate });
                }}
                className="w-full"
                format="DD/MM/YYYY"
                disabledDate={(current) => {
                  return current && current < moment().startOf("day");
                }}
              />

              <TimePicker
                value={form.startDate}
                onChange={(time) => {
                  if (time && form.startDate) {
                    const newDate = form.startDate
                      .clone()
                      .hour(time.hour())
                      .minute(time.minute());
                    setForm({ ...form, startDate: newDate });
                  }
                }}
                format="HH:mm"
                className="w-full sm:w-32"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày kết thúc *
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <DatePicker
                value={form.endDate}
                onChange={(date) => {
                  const currentTime = form.endDate ? form.endDate : moment();
                  const newDate = date
                    ? date.hour(currentTime.hour()).minute(currentTime.minute())
                    : null;
                  setForm({ ...form, endDate: newDate });
                }}
                className="w-full"
                format="DD/MM/YYYY"
                disabledDate={(current) => {
                  if (!form.startDate || !current) return false;
                  return current.startOf("day") < form.startDate.startOf("day");
                }}
              />

              <TimePicker
                value={form.endDate}
                onChange={(time) => {
                  if (time && form.endDate) {
                    const newDate = form.endDate
                      .clone()
                      .hour(time.hour())
                      .minute(time.minute());
                    setForm({ ...form, endDate: newDate });
                  }
                }}
                format="HH:mm"
                className="w-full sm:w-32"
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CreateEvent;
