import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { applicationsApi } from '../../modules/applications/applications.api';

export function ApplicationAutocomplete({
  tenantId,
  value,
  onChange,
  label = 'Aplicação',
  error,
  helperText,
  size,
  sx,
}: {
  tenantId: string;
  value: string;
  onChange: (id: string) => void;
  label?: string;
  error?: boolean;
  helperText?: string;
  size?: 'small' | 'medium';
  sx?: object;
}) {
  const validTenantId = z.string().uuid().safeParse(tenantId).success;
  const { data, isLoading } = useQuery({
    queryKey: ['applications-select', tenantId],
    queryFn: () => applicationsApi.list({ tenantId, page: 1, pageSize: 100 }),
    enabled: validTenantId,
    staleTime: 60_000,
  });
  const options = data?.items ?? [];
  const selected = options.find((application) => application.id === value) ?? null;

  return (
    <Autocomplete
      options={options}
      loading={isLoading}
      value={selected}
      onChange={(_, newValue) => onChange(newValue?.id ?? '')}
      getOptionLabel={(application) => application.name}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      disabled={!validTenantId}
      noOptionsText={validTenantId ? 'Nenhuma aplicação encontrada' : 'Selecione um tenant primeiro'}
      size={size}
      sx={sx}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={error}
          helperText={helperText ?? (!validTenantId ? 'Selecione um tenant primeiro.' : undefined)}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {isLoading ? <CircularProgress color="inherit" size={16} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
}
