import { z } from "zod";

export const templateFormSchema = z
  .object({
    tenantId: z.string().uuid("Selecione um tenant."),
    whatsAppAccountId: z.string().uuid("Selecione uma conta WhatsApp."),
    name: z
      .string()
      .min(1, "Informe o nome do modelo.")
      .max(512)
      .regex(
        /^[a-z0-9_]+$/,
        "Use apenas letras minúsculas, números e underscore.",
      ),
    language: z.string().min(2, "Informe o idioma."),
    category: z.enum(["MARKETING", "UTILITY", "AUTHENTICATION"]),
    headerText: z.string().optional(),
    bodyText: z.string().min(1, "Informe o texto do corpo."),
    bodyExamples: z.string().optional(),
    footerText: z.string().optional(),
    hasUrlButton: z.boolean(),
    buttonText: z.string().optional(),
    buttonUrl: z.string().optional(),
    buttonUrlExample: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (!value.hasUrlButton) return;
    if (!value.buttonText?.trim())
      context.addIssue({
        code: "custom",
        path: ["buttonText"],
        message: "Informe o texto do botão.",
      });
    if (!z.string().url().safeParse(value.buttonUrl).success)
      context.addIssue({
        code: "custom",
        path: ["buttonUrl"],
        message: "Informe uma URL válida.",
      });
    if (!z.string().url().safeParse(value.buttonUrlExample).success)
      context.addIssue({
        code: "custom",
        path: ["buttonUrlExample"],
        message: "Informe uma URL de exemplo válida.",
      });
  });

export type TemplateFormData = z.infer<typeof templateFormSchema>;
