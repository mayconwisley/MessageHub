import { useState } from 'react';

/**
 * Este hook não observa filtros/busca — ele não reseta `page` sozinho quando um filtro muda.
 * Toda tela que usa filtros junto com paginação deve chamar `setPage(1)` explicitamente
 * no `onChange` de cada filtro; do contrário a página pode ficar "presa" além do total de
 * resultados filtrados.
 */
export function usePagination(initialPageSize = 20) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  return { page, pageSize, setPage, setPageSize };
}
