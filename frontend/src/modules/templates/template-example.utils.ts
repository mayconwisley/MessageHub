type MetaTemplateExample = {
  bodyText?: unknown;
  body_text?: unknown;
};

function stringValues(value: unknown): string[] {
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return value;
  }

  if (
    value &&
    typeof value === 'object' &&
    'values' in value &&
    Array.isArray(value.values) &&
    value.values.every((item) => typeof item === 'string')
  ) {
    return value.values;
  }

  return [];
}

/**
 * Compatibiliza payloads do Hub e snapshots antigos/sincronizados da Meta - o formato
 * exato de `example` varia entre eles (camelCase vs. snake_case), por isso o parâmetro
 * aceita qualquer shape com um campo `example` em vez de só o `TemplateComponent` estrito.
 */
export function bodyExampleValues(component?: { example?: unknown }): string[] {
  const example = component?.example as MetaTemplateExample | undefined;
  const rows = example?.bodyText ?? example?.body_text;
  return Array.isArray(rows) ? stringValues(rows[0]) : [];
}
