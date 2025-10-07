import React from "react";
import { Handle } from "reactflow";
import { PlayCircleOutlined } from "@ant-design/icons";

const StartNode = ({ data }) => {
  return (
    <div className="start-node bg-blue-50 border border-blue-300 rounded p-3 shadow-md min-w-[180px]">
      <div className="flex items-center">
        <PlayCircleOutlined className="text-blue-600 text-lg mr-2" />

        <div className="font-medium text-blue-800">Bắt đầu</div>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Bắt đầu thực thi quy trình tại đây
      </div>

      {/* Only source handle, no target since it's the start */}
      <Handle
        type="source"
        position="bottom"
        style={{ background: "#4299e1", width: "10px", height: "10px" }}
        id="start-source"
      />
    </div>
  );
};

export default StartNode;
