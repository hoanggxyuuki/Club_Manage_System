import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { eventService } from "../../services/events";
import { useAuth } from "../../context/AuthContext";

const QRDisplay = ({ event, onClose, onRefresh }) => {
  const { user } = useAuth();
  if (!event || !event.qrCode) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Event QR Code</h2>
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
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="text-center text-gray-600">
            No QR code available for this event.
          </p>
        </div>
      </div>
    );
  }

  const handleRefreshQR = async () => {
    try {
      const result = await eventService.refreshQRCode(event._id);
      onRefresh?.(result.qrCode);
    } catch (error) {
      console.error("Failed to refresh QR code:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Event QR Code</h2>
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
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center space-y-4">
          {!event.creator ||
          event.creator._id === user?.id ||
          ["admin", "leader"].includes(user?.role) ? (
            <>
              <div className="bg-white p-4 rounded-lg shadow">
                <QRCodeSVG
                  value={event.qrCode.displayUrl || ""} 
                  size={200}
                  level="H"
                  includeMargin={true}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </div>

              <div className="text-center space-y-2">
                <h3 className="font-semibold">{event.name}</h3>
                {event.qrCode.expiresAt && (
                  <p className="text-sm text-gray-500">
                    Expires:{" "}
                    {format(
                      new Date(event.qrCode.expiresAt),
                      "dd/MM/yyyy HH:mm",
                    )}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500">
              <p>Only event creators, leaders, and admins can view QR codes.</p>
            </div>
          )}

          <button
            onClick={handleRefreshQR}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Refresh QR Code
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRDisplay;
