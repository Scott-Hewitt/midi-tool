import { useState, useEffect, useCallback } from 'react';
import { checkOnlineStatus } from '../utils/syncService';
import {
  saveMidiFileOffline,
  getUserMidiFilesOffline,
  deleteMidiFileOffline,
} from '../utils/offlineStorage';
import { handleApiError } from '../utils/errorHandling';
import { useToast } from '@chakra-ui/react';

/**
 * Hook for offline support
 * @param {Object} options - Hook options
 * @returns {Object} - Offline support utilities
 */
export const useOfflineSupport = (options = {}) => {
  const [isOnline, setIsOnline] = useState(checkOnlineStatus());
  const [offlineFiles, setOfflineFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const toast = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'You are back online',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'You are offline',
        description: 'Changes will be saved locally and synced when you reconnect.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  const loadOfflineFiles = useCallback(
    async userId => {
      if (!userId) return;

      try {
        setLoading(true);
        const files = await getUserMidiFilesOffline(userId);
        setOfflineFiles(files);
      } catch (error) {
        handleApiError(error, toast, 'loading offline files');
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const saveFileOffline = useCallback(
    async (fileData, userId) => {
      if (!userId) {
        toast({
          title: 'Authentication required',
          description: 'You need to be logged in to save files, even offline.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return null;
      }

      try {
        fileData.userId = userId;

        const fileId = await saveMidiFileOffline(fileData);

        setOfflineFiles(prev => [...prev, { ...fileData, id: fileId }]);

        toast({
          title: 'File saved offline',
          description: 'The file will be synced when you reconnect.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        return fileId;
      } catch (error) {
        handleApiError(error, toast, 'saving file offline');
        return null;
      }
    },
    [toast]
  );

  const deleteFileOffline = useCallback(
    async (fileId, userId) => {
      if (!userId) return false;

      try {
        await deleteMidiFileOffline(fileId, userId);

        setOfflineFiles(prev => prev.filter(file => file.id !== fileId));

        toast({
          title: 'File deleted',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        return true;
      } catch (error) {
        handleApiError(error, toast, 'deleting file offline');
        return false;
      }
    },
    [toast]
  );

  useEffect(() => {
    if (options.userId) {
      loadOfflineFiles(options.userId);
    }
  }, [options.userId, loadOfflineFiles]);

  return {
    isOnline,
    offlineFiles,
    loading,
    loadOfflineFiles,
    saveFileOffline,
    deleteFileOffline,
  };
};
