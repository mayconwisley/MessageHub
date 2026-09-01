export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Direção de ordenação aceita por todo endpoint de listagem paginado do backend. */
export type SortDirection = 'ASC' | 'DESC';
