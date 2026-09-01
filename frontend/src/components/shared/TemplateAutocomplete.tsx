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
  const matchInPage = data?.items.find((template) => template.id === value) ?? null;

  // O template selecionado pode não estar entre os 100 primeiros aprovados retornados
  // (ex.: ao editar um envio cujo template não está nesse conjunto) - busca por ID como fallback.
  const { data: fallbackTemplate } = useQuery({
    queryKey: ['templates-select-by-id', value, tenantId],
    queryFn: () => templatesApi.getById(value, tenantId),
    enabled: validScope && Boolean(value) && !matchInPage,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!value) {
      setSelectedOption(null);
      return;
    }
    setSelectedOption(matchInPage ?? fallbackTemplate ?? null);
  }, [value, matchInPage, fallbackTemplate]);

  const options: Template[] =
    fallbackTemplate && !matchInPage
      ? [fallbackTemplate, ...(data?.items ?? [])]
      : (data?.items ?? []);

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
