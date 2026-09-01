import { CheckOutlined, ContentCopyOutlined } from '@mui/icons-material';
import {
  Box,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMemo, useState, type ReactNode } from 'react';

export interface PaginatedTableColumn<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  /** Habilita ordenação client-side (apenas dentro da página atual — os dados são paginados no servidor). */
  sortable?: boolean;
  /** Valor usado para ordenar, quando o valor bruto da coluna não é diretamente comparável. */
  sortValue?: (row: T) => string | number | Date;
}

const TRUNCATE_THRESHOLD = 28;

function toCellText(value: unknown): string {
  if (value === null || value === undefined) return '—';
  switch (typeof value) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'bigint':
      return String(value);
    default:
      return JSON.stringify(value);
  }
}

function TruncatedCopyableText({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async (event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard indisponível (ex.: contexto não seguro) - falha silenciosamente, sem quebrar a tabela.
    }
  };
  return (
    <Tooltip title={text}>
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, maxWidth: 260 }}>
        <Box
          component="span"
          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {text}
        </Box>
        <IconButton size="small" onClick={copy} aria-label="Copiar valor" sx={{ p: 0.25 }}>
          {copied ? (
            <CheckOutlined fontSize="inherit" color="success" />
          ) : (
            <ContentCopyOutlined fontSize="inherit" />
          )}
        </IconButton>
      </Box>
    </Tooltip>
  );
}

function DefaultCell({ value }: { value: unknown }) {
  const text = toCellText(value);
  if (text.length <= TRUNCATE_THRESHOLD) return <>{text}</>;
  return <TruncatedCopyableText text={text} />;
}

export interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}

export interface PaginatedTableProps<T extends { id: string }> {
  columns: PaginatedTableColumn<T>[];
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  emptyMessage?: string;
  rowActions?: (row: T) => ReactNode;
  /**
   * Estado de ordenação controlado pelo servidor. Quando `onSortChange` é informado, a tabela
   * não reordena `rows` localmente — ela apenas reflete `sort` e notifica cliques de coluna,
   * deixando a página responsável por refazer a busca ordenada no backend.
   */
  sort?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;
}

export function PaginatedTable<T extends { id: string }>({
  columns,
  rows,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  emptyMessage = 'Nenhum registro encontrado.',
  rowActions,
  sort: controlledSort,
  onSortChange,
}: PaginatedTableProps<T>) {
  const isServerSort = Boolean(onSortChange);
  const [internalSort, setInternalSort] = useState<SortState | null>(null);
  const sort = isServerSort ? (controlledSort ?? null) : internalSort;
  const colSpan = columns.length + (rowActions ? 1 : 0);

  const sortedRows = useMemo(() => {
    if (isServerSort || !sort) return rows;
    const column = columns.find((candidate) => candidate.key === sort.key);
    if (!column) return rows;
    const getValue =
      column.sortValue ??
      ((row: T) => (row as Record<string, unknown>)[column.key] as string | number);
    const sorted = [...rows].sort((a, b) => {
      const valueA = getValue(a);
      const valueB = getValue(b);
      if (valueA === valueB) return 0;
      return valueA > valueB ? 1 : -1;
    });
    return sort.direction === 'asc' ? sorted : sorted.reverse();
  }, [rows, sort, columns, isServerSort]);

  const toggleSort = (key: string) => {
    const next: SortState | null = (() => {
      if (sort?.key !== key) return { key, direction: 'asc' };
      if (sort.direction === 'asc') return { key, direction: 'desc' };
      return null;
    })();
    if (isServerSort) onSortChange?.(next);
    else setInternalSort(next);
  };

  return (
    <Paper variant="outlined">
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  sortDirection={sort?.key === column.key ? sort.direction : false}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={sort?.key === column.key}
                      direction={sort?.key === column.key ? sort.direction : 'asc'}
                      onClick={() => toggleSort(column.key)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {rowActions && <TableCell align="right">Ações</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={colSpan}>
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {sortedRows.map((row) => (
              <TableRow key={row.id} hover>
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    {column.render ? (
                      column.render(row)
                    ) : (
                      <DefaultCell value={(row as Record<string, unknown>)[column.key]} />
                    )}
                  </TableCell>
                ))}
                {rowActions && <TableCell align="right">{rowActions(row)}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={Math.max(page - 1, 0)}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[10, 20, 50]}
        onPageChange={(_, newPage) => onPageChange(newPage + 1)}
        onRowsPerPageChange={(event) => onPageSizeChange(Number(event.target.value))}
        labelRowsPerPage="Linhas por página:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`
        }
        getItemAriaLabel={(type) =>
          ({
            first: 'Primeira página',
            last: 'Última página',
            next: 'Próxima página',
            previous: 'Página anterior',
          })[type]
        }
      />
    </Paper>
  );
}
