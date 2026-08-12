const IGNORED_PATH_PREFIXES = ['/health', '/docs', '/docs-json'];

/**
 * Evita "lixo" no log: health checks (polling frequente de orquestradores) e
 * assets do Swagger nao agregam valor de observabilidade e afogam o log real.
 */
export function shouldIgnoreRequestLog(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  const path = url.split('?')[0];
  return IGNORED_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
