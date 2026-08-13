import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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
  const [inputValue, setInputValue] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOption, setSelectedOption] = useState<WhatsAppAccount | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(inputValue), 300);
    return () => clearTimeout(timeout);
  }, [inputValue]);

  const { data, isLoading } = useQuery({
    queryKey: ['whatsapp-accounts-select', tenantId, search],
    queryFn: () =>
      whatsAppAccountsApi.list({ tenantId, page: 1, pageSize: 20, search: search || undefined }),
    enabled: validTenantId,
    staleTime: 30_000,
  });
  const options: WhatsAppAccount[] = data?.items ?? [];

  useEffect(() => {
    if (!value) {
      setSelectedOption(null);
      return;
    }
    const match = data?.items.find((account) => account.id === value);
    if (match) setSelectedOption(match);
  }, [data, value]);

  return (
    <Autocomplete
      options={options}
      loading={isLoading}
      value={selectedOption}
      onChange={(_, newValue) => {
        onChange(newValue?.id ?? '');
      }}
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
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
