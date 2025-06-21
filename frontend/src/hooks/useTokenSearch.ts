import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { tokenService, Token, TokenSearchResponse } from '@/lib/tokenService';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useTokenSearch(searchQuery: string = '', limit: number = 20) {
  const debouncedQuery = useDebounce(searchQuery, 300);
  
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch
  } = useInfiniteQuery<TokenSearchResponse, Error>({
    queryKey: ['tokens', debouncedQuery, limit],
    queryFn: async ({ pageParam = 0 }) => {
      return tokenService.searchTokens(debouncedQuery, limit, pageParam as number);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * limit;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    enabled: true,
    refetchOnWindowFocus: false,
    initialPageParam: 0,
    retry: (failureCount, error) => {
      // Retry up to 2 times for network errors
      if (failureCount < 2) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const tokens = useMemo(() => {
    return data?.pages.flatMap(page => page.tokens) || [];
  }, [data]);

  const totalCount = data?.pages[0]?.total || 0;

  return {
    tokens,
    totalCount,
    isLoading: isLoading && !tokens.length,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isSearching: searchQuery !== debouncedQuery,
  };
}

export function usePopularTokens(limit: number = 10) {
  return useQuery<Token[], Error>({
    queryKey: ['popular-tokens', limit],
    queryFn: () => tokenService.getPopularTokens(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Retry up to 2 times for network errors
      if (failureCount < 2) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useTokenByAddress(address: string) {
  return useQuery<Token | null, Error>({
    queryKey: ['token', address],
    queryFn: () => tokenService.getTokenByAddress(address),
    enabled: !!address && address.length > 20, // Basic validation for Solana address length
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      // Don't retry for invalid addresses (404 errors)
      if (error?.message?.includes('404')) {
        return false;
      }
      if (failureCount < 2) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
} 