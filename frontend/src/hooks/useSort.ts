import { useState } from 'react';
import type { SortState } from '../components/shared/PaginatedTable';

/**
 * Ordenação resolvida no servidor: mantém o estado usado pela `PaginatedTable` e já traduz
 * para os parâmetros `sortBy`/`sortDirection` esperados pelos endpoints paginados do backend.
 */
export function useSort(onSortApplied?: () => void) {
  const [sort, setSort] = useState<SortState | null>(null);

  const onSortChange = (next: SortState | null) => {
    setSort(next);
    onSortApplied?.();
  };

  return {
    sort,
    onSortChange,
    sortBy: sort?.key,
    sortDirection: sort
      ? sort.direction === 'asc'
        ? ('ASC' as const)
        : ('DESC' as const)
      : undefined,
  };
}
