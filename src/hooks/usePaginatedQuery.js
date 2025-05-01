/**
 * Paginated Query Hook
 *
 * This hook provides paginated query functionality for Firestore collections.
 */

import { useState, useEffect, useCallback } from 'react';
import { getPaginatedData, getNextPage, getPrevPage } from '../utils/pagination';
import { handleApiError } from '../utils/errorHandling';
import { useToast } from '@chakra-ui/react';

/**
 * Hook for paginated queries
 * @param {string} collectionName - Firestore collection name
 * @param {Object} options - Query options
 * @returns {Object} - Paginated query utilities
 */
export const usePaginatedQuery = (collectionName, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    firstVisible: null,
    lastVisible: null,
    hasNextPage: false,
    hasPrevPage: false,
    pageSize: options.pageSize || 10,
    currentPage: 1,
    totalPages: 1,
  });

  const toast = useToast();

  const fetchData = useCallback(
    async (paginationDirection = 'next') => {
      try {
        setLoading(true);

        let result;

        if (paginationDirection === 'next' && pagination.lastVisible) {
          result = await getNextPage(collectionName, options, pagination);
        } else if (paginationDirection === 'prev' && pagination.firstVisible) {
          result = await getPrevPage(collectionName, options, pagination);
        } else {
          result = await getPaginatedData(collectionName, {
            ...options,
            direction: paginationDirection,
          });
        }

        setData(result.data);
        setPagination(prev => ({
          ...result.pagination,
          currentPage:
            paginationDirection === 'next'
              ? prev.hasNextPage
                ? prev.currentPage + 1
                : prev.currentPage
              : prev.hasPrevPage
                ? prev.currentPage - 1
                : prev.currentPage,
          totalPages: prev.totalPages, // This would need to be calculated separately
        }));
        setError(null);
      } catch (err) {
        setError(err);
        handleApiError(err, toast, 'fetching data');
      } finally {
        setLoading(false);
      }
    },
    [collectionName, options, pagination, toast]
  );

  useEffect(() => {
    fetchData('next');
  }, [fetchData]);

  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      fetchData('next');
    }
  }, [fetchData, pagination.hasNextPage]);

  const prevPage = useCallback(() => {
    if (pagination.hasPrevPage) {
      fetchData('prev');
    }
  }, [fetchData, pagination.hasPrevPage]);

  const refresh = useCallback(() => {
    fetchData('next');
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    pagination,
    nextPage,
    prevPage,
    refresh,
  };
};
