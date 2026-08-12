import { CheckOutlined, ContentCopyOutlined } from '@mui/icons-material';
import { Box, IconButton, Tooltip } from '@mui/material';
import { useState } from 'react';

export function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 2,
          pr: 5,
          borderRadius: 2,
          bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
          border: '1px solid',
          borderColor: 'divider',
          overflowX: 'auto',
          fontSize: 13,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          whiteSpace: 'pre',
        }}
      >
        {code}
      </Box>
      <Tooltip title={copied ? 'Copiado!' : 'Copiar'}>
        <IconButton size="small" onClick={copy} sx={{ position: 'absolute', top: 8, right: 8 }}>
          {copied ? <CheckOutlined fontSize="small" color="success" /> : <ContentCopyOutlined fontSize="small" />}
        </IconButton>
      </Tooltip>
    </Box>
  );
}
