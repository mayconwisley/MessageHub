import type { TemplateComponent } from "./templates.api";

type MetaTemplateExample = {
  bodyText?: unknown;
  body_text?: unknown;
};

function stringValues(value: unknown): string[] {
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    "values" in value &&
    Array.isArray(value.values) &&
    value.values.every((item) => typeof item === "string")
  ) {
    return value.values;
  }

  return [];
}

/** Compatibiliza payloads do Hub e snapshots antigos/sincronizados da Meta. */
export function bodyExampleValues(component?: TemplateComponent): string[] {
  const example = component?.example as MetaTemplateExample | undefined;
  const rows = example?.bodyText ?? example?.body_text;
  return Array.isArray(rows) ? stringValues(rows[0]) : [];
}
