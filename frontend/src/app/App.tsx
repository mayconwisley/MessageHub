import {
  AccountTreeOutlined,
  AdminPanelSettingsOutlined,
  AppsOutlined,
  ChatOutlined,
  DarkModeOutlined,
  DashboardOutlined,
  ExpandLess,
  ExpandMore,
  ForumOutlined,
  IntegrationInstructionsOutlined,
  KeyOutlined,
  LightModeOutlined,
  LogoutOutlined,
  MenuOutlined,
  PeopleOutlined,
  PhoneOutlined,
  SettingsOutlined,
  SmartToyOutlined,
  VpnKeyOutlined,
} from '@mui/icons-material';
import { AppBar, Avatar, Box, Collapse, CssBaseline, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, ThemeProvider, Toolbar, Tooltip, Typography, useMediaQuery, type Theme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import { NavLink, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import { authStorage } from '../services/auth-storage';
import { LoginPage } from '../modules/auth/LoginPage';
import { logout as logoutRequest } from '../modules/auth/auth.api';
import { DashboardPage } from '../modules/dashboard/DashboardPage';
import { CredentialsPage } from '../modules/credentials/CredentialsPage';
import { TenantsPage } from '../modules/tenants/TenantsPage';
import { ApplicationsPage } from '../modules/applications/ApplicationsPage';
import { WhatsAppAccountsPage } from '../modules/whatsapp-accounts/WhatsAppAccountsPage';
import { PhoneNumbersPage } from '../modules/phone-numbers/PhoneNumbersPage';
import { ApiKeysPage } from '../modules/api-keys/ApiKeysPage';
import { UsersPage } from '../modules/users/UsersPage';
import { MessagesPage } from '../modules/messages/MessagesPage';
import { TemplatesPage } from '../modules/templates/TemplatesPage';
import { ApiDocsPage } from '../modules/api-docs/ApiDocsPage';
import { ThemeModeProvider, useThemeMode } from './ThemeModeProvider';
import { buildTheme } from './theme';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

interface NavLeaf {
  to: string;
  label: string;
  icon: ReactNode;
}

interface NavGroupConfig {
  label: string;
  icon: ReactNode;
  items: NavLeaf[];
}

const topLinks: NavLeaf[] = [{ to: '/', label: 'Visão geral', icon: <DashboardOutlined /> }];

const navGroups: NavGroupConfig[] = [
  {
    label: 'Administração',
    icon: <AdminPanelSettingsOutlined />,
    items: [
      { to: '/tenants', label: 'Tenants', icon: <AccountTreeOutlined /> },
      { to: '/applications', label: 'Aplicações', icon: <AppsOutlined /> },
      { to: '/whatsapp-accounts', label: 'Contas WhatsApp', icon: <SmartToyOutlined /> },
      { to: '/phone-numbers', label: 'Números', icon: <PhoneOutlined /> },
      { to: '/api-keys', label: 'API keys', icon: <VpnKeyOutlined /> },
      { to: '/users', label: 'Usuários', icon: <PeopleOutlined /> },
    ],
  },
  {
    label: 'Mensageria',
    icon: <ForumOutlined />,
    items: [
      { to: '/messages', label: 'Mensagens', icon: <ChatOutlined /> },
      { to: '/templates', label: 'Templates', icon: <SettingsOutlined /> },
      { to: '/api-docs', label: 'Documentação da API', icon: <IntegrationInstructionsOutlined /> },
    ],
  },
];

const bottomLinks: NavLeaf[] = [{ to: '/credentials', label: 'Credenciais', icon: <KeyOutlined /> }];

const drawerWidth = 264;

function NavItem({ to, label, icon, sx, onNavigate }: NavLeaf & { sx?: object; onNavigate?: () => void }) {
  const location = useLocation();
  return (
    <ListItemButton component={NavLink} to={to} selected={location.pathname === to} sx={sx} onClick={onNavigate}>
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText primary={label} />
    </ListItemButton>
  );
}

function NavGroup({ label, icon, items, onNavigate }: NavGroupConfig & { onNavigate?: () => void }) {
  const location = useLocation();
  const hasActiveChild = items.some((item) => item.to === location.pathname);
  const [open, setOpen] = useState(hasActiveChild);

  return (
    <>
      <ListItemButton onClick={() => setOpen((current) => !current)} selected={hasActiveChild && !open}>
        <ListItemIcon>{icon}</ListItemIcon>
        <ListItemText primary={label} />
        {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {items.map((item) => (
            <NavItem key={item.to} {...item} sx={{ pl: 4 }} onNavigate={onNavigate} />
          ))}
        </List>
      </Collapse>
    </>
  );
}

function Layout() {
  const navigate = useNavigate();
  const { mode, toggleMode } = useThemeMode();
  const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobileNav = () => setMobileOpen(false);
  const logout = async () => {
    try {
      await logoutRequest();
    } catch {
      // A sessão local é limpa mesmo que a revogação no backend falhe (ex.: token já expirado).
    }
    authStorage.removeSessionToken();
    authStorage.removeApiKey();
    queryClient.clear();
    navigate('/login');
  };

  const navList = (
    <List sx={{ px: 0.5 }}>
      {topLinks.map((item) => (
        <NavItem key={item.to} {...item} onNavigate={closeMobileNav} />
      ))}
      {navGroups.map((group) => (
        <NavGroup key={group.label} {...group} onNavigate={closeMobileNav} />
      ))}
      {bottomLinks.map((item) => (
        <NavItem key={item.to} {...item} onNavigate={closeMobileNav} />
      ))}
    </List>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 1.5 }}>
          {!isDesktop && (
            <IconButton aria-label="Abrir menu" color="inherit" edge="start" onClick={() => setMobileOpen(true)}>
              <MenuOutlined />
            </IconButton>
          )}
          <Avatar sx={{ bgcolor: 'primary.main', width: 34, height: 34 }}>
            <ChatOutlined fontSize="small" />
          </Avatar>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>Message Hub Console</Typography>
          <Tooltip title={mode === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}>
            <IconButton aria-label="Alternar tema" color="inherit" onClick={toggleMode}>
              {mode === 'dark' ? <LightModeOutlined /> : <DarkModeOutlined />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Sair">
            <IconButton aria-label="Sair" color="inherit" onClick={logout}>
              <LogoutOutlined />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Drawer
        variant={isDesktop ? 'permanent' : 'temporary'}
        open={isDesktop ? true : mobileOpen}
        onClose={closeMobileNav}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: isDesktop ? drawerWidth : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', pt: isDesktop ? 9 : 1 },
        }}
      >
        {navList}
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, md: 4 }, pt: { xs: 10, md: 12 }, maxWidth: 1500 }}>
        <Outlet />
      </Box>
    </Box>
  );
}

function ProtectedRoute() {
  return authStorage.getSessionToken() ? <Layout /> : <Navigate to="/login" replace />;
}

function LoginRoute() {
  return authStorage.getSessionToken() ? <Navigate to="/" replace /> : <LoginPage />;
}

function ThemedApp() {
  const { mode } = useThemeMode();
  const theme = useMemo(() => buildTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/tenants" element={<TenantsPage />} />
              <Route path="/applications" element={<ApplicationsPage />} />
              <Route path="/whatsapp-accounts" element={<WhatsAppAccountsPage />} />
              <Route path="/phone-numbers" element={<PhoneNumbersPage />} />
              <Route path="/api-keys" element={<ApiKeysPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/credentials" element={<CredentialsPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/api-docs" element={<ApiDocsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export function App() {
  return (
    <ThemeModeProvider>
      <ThemedApp />
    </ThemeModeProvider>
  );
}
