import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { messagesApi, type Message } from '../../modules/messages/messages.api';

function getMessageLabel(message: Message) {
  const preview =
    message.content.length > 40 ? `${message.content.slice(0, 40)}…` : message.content;
  return `${message.to} · ${preview} (${message.status})`;
}

export function MessageAutocomplete({
  applicationId,
  value,
  onChange,
  label = 'Mensagem',
  error,
  helperText,
  size,
  sx,
}: {
  applicationId: string;
  value: string;
  onChange: (id: string) => void;
  label?: string;
  error?: boolean;
  helperText?: string;
  size?: 'small' | 'medium';
  sx?: object;
}) {
  const validApplicationId = z.string().uuid().safeParse(applicationId).success;
  const validValue = z.string().uuid().safeParse(value).success;
  const [inputValue, setInputValue] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(inputValue), 300);
    return () => clearTimeout(timeout);
  }, [inputValue]);

  const list = useQuery({
    queryKey: ['messages-select', applicationId, search],
    queryFn: () =>
      messagesApi.list({ applicationId, page: 1, pageSize: 20, search: search || undefined }),
    enabled: validApplicationId,
    staleTime: 30_000,
  });
  const currentMessage = useQuery({
    queryKey: ['message-select-current', applicationId, value],
    queryFn: () => messagesApi.get(value, applicationId),
    enabled: validApplicationId && validValue,
    staleTime: 60_000,
  });

  const options = list.data?.items ?? [];
  const selected = options.find((message) => message.id === value) ?? currentMessage.data ?? null;
  const mergedOptions =
    selected && !options.some((message) => message.id === selected.id)
      ? [selected, ...options]
      : options;

  return (
    <Autocomplete
      options={mergedOptions}
      loading={list.isLoading || currentMessage.isLoading}
      value={selected}
      onChange={(_, newValue) => onChange(newValue?.id ?? '')}
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
      getOptionLabel={getMessageLabel}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      disabled={!validApplicationId}
      noOptionsText={
        validApplicationId
          ? 'Nenhuma mensagem encontrada'
          : 'Selecione um tenant e uma aplicação primeiro'
      }
      size={size}
      sx={sx}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={error}
          helperText={
            helperText ??
            (validApplicationId
              ? 'Busque por destinatário, conteúdo, ID ou request ID.'
              : 'Selecione um tenant e uma aplicação primeiro.')
          }
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {list.isLoading ? <CircularProgress color="inherit" size={16} /> : null}
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
