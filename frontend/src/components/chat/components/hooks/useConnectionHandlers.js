import { useEffect, useRef } from 'react';

export const useConnectionHandlers = ({ 
  targetUserId, 
  connectionStatus, 
  webRTCService, 
  socket, 
  setError 
}) => {
  const timeoutRef = useRef(null);
  const retryAttemptsRef = useRef(0);
  const maxRetryAttempts = 3;
  
  
  useEffect(() => {
    if (connectionStatus === 'connected') {
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      retryAttemptsRef.current = 0;
      return;
    }
    
    if (connectionStatus === 'failed') {
      
      const retryConnection = async () => {
        retryAttemptsRef.current++;
        
        if (retryAttemptsRef.current <= maxRetryAttempts) {
          console.log(`Đang thử kết nối lại (lần ${retryAttemptsRef.current}/${maxRetryAttempts})...`);
          
          try {
            await webRTCService.restartConnection();
          } catch (error) {
            console.error('Lỗi khởi động lại kết nối:', error);
            setError(`Không thể khởi động lại kết nối: ${error.message}`);
          }
          
          
          timeoutRef.current = setTimeout(() => {
            if (connectionStatus !== 'connected') {
              if (retryAttemptsRef.current >= maxRetryAttempts) {
                setError('Không thể kết nối sau nhiều lần thử. Vui lòng thử lại sau.');
              } else {
                retryConnection();
              }
            }
          }, 10000 + retryAttemptsRef.current * 2000);  
        } else {
          setError('Đã thử kết nối lại nhiều lần nhưng không thành công.');
        }
      };
      
      retryConnection();
    } else if (connectionStatus === 'initializing' || connectionStatus === 'connecting' || connectionStatus === 'new') {
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        if (connectionStatus !== 'connected') {
          console.warn('Connection timeout', connectionStatus);
          setError('Kết nối bị timeout. Đang thử lại...');
          webRTCService.restartConnection().catch(e => {
            console.error('Không thể kết nối lại:', e);
            setError(`Không thể kết nối: ${e.message}`);
          });
        }
      }, 20000);  
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [connectionStatus, webRTCService, setError]);
  
  return null;
};