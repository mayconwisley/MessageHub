import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { tenantsApi } from '../../modules/tenants/tenants.api';

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
  const { data, isLoading } = useQuery({
    queryKey: ['tenants-select'],
    queryFn: () => tenantsApi.list({ page: 1, pageSize: 100 }),
    staleTime: 60_000,
  });
  const options = data?.items ?? [];
  const selected = options.find((tenant) => tenant.id === value) ?? null;

  return (
    <Autocomplete
      options={options}
      loading={isLoading}
      value={selected}
      onChange={(_, newValue) => onChange(newValue?.id ?? '')}
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
