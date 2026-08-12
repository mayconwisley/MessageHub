import { useState } from 'react';

export function usePagination(initialPageSize = 20) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  return { page, pageSize, setPage, setPageSize };
}
