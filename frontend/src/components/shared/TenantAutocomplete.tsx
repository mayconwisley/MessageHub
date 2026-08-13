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
  const options = data?.items ?? [];

  useEffect(() => {
    if (!value) {
      setSelectedOption(null);
      return;
    }
    const match = data?.items.find((tenant) => tenant.id === value);
    if (match) setSelectedOption(match);
  }, [data, value]);

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
