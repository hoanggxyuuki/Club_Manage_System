import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { eventService } from "../../../services/events";
import { useAuth } from "../../../context/AuthContext";
import { format } from "date-fns";
import { AnimatedComponent, AnimatePresence } from "../../../components/common/AnimatedComponent";
import CreateEvent from "./CreateEvent";
import {
  CalendarDays,
  Users,
  Clock,
  UserCircle,
  MapPin,
  Edit,
  Trash2,
  Search,
  Tag,
  Filter,
  RefreshCw,
} from "lucide-react";
import EventParticipants from "./EventParticipants";
import QRScanner from "../../../components/events/QRScanner";
import QRDisplay from "../../../components/events/QRDisplay";
import LoadingSpinner from "../../../components/common/LoadingSpinner";

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showQRDisplay, setShowQRDisplay] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const weekdays = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];

  const showMessage = (message, isError = false) => {
    if (isError) {
      setError(message);
      setStatusMessage(null);
    } else {
      setStatusMessage(message);
      setError(null);
    }
    setTimeout(() => {
      setError(null);
      setStatusMessage(null);
    }, 5000);
  };

  const fetchEvents = async () => {
    try {
      const data = await eventService.getEvents(activeTab);
      setEvents(data);
      setError(null);
    } catch (error) {
      showMessage(error.message || "Error loading events", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [activeTab]);

  const { eventId, code } = useParams();

  useEffect(() => {
    if (eventId && code) {
      eventService
        .verifyAttendance(`${eventId}/${code}`)
        .then(() => {
          showMessage("Điểm danh thành công!");
          fetchEvents();
        })
        .catch((error) => {
          showMessage(error.message || "Không thể điểm danh", true);
        });
    }
  }, [eventId, code]);

  const isEventExpired = (event) => {
    return new Date(event.endDate) < new Date();
  };

  const getParticipantStatus = (event) => {
    const participant = event.participants?.find(
      (p) => p.userId?._id === user?.userId,
    );
    return participant?.status || "pending";
  };

  const getAttendanceStatus = (event) => {
    const participant = event.participants?.find(
      (p) => p.userId?._id === user?.userId,
    );
    return participant?.attendance?.isPresent || false;
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: "bg-green-100 text-green-800",
      declined: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
      archived: "bg-gray-100 text-gray-600",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const handleStatusUpdate = async (eventId, status) => {
    try {
      await eventService.updateParticipantStatus(eventId, status);
      showMessage(`Successfully ${status} the event`);
      fetchEvents();
    } catch (error) {
      showMessage(error.message || "Lỗi khi cập nhật trạng thái sự kiện", true);
    }
  };

  const handleViewParticipants = (event) => {
    setSelectedEvent(event);
    setShowParticipants(true);
  };

  const handleShowQRDisplay = (event) => {
    setSelectedEvent(event);
    setShowQRDisplay(true);
  };

  const handleQRRefresh = (newQRCode) => {
    setEvents(
      events.map((event) =>
        event._id === selectedEvent._id
          ? { ...event, qrCode: newQRCode }
          : event,
      ),
    );
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setIsEditing(true);
    setShowCreateForm(true);
  };

  const handleDeleteClick = (event) => {
    setEventToDelete(event);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await eventService.deleteEvent(eventToDelete._id);
      showMessage("Event deleted successfully");
      fetchEvents();
    } catch (error) {
      showMessage(error.message || "Error deleting event", true);
    } finally {
      setShowDeleteConfirm(false);
      setEventToDelete(null);
    }
  };

  const handleCreateEvent = async (eventData) => {
    try {
      if (isEditing && selectedEvent) {
        await eventService.updateEvent(selectedEvent._id, eventData);
        showMessage("Event updated successfully");
      } else {
        await eventService.createEvent(eventData);
        showMessage("Event created successfully");
      }
      setShowCreateForm(false);
      setIsEditing(false);
      setSelectedEvent(null);
      fetchEvents();
    } catch (error) {
      showMessage(
        error.message || isEditing
          ? "Error updating event"
          : "Error creating event",
        true,
      );
    }
  };

  const handleScanSuccess = () => {
    showMessage("Attendance marked successfully");
    fetchEvents();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchEvents();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterType === "all" ||
      (filterType === "required" && event.eventType === "required") ||
      (filterType === "optional" && event.eventType === "optional");

    return matchesSearch && matchesFilter;
  });

  const EventSkeleton = () => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 relative">
      <div className="p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded-md w-3/4 mb-4"></div>
          <div className="space-y-3 mb-6">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
          <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="mt-6 flex justify-end">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Đang tải sự kiện..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center border-b pb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 text-transparent bg-clip-text">
                  Sự kiện
                </h1>
                <button
                  onClick={handleRefresh}
                  className={`p-2 rounded-full hover:bg-blue-100 transition-all ${isRefreshing ? "animate-spin" : ""}`}
                >
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === "active"
                  ? "Quản lí và tham gia sự kiện sắp tới"
                  : "Xem lại các sự kiện đã kết thúc"}
              </p>
            </div>

            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm sự kiện..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
              <div className="flex flex-wrap justify-center bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab("active")}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md ${
                    activeTab === "active"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Sự kiện hiện tại
                </button>
                <button
                  onClick={() => setActiveTab("expired")}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md ${
                    activeTab === "expired"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Sự kiện đã lưu trữ
                </button>
              </div>
              <div className="flex justify-center gap-2 w-full sm:w-auto">
                {activeTab === "active" && (
                  <button
                    onClick={() => setShowQRScanner(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Quét QR
                  </button>
                )}
                {["admin", "leader"].includes(user?.role) &&
                  activeTab === "active" && (
                    <button
                      onClick={() => {
                        setShowCreateForm(true);
                        setIsEditing(false);
                        setSelectedEvent(null);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Tạo sự kiện
                    </button>
                  )}
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="flex flex-wrap gap-4 mb-6">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả loại</option>
              <option value="required">Bắt buộc tham gia</option>
              <option value="optional">Tùy chọn tham gia</option>
            </select>
          </div>

          {/* No Results Message */}
          {filteredEvents.length === 0 && (
            <AnimatedComponent
              className="text-center py-12"
              animation="fadeIn"
              duration={300}
            >
              <div className="text-gray-500">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">
                  Không tìm thấy sự kiện
                </h3>
                <p>Thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc</p>
              </div>
            </AnimatedComponent>
          )}

          {/* Events Grid */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredEvents.map((event, index) => (
                <AnimatedComponent
                  key={event._id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100"
                  animation="slideInUp"
                  duration={300}
                  delay={index * 100}
                >
                  <div
                    className={`absolute left-0 top-0 w-2 h-full ${event.eventType === "required" ? "bg-red-500" : "bg-blue-500"}`}
                  ></div>
                  <div className="p-4 sm:p-6 relative">
                    {/* Event Header */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 mb-4 group">
                      <h3 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent truncate max-w-full sm:max-w-[70%]">
                        {event.name}
                      </h3>
                      <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 flex-wrap shrink-0">
                        <div className="flex flex-wrap gap-2">
                          {activeTab === "expired" ? (
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor("archived")}`}
                            >
                              Đã lưu trữ
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(getParticipantStatus(event))}`}
                            >
                              {getParticipantStatus(event)}
                            </span>
                          )}
                          {getAttendanceStatus(event) && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Đã điểm danh
                            </span>
                          )}
                        </div>
                        {["admin", "leader"].includes(user?.role) && (
                          <div className="flex gap-3">
                            <AnimatedComponent
                              onClick={() => handleEditEvent(event)}
                              className="p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200 cursor-pointer"
                              animation="fadeIn"
                              duration={200}
                            >
                              <Edit className="w-5 h-5 text-blue-500" />
                            </AnimatedComponent>
                            <AnimatedComponent
                              onClick={() => handleDeleteClick(event)}
                              className="p-2 rounded-lg hover:bg-red-50 transition-colors duration-200 cursor-pointer"
                              animation="fadeIn"
                              duration={200}
                            >
                              <Trash2 className="w-5 h-5 text-red-500" />
                            </AnimatedComponent>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Event Description */}
                    <p className="text-gray-600 mb-6 line-clamp-3 overflow-hidden group-hover:line-clamp-none transition-all duration-300">
                      {event.description}
                    </p>

                    {/* Event Details */}
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarDays className="h-5 w-5 mr-2 text-gray-400" />

                        <span>
                          Ngày bắt đầu:{" "}
                          {weekdays[new Date(event.startDate).getDay()]},{" "}
                          {format(
                            new Date(event.startDate),
                            "dd/MM/yyyy HH:mm",
                          )}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-5 w-5 mr-2 text-gray-400" />

                        <span>
                          Ngày kết thúc:{" "}
                          {weekdays[new Date(event.endDate).getDay()]},{" "}
                          {format(new Date(event.endDate), "dd/MM/yyyy HH:mm")}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-5 w-5 mr-2 text-gray-400" />

                          <span>{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-500">
                        <UserCircle className="h-5 w-5 mr-2 text-gray-400" />

                        <span>
                          Tạo bởi: {event.creator?.username || "Unknown"}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="font-medium mr-2">Loại sự kiện:</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            event.eventType === "required"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {event.eventType === "required"
                            ? "Bắt buộc tham gia"
                            : "Tùy chọn tham gia"}
                        </span>
                      </div>
                      {event.managingUnit?.name && (
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="font-medium mr-2">
                            Đơn vị quản lý:
                          </span>
                          <span>{event.managingUnit.name}</span>
                        </div>
                      )}
                      {event.supervisors?.length > 0 && (
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="font-medium mr-2">
                            Người giám sát:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {event.supervisors.map((supervisor) => (
                              <span
                                key={supervisor.userId?._id}
                                className="bg-gray-100 px-2 py-0.5 rounded-full text-xs"
                              >
                                {supervisor.userId?.username || "Unknown"}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Event Actions */}
                    <div className="mt-6 flex flex-wrap justify-end items-center gap-2">
                      {activeTab === "active" &&
                        getParticipantStatus(event) === "pending" && (
                          <div className="flex flex-wrap w-full sm:w-auto justify-end gap-2">
                            <button
                              onClick={() =>
                                handleStatusUpdate(event._id, "confirmed")
                              }
                              className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              Chấp nhận
                            </button>
                            <button
                              onClick={() =>
                                handleStatusUpdate(event._id, "declined")
                              }
                              className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              Từ chối
                            </button>
                          </div>
                        )}
                      {["admin", "leader"].includes(user?.role) && (
                        <div className="flex flex-wrap gap-4 w-full sm:w-auto justify-end">
                          <button
                            onClick={() => handleViewParticipants(event)}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-all transform hover:scale-105"
                          >
                            Xem thành viên
                          </button>
                          <button
                            onClick={() => handleShowQRDisplay(event)}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-green-600 hover:text-green-900 hover:bg-green-50 rounded-md transition-all transform hover:scale-105"
                          >
                            QR Code
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </AnimatedComponent>
              ))}
            </AnimatePresence>
          </div>

          {/* Modals */}
          <CreateEvent
            visible={showCreateForm}
            onClose={() => {
              setShowCreateForm(false);
              setIsEditing(false);
              setSelectedEvent(null);
            }}
            onSubmit={handleCreateEvent}
            initialData={isEditing ? selectedEvent : null}
          />

          <EventParticipants
            visible={showParticipants}
            onClose={() => setShowParticipants(false)}
            event={selectedEvent}
          />

          {showQRScanner && (
            <QRScanner
              onClose={() => setShowQRScanner(false)}
              onSuccess={handleScanSuccess}
            />
          )}

          {showQRDisplay && selectedEvent && (
            <QRDisplay
              event={selectedEvent}
              onClose={() => setShowQRDisplay(false)}
              onRefresh={handleQRRefresh}
            />
          )}

          {showDeleteConfirm && (
            <AnimatedComponent
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
              animation="fadeIn"
              duration={300}
            >
              <AnimatedComponent
                className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
                animation="scaleIn"
                duration={300}
              >
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Delete Event
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete "{eventToDelete?.name}"?
                    This action cannot be undone.
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <AnimatedComponent
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 cursor-pointer"
                    animation="fadeIn"
                    duration={200}
                  >
                    Cancel
                  </AnimatedComponent>
                  <AnimatedComponent
                    onClick={handleDeleteConfirm}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 cursor-pointer"
                    animation="fadeIn"
                    duration={200}
                  >
                    Delete
                  </AnimatedComponent>
                </div>
              </AnimatedComponent>
            </AnimatedComponent>
          )}
        </div>
      </div>
    </div>
  );
}

export default Events;
