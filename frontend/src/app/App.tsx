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
  HelpOutlineOutlined,
  HistoryOutlined,
  IntegrationInstructionsOutlined,
  LightModeOutlined,
  LogoutOutlined,
  MenuOutlined,
  PeopleOutlined,
  PhoneOutlined,
  SettingsOutlined,
  SmartToyOutlined,
  VpnKeyOutlined,
  WebhookOutlined,
  MonitorHeartOutlined,
  NotificationsActiveOutlined,
  ScienceOutlined,
  EmailOutlined,
  RefreshOutlined,
} from '@mui/icons-material';
import {
  AppBar,
  Box,
  CircularProgress,
  Collapse,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  type Theme,
} from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Component, lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import { authStorage } from '../services/auth-storage';
import { SESSION_EXPIRED_EVENT } from '../services/http-client';
import { logout as logoutRequest } from '../modules/auth/auth.api';
import { ThemeModeProvider } from './ThemeModeProvider';
import { useThemeMode } from './useThemeMode';
import { buildTheme } from './theme';
import brandLogoDark from '../assets/brand/message-hub-logo-dark.svg';
import brandLogoLight from '../assets/brand/message-hub-logo-light.svg';

const LoginPage = lazy(async () => {
  const module = await import('../modules/auth/LoginPage');
  return { default: module.LoginPage };
});
const DashboardPage = lazy(async () => {
  const module = await import('../modules/dashboard/DashboardPage');
  return { default: module.DashboardPage };
});
const TenantsPage = lazy(async () => {
  const module = await import('../modules/tenants/TenantsPage');
  return { default: module.TenantsPage };
});
const ApplicationsPage = lazy(async () => {
  const module = await import('../modules/applications/ApplicationsPage');
  return { default: module.ApplicationsPage };
});
const WhatsAppAccountsPage = lazy(async () => {
  const module = await import('../modules/whatsapp-accounts/WhatsAppAccountsPage');
  return { default: module.WhatsAppAccountsPage };
});
const PhoneNumbersPage = lazy(async () => {
  const module = await import('../modules/phone-numbers/PhoneNumbersPage');
  return { default: module.PhoneNumbersPage };
});
const ApiKeysPage = lazy(async () => {
  const module = await import('../modules/api-keys/ApiKeysPage');
  return { default: module.ApiKeysPage };
});
const UsersPage = lazy(async () => {
  const module = await import('../modules/users/UsersPage');
  return { default: module.UsersPage };
});
const MessagesPage = lazy(async () => {
  const module = await import('../modules/messages/MessagesPage');
  return { default: module.MessagesPage };
});
const TemplatesPage = lazy(async () => {
  const module = await import('../modules/templates/TemplatesPage');
  return { default: module.TemplatesPage };
});
const ApiDocsPage = lazy(async () => {
  const module = await import('../modules/api-docs/ApiDocsPage');
  return { default: module.ApiDocsPage };
});
const WebhooksPage = lazy(async () => {
  const module = await import('../modules/webhooks/WebhooksPage');
  return { default: module.WebhooksPage };
});
const MonitoringPage = lazy(async () => {
  const module = await import('../modules/monitoring/MonitoringPage');
  return { default: module.MonitoringPage };
});
const EngineeringAlertsPage = lazy(async () => {
  const module = await import('../modules/engineering-alerts/EngineeringAlertsPage');
  return { default: module.EngineeringAlertsPage };
});
const AuditLogsPage = lazy(async () => {
  const module = await import('../modules/audit-logs/AuditLogsPage');
  return { default: module.AuditLogsPage };
});
const SandboxPage = lazy(async () => {
  const module = await import('../modules/sandbox/SandboxPage');
  return { default: module.SandboxPage };
});
const HelpPage = lazy(async () => {
  const module = await import('../modules/help/HelpPage');
  return { default: module.HelpPage };
});
const EmailConfigurationsPage = lazy(async () => {
  const module = await import('../modules/email-configurations/EmailConfigurationsPage');
  return { default: module.EmailConfigurationsPage };
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

interface NavLeaf {
  to: string;
  label: string;
  icon: ReactNode;
  platformOnly?: boolean;
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
      { to: '/tenants', label: 'Tenants', icon: <AccountTreeOutlined />, platformOnly: true },
      { to: '/applications', label: 'Aplicações', icon: <AppsOutlined /> },
      {
        to: '/whatsapp-accounts',
        label: 'Contas WhatsApp',
        icon: <SmartToyOutlined />,
      },
      { to: '/phone-numbers', label: 'Números', icon: <PhoneOutlined /> },
      { to: '/email-configurations', label: 'E-mail SMTP', icon: <EmailOutlined /> },
      { to: '/api-keys', label: 'Chaves de API', icon: <VpnKeyOutlined /> },
      { to: '/users', label: 'Usuários', icon: <PeopleOutlined />, platformOnly: true },
      { to: '/audit-logs', label: 'Eventos e logs', icon: <HistoryOutlined />, platformOnly: true },
    ],
  },
  {
    label: 'Mensageria',
    icon: <ForumOutlined />,
    items: [
      { to: '/messages', label: 'Mensagens', icon: <ChatOutlined /> },
      {
        to: '/templates',
        label: 'Modelos de mensagem',
        icon: <SettingsOutlined />,
      },
      {
        to: '/api-docs',
        label: 'Documentação da API',
        icon: <IntegrationInstructionsOutlined />,
      },
      { to: '/webhooks', label: 'Webhooks e DLQ', icon: <WebhookOutlined />, platformOnly: true },
      {
        to: '/monitoring',
        label: 'Monitor de integrações',
        icon: <MonitorHeartOutlined />,
        platformOnly: true,
      },
      {
        to: '/engineering-alerts',
        label: 'Alertas de engenharia',
        icon: <NotificationsActiveOutlined />,
        platformOnly: true,
      },
      { to: '/sandbox', label: 'Ambiente sandbox', icon: <ScienceOutlined />, platformOnly: true },
    ],
  },
];

const bottomLinks: NavLeaf[] = [
  { to: '/help', label: 'Manual do usuário', icon: <HelpOutlineOutlined /> },
];

const drawerWidth = 264;

function NavItem({
  to,
  label,
  icon,
  sx,
  onNavigate,
}: NavLeaf & { sx?: object; onNavigate?: () => void }) {
  const location = useLocation();
  return (
    <ListItemButton
      component={NavLink}
      to={to}
      selected={location.pathname === to}
      sx={sx}
      onClick={onNavigate}
    >
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText primary={label} />
    </ListItemButton>
  );
}

function NavGroup({
  label,
  icon,
  items,
  onNavigate,
}: NavGroupConfig & { onNavigate?: () => void }) {
  const location = useLocation();
  const hasActiveChild = items.some((item) => item.to === location.pathname);
  const [open, setOpen] = useState(hasActiveChild);

  return (
    <>
      <ListItemButton
        onClick={() => setOpen((current) => !current)}
        selected={hasActiveChild && !open}
      >
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
  const isPlatformAdmin = authStorage.getSessionUser()?.role === 'platform_admin';
  const closeMobileNav = () => setMobileOpen(false);
  const logout = async () => {
    try {
      await logoutRequest();
    } catch {
      // A sessão local é limpa mesmo que a revogação no backend falhe (ex.: token já expirado).
    }
    authStorage.removeSessionToken();
    queryClient.clear();
    void navigate('/login');
  };

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.platformOnly || isPlatformAdmin),
    }))
    .filter((group) => group.items.length > 0);
  const navList = (
    <List sx={{ px: 0.5 }}>
      {topLinks.map((item) => (
        <NavItem key={item.to} {...item} onNavigate={closeMobileNav} />
      ))}
      {visibleGroups.map((group) => (
        <NavGroup key={group.label} {...group} onNavigate={closeMobileNav} />
      ))}
      {bottomLinks.map((item) => (
        <NavItem key={item.to} {...item} onNavigate={closeMobileNav} />
      ))}
    </List>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <AppBar position="fixed" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 1.5 }}>
          {!isDesktop && (
            <IconButton
              aria-label="Abrir menu"
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(true)}
            >
              <MenuOutlined />
            </IconButton>
          )}
          <Box
            component="img"
            src={mode === 'dark' ? brandLogoDark : brandLogoLight}
            alt="Message Hub"
            sx={{
              width: { xs: 166, sm: 205 },
              height: 'auto',
              flexGrow: 1,
              maxHeight: 42,
              objectFit: 'contain',
              objectPosition: 'left',
            }}
          />
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
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            pt: isDesktop ? 9 : 1,
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ flexGrow: 1 }}>{navList}</Box>
          <Typography variant="caption" align="center" sx={{ py: 1.5, color: 'text.disabled' }}>
            v{__APP_VERSION__}
          </Typography>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          p: { xs: 2, md: 4 },
          pt: { xs: 10, md: 12 },
          maxWidth: 1500,
        }}
      >
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

interface RouteErrorBoundaryState {
  hasError: boolean;
}

class RouteErrorBoundary extends Component<{ children: ReactNode }, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3 }}>
          <Box sx={{ maxWidth: 440, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Não foi possível carregar esta tela
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Tente novamente. Se o problema persistir, informe o horário da ocorrência ao suporte.
            </Typography>
            <IconButton aria-label="Tentar novamente" onClick={() => window.location.reload()}>
              <RefreshOutlined />
            </IconButton>
          </Box>
        </Box>
      );
    }
    return this.props.children;
  }
}

function SessionExpirationHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const onSessionExpired = () => {
      authStorage.removeSessionToken();
      queryClient.clear();
      void navigate('/login', { replace: true });
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, [navigate]);

  return null;
}

function ThemedApp() {
  const { mode } = useThemeMode();
  const theme = useMemo(() => buildTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SessionExpirationHandler />
          <RouteErrorBoundary>
            <Suspense
              fallback={
                <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', gap: 2 }}>
                  <CircularProgress aria-label="Carregando tela" />
                  <Typography color="text.secondary">Carregando tela...</Typography>
                </Box>
              }
            >
              <Routes>
                <Route path="/login" element={<LoginRoute />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/tenants" element={<TenantsPage />} />
                  <Route path="/applications" element={<ApplicationsPage />} />
                  <Route path="/whatsapp-accounts" element={<WhatsAppAccountsPage />} />
                  <Route path="/phone-numbers" element={<PhoneNumbersPage />} />
                  <Route path="/email-configurations" element={<EmailConfigurationsPage />} />
                  <Route path="/api-keys" element={<ApiKeysPage />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/audit-logs" element={<AuditLogsPage />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/templates" element={<TemplatesPage />} />
                  <Route path="/api-docs" element={<ApiDocsPage />} />
                  <Route path="/webhooks" element={<WebhooksPage />} />
                  <Route path="/monitoring" element={<MonitoringPage />} />
                  <Route path="/engineering-alerts" element={<EngineeringAlertsPage />} />
                  <Route path="/sandbox" element={<SandboxPage />} />
                  <Route path="/help" element={<HelpPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </RouteErrorBoundary>
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
