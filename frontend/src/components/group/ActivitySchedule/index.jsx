import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  getGroupSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  joinSchedule,
  updateAttendeeStatus,
  getAttendanceStats,
} from "../../../services/activitySchedule";
import {
  Button,
  Modal,
  Form,
  Table,
  Space,
  message,
  Input,
  DatePicker,
  Select,
  Badge,
  Tooltip,
  Popconfirm,
  Tag,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  UserAddOutlined,
  CheckOutlined,
  CloseOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useMediaQuery } from "react-responsive";

const ActivitySchedule = ({ groupId, isLeader }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [form] = Form.useForm();
  const { user } = useAuth();

  
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });

  
  const fetchAttendanceStats = async (scheduleId) => {
    try {
      const stats = await getAttendanceStats(scheduleId);
      setAttendanceStats(stats);
    } catch (error) {
      message.error("Không thể tải thông tin điểm danh");
    }
  };

  const handleJoin = async (scheduleId) => {
    try {
      await joinSchedule(scheduleId);
      message.success("Đã tham gia lịch sinh hoạt thành công");
      setSchedules((prevSchedules) =>
        prevSchedules.map((schedule) => {
          if (schedule._id === scheduleId) {
            return {
              ...schedule,
              attendees: [
                ...(schedule.attendees || []),
                {
                  userId: {
                    _id: user._id,
                    username: user.username,
                  },
                  status: "pending",
                  joinedAt: new Date().toISOString(),
                  _id: user._id,
                  username: user.username,
                },
              ],
            };
          }
          return schedule;
        }),
      );
      fetchSchedules();
    } catch (error) {
      message.error(error.message || "Không thể tham gia lịch sinh hoạt");
    }
  };

  const handleUpdateAttendance = async (scheduleId, userId, status) => {
    try {
      await updateAttendeeStatus(scheduleId, userId, { status });
      message.success("Đã cập nhật trạng thái điểm danh");

      if (selectedSchedule?._id === scheduleId) {
        const updatedSchedule = JSON.parse(JSON.stringify(selectedSchedule));
        const attendeeIndex = updatedSchedule.attendees.findIndex(
          (a) => a.userId._id === userId._id,
        );
        if (attendeeIndex !== -1) {
          updatedSchedule.attendees[attendeeIndex].status = status;
          if (status === "attended") {
            updatedSchedule.attendees[attendeeIndex].checkedInAt =
              new Date().toISOString();
          }
          setSelectedSchedule(updatedSchedule);
        }
        fetchAttendanceStats(scheduleId);
      }

      setSchedules((prevSchedules) =>
        prevSchedules.map((schedule) => {
          if (schedule._id === scheduleId) {
            const updatedSchedule = { ...schedule };
            const attendeeIndex = updatedSchedule.attendees.findIndex(
              (a) => a.userId._id === userId,
            );
            if (attendeeIndex !== -1) {
              updatedSchedule.attendees[attendeeIndex].status = status;
              if (status === "attended") {
                updatedSchedule.attendees[attendeeIndex].checkedInAt =
                  new Date().toISOString();
              }
            }
            return updatedSchedule;
          }
          return schedule;
        }),
      );
    } catch (error) {
      message.error("Không thể cập nhật trạng thái điểm danh");
    }
  };

  const canJoinSchedule = (schedule) => {
    if (!schedule) return false;
    const isActiveSchedule =
      schedule.status === "upcoming" || schedule.status === "ongoing";
    const isAlreadyJoined = schedule.attendees?.some(
      (a) => a.userId._id === user.userId,
    );
    let isFull = false;
    if (schedule.maxParticipants != null) {
      const confirmedCount =
        schedule.attendees?.filter((a) =>
          ["pending", "attended"].includes(a.status),
        ).length || 0;
      isFull = confirmedCount >= schedule.maxParticipants;
    }
    return isActiveSchedule && !isAlreadyJoined && !isFull;
  };

  const getAttendeeStatus = (schedule) => {
    if (!schedule?.attendees) return null;
    let attendee = schedule.attendees.find(
      (a) => a.userId?._id === user.userId,
    );
    if (!attendee) {
      attendee = schedule.attendees.find((a) => a._id === user.userId);
    }
    return attendee?.status;
  };

  const getStatusColor = (status) => {
    const colors = {
      upcoming: "blue",
      ongoing: "green",
      completed: "gray",
      cancelled: "red",
    };
    return colors[status] || "default";
  };

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const data = await getGroupSchedules(groupId);
      setSchedules(data);
    } catch (error) {
      message.error("Không thể tải lịch sinh hoạt");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchSchedules();
    }
  }, [groupId]);

  const handleCreate = async (values) => {
    try {
      await createSchedule({
        ...values,
        groupId,
        startTime: values.startTime.toISOString(),
        endTime: values.endTime.toISOString(),
      });
      message.success("Tạo lịch sinh hoạt thành công");
      setModalVisible(false);
      form.resetFields();
      fetchSchedules();
    } catch (error) {
      message.error("Không thể tạo lịch sinh hoạt");
    }
  };

  const handleUpdate = async (values) => {
    try {
      await updateSchedule(editingSchedule._id, {
        ...values,
        startTime: values.startTime.toISOString(),
        endTime: values.endTime.toISOString(),
      });
      message.success("Cập nhật lịch sinh hoạt thành công");
      setModalVisible(false);
      setEditingSchedule(null);
      form.resetFields();
      fetchSchedules();
    } catch (error) {
      message.error("Không thể cập nhật lịch sinh hoạt");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSchedule(id);
      message.success("Xóa lịch sinh hoạt thành công");
      fetchSchedules();
    } catch (error) {
      message.error("Không thể xóa lịch sinh hoạt");
    }
  };

  
  const getColumns = () => {
    const baseColumns = [
      {
        title: "Tiêu đề",
        dataIndex: "title",
        key: "title",
        render: (text, record) => (
          <Space direction={isMobile ? "vertical" : "horizontal"} size="small">
            {text}
            <Tag color={getStatusColor(record.status)}>
              {record.status === "upcoming"
                ? "Sắp diễn ra"
                : record.status === "ongoing"
                  ? "Đang diễn ra"
                  : record.status === "completed"
                    ? "Đã kết thúc"
                    : "Đã hủy"}
            </Tag>
          </Space>
        ),
      },
      {
        title: "Tham gia",
        key: "attendance",
        render: (_, record) => {
          const attendeeStatus = getAttendeeStatus(record);
          const statusColors = {
            pending: "orange",
            confirmed: "blue",
            attended: "green",
            absent: "red",
            declined: "gray",
          };

          return (
            <Space
              direction={isMobile ? "vertical" : "horizontal"}
              size="small"
            >
              <Badge count={record.attendees?.length || 0} overflowCount={999}>
                <Button
                  icon={<TeamOutlined />}
                  onClick={() => {
                    setSelectedSchedule(record);
                    fetchAttendanceStats(record._id);
                    setAttendanceModalVisible(true);
                  }}
                  size={isMobile ? "large" : "middle"}
                  style={isMobile ? { width: "100%", marginBottom: "8px" } : {}}
                />
              </Badge>
              {attendeeStatus ? (
                <Tag
                  color={statusColors[attendeeStatus]}
                  style={isMobile ? { width: "100%", textAlign: "center" } : {}}
                >
                  {attendeeStatus === "pending"
                    ? "Chờ xác nhận"
                    : attendeeStatus === "confirmed"
                      ? "Đã xác nhận"
                      : attendeeStatus === "attended"
                        ? "Đã tham gia"
                        : attendeeStatus === "absent"
                          ? "Vắng mặt"
                          : "Từ chối"}
                </Tag>
              ) : canJoinSchedule(record) ? (
                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={() => handleJoin(record._id)}
                  size={isMobile ? "large" : "middle"}
                  style={isMobile ? { width: "100%" } : {}}
                >
                  Tham gia
                </Button>
              ) : (
                <Tag
                  color="red"
                  style={isMobile ? { width: "100%", textAlign: "center" } : {}}
                >
                  Đã đủ người
                </Tag>
              )}
            </Space>
          );
        },
      },
    ];

    
    if (!isMobile) {
      baseColumns.splice(
        1,
        0,
        {
          title: "Thời gian",
          key: "time",
          render: (_, record) => (
            <Space direction="vertical" size="small">
              <div>
                Bắt đầu: {dayjs(record.startTime).format("DD/MM/YYYY HH:mm")}
              </div>
              <div>
                Kết thúc: {dayjs(record.endTime).format("DD/MM/YYYY HH:mm")}
              </div>
            </Space>
          ),
        },
        {
          title: "Địa điểm",
          dataIndex: "location",
          key: "location",
        },
      );
    }

    
    baseColumns.push({
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space
          direction={isMobile ? "vertical" : "horizontal"}
          style={isMobile ? { width: "100%" } : {}}
        >
          {isLeader && (
            <>
              <Button
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingSchedule(record);
                  form.setFieldsValue({
                    ...record,
                    startTime: dayjs(record.startTime),
                    endTime: dayjs(record.endTime),
                  });
                  setModalVisible(true);
                }}
                style={isMobile ? { width: "100%" } : {}}
                size={isMobile ? "large" : "middle"}
              >
                {isMobile && "Chỉnh sửa"}
              </Button>
              <Button
                icon={<DeleteOutlined />}
                danger
                onClick={() => handleDelete(record._id)}
                style={isMobile ? { width: "100%" } : {}}
                size={isMobile ? "large" : "middle"}
              >
                {isMobile && "Xóa"}
              </Button>
            </>
          )}
        </Space>
      ),
    });

    return baseColumns;
  };

  
  const expandableConfig = isMobile
    ? {
        expandedRowRender: (record) => (
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <strong>Thời gian bắt đầu:</strong>
              <br />
              {dayjs(record.startTime).format("DD/MM/YYYY HH:mm")}
            </div>
            <div>
              <strong>Thời gian kết thúc:</strong>
              <br />
              {dayjs(record.endTime).format("DD/MM/YYYY HH:mm")}
            </div>
            <div>
              <strong>Địa điểm:</strong>
              <br />
              {record.location}
            </div>
          </Space>
        ),
      }
    : undefined;

  return (
    <div className="activity-schedule">
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          gap: isMobile ? "12px" : "0",
        }}
      >
        <h2>Lịch sinh hoạt nhóm</h2>
        {isLeader && (
          <Button
            type="primary"
            icon={<CalendarOutlined />}
            onClick={() => {
              setEditingSchedule(null);
              form.resetFields();
              setModalVisible(true);
            }}
            size={isMobile ? "large" : "middle"}
            style={isMobile ? { width: "100%" } : {}}
          >
            Tạo lịch sinh hoạt
          </Button>
        )}
      </div>

      <Table
        loading={loading}
        columns={getColumns()}
        dataSource={schedules}
        rowKey="_id"
        expandable={expandableConfig}
        scroll={{ x: isMobile ? undefined : true }}
        pagination={{
          size: isMobile ? "small" : "default",
          pageSize: isMobile ? 5 : 10,
        }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={
          editingSchedule
            ? "Chỉnh sửa lịch sinh hoạt"
            : "Tạo lịch sinh hoạt mới"
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingSchedule(null);
          form.resetFields();
        }}
        footer={null}
        width={isMobile ? "100%" : 520}
        style={{ top: isMobile ? 0 : 100 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingSchedule ? handleUpdate : handleCreate}
        >
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input size={isMobile ? "large" : "middle"} />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea size={isMobile ? "large" : "middle"} />
          </Form.Item>

          <Form.Item
            name="startTime"
            label="Thời gian bắt đầu"
            rules={[
              { required: true, message: "Vui lòng chọn thời gian bắt đầu" },
            ]}
          >
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              size={isMobile ? "large" : "middle"}
              className="responsive-date-picker"
              inputReadOnly={isMobile}
              popupClassName="date-picker-popup"
            />
          </Form.Item>

          <Form.Item
            name="endTime"
            label="Thời gian kết thúc"
            rules={[
              { required: true, message: "Vui lòng chọn thời gian kết thúc" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (
                    !value ||
                    !getFieldValue("startTime") ||
                    value.isAfter(getFieldValue("startTime"))
                  ) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Thời gian kết thúc phải sau thời gian bắt đầu"),
                  );
                },
              }),
            ]}
          >
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              size={isMobile ? "large" : "middle"}
              className="responsive-date-picker"
              inputReadOnly={isMobile}
              popupClassName="date-picker-popup"
            />
          </Form.Item>

          <Form.Item name="location" label="Địa điểm">
            <Input size={isMobile ? "large" : "middle"} />
          </Form.Item>

          <Form.Item name="maxParticipants" label="Số người tối đa">
            <Input type="number" min={0} size={isMobile ? "large" : "middle"} />
          </Form.Item>

          <Form.Item name="recurringType" label="Lặp lại" initialValue="none">
            <Select size={isMobile ? "large" : "middle"}>
              <Select.Option value="none">Không lặp lại</Select.Option>
              <Select.Option value="daily">Hàng ngày</Select.Option>
              <Select.Option value="weekly">Hàng tuần</Select.Option>
              <Select.Option value="monthly">Hàng tháng</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space
              direction={isMobile ? "vertical" : "horizontal"}
              style={{ width: "100%" }}
            >
              <Button
                type="primary"
                htmlType="submit"
                size={isMobile ? "large" : "middle"}
                style={isMobile ? { width: "100%" } : {}}
              >
                {editingSchedule ? "Cập nhật" : "Tạo mới"}
              </Button>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setEditingSchedule(null);
                  form.resetFields();
                }}
                size={isMobile ? "large" : "middle"}
                style={isMobile ? { width: "100%" } : {}}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Attendance Management Modal */}
      <Modal
        title={`Quản lý điểm danh - ${selectedSchedule?.title}`}
        open={attendanceModalVisible}
        onCancel={() => {
          setAttendanceModalVisible(false);
          setSelectedSchedule(null);
          setAttendanceStats(null);
        }}
        footer={null}
        width={isMobile ? "100%" : 800}
        style={{ top: isMobile ? 0 : 100 }}
      >
        {selectedSchedule && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h3>Thống kê điểm danh</h3>
              {attendanceStats && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <Tag
                    color="blue"
                    style={
                      isMobile ? { width: "100%", textAlign: "center" } : {}
                    }
                  >
                    Tổng số: {attendanceStats.total}
                  </Tag>
                  <Tag
                    color="cyan"
                    style={
                      isMobile ? { width: "100%", textAlign: "center" } : {}
                    }
                  >
                    Đã xác nhận: {attendanceStats.confirmed}
                  </Tag>
                  <Tag
                    color="green"
                    style={
                      isMobile ? { width: "100%", textAlign: "center" } : {}
                    }
                  >
                    Đã tham gia: {attendanceStats.attended}
                  </Tag>
                  <Tag
                    color="red"
                    style={
                      isMobile ? { width: "100%", textAlign: "center" } : {}
                    }
                  >
                    Vắng mặt: {attendanceStats.absent}
                  </Tag>
                  <Tag
                    color="orange"
                    style={
                      isMobile ? { width: "100%", textAlign: "center" } : {}
                    }
                  >
                    Chờ xác nhận: {attendanceStats.pending}
                  </Tag>
                  <Tag
                    color="gray"
                    style={
                      isMobile ? { width: "100%", textAlign: "center" } : {}
                    }
                  >
                    Từ chối: {attendanceStats.declined}
                  </Tag>
                </div>
              )}
            </div>

            <Table
              dataSource={selectedSchedule.attendees}
              rowKey={(record) => record.userId._id}
              columns={[
                {
                  title: "Thành viên",
                  dataIndex: ["userId", "username"],
                  key: "username",
                },
                {
                  title: "Trạng thái",
                  dataIndex: "status",
                  key: "status",
                  render: (status) => (
                    <Tag
                      color={
                        status === "pending"
                          ? "orange"
                          : status === "confirmed"
                            ? "blue"
                            : status === "attended"
                              ? "green"
                              : status === "absent"
                                ? "red"
                                : "gray"
                      }
                      style={
                        isMobile ? { width: "100%", textAlign: "center" } : {}
                      }
                    >
                      {status === "pending"
                        ? "Chờ xác nhận"
                        : status === "confirmed"
                          ? "Đã xác nhận"
                          : status === "attended"
                            ? "Đã tham gia"
                            : status === "absent"
                              ? "Vắng mặt"
                              : "Từ chối"}
                    </Tag>
                  ),
                },
                !isMobile && {
                  title: "Thời gian tham gia",
                  dataIndex: "joinedAt",
                  key: "joinedAt",
                  render: (date) =>
                    date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-",
                },
                {
                  title: "Thao tác",
                  key: "action",
                  render: (_, record) =>
                    isLeader &&
                    selectedSchedule.status !== "completed" && (
                      <Space
                        direction={isMobile ? "vertical" : "horizontal"}
                        style={isMobile ? { width: "100%" } : {}}
                      >
                        <Popconfirm
                          title="Xác nhận tham gia?"
                          onConfirm={() =>
                            handleUpdateAttendance(
                              selectedSchedule._id,
                              record.userId._id,
                              "attended",
                            )
                          }
                        >
                          <Button
                            icon={<CheckOutlined />}
                            type="primary"
                            size={isMobile ? "large" : "small"}
                            style={isMobile ? { width: "100%" } : {}}
                          >
                            {isMobile && "Xác nhận tham gia"}
                          </Button>
                        </Popconfirm>
                        <Popconfirm
                          title="Đánh dấu vắng mặt?"
                          onConfirm={() =>
                            handleUpdateAttendance(
                              selectedSchedule._id,
                              record.userId._id,
                              "absent",
                            )
                          }
                        >
                          <Button
                            icon={<CloseOutlined />}
                            danger
                            size={isMobile ? "large" : "small"}
                            style={isMobile ? { width: "100%" } : {}}
                          >
                            {isMobile && "Đánh dấu vắng mặt"}
                          </Button>
                        </Popconfirm>
                      </Space>
                    ),
                },
              ].filter(Boolean)}
              scroll={{ x: isMobile ? undefined : true }}
              pagination={{
                size: isMobile ? "small" : "default",
                pageSize: isMobile ? 5 : 10,
              }}
            />
          </div>
        )}
      </Modal>

      <style jsx global>{`
        .activity-schedule .ant-table-cell {
          white-space: normal;
          word-wrap: break-word;
        }

        .activity-schedule .responsive-date-picker {
          width: auto;
          min-width: 200px;
        }

        .activity-schedule .date-picker-popup {
          max-width: calc(100vw - 32px);
        }

        .activity-schedule .date-picker-popup .ant-picker-panel-container {
          display: flex;
          flex-direction: column;
        }

        .activity-schedule .date-picker-popup .ant-picker-time-panel {
          width: 100% !important;
          min-width: unset;
        }

        @media (max-width: 767px) {
          .activity-schedule .ant-table-cell {
            padding: 8px;
          }

          .activity-schedule .ant-modal {
            max-width: 100%;
            margin: 0;
          }

          .activity-schedule .ant-modal-content {
            border-radius: 0;
          }

          .activity-schedule .responsive-date-picker {
            width: 100% !important;
          }

          .activity-schedule .date-picker-popup .ant-picker-panels {
            flex-direction: column;
          }

          .activity-schedule .date-picker-popup .ant-picker-panel-container {
            flex-direction: column;
          }

          .activity-schedule .ant-space {
            gap: 8px !important;
          }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .activity-schedule .responsive-date-picker {
            width: 300px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ActivitySchedule;
