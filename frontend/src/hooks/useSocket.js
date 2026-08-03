import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const useSocket = () => {
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user || !token) return;

    const socket = io(
      import.meta.env.VITE_API_URL || 'http://localhost:5000',
      { transports: ['websocket'] }
    );

    socket.on('connect', () => {
      socket.emit('register', user.id);
      console.log('[Socket] Connected and registered user', user.id);
    });

    socket.on('shortlisted', (data) => {
      toast.success(data.message, { duration: 6000, icon: '🎉' });
    });

    socket.on('application_update', (data) => {
      if (data.type === 'selected') {
        toast.success(data.message, { duration: 8000, icon: '🏆' });
      } else if (data.type === 'rejected') {
        toast(data.message, { duration: 5000, icon: '📋' });
      } else {
        toast(data.message, { duration: 4000 });
      }
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });

    // Cleanup on unmount or user change
    return () => {
      socket.disconnect();
    };
  }, [user, token]);
  // No return value needed — side effect only
};