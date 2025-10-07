import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

export const useSocketHandlers = ({
  socket,
  targetUserId,
  localStream,
  connectionStatus,
  setError
}) => {
  useEffect(() => {
    if (!socket || !targetUserId) return;

    
    let networkDisconnections = 0;
    let lastReconnect = null;

    const handleNetworkChange = () => {
      if (!navigator.onLine) {
        networkDisconnections++;
        setError('Network connection lost. Attempting to reconnect...');
        toast.error('Network connection lost', {
          id: 'network-error',
          duration: 3000
        });
      } else {
        toast.success('Network connection restored', {
          id: 'network-restored',
          duration: 3000
        });
        
        
        if (networkDisconnections > 0) {
          socket.emit('check_user_online', { targetUserId });
        }
      }
    };

    
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    
    socket.io.on('reconnect', (attempt) => {
      lastReconnect = new Date();
      toast.success('Connection restored', {
        id: 'socket-reconnected',
        duration: 3000
      });
      
      if (connectionStatus === 'disconnected' || connectionStatus === 'failed') {
        
        socket.emit('check_user_online', { targetUserId }, (response) => {
          if (response && response.online) {
            
            socket.emit('reconnect_call', { targetUserId });
          } else {
            setError('The other participant is no longer available');
          }
        });
      }
    });

    socket.io.on('reconnect_attempt', (attempt) => {
      if (attempt > 2) {
        toast.loading(`Reconnecting to server (attempt ${attempt})...`, {
          id: 'reconnect-attempt',
          duration: 3000
        });
      }
    });

    socket.io.on('reconnect_error', () => {
      setError('Failed to reconnect to server. Please check your connection.');
      
      
      if (networkDisconnections > 3 || (lastReconnect && (new Date() - lastReconnect > 15000))) {
        toast.error('Connection issues persist. Consider ending and restarting the call.', {
          id: 'suggest-restart',
          duration: 5000
        });
      }
    });

    socket.io.on('reconnect_failed', () => {
      setError('Connection to server failed. Please try again later.');
      toast.error('Connection to server failed', {
        id: 'reconnect-failed',
        duration: 5000
      });
    });

    
    socket.on('call_error', ({ message }) => {
      setError(message || 'An error occurred with the video call');
    });
    
    
    socket.on('user_offline', (offlineUserId) => {
      if (offlineUserId.toString() === targetUserId.toString()) {
        setError('The other participant has gone offline');
        toast.error('Call participant disconnected', {
          id: 'user-offline',
          duration: 5000
        });
      }
    });
    
    
    socket.on('turn_servers_update', (turnServers) => {
      if (turnServers && turnServers.length > 0) {
        
        
        console.log('Received updated TURN servers');
      }
    });

    return () => {
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
      
      socket.io.off('reconnect');
      socket.io.off('reconnect_attempt');
      socket.io.off('reconnect_error');
      socket.io.off('reconnect_failed');
      socket.off('call_error');
      socket.off('user_offline');
      socket.off('turn_servers_update');
    };
  }, [socket, targetUserId, connectionStatus, setError]);

  return {}; 
};