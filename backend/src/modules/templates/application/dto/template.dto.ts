import { TemplateSummary } from '../ports/template-provider.interface';

export interface TemplateDto extends TemplateSummary {
  localId: string;
  whatsAppAccountId: string;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncTemplatesResult {
  total: number;
  created: number;
  updated: number;
  deleted: number;
}

export interface PublishPendingResult {
  published: number;
  failed: number;
  skipped: number;
}
