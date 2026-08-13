import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { phoneNumbersApi, type PhoneNumber } from '../../modules/phone-numbers/phone-numbers.api';

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
  const [inputValue, setInputValue] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<PhoneNumber[]>([]);

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
    setSelectedOptions((previous) => {
      const known = new Map(previous.map((phoneNumber) => [phoneNumber.id, phoneNumber]));
      for (const option of data?.items ?? []) known.set(option.id, option);
      return value
        .map((id) => known.get(id))
        .filter((phoneNumber): phoneNumber is PhoneNumber => Boolean(phoneNumber));
    });
  }, [data, value]);

  const mergedOptions = [
    ...options,
    ...selectedOptions.filter((option) => !options.some((o) => o.id === option.id)),
  ];

  return (
    <Autocomplete
      multiple
      options={mergedOptions}
      loading={isLoading}
      value={selectedOptions}
      onChange={(_, newValue) => onChange(newValue.map((phoneNumber) => phoneNumber.id))}
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
