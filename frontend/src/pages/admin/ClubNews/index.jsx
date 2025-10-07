import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Table,
  Space,
  Switch,
  message,
  Modal,
  Popconfirm,
  Upload,
  Select,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import {
  getAllClubNews,
  createClubNews,
  updateClubNews,
  deleteClubNews,
} from "../../../services/clubNewsService";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const { TextArea } = Input;

const ClubNewsAdmin = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewNews, setPreviewNews] = useState(null);
  const [editingNews, setEditingNews] = useState(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  
  useEffect(() => {
    fetchNews();
  }, []);

  
  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await getAllClubNews();
      if (response.success) {
        setNews(response.data);
        setPagination({
          ...pagination,
          total: response.pagination?.total || response.data.length,
        });
      }
    } catch (error) {
      message.error("Không thể tải danh sách tin tức câu lạc bộ");
    } finally {
      setLoading(false);
    }
  };

  
  const showCreateModal = () => {
    setEditingNews(null);
    form.resetFields();
    form.setFieldsValue({
      showToAllPending: true,
      showToMembers: true,
      isPublished: true,
    });
    setFileList([]);
    setModalVisible(true);
  };

  
  const showEditModal = (record) => {
    setEditingNews(record);
    form.setFieldsValue({
      title: record.title,
      content: record.content,
      summary: record.summary,
      showToAllPending: record.showToAllPending,
      showToMembers: record.showToMembers,
      isPublished: record.isPublished,
    });

    
    if (record.image) {
      setFileList([
        {
          uid: "-1",
          name: record.image.split("/").pop(),
          status: "done",
          url: `${process.env.REACT_APP_API_URL}/${record.image}`,
        },
      ]);
    } else {
      setFileList([]);
    }

    setModalVisible(true);
  };

  
  const showPreviewModal = (record) => {
    setPreviewNews(record);
    setPreviewModalVisible(true);
  };

  
  const handleImageChange = ({ fileList }) => {
    setFileList(fileList);
  };

  
  const handleSubmit = async (values) => {
    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("content", values.content);

      if (values.summary) {
        formData.append("summary", values.summary);
      }

      formData.append("showToAllPending", values.showToAllPending || false);
      formData.append("showToMembers", values.showToMembers || false);
      formData.append("isPublished", values.isPublished || false);

      
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("image", fileList[0].originFileObj);
      }

      if (editingNews) {
        
        await updateClubNews(editingNews._id, formData);
        message.success("Cập nhật tin tức thành công");
      } else {
        
        await createClubNews(formData);
        message.success("Tạo tin tức mới thành công");
      }
      setModalVisible(false);
      fetchNews();
    } catch (error) {
      message.error(
        editingNews
          ? "Không thể cập nhật tin tức"
          : "Không thể tạo tin tức mới",
      );
    }
  };

  
  const handleDelete = async (id) => {
    try {
      await deleteClubNews(id);
      message.success("Xóa tin tức thành công");
      fetchNews();
    } catch (error) {
      message.error("Không thể xóa tin tức");
    }
  };

  
  const columns = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Tóm tắt",
      dataIndex: "summary",
      key: "summary",
      ellipsis: true,
      render: (text) => <span>{text}</span>,
    },
    {
      title: "Hình ảnh",
      dataIndex: "image",
      key: "image",
      render: (image) =>
        image ? (
          <img
            src={`${process.env.REACT_APP_API_URL}/${image}`}
            alt="Thumbnail"
            className="w-16 h-12 object-cover rounded"
          />
        ) : (
          <span className="text-gray-400">Không có hình ảnh</span>
        ),
    },
    {
      title: "Hiển thị cho demo",
      dataIndex: "showToAllPending",
      key: "showToAllPending",
      render: (show) => (
        <span className={show ? "text-green-600" : "text-red-600"}>
          {show ? "Có" : "Không"}
        </span>
      ),
    },
    {
      title: "Hiển thị cho thành viên",
      dataIndex: "showToMembers",
      key: "showToMembers",
      render: (show) => (
        <span className={show ? "text-green-600" : "text-red-600"}>
          {show ? "Có" : "Không"}
        </span>
      ),
    },
    {
      title: "Đã xuất bản",
      dataIndex: "isPublished",
      key: "isPublished",
      render: (published) => (
        <span className={published ? "text-green-600" : "text-orange-600"}>
          {published ? "Đã xuất bản" : "Bản nháp"}
        </span>
      ),
    },
    {
      title: "Ngày xuất bản",
      dataIndex: "publishDate",
      key: "publishDate",
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="default"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => showPreviewModal(record)}
          >
            Xem
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => showEditModal(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa tin tức này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Có"
            cancelText="Không"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ color: [] }, { background: [] }],
      ["link", "image"],
      ["clean"],
    ],
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý tin tức câu lạc bộ</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={showCreateModal}
        >
          Thêm tin tức mới
        </Button>
      </div>

      <Table
        dataSource={news}
        columns={columns}
        rowKey="_id"
        loading={loading}
        pagination={pagination}
        onChange={(pagination) => setPagination(pagination)}
      />

      {/* Modal tạo/chỉnh sửa tin tức */}
      <Modal
        title={editingNews ? "Chỉnh sửa tin tức" : "Thêm tin tức mới"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="summary" label="Tóm tắt">
            <TextArea rows={2} />
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung"
            rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
          >
            <ReactQuill
              theme="snow"
              modules={modules}
              style={{ height: "200px", marginBottom: "50px" }}
            />
          </Form.Item>

          <Form.Item label="Hình ảnh" valuePropName="fileList">
            <Upload
              listType="picture"
              fileList={fileList}
              onChange={handleImageChange}
              beforeUpload={() => false}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Tải lên ảnh</Button>
              <span className="ml-2 text-gray-500 text-sm">
                Tối đa 1 ảnh, kích thước &lt; 5MB
              </span>
            </Upload>
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Form.Item
              name="showToAllPending"
              label="Hiển thị cho người dùng demo"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="showToMembers"
              label="Hiển thị cho thành viên"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="isPublished"
              label="Xuất bản ngay"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>

          <Form.Item className="mb-0">
            <div className="flex justify-end space-x-2">
              <Button onClick={() => setModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                {editingNews ? "Cập nhật" : "Tạo mới"}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal xem trước tin tức */}
      <Modal
        title={previewNews?.title}
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        width={800}
        footer={[
          <Button key="back" onClick={() => setPreviewModalVisible(false)}>
            Đóng
          </Button>,
        ]}
      >
        {previewNews && (
          <div className="preview-content">
            {previewNews.image && (
              <div className="mb-4">
                <img
                  src={`${process.env.REACT_APP_API_URL}/${previewNews.image}`}
                  alt={previewNews.title}
                  className="w-full h-auto max-h-96 object-contain rounded"
                />
              </div>
            )}
            <div className="text-gray-500 mb-4">{previewNews.summary}</div>
            <div dangerouslySetInnerHTML={{ __html: previewNews.content }} />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClubNewsAdmin;
