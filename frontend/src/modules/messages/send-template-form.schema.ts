import { z } from 'zod';

export const sendTemplateFormSchema = z.object({
  phoneNumberId: z.string().uuid('Informe um UUID válido.'),
  to: z.string().min(8, 'Informe um número de telefone válido.'),
  templateId: z
    .string()
    .min(1, 'Selecione um modelo aprovado.')
    .max(255, 'O identificador do modelo é inválido.'),
});

export type SendTemplateFormData = z.infer<typeof sendTemplateFormSchema>;
