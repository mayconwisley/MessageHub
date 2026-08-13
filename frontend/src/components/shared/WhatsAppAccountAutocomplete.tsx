import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import {
  whatsAppAccountsApi,
  type WhatsAppAccount,
} from '../../modules/whatsapp-accounts/whatsapp-accounts.api';

export function WhatsAppAccountAutocomplete({
  tenantId,
  value,
  onChange,
  label = 'Conta WhatsApp',
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
    queryKey: ['whatsapp-accounts-select', tenantId],
    queryFn: () => whatsAppAccountsApi.list({ tenantId, page: 1, pageSize: 100 }),
    enabled: validTenantId,
    staleTime: 60_000,
  });
  const options: WhatsAppAccount[] = data?.items ?? [];
  const selected = options.find((account) => account.id === value) ?? null;

  return (
    <Autocomplete
      options={options}
      loading={isLoading}
      value={selected}
      onChange={(_, newValue) => {
        onChange(newValue?.id ?? '');
      }}
      getOptionLabel={(account) => account.wabaId}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      disabled={!validTenantId}
      noOptionsText={validTenantId ? 'Nenhuma conta encontrada' : 'Selecione um tenant primeiro'}
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
