import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";
import { eventService } from "../../services/events";
import { toast } from "react-hot-toast";

const QRScanner = ({ onClose, onSuccess }) => {
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  useEffect(() => {
    const config = {
      fps: 20, 
      qrbox: function(viewfinderWidth, viewfinderHeight) {
        
        let minEdgePercentage = 0.7; 
        let minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
        let qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
        return {
          width: qrboxSize,
          height: qrboxSize
        };
      },
      aspectRatio: 1.0,
      rememberLastUsedCamera: true,
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true 
      },
      videoConstraints: {
        facingMode: "environment",
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        frameRate: { ideal: 30, min: 15 }
      }
    };

    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      config,
      false
    );

    html5QrcodeScannerRef.current = html5QrcodeScanner;

    const onScanSuccess = async (decodedText) => {
      try {
        setIsScanning(true);
        await eventService.verifyAttendance(decodedText);
        toast.success("Điểm danh thành công!");
        onSuccess?.();
        onClose?.();
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || err.message || "Không thể điểm danh";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsScanning(false);
      }
    };

    const onScanError = (errorMessage) => {
      
      if (!errorMessage.includes("NotFoundException") && 
          !errorMessage.includes("No QR code found") &&
          !errorMessage.includes("NotFoundError")) {
        console.warn("QR scan error:", errorMessage);
      }
    };

    html5QrcodeScanner.render(onScanSuccess, onScanError);

    return () => {
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.clear().catch(console.error);
      }
    };
  }, [onClose, onSuccess]);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError("");

    try {
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      const result = await new Promise((resolve, reject) => {
        img.onload = async () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          try {
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            
            const jsQR = await import('jsqr');
            const code = jsQR.default(imageData.data, imageData.width, imageData.height);
            
            if (code) {
              resolve(code.data);
            } else {
              reject(new Error('Không tìm thấy mã QR trong ảnh'));
            }
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => {
          reject(new Error('Không thể tải ảnh'));
        };

        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });

      await eventService.verifyAttendance(result);
      toast.success("Điểm danh thành công!");
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error("File scanning error:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Không thể đọc mã QR từ ảnh. Vui lòng thử lại với ảnh rõ nét hơn.";
      setError(errorMessage);
      toast.error("Không thể đọc mã QR từ ảnh", {
        description: "Hãy đảm bảo ảnh rõ nét và chứa mã QR hợp lệ",
      });
    } finally {
      setIsScanning(false);
      
      event.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Quét mã QR</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isScanning}
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

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {isScanning && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
            Đang xử lý...
          </div>
        )}

        <div id="qr-reader" className="w-full"></div>

        <div className="mt-4 flex flex-col items-center gap-2">
          <div className="text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-blue-800 font-medium">📱 Khuyến nghị:</p>
              <p className="text-xs text-blue-700 mt-1">
                Để có trải nghiệm tốt nhất, hãy sử dụng ứng dụng di động 
                có chức năng quét QR rồi copy link và dán vào trình duyệt.
              </p>
              {/* Nút chuyển tiếp ứng dụng */}
              {(() => {
                const ua = navigator.userAgent || navigator.vendor || window.opera;
                const isAndroid = /android/i.test(ua);
                const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
                const isDesktop = !isAndroid && !isIOS;
                const zaloQR = 'zalo://zaloapp.com/qr/p/MA_QR';
                const zaloPlayStore = 'https://play.google.com/store/apps/details?id=com.zing.zalo';
                const zaloAppStore = 'https://apps.apple.com/vn/app/zalo/id579523206';
                function openZalo() {
                  if (isAndroid) {
                    window.location.href = zaloQR;
                    setTimeout(() => {
                      window.location.href = zaloPlayStore;
                    }, 2000);
                  } else if (isIOS) {
                    window.location.href = zaloQR;
                    setTimeout(() => {
                      window.location.href = zaloAppStore;
                    }, 2000);
                  } else {
                    alert('Vui lòng mở trên điện thoại để sử dụng chức năng này!');
                  }
                }
                function openCamera() {
                  if (isIOS) {
                    try {
                      window.location.href = 'shortcuts://x-callback-url/run-shortcut?x-error=camera://';
                    } catch {
                      try {
                        window.location.href = 'camera://';
                      } catch {
                        toast.info('Hãy mở ứng dụng Camera và chọn chế độ quét QR');
                      }
                    }
                  } else if (isAndroid) {
                    
                    try {
                      window.location.href = 'google://lens';
                    } catch {
                      toast.info('Hãy mở ứng dụng Camera hoặc Google Lens để quét QR');
                    }
                  } else {
                    
                    toast.info('Hãy sử dụng camera trên điện thoại để quét QR code', {
                      duration: 4000
                    });
                  }
                }
                
                if (isDesktop) return null;
                return (
                  <div className="flex gap-2 mt-3">
                    {!isAndroid && (
                      <button
                        onClick={openCamera}
                        className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium text-gray-700"
                      >
                        📷 Camera
                      </button>
                    )}
                    <button
                      onClick={openZalo}
                      className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded text-xs font-medium text-blue-700"
                    >
                      💬 Zalo
                    </button>
                  </div>
                );
              })()}
              <p className="text-xs text-gray-500 mt-2 italic">
                Sau khi quét được, copy link và quay lại đây
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-yellow-800 font-medium">💡 Mẹo quét QR hiệu quả:</p>
              <ul className="text-xs text-yellow-700 mt-1 list-disc list-inside">
                <li>Giữ thiết bị ổn định và đủ ánh sáng</li>
                <li>QR code nên chiếm 30-50% khung hình</li>
                <li>Thử nghiêng góc nếu có phản chiếu</li>
                <li>Hoặc chụp ảnh QR rồi tải lên</li>
              </ul>
            </div>
            <p className="text-sm text-gray-500 mb-2">
              Quét mã QR bằng camera hoặc tải ảnh lên
            </p>
            <label className="inline-flex items-center px-4 py-2 mt-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50">
              <span>Tải ảnh QR lên</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isScanning}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
