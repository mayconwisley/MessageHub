import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';

export interface PaginatedTableColumn<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
}

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
}: PaginatedTableProps<T>) {
  const colSpan = columns.length + (rowActions ? 1 : 0);
  return (
    <Paper variant="outlined">
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.key}>{column.label}</TableCell>
              ))}
              {rowActions && <TableCell align="right">Ações</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={colSpan}>
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id} hover>
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    {column.render
                      ? column.render(row)
                      : toCellText((row as Record<string, unknown>)[column.key])}
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
