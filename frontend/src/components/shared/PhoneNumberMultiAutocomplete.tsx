import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { phoneNumbersApi } from '../../modules/phone-numbers/phone-numbers.api';

export function PhoneNumberMultiAutocomplete({
  tenantId,
  value,
  onChange,
  label = 'Números de telefone',
  error,
  helperText,
  size,
  sx,
}: {
  tenantId: string;
  value: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  error?: boolean;
  helperText?: string;
  size?: 'small' | 'medium';
  sx?: object;
}) {
  const validTenantId = z.string().uuid().safeParse(tenantId).success;
  const { data, isLoading } = useQuery({
    queryKey: ['phone-numbers-select', tenantId],
    queryFn: () => phoneNumbersApi.list({ tenantId, page: 1, pageSize: 100 }),
    enabled: validTenantId,
    staleTime: 60_000,
  });
  const options = data?.items ?? [];
  const selected = options.filter((phoneNumber) => value.includes(phoneNumber.id));

  return (
    <Autocomplete
      multiple
      options={options}
      loading={isLoading}
      value={selected}
      onChange={(_, newValue) => onChange(newValue.map((phoneNumber) => phoneNumber.id))}
      getOptionLabel={(phoneNumber) => phoneNumber.displayNumber}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      disabled={!validTenantId}
      noOptionsText={validTenantId ? 'Nenhum número encontrado' : 'Selecione um tenant primeiro'}
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
