import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { whatsAppAccountsApi, type WhatsAppAccount } from '../../modules/whatsapp-accounts/whatsapp-accounts.api';

const DEFAULT_CHANNEL_SENTINEL = '__default_channel__';

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
  const client = useQueryClient();
  const validTenantId = z.string().uuid().safeParse(tenantId).success;
  const { data, isLoading } = useQuery({
    queryKey: ['whatsapp-accounts-select', tenantId],
    queryFn: () => whatsAppAccountsApi.list({ tenantId, page: 1, pageSize: 100 }),
    enabled: validTenantId,
    staleTime: 60_000,
  });
  const defaultChannel = useQuery({
    queryKey: ['whatsapp-default-channel'],
    queryFn: () => whatsAppAccountsApi.getDefaultChannel(),
    staleTime: 5 * 60_000,
  });
  const ensureDefaultChannel = useMutation({
    mutationFn: () => whatsAppAccountsApi.ensureDefaultChannel(tenantId),
    onSuccess: (account) => {
      client.invalidateQueries({ queryKey: ['whatsapp-accounts-select', tenantId] });
      onChange(account.id);
    },
  });

  const registered = data?.items ?? [];
  const hasDefaultRegistered = registered.some(
    (account) => account.credentialSource === 'default' && account.wabaId === defaultChannel.data?.wabaId,
  );
  const options: WhatsAppAccount[] =
    defaultChannel.data?.enabled && !hasDefaultRegistered
      ? [
          {
            id: DEFAULT_CHANNEL_SENTINEL,
            tenantId,
            wabaId: `Padrão (.env) — ${defaultChannel.data.wabaId}`,
            credentialSource: 'default',
            status: 'ACTIVE',
            createdAt: '',
          },
          ...registered,
        ]
      : registered;
  const selected = options.find((account) => account.id === value) ?? null;

  return (
    <Autocomplete
      options={options}
      loading={isLoading}
      value={selected}
      onChange={(_, newValue) => {
        if (newValue?.id === DEFAULT_CHANNEL_SENTINEL) {
          ensureDefaultChannel.mutate();
          return;
        }
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
          error={error || ensureDefaultChannel.isError}
          helperText={
            ensureDefaultChannel.isError
              ? ensureDefaultChannel.error.message
              : (helperText ?? (!validTenantId ? 'Selecione um tenant primeiro.' : undefined))
          }
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {isLoading || ensureDefaultChannel.isPending ? <CircularProgress color="inherit" size={16} /> : null}
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
