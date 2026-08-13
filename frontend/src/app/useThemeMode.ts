import { useContext } from 'react';
import { ThemeModeContext } from './theme-mode.context';

export function useThemeMode() {
  const context = useContext(ThemeModeContext);
  if (!context) throw new Error('useThemeMode deve ser usado dentro de ThemeModeProvider.');
  return context;
}
