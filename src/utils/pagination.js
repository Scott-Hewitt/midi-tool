/**
 * Pagination Utilities
 *
 * This module provides utilities for paginating data from Firestore.
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  // startAt and endAt are imported for potential future use
  // startAt,
  // endAt,
  endBefore,
  limitToLast,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useState, useEffect, useCallback } from 'react';

/**
 * Get paginated data from Firestore
 * @param {string} collectionName - Collection name
 * @param {Object} options - Query options
 * @param {Array} options.filters - Array of filter objects with field, operator, and value
 * @param {string} options.orderByField - Field to order by
 * @param {string} options.orderDirection - Order direction ('asc' or 'desc')
 * @param {number} options.pageSize - Number of items per page
 * @param {Object} options.lastVisible - Last document from previous page
 * @param {Object} options.firstVisible - First document from next page (for backward pagination)
 * @returns {Promise<Object>} - Paginated data and pagination info
 */
export const getPaginatedData = async (collectionName, options = {}) => {
  try {
    const {
      filters = [],
      orderByField = 'createdAt',
      orderDirection = 'desc',
      pageSize = 10,
      lastVisible = null,
      firstVisible = null,
      direction = 'next',
    } = options;

    // Start building the query
    let q = collection(db, collectionName);

    // Add filters
    filters.forEach(filter => {
      q = query(q, where(filter.field, filter.operator, filter.value));
    });

    // Add ordering
    q = query(q, orderBy(orderByField, orderDirection));

    // Add pagination
    if (direction === 'next') {
      // Forward pagination
      if (lastVisible) {
        q = query(q, startAfter(lastVisible), limit(pageSize));
      } else {
        q = query(q, limit(pageSize));
      }
    } else if (direction === 'prev') {
      // Backward pagination
      if (firstVisible) {
        q = query(q, endBefore(firstVisible), limitToLast(pageSize));
      } else {
        // If no firstVisible, just get the last page
        q = query(q, limitToLast(pageSize));
      }
    }

    // Execute the query
    const querySnapshot = await getDocs(q);

    // Extract the data
    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get the first and last visible documents for pagination
    const newFirstVisible = querySnapshot.docs[0] || null;
    const newLastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

    // Check if there are more pages
    let hasNextPage = false;
    let hasPrevPage = false;

    if (newLastVisible) {
      // Check for next page
      const nextQuery = query(
        collection(db, collectionName),
        ...filters.map(filter => where(filter.field, filter.operator, filter.value)),
        orderBy(orderByField, orderDirection),
        startAfter(newLastVisible),
        limit(1)
      );
      const nextSnapshot = await getDocs(nextQuery);
      hasNextPage = !nextSnapshot.empty;
    }

    if (newFirstVisible) {
      // Check for previous page
      const prevQuery = query(
        collection(db, collectionName),
        ...filters.map(filter => where(filter.field, filter.operator, filter.value)),
        orderBy(orderByField, orderDirection),
        endBefore(newFirstVisible),
        limitToLast(1)
      );
      const prevSnapshot = await getDocs(prevQuery);
      hasPrevPage = !prevSnapshot.empty;
    }

    return {
      data,
      pagination: {
        firstVisible: newFirstVisible,
        lastVisible: newLastVisible,
        hasNextPage,
        hasPrevPage,
        pageSize,
      },
    };
  } catch (error) {
    console.error('Error getting paginated data:', error);
    throw error;
  }
};

/**
 * Get the next page of data
 * @param {string} collectionName - Collection name
 * @param {Object} options - Query options
 * @param {Object} currentPagination - Current pagination info
 * @returns {Promise<Object>} - Next page data and pagination info
 */
export const getNextPage = async (collectionName, options, currentPagination) =>
  getPaginatedData(collectionName, {
    ...options,
    lastVisible: currentPagination.lastVisible,
    direction: 'next',
  });

/**
 * Get the previous page of data
 * @param {string} collectionName - Collection name
 * @param {Object} options - Query options
 * @param {Object} currentPagination - Current pagination info
 * @returns {Promise<Object>} - Previous page data and pagination info
 */
export const getPrevPage = async (collectionName, options, currentPagination) =>
  getPaginatedData(collectionName, {
    ...options,
    firstVisible: currentPagination.firstVisible,
    direction: 'prev',
  });

/**
 * Create a paginated query hook for React components
 * @param {string} collectionName - Collection name
 * @param {Object} defaultOptions - Default query options
 * @returns {Function} - Hook function
 */
export const createPaginatedQueryHook =
  (collectionName, defaultOptions = {}) =>
  (options = {}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
      firstVisible: null,
      lastVisible: null,
      hasNextPage: false,
      hasPrevPage: false,
      pageSize: defaultOptions.pageSize || 10,
    });

    const fetchData = useCallback(
      async (paginationDirection = 'next') => {
        try {
          setLoading(true);

          const mergedOptions = {
            ...defaultOptions,
            ...options,
            direction: paginationDirection,
          };

          if (paginationDirection === 'next') {
            mergedOptions.lastVisible = pagination.lastVisible;
            mergedOptions.firstVisible = null;
          } else if (paginationDirection === 'prev') {
            mergedOptions.firstVisible = pagination.firstVisible;
            mergedOptions.lastVisible = null;
          }

          const result = await getPaginatedData(collectionName, mergedOptions);

          setData(result.data);
          setPagination(result.pagination);
          setError(null);
        } catch (err) {
          setError(err);
        } finally {
          setLoading(false);
        }
      },
      [options, pagination.firstVisible, pagination.lastVisible]
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

    return {
      data,
      loading,
      error,
      pagination,
      nextPage,
      prevPage,
      refresh: () => fetchData('next'),
    };
  };
