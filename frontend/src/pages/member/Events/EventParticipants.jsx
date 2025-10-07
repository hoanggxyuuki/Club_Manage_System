import React from "react";
import { X, CheckCircle, XCircle, Clock, UserCheck } from "lucide-react";
import { format } from "date-fns";

const EventParticipants = ({ visible, onClose, event }) => {
  if (!visible) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;

      case "declined":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const stats = {
    confirmed:
      event?.participants?.filter((p) => p.status === "confirmed").length || 0,
    declined:
      event?.participants?.filter((p) => p.status === "declined").length || 0,
    pending:
      event?.participants?.filter((p) => p.status === "pending").length || 0,
    attended:
      event?.participants?.filter((p) => p.attendance?.isPresent).length || 0,
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Thành viên sự kiện</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-green-600 font-semibold">Tham gia</div>
            <div className="text-2xl font-bold">{stats.confirmed}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-red-600 font-semibold">Từ chối</div>
            <div className="text-2xl font-bold">{stats.declined}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-yellow-600 font-semibold">Chờ</div>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-blue-600 font-semibold">Điểm danh</div>
            <div className="text-2xl font-bold">{stats.attended}</div>
          </div>
        </div>

        <div className="overflow-y-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thành viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Điểm danh
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {event?.participants?.map((participant) => (
                <tr key={participant.userId?._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {participant.userId?.username}
                    </div>
                    <div className="text-sm text-gray-500">
                      {participant.userId?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(participant.status)}
                      <span className="ml-2 text-sm text-gray-700">
                        {participant.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {participant.attendance?.isPresent ? (
                      <div className="flex items-center">
                        <UserCheck className="w-4 h-4 text-blue-500" />

                        <span className="ml-2 text-sm text-gray-700">
                          {format(
                            new Date(participant.attendance.checkInTime),
                            "HH:mm dd/MM/yyyy",
                          )}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">
                        Chưa điểm danh
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {participant.attendance?.ipAddress ? (
                      <span className="text-sm text-gray-700">
                        {participant.attendance.ipAddress}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EventParticipants;
