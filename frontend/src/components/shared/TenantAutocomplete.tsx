import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { tenantsApi, type Tenant } from '../../modules/tenants/tenants.api';

export function TenantAutocomplete({
  value,
  onChange,
  label = 'Tenant',
  error,
  helperText,
  size,
  sx,
}: {
  value: string;
  onChange: (id: string) => void;
  label?: string;
  error?: boolean;
  helperText?: string;
  size?: 'small' | 'medium';
  sx?: object;
}) {
  const [inputValue, setInputValue] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOption, setSelectedOption] = useState<Tenant | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(inputValue), 300);
    return () => clearTimeout(timeout);
  }, [inputValue]);

  const { data, isLoading } = useQuery({
    queryKey: ['tenants-select', search],
    queryFn: () => tenantsApi.list({ page: 1, pageSize: 20, search: search || undefined }),
    staleTime: 30_000,
  });
  const matchInPage = data?.items.find((tenant) => tenant.id === value) ?? null;

  // O tenant selecionado pode não estar na página atual de resultados (ex.: ao editar um
  // registro cujo tenant vinculado não é um dos primeiros da busca) - busca por ID como fallback.
  const { data: fallbackTenant } = useQuery({
    queryKey: ['tenants-select-by-id', value],
    queryFn: () => tenantsApi.getById(value),
    enabled: Boolean(value) && !matchInPage,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!value) {
      setSelectedOption(null);
      return;
    }
    setSelectedOption(matchInPage ?? fallbackTenant ?? null);
  }, [value, matchInPage, fallbackTenant]);

  const options =
    fallbackTenant && !matchInPage ? [fallbackTenant, ...(data?.items ?? [])] : (data?.items ?? []);

  return (
    <Autocomplete
      options={options}
      loading={isLoading}
      value={selectedOption}
      onChange={(_, newValue) => onChange(newValue?.id ?? '')}
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
      getOptionLabel={(tenant) => tenant.name}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      noOptionsText="Nenhum tenant encontrado"
      size={size}
      sx={sx}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={error}
          helperText={helperText}
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
