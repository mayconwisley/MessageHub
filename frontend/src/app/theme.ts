import { createTheme, type PaletteMode, alpha } from '@mui/material';

export function buildTheme(mode: PaletteMode) {
  const isDark = mode === 'dark';
  const divider = isDark ? 'rgba(230,242,236,0.12)' : 'rgba(23,43,36,0.10)';
  const paper = isDark ? '#141f1a' : '#ffffff';
  const surface = isDark ? '#0e1613' : '#ffffff';

  return createTheme({
    palette: {
      mode,
      primary: { main: isDark ? '#2fd977' : '#075e54' },
      secondary: { main: isDark ? '#1fb8a8' : '#25d366' },
      background: { default: isDark ? '#0a100d' : '#f4f7f5', paper },
      text: { primary: isDark ? '#e7f3ee' : '#16241f', secondary: isDark ? '#9db3ac' : '#5c716b' },
      divider,
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: 'Inter, Roboto, Arial, sans-serif',
      h4: { fontWeight: 700, letterSpacing: -0.5 },
      h6: { fontWeight: 700 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiCard: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: { root: { borderRadius: 16, borderColor: divider } },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 10, paddingInline: 18 },
        },
      },
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiFormControl: { defaultProps: { size: 'small' } },
      MuiTableCell: {
        styleOverrides: {
          head: { fontWeight: 700, backgroundColor: isDark ? alpha('#2fd977', 0.06) : alpha('#075e54', 0.04) },
          root: { borderColor: divider },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: surface,
            color: isDark ? '#e7f3ee' : '#16241f',
            borderBottom: `1px solid ${divider}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: surface,
            borderRight: `1px solid ${divider}`,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            marginInline: 8,
            marginBlock: 2,
            '&.Mui-selected': {
              backgroundColor: isDark ? alpha('#2fd977', 0.16) : alpha('#075e54', 0.09),
              color: isDark ? '#2fd977' : '#075e54',
              '& .MuiListItemIcon-root': { color: isDark ? '#2fd977' : '#075e54' },
            },
          },
        },
      },
      MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    },
  });
}
