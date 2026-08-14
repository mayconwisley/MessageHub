const fieldLabels: Record<string, string> = {
  id: 'ID',
  tenantId: 'Tenant',
  applicationId: 'Aplicação',
  phoneNumberId: 'ID do número de telefone',
  whatsAppAccountId: 'Conta WhatsApp',
  wabaId: 'ID da conta WhatsApp (WABA)',
  displayNumber: 'Número de exibição',
  name: 'Nome',
  email: 'E-mail',
  role: 'Perfil',
  status: 'Status',
  type: 'Tipo',
  to: 'Destinatário',
  content: 'Conteúdo',
  idempotencyKey: 'Chave de idempotência',
  providerMessageId: 'ID da mensagem no provedor',
  localId: 'ID local',
  metaTemplateId: 'ID do modelo na Meta',
  attemptCount: 'Tentativas',
  attemptNumber: 'Número da tentativa',
  errorCode: 'Código do erro',
  errorMessage: 'Mensagem de erro',
  credentialSource: 'Origem das credenciais',
  webhookUrl: 'URL do webhook',
  webhookSecret: 'Segredo do webhook',
  language: 'Idioma',
  category: 'Categoria',
  rejectedReason: 'Motivo da rejeição',
  lastError: 'Último erro',
  expiresAt: 'Expira em',
  createdAt: 'Criado em',
  updatedAt: 'Atualizado em',
  occurredAt: 'Ocorrido em',
  lastLoginAt: 'Último acesso em',
};

const valueLabels: Record<string, string> = {
  ACTIVE: 'Ativo',
  SUSPENDED: 'Suspenso',
  REVOKED: 'Revogada',
  DRAFT: 'Rascunho',
  PENDING: 'Pendente',
  PROCESSING: 'Processando',
  SENT: 'Enviada',
  DELIVERED: 'Entregue',
  READ: 'Lida',
  FAILED: 'Falhou',
  RETRY: 'Repetindo',
  SUCCEEDED: 'Sucesso',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  PAUSED: 'Pausado',
  DISABLED: 'Desativado',
  TEXT: 'Texto',
  TEMPLATE: 'Modelo',
  default: 'Padrão',
  tenant: 'Tenant',
  platform: 'Plataforma',
};

const dateFields = new Set(['createdAt', 'updatedAt', 'occurredAt', 'expiresAt', 'lastLoginAt']);

/**
 * Campos que nunca devem aparecer em texto legível em uma exibição genérica de entidade:
 * mesmo que uma resposta futura do backend inclua um desses por engano, o componente que
 * lista campos automaticamente (ex.: EntityResult) não deve renderizá-los.
 */
const SENSITIVE_FIELDS = new Set([
  'accessToken',
  'appSecret',
  'webhookSecret',
  'plainTextKey',
  'passwordHash',
  'password',
  'secret',
  'token',
]);

export function isSensitiveField(field: string): boolean {
  return SENSITIVE_FIELDS.has(field);
}

export function toPresentationLabel(field: string): string {
  return fieldLabels[field] ?? field;
}

export function toPresentationValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value !== 'string') return String(value);
  if (dateFields.has(field)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toLocaleString('pt-BR');
  }
  return valueLabels[value] ?? value;
}
