import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Tabs,
  Button,
  Modal,
  Input,
  Tag,
  Table,
  Space,
  Popconfirm,
  message,
} from "antd";
import {
  UserAddOutlined,
  DeleteOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import {
  getAllUsers,
  addGroupMember,
  removeGroupMember,
  updateMemberRole,
} from "../../../services/users";
import ActivitySchedule from "../../../components/group/ActivitySchedule";
import debounce from "lodash/debounce";

const GroupDetail = ({ group, onClose, onUpdate, isLeader }) => {
  const [activeTab, setActiveTab] = useState("1");
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [groupMembers, setGroupMembers] = useState(group.members);

  useEffect(() => {
    if (addMemberModalVisible) {
      fetchUsers();
    }
  }, [addMemberModalVisible]);

  useEffect(() => {
    setGroupMembers(group.members);
  }, [group.members]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const users = await getAllUsers();
      const availableUsers = users.filter(
        (user) =>
          !group.members.some((member) => member.userId._id === user._id),
      );
      setAllUsers(availableUsers);
      setFilteredUsers(availableUsers);
    } catch (error) {
      message.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  
  const calculateSearchScore = useCallback((user, searchTerm) => {
    const searchLower = searchTerm.toLowerCase();
    let score = 0;

    
    if (user.username.toLowerCase().includes(searchLower)) score += 3;
    if (user.email.toLowerCase().includes(searchLower)) score += 2;
    if (user.fullName?.toLowerCase().includes(searchLower)) score += 4;

    
    if (user.username.toLowerCase().startsWith(searchLower)) score += 5;
    if (user.fullName?.toLowerCase().startsWith(searchLower)) score += 6;

    
    const words = user.fullName?.toLowerCase().split(" ") || [];
    words.forEach((word) => {
      if (word.startsWith(searchLower)) score += 3;
    });

    
    if (user.username.toLowerCase() === searchLower) score += 10;
    if (user.email.toLowerCase() === searchLower) score += 8;
    if (user.fullName?.toLowerCase() === searchLower) score += 10;

    return score;
  }, []);

  const debouncedSearch = useMemo(
    () =>
      debounce(async (value) => {
        setSearchLoading(true);
        try {
          if (!value.trim()) {
            setFilteredUsers(allUsers);
            return;
          }

          const searchResults = allUsers
            .map((user) => ({
              ...user,
              searchScore: calculateSearchScore(user, value),
            }))
            .filter((user) => user.searchScore > 0)
            .sort((a, b) => b.searchScore - a.searchScore);

          setFilteredUsers(searchResults);
        } finally {
          setSearchLoading(false);
        }
      }, 300),
    [allUsers, calculateSearchScore],
  );

  const handleSearch = (value) => {
    setSearchText(value);
    debouncedSearch(value);
  };

  const handleAddMembers = async () => {
    if (!selectedUsers.length) return;

    setLoading(true);
    try {
      const newMembers = [];
      for (const userId of selectedUsers) {
        const response = await addGroupMember(group._id, userId);
        if (response) {
          const user = allUsers.find((u) => u._id === userId);
          newMembers.push({
            userId: user,
            role: "member",
            _id: response._id, 
          });
        }
      }

      setGroupMembers((prev) => [...prev, ...newMembers]);
      message.success(
        `Đã thêm ${selectedUsers.length} thành viên mới vào nhóm`,
      );
      setAddMemberModalVisible(false);
      setSelectedUsers([]);
      setSearchText("");
      onUpdate(); 
    } catch (error) {
      message.error("Không thể thêm thành viên");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await removeGroupMember(group._id, userId);
      setGroupMembers((prev) =>
        prev.filter((member) => member.userId._id !== userId),
      );
      message.success("Đã xóa thành viên khỏi nhóm");
      onUpdate(); 
    } catch (error) {
      message.error("Không thể xóa thành viên");
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await updateMemberRole(group._id, userId, newRole);
      setGroupMembers((prev) =>
        prev.map((member) =>
          member.userId._id === userId ? { ...member, role: newRole } : member,
        ),
      );
      message.success("Đã cập nhật vai trò thành viên");
      onUpdate(); 
    } catch (error) {
      message.error("Không thể cập nhật vai trò");
    }
  };

  const rowSelection = {
    selectedRowKeys: selectedUsers,
    onChange: (selectedRowKeys) => {
      setSelectedUsers(selectedRowKeys);
    },
  };

  const url = import.meta.env.VITE_PROXY_API_URL;

  const items = [
    {
      key: "1",
      label: "Thông tin",
      children: (
        <div className="p-4">
          <h3 className="text-xl font-semibold mb-4">{group.name}</h3>
          <p className="text-gray-600 mb-4">{group.description}</p>
          <div className="flex items-center text-sm text-gray-500">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            {groupMembers?.length || 0} thành viên
          </div>
        </div>
      ),
    },
    {
      key: "2",
      label: "Lịch sinh hoạt",
      children: <ActivitySchedule groupId={group._id} isLeader={isLeader} />,
    },
    {
      key: "3",
      label: "Thành viên",
      children: (
        <div className="p-4">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-medium">Danh sách thành viên</h3>
            {isLeader && (
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => setAddMemberModalVisible(true)}
              >
                Thêm thành viên
              </Button>
            )}
          </div>

          <Table
            dataSource={groupMembers}
            rowKey={(record) => record.userId._id}
            scroll={{ x: true }}
            columns={[
              {
                title: "Thành viên",
                key: "member",
                render: (_, record) => (
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <img
                      src={`${url}${record.userId.avatar}`}
                      alt={record.userId.username.charAt(0)}
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0"
                    />

                    <div className="flex flex-col overflow-hidden max-w-[120px] sm:max-w-[200px]">
                      <span className="text-sm sm:text-base font-medium truncate">
                        {record.userId.username}
                      </span>
                      <span className="text-xs text-gray-500 truncate hidden sm:block">
                        {record.userId.email}
                      </span>
                    </div>
                  </div>
                ),
              },
              {
                title: "Vai trò",
                key: "role",
                render: (_, record) => (
                  <div className="flex items-center">
                    <Tag
                      color={
                        record.role === "owner"
                          ? "gold"
                          : record.role === "leader"
                            ? "green"
                            : "blue"
                      }
                    >
                      {record.role === "owner"
                        ? "Chủ nhóm"
                        : record.role === "leader"
                          ? "Quản lý"
                          : "Thành viên"}
                    </Tag>
                  </div>
                ),
              },
              {
                title: "Thao tác",
                key: "action",
                render: (_, record) =>
                  isLeader &&
                  record.role !== "owner" && (
                    <div className="flex items-center gap-1 sm:gap-2">
                      {record.role === "member" ? (
                        <Button
                          icon={<CrownOutlined />}
                          onClick={() =>
                            handleUpdateRole(record.userId._id, "leader")
                          }
                          title="Thăng cấp thành quản lý"
                          className="flex items-center justify-center min-w-[32px] h-8 sm:h-9 !px-2"
                        />
                      ) : (
                        <Button
                          icon={<CrownOutlined />}
                          onClick={() =>
                            handleUpdateRole(record.userId._id, "member")
                          }
                          title="Hạ cấp xuống thành viên"
                          className="flex items-center justify-center min-w-[32px] h-8 sm:h-9 !px-2"
                        />
                      )}
                      <Popconfirm
                        title="Bạn có chắc muốn xóa thành viên này?"
                        onConfirm={() => handleRemoveMember(record.userId._id)}
                        placement="topRight"
                      >
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          title="Xóa khỏi nhóm"
                          className="flex items-center justify-center min-w-[32px] h-8 sm:h-9 !px-2"
                        />
                      </Popconfirm>
                    </div>
                  ),
              },
            ]}
            responsive
            pagination={{ responsive: true, pageSize: 10 }}
          />

          <Modal
            title="Thêm thành viên mới"
            open={addMemberModalVisible}
            onCancel={() => {
              setAddMemberModalVisible(false);
              setSelectedUsers([]);
              setSearchText("");
            }}
            onOk={handleAddMembers}
            confirmLoading={loading}
            okButtonProps={{ disabled: !selectedUsers.length }}
            width="95vw"
            style={{ maxWidth: 800 }}
            styles={{ body: { padding: "12px" } }}
            className="!top-[5vh]"
          >
            <div className="mb-3 sm:mb-4">
              <Input.Search
                placeholder="Tìm kiếm thành viên..."
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                loading={searchLoading}
                allowClear
                className="!text-sm sm:!text-base"
                style={{ width: "100%" }}
              />

              <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500">
                Gợi ý: Tìm theo tên, tên đăng nhập hoặc email
              </div>
            </div>

            <Table
              rowSelection={rowSelection}
              dataSource={filteredUsers}
              loading={loading}
              rowKey="_id"
              columns={[
                {
                  title: "Thành viên",
                  key: "user",
                  render: (_, record) => (
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <img
                        src={`${url}${record.avatar}`}
                        alt={record.username.charAt(0)}
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full"
                      />

                      <div className="flex flex-col max-w-[120px] sm:max-w-[200px]">
                        <span className="text-sm sm:text-base font-medium truncate">
                          {record.fullName || record.username}
                        </span>
                        <span className="text-xs text-gray-500 truncate">
                          @{record.username}
                        </span>
                      </div>
                    </div>
                  ),
                },
                {
                  title: "Email",
                  dataIndex: "email",
                  key: "email",
                  className: "hidden sm:table-cell",
                  responsive: ["sm"],
                },
                {
                  title: "Vai trò",
                  key: "role",
                  render: (_, record) => (
                    <Tag
                      color={
                        record.role === "admin"
                          ? "red"
                          : record.role === "owner"
                            ? "gold"
                            : record.role === "leader"
                              ? "green"
                              : "blue"
                      }
                    >
                      {record.role === "admin"
                        ? "Quản trị viên"
                        : record.role === "owner"
                          ? "Chủ CLB"
                          : record.role === "leader"
                            ? "Quản lý"
                            : "Thành viên"}
                    </Tag>
                  ),
                },
              ]}
              pagination={{ pageSize: 5 }}
            />
          </Modal>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Chi tiết nhóm</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div
          className="overflow-y-auto"
          style={{ maxHeight: "calc(90vh - 4rem)" }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={items}
            className="p-4"
          />
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;
