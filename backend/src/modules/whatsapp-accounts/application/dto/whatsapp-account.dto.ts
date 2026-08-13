export interface WhatsAppAccountDto {
  id: string;
  tenantId: string;
  wabaId: string;
  credentialSource: string;
  status: string;
  credentialExpiresAt: Date | null;
  createdAt: Date;
}
