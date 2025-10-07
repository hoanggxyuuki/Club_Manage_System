import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, List, Button, Empty, Spin, Pagination, Tag } from "antd";
import { CalendarOutlined, UserOutlined, EyeOutlined } from "@ant-design/icons";
import { getMemberClubNews } from "../../services/clubNewsService";

const ClubNewsList = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchClubNews();
  }, [pagination.current]);

  const fetchClubNews = async () => {
    setLoading(true);
    try {
      const response = await getMemberClubNews(
        pagination.current,
        pagination.pageSize,
      );
      if (response.success) {
        setNews(response.data);
        setPagination({
          ...pagination,
          total: response.total || 0,
        });
      } else {
        setError("Không thể tải tin tức");
      }
    } catch (error) {
      console.error("Error fetching club news:", error);
      setError("Đã xảy ra lỗi khi tải tin tức câu lạc bộ");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setPagination({
      ...pagination,
      current: page,
    });
  };

  if (loading && news.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Đang tải tin tức..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg text-red-500 mb-4">{error}</h3>
        <Button type="primary" onClick={fetchClubNews}>
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tin tức câu lạc bộ</h1>
      </div>

      {news.length > 0 ? (
        <>
          <List
            grid={{
              gutter: 16,
              xs: 1,
              sm: 1,
              md: 2,
              lg: 3,
              xl: 3,
              xxl: 4,
            }}
            dataSource={news}
            renderItem={(item) => (
              <List.Item>
                <Card
                  hoverable
                  cover={
                    item.image ? (
                      <img
                        alt={item.title}
                        src={`${process.env.REACT_APP_API_URL}/${item.image}`}
                        className="h-48 object-cover"
                      />
                    ) : (
                      <div className="h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">Không có hình ảnh</span>
                      </div>
                    )
                  }
                  className="h-full flex flex-col"
                >
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                      {item.title}
                    </h3>

                    {item.summary && (
                      <p className="text-gray-500 mb-3 line-clamp-3">
                        {item.summary}
                      </p>
                    )}
                  </div>

                  <div className="mt-auto">
                    <div className="flex justify-between text-sm text-gray-500 mb-3">
                      <span className="flex items-center">
                        <CalendarOutlined className="mr-1" />
                        {new Date(item.publishDate).toLocaleDateString("vi-VN")}
                      </span>

                      {item.author && (
                        <span className="flex items-center">
                          <UserOutlined className="mr-1" />
                          {item.author.fullName || item.author.username}
                        </span>
                      )}
                    </div>

                    <Link to={`/club-news/${item._id}`}>
                      <Button type="primary" icon={<EyeOutlined />} block>
                        Xem chi tiết
                      </Button>
                    </Link>
                  </div>
                </Card>
              </List.Item>
            )}
          />

          <div className="mt-8 flex justify-center">
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        </>
      ) : (
        <Empty
          description="Không có tin tức nào"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </div>
  );
};

export default ClubNewsList;
