import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { phoneNumbersApi, type PhoneNumber } from '../../modules/phone-numbers/phone-numbers.api';

export function PhoneNumberAutocomplete({
  tenantId,
  value,
  onChange,
  label = 'Número remetente',
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
  const [selectedOption, setSelectedOption] = useState<PhoneNumber | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(inputValue), 300);
    return () => clearTimeout(timeout);
  }, [inputValue]);

  const { data, isLoading } = useQuery({
    queryKey: ['phone-numbers-select', tenantId, search],
    queryFn: () =>
      phoneNumbersApi.list({ tenantId, page: 1, pageSize: 20, search: search || undefined }),
    enabled: validTenantId,
    staleTime: 30_000,
  });
  const options = data?.items ?? [];

  useEffect(() => {
    if (!value) {
      setSelectedOption(null);
      return;
    }
    const match = data?.items.find((phoneNumber) => phoneNumber.id === value);
    if (match) setSelectedOption(match);
  }, [data, value]);

  return (
    <Autocomplete
      options={options}
      loading={isLoading}
      value={selectedOption}
      onChange={(_, newValue) => onChange(newValue?.id ?? '')}
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
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
