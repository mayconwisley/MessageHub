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
  const matchInPage = data?.items.find((phoneNumber) => phoneNumber.id === value) ?? null;

  // O número selecionado pode não estar na página atual de resultados (ex.: ao editar um
  // registro cujo número vinculado não é um dos primeiros da busca) - busca por ID como fallback.
  const { data: fallbackPhoneNumber } = useQuery({
    queryKey: ['phone-numbers-select-by-id', value],
    queryFn: () => phoneNumbersApi.getById(value),
    enabled: Boolean(value) && !matchInPage,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!value) {
      setSelectedOption(null);
      return;
    }
    setSelectedOption(matchInPage ?? fallbackPhoneNumber ?? null);
  }, [value, matchInPage, fallbackPhoneNumber]);

  const options =
    fallbackPhoneNumber && !matchInPage
      ? [fallbackPhoneNumber, ...(data?.items ?? [])]
      : (data?.items ?? []);

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
