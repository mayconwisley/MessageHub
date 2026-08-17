import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { templatesApi, type Template } from '../../modules/templates/templates.api';

export function TemplateAutocomplete({
  tenantId,
  whatsAppAccountId,
  value,
  onChange,
  label = 'Modelo de mensagem',
  error,
  helperText,
  size,
  sx,
}: {
  tenantId: string;
  whatsAppAccountId: string;
  value: string;
  onChange: (id: string, template: Template | null) => void;
  label?: string;
  error?: boolean;
  helperText?: string;
  size?: 'small' | 'medium';
  sx?: object;
}) {
  const validScope =
    z.string().uuid().safeParse(tenantId).success &&
    z.string().uuid().safeParse(whatsAppAccountId).success;
  const [selectedOption, setSelectedOption] = useState<Template | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['templates-select', tenantId, whatsAppAccountId],
    queryFn: () =>
      templatesApi.list({
        tenantId,
        whatsAppAccountId,
        page: 1,
        pageSize: 100,
        status: 'APPROVED',
      }),
    enabled: validScope,
    staleTime: 30_000,
  });
  const options: Template[] = data?.items ?? [];

  useEffect(() => {
    if (!value) {
      setSelectedOption(null);
      return;
    }
    const match = data?.items.find((template) => template.id === value);
    setSelectedOption(match ?? null);
  }, [data, value]);

  return (
    <Autocomplete
      options={options}
      loading={isLoading}
      value={selectedOption}
      onChange={(_, newValue) => onChange(newValue?.id ?? '', newValue)}
      getOptionLabel={(template) => `${template.name} (${template.language})`}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      disabled={!validScope}
      noOptionsText={
        validScope ? 'Nenhum modelo aprovado encontrado' : 'Selecione a conta WhatsApp primeiro'
      }
      size={size}
      sx={sx}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={error}
          helperText={
            helperText ?? (!validScope ? 'Selecione a conta WhatsApp primeiro.' : undefined)
          }
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
