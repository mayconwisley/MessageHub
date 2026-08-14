import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { applicationsApi, type Application } from '../../modules/applications/applications.api';

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
  const [inputValue, setInputValue] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOption, setSelectedOption] = useState<Application | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(inputValue), 300);
    return () => clearTimeout(timeout);
  }, [inputValue]);

  const { data, isLoading } = useQuery({
    queryKey: ['applications-select', tenantId, search],
    queryFn: () =>
      applicationsApi.list({ tenantId, page: 1, pageSize: 20, search: search || undefined }),
    enabled: validTenantId,
    staleTime: 30_000,
  });
  const options = data?.items ?? [];

  useEffect(() => {
    if (!value) {
      setSelectedOption(null);
      return;
    }
    const match = data?.items.find((application) => application.id === value);
    setSelectedOption(match ?? null);
  }, [data, value]);

  return (
    <Autocomplete
      options={options}
      loading={isLoading}
      value={selectedOption}
      onChange={(_, newValue) => onChange(newValue?.id ?? '')}
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
      getOptionLabel={(application) => application.name}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      disabled={!validTenantId}
      noOptionsText={
        validTenantId ? 'Nenhuma aplicação encontrada' : 'Selecione um tenant primeiro'
      }
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
