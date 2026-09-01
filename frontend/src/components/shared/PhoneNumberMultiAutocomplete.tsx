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

  const knownIds = new Set([
    ...(data?.items ?? []).map((phoneNumber) => phoneNumber.id),
    ...selectedOptions.map((phoneNumber) => phoneNumber.id),
  ]);
  const missingIds = value.filter((id) => !knownIds.has(id));

  // Números já vinculados podem não estar na página atual de resultados (ex.: ao editar uma
  // aplicação cujos números vinculados não são os primeiros da busca) - busca por ID como fallback.
  const { data: fallbackPhoneNumbers } = useQuery({
    queryKey: ['phone-numbers-select-by-ids', missingIds],
    queryFn: () => Promise.all(missingIds.map((id) => phoneNumbersApi.getById(id))),
    enabled: missingIds.length > 0,
    staleTime: 30_000,
  });

  useEffect(() => {
    setSelectedOptions((previous) => {
      const known = new Map(previous.map((phoneNumber) => [phoneNumber.id, phoneNumber]));
      for (const option of data?.items ?? []) known.set(option.id, option);
      for (const option of fallbackPhoneNumbers ?? []) known.set(option.id, option);
      return value
        .map((id) => known.get(id))
        .filter((phoneNumber): phoneNumber is PhoneNumber => Boolean(phoneNumber));
    });
  }, [data, fallbackPhoneNumbers, value]);

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
