import React, { useEffect, useRef } from "react";

/**
 * Jitsi Meet Implementation
 *
 * Jitsi Meet là một giải pháp video call mã nguồn mở và HOÀN TOÀN MIỄN PHÍ
 * Không giới hạn thời gian hoặc số người tham gia
 *
 * Installation:
 * Không cần cài đặt npm package, sử dụng script từ CDN
 */

const JitsiMeetComponent = ({ roomId, onEndCall }) => {
  const containerRef = useRef(null);
  const jitsiApiRef = useRef(null);

  useEffect(() => {
    
    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;

    
    script.onload = initJitsi;

    
    document.body.appendChild(script);

    return () => {
      
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }
      document.body.removeChild(script);
    };
  }, []);

  const initJitsi = () => {
    try {
      
      if (!window.JitsiMeetExternalAPI) {
        console.error("Jitsi Meet API không được tải");
        return;
      }

      
      const normalizedRoomId = `club_meet_${roomId.replace(/[^a-zA-Z0-9]/g, "_")}`;

      
      const domain = "meet.jit.si";
      const options = {
        roomName: normalizedRoomId,
        width: "100%",
        height: "100%",
        parentNode: containerRef.current,
        lang: "vi", 

        
        configOverwrite: {
          
          disableDeepLinking: true,

          
          resolution: 720,
          constraints: {
            video: {
              height: {
                ideal: 720,
                max: 720,
                min: 240,
              },
            },
          },

          
          enableLayerSuspension: true,

          
          p2p: {
            enabled: true,
          },

          
          toolbarButtons: [
            "microphone",
            "camera",
            "closedcaptions",
            "desktop",
            "fullscreen",
            "fodeviceselection",
            "hangup",
            "profile",
            "chat",
            "recording",
            "settings",
            "raisehand",
            "videoquality",
            "filmstrip",
            "participants-pane",
          ],
        },

        
        interfaceConfigOverwrite: {
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_BACKGROUND: "#111827",
          DEFAULT_LOCAL_DISPLAY_NAME: "Bạn",
          TOOLBAR_BUTTONS: [
            "microphone",
            "camera",
            "desktop",
            "chat",
            "settings",
            "hangup",
          ],
        },
      };

      
      const jitsiApi = new window.JitsiMeetExternalAPI(domain, options);
      jitsiApiRef.current = jitsiApi;

      
      jitsiApi.addEventListeners({
        readyToClose: () => {
          console.log("Jitsi cuộc gọi đã kết thúc");
          if (onEndCall) onEndCall();
        },

        
        videoConferenceLeft: () => {
          console.log("Đã rời khỏi cuộc họp video");
          if (onEndCall) onEndCall();
        },
      });
    } catch (error) {
      console.error("Lỗi khi khởi tạo Jitsi Meet:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Container cho Jitsi Meet */}
      <div ref={containerRef} className="w-full h-full"></div>
    </div>
  );
};

export default JitsiMeetComponent;
