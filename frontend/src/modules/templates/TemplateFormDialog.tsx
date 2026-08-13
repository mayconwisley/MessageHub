import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { TenantAutocomplete } from "../../components/shared/TenantAutocomplete";
import { WhatsAppAccountAutocomplete } from "../../components/shared/WhatsAppAccountAutocomplete";
import type { Template } from "./templates.api";
import { bodyExampleValues } from "./template-example.utils";
import {
  templateFormSchema,
  type TemplateFormData,
} from "./template-form.schema";
import { TemplateWhatsAppPreview } from "./TemplateWhatsAppPreview";

type Props = {
  open: boolean;
  template?: Template | null;
  tenantId?: string;
  accountId?: string;
  isSubmitting: boolean;
  error?: Error | null;
  onClose: () => void;
  onSubmit: (data: TemplateFormData) => void;
};

function formValues(
  template: Template | null | undefined,
  tenantId?: string,
  accountId?: string,
): TemplateFormData {
  const component = (type: string) =>
    template?.components.find((item) => item.type.toUpperCase() === type);
  const button = component("BUTTONS")?.buttons?.find(
    (item) => item.type.toUpperCase() === "URL",
  );
  const examples = bodyExampleValues(component("BODY")).join(", ");
  return {
    tenantId: tenantId ?? "",
    whatsAppAccountId: accountId ?? template?.whatsAppAccountId ?? "",
    name: template?.name ?? "",
    language: template?.language ?? "pt_BR",
    category: (template?.category as TemplateFormData["category"]) ?? "UTILITY",
    headerText: component("HEADER")?.text ?? "",
    bodyText: component("BODY")?.text ?? "",
    bodyExamples: examples,
    footerText: component("FOOTER")?.text ?? "",
    hasUrlButton: Boolean(button),
    buttonText: button?.text ?? "",
    buttonUrl: button?.url ?? "",
    buttonUrlExample: button?.example ?? "",
  };
}

export function TemplateFormDialog({
  open,
  template,
  tenantId,
  accountId,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}: Props) {
  const isEditing = Boolean(template);
  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    values: formValues(template, tenantId, accountId),
  });
  const values = form.watch();
  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth="lg"
    >
      <DialogTitle>
        {isEditing
          ? `Editar modelo “${template?.name}”`
          : "Novo modelo de mensagem"}
      </DialogTitle>
      <DialogContent dividers>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={3}
          sx={{ pt: 1 }}
        >
          <Stack
            component="form"
            id="template-form"
            spacing={2}
            sx={{ flex: 1 }}
            onSubmit={form.handleSubmit(onSubmit)}
          >
            {error && <Alert severity="error">{error.message}</Alert>}
            {isEditing && template?.id && (
              <Alert severity="info">
                Alterações em um modelo publicado serão reenviadas à Meta para
                nova análise.
              </Alert>
            )}
            <Controller
              name="tenantId"
              control={form.control}
              render={({ field }) => (
                <TenantAutocomplete
                  label="Tenant"
                  value={field.value}
                  onChange={(id) => {
                    field.onChange(id);
                    form.setValue("whatsAppAccountId", "");
                  }}
                  error={Boolean(form.formState.errors.tenantId)}
                  helperText={form.formState.errors.tenantId?.message}
                />
              )}
            />
            <Controller
              name="whatsAppAccountId"
              control={form.control}
              render={({ field }) => (
                <WhatsAppAccountAutocomplete
                  tenantId={values.tenantId}
                  value={field.value}
                  onChange={field.onChange}
                  error={Boolean(form.formState.errors.whatsAppAccountId)}
                  helperText={form.formState.errors.whatsAppAccountId?.message}
                />
              )}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Nome do modelo"
                disabled={isEditing}
                {...form.register("name")}
                error={Boolean(form.formState.errors.name)}
                helperText={
                  form.formState.errors.name?.message ??
                  "Ex.: confirmacao_pedido"
                }
              />
              <TextField
                fullWidth
                label="Idioma"
                disabled={isEditing}
                {...form.register("language")}
                error={Boolean(form.formState.errors.language)}
                helperText={
                  form.formState.errors.language?.message ?? "Ex.: pt_BR"
                }
              />
              <Controller
                name="category"
                control={form.control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Categoria</InputLabel>
                    <Select {...field} label="Categoria">
                      <MenuItem value="UTILITY">Utilidade</MenuItem>
                      <MenuItem value="MARKETING">Marketing</MenuItem>
                      <MenuItem value="AUTHENTICATION">Autenticação</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Stack>
            <Divider>
              <Typography variant="caption">Conteúdo</Typography>
            </Divider>
            <TextField
              label="Cabeçalho (opcional)"
              {...form.register("headerText")}
              fullWidth
            />
            <TextField
              label="Corpo"
              placeholder="Use {{1}}, {{2}} para variáveis"
              multiline
              minRows={3}
              {...form.register("bodyText")}
              error={Boolean(form.formState.errors.bodyText)}
              helperText={form.formState.errors.bodyText?.message}
              fullWidth
            />
            <TextField
              label="Exemplos das variáveis"
              placeholder="João Silva, PED-123"
              helperText="Um exemplo para cada variável, na ordem."
              {...form.register("bodyExamples")}
              fullWidth
            />
            <TextField
              label="Rodapé (opcional)"
              {...form.register("footerText")}
              fullWidth
            />
            <Divider>
              <Typography variant="caption">Botão</Typography>
            </Divider>
            <Controller
              name="hasUrlButton"
              control={form.control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch checked={field.value} onChange={field.onChange} />
                  }
                  label="Adicionar botão de URL"
                />
              )}
            />
            {values.hasUrlButton && (
              <>
                <TextField
                  label="Texto do botão"
                  {...form.register("buttonText")}
                  error={Boolean(form.formState.errors.buttonText)}
                  helperText={form.formState.errors.buttonText?.message}
                  fullWidth
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="URL"
                    {...form.register("buttonUrl")}
                    error={Boolean(form.formState.errors.buttonUrl)}
                    helperText={form.formState.errors.buttonUrl?.message}
                    fullWidth
                  />
                  <TextField
                    label="URL de exemplo"
                    {...form.register("buttonUrlExample")}
                    error={Boolean(form.formState.errors.buttonUrlExample)}
                    helperText={form.formState.errors.buttonUrlExample?.message}
                    fullWidth
                  />
                </Stack>
              </>
            )}
          </Stack>
          <TemplateWhatsAppPreview
            headerText={values.headerText}
            bodyText={values.bodyText}
            footerText={values.footerText}
            examples={values.bodyExamples}
            buttonText={values.hasUrlButton ? values.buttonText : undefined}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          type="submit"
          form="template-form"
          variant="contained"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Salvando..."
            : isEditing
              ? "Atualizar modelo"
              : "Criar modelo"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
