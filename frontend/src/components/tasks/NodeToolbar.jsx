import React from "react";
import { Card } from "antd";
import {
  PlayCircleOutlined,
  AppstoreOutlined,
  BranchesOutlined,
  BellOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

const NodeToolbar = ({ selectedGroup }) => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const isNodeDisabled = (nodeType) => {
    
    const requiresGroup = ["task", "notification", "approval"];
    return !selectedGroup && requiresGroup.includes(nodeType);
  };

  return (
    <div
      className="node-toolbar flex-shrink-0 bg-white border-r p-4"
      style={{ width: "250px", overflowY: "auto" }}
    >
      <h3 className="text-lg font-semibold mb-4">Các Thành Phần</h3>

      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-600 mb-2">
          Điều Khiển Luồng
        </h4>
        <div
          className="node-item bg-blue-50 border border-blue-200 rounded p-3 mb-3 cursor-grab flex items-center"
          draggable
          onDragStart={(event) => onDragStart(event, "start")}
        >
          <PlayCircleOutlined className="text-xl text-blue-600 mr-2" />

          <div>
            <div className="font-medium">Bắt Đầu</div>
            <div className="text-xs text-gray-500">Điểm vào của quy trình</div>
          </div>
        </div>

        <div
          className="node-item bg-yellow-50 border border-yellow-200 rounded p-3 mb-3 cursor-grab flex items-center"
          draggable
          onDragStart={(event) => onDragStart(event, "condition")}
        >
          <BranchesOutlined className="text-xl text-yellow-600 mr-2" />

          <div>
            <div className="font-medium">Điều Kiện</div>
            <div className="text-xs text-gray-500">
              Phân nhánh dựa trên điều kiện
            </div>
          </div>
        </div>

        <div
          className="node-item bg-orange-50 border border-orange-200 rounded p-3 mb-3 cursor-grab flex items-center"
          draggable
          onDragStart={(event) => onDragStart(event, "timer")}
        >
          <ClockCircleOutlined className="text-xl text-orange-500 mr-2" />

          <div>
            <div className="font-medium">Hẹn Giờ</div>
            <div className="text-xs text-gray-500">
              Đợi một khoảng thời gian
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-600 mb-2">
          Tác Vụ & Tương Tác
        </h4>

        <div
          className={`node-item ${
            isNodeDisabled("task")
              ? "bg-gray-100 border border-gray-300 cursor-not-allowed opacity-60"
              : "bg-green-50 border border-green-200 cursor-grab"
          } rounded p-3 mb-3 flex items-center`}
          draggable={!isNodeDisabled("task")}
          onDragStart={
            !isNodeDisabled("task")
              ? (event) => onDragStart(event, "task")
              : undefined
          }
        >
          <AppstoreOutlined
            className={`text-xl ${isNodeDisabled("task") ? "text-gray-500" : "text-green-600"} mr-2`}
          />

          <div>
            <div className="font-medium">Tác Vụ</div>
            <div className="text-xs text-gray-500">
              {isNodeDisabled("task")
                ? "Cần chọn nhóm trước"
                : "Tạo tác vụ mới"}
            </div>
          </div>
        </div>

        <div
          className={`node-item ${
            isNodeDisabled("notification")
              ? "bg-gray-100 border border-gray-300 cursor-not-allowed opacity-60"
              : "bg-blue-50 border border-blue-200 cursor-grab"
          } rounded p-3 mb-3 flex items-center`}
          draggable={!isNodeDisabled("notification")}
          onDragStart={
            !isNodeDisabled("notification")
              ? (event) => onDragStart(event, "notification")
              : undefined
          }
        >
          <BellOutlined
            className={`text-xl ${isNodeDisabled("notification") ? "text-gray-500" : "text-blue-600"} mr-2`}
          />

          <div>
            <div className="font-medium">Thông Báo</div>
            <div className="text-xs text-gray-500">
              {isNodeDisabled("notification")
                ? "Cần chọn nhóm trước"
                : "Gửi thông báo cho thành viên"}
            </div>
          </div>
        </div>

        <div
          className={`node-item ${
            isNodeDisabled("approval")
              ? "bg-gray-100 border border-gray-300 cursor-not-allowed opacity-60"
              : "bg-purple-50 border border-purple-200 cursor-grab"
          } rounded p-3 mb-3 flex items-center`}
          draggable={!isNodeDisabled("approval")}
          onDragStart={
            !isNodeDisabled("approval")
              ? (event) => onDragStart(event, "approval")
              : undefined
          }
        >
          <CheckSquareOutlined
            className={`text-xl ${isNodeDisabled("approval") ? "text-gray-500" : "text-purple-600"} mr-2`}
          />

          <div>
            <div className="font-medium">Phê Duyệt</div>
            <div className="text-xs text-gray-500">
              {isNodeDisabled("approval")
                ? "Cần chọn nhóm trước"
                : "Yêu cầu phê duyệt từ quản lý"}
            </div>
          </div>
        </div>
      </div>

      {isNodeDisabled("task") && (
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-sm text-yellow-700 mb-3">
          Vui lòng chọn nhóm ở phần đầu trang để kích hoạt việc tạo tác vụ,
          thông báo và phê duyệt
        </div>
      )}

      <div className="mt-8 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium mb-2">Hướng dẫn sử dụng:</h4>
        <ol className="text-xs text-gray-600 list-decimal pl-4 space-y-1">
          <li>
            <strong>Bước 1:</strong> Chọn nhóm ở phần đầu trang
          </li>
          <li>
            <strong>Bước 2:</strong> Kéo các thành phần vào bản thiết kế
          </li>
          <li>
            <strong>Bước 3:</strong> Kết nối chúng bằng cách kéo từ điểm kết nối
          </li>
          <li>
            <strong>Bước 4:</strong> Cấu hình thông tin bằng cách click vào biểu
            tượng cài đặt
          </li>
          <li>
            <strong>Bước 5:</strong> Chạy quy trình để thực hiện các tác vụ
          </li>
        </ol>

        <div className="text-xs text-gray-500 mt-3 italic">
          Mẹo: Điểm kết nối màu xanh lá cây khi kết nối từ Điều Kiện hoặc Phê
          Duyệt sẽ đại diện cho luồng "đúng" hoặc "đồng ý". Điểm màu đỏ đại diện
          cho luồng "sai" hoặc "từ chối".
        </div>
      </div>
    </div>
  );
};

export default NodeToolbar;
