import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LaunchIcon from "@mui/icons-material/Launch";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { Avatar, Box, Stack, Typography, useTheme } from "@mui/material";

type TemplateWhatsAppPreviewProps = {
  headerText?: string;
  bodyText?: string;
  footerText?: string;
  examples?: string;
  buttonText?: string;
};

function interpolate(text: string, examples: string): string {
  const values = examples
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return text.replace(
    /\{\{(\d+)\}\}/g,
    (placeholder, index: string) => values[Number(index) - 1] ?? placeholder,
  );
}

export function TemplateWhatsAppPreview({
  headerText,
  bodyText,
  footerText,
  examples = "",
  buttonText,
}: TemplateWhatsAppPreviewProps) {
  const isDark = useTheme().palette.mode === "dark";
  const colors = isDark
    ? {
        header: "#202c33",
        background: "#0b141a",
        bubble: "#005c4b",
        text: "#e9edef",
        secondary: "rgba(255,255,255,.6)",
      }
    : {
        header: "#075e54",
        background: "#e5ddd5",
        bubble: "#d9fdd3",
        text: "rgba(0,0,0,.87)",
        secondary: "rgba(0,0,0,.5)",
      };
  const content = bodyText
    ? interpolate(bodyText, examples)
    : "Digite o corpo da mensagem para ver a prévia...";

  return (
    <Stack spacing={1} sx={{ width: 300 }}>
      <Typography variant="caption" color="text.secondary">
        Prévia no WhatsApp
      </Typography>
      <Box sx={{ overflow: "hidden", borderRadius: 2, boxShadow: 3 }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ px: 1.5, py: 1, color: "#fff", bgcolor: colors.header }}
        >
          <ArrowBackIcon fontSize="small" />
          <Avatar sx={{ width: 30, height: 30, bgcolor: "#128c7e" }}>
            <WhatsAppIcon fontSize="small" />
          </Avatar>
          <Typography
            variant="body2"
            fontWeight={600}
            noWrap
            sx={{ flexGrow: 1 }}
          >
            Sua empresa
          </Typography>
          <MoreVertIcon fontSize="small" />
        </Stack>
        <Box
          sx={{
            p: 2,
            minHeight: 220,
            bgcolor: colors.background,
            backgroundImage: isDark
              ? undefined
              : "radial-gradient(rgba(0,0,0,.03) 1px, transparent 1px)",
            backgroundSize: "14px 14px",
          }}
        >
          <Box
            sx={{
              overflow: "hidden",
              borderRadius: 1.5,
              bgcolor: colors.bubble,
              boxShadow: "0 1px .5px rgba(0,0,0,.18)",
            }}
          >
            <Box sx={{ p: 1.5 }}>
              {headerText && (
                <Typography
                  fontSize={14}
                  fontWeight={700}
                  whiteSpace="pre-wrap"
                  color={colors.text}
                >
                  {headerText}
                </Typography>
              )}
              <Typography
                fontSize={14}
                whiteSpace="pre-wrap"
                sx={{
                  mt: headerText ? 0.5 : 0,
                  color: bodyText ? colors.text : colors.secondary,
                  fontStyle: bodyText ? "normal" : "italic",
                }}
              >
                {content}
              </Typography>
              {footerText && (
                <Typography
                  fontSize={12}
                  whiteSpace="pre-wrap"
                  sx={{ mt: 0.75, color: colors.secondary }}
                >
                  {footerText}
                </Typography>
              )}
              <Typography
                align="right"
                fontSize={11}
                sx={{ mt: 0.75, color: colors.secondary }}
              >
                {new Date().toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Typography>
            </Box>
            {buttonText && (
              <Stack
                direction="row"
                spacing={0.75}
                justifyContent="center"
                alignItems="center"
                sx={{
                  py: 1,
                  borderTop: "1px solid rgba(0,0,0,.1)",
                  color: "#008069",
                }}
              >
                <LaunchIcon fontSize="small" />
                <Typography fontSize={14} fontWeight={600}>
                  {buttonText}
                </Typography>
              </Stack>
            )}
          </Box>
        </Box>
      </Box>
    </Stack>
  );
}
