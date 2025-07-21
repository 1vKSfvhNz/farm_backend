// ThemeContext.tsx
import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import { Palette } from '../types/palette';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface FontSize {
  xsmall: number;
  small: number;
  medium: number;
  large: number;
  xlarge: number;
  xxlarge: number;
}

interface Typography {
  header: {
    fontSize: number;
    fontWeight: '300' | '400' | '500' | '600' | '700' | '800' | '900' | 'bold' | 'normal';
    lineHeight?: number;
  };
  subheader: {
    fontSize: number;
    fontWeight: '300' | '400' | '500' | '600' | '700' | '800' | '900' | 'bold' | 'normal';
    lineHeight?: number;
  };
  subtitle: {
    fontSize: number;
    fontWeight: '300' | '400' | '500' | '600' | '700' | '800' | '900' | 'bold' | 'normal';
    lineHeight?: number;
  };
  h4: {
    fontSize: number;
    fontWeight: '300' | '400' | '500' | '600' | '700' | '800' | '900' | 'bold' | 'normal';
    lineHeight?: number;
  };
  body: {
    fontSize: number;
    fontWeight: '300' | '400' | '500' | '600' | '700' | '800' | '900' | 'bold' | 'normal';
    lineHeight?: number;
  };
  caption: {
    fontSize: number;
    fontWeight: '300' | '400' | '500' | '600' | '700' | '800' | '900' | 'bold' | 'normal';
    lineHeight?: number;
  };
  button: {
    fontSize: number;
    fontWeight: '300' | '400' | '500' | '600' | '700' | '800' | '900' | 'bold' | 'normal';
    lineHeight?: number;
  };
}

interface Spacing {
  xsmall: number;
  small: number;
  medium: number;
  large: number;
  xlarge: number;
  xxlarge: number;
}

interface BorderRadius {
  small: number;
  medium: number;
  large: number;
  xlarge: number;
  round: number;
}

type AgricultureTheme = {
  colors: Palette;
  isDark: boolean;
  spacing: Spacing;
  fontSize: FontSize;
  typography: Typography;
  borderRadius: BorderRadius;
  shadows: {
    small: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    medium: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    large: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
  toggleTheme?: () => void;
  setCustomTheme?: (theme: Partial<AgricultureTheme>) => void;
};

// ============================================================================
// COLOR PALETTES
// ============================================================================

// Couleurs adaptées au domaine agricole
const lightColors: Palette = {
  // Primary colors
  primary: '#2E7D32', // Vert foncé - rappelle la végétation
  primaryLight: '#4CAF50', // Vert moyen
  primaryLighter: '#81C784', // Vert clair
  primaryDark: '#1B5E20', // Vert très foncé
  
  // Secondary colors
  secondary: '#5D4037', // Brun - rappelle la terre
  secondaryLight: '#8D6E63',
  secondaryDark: '#3E2723',
  
  // Background colors
  background: '#F5F5F6', // Gris très clair
  card: '#FFFFFF',
  surface: '#FAFAFA',
  
  // Text colors
  text: '#263238', // Gris très foncé
  textSecondary: '#546E7A',
  textDisabled: '#9E9E9E',
  
  // Status colors
  success: '#4CAF50', // Pour indicateurs positifs (croissance, santé)
  warning: '#FF9800', // Pour alertes
  error: '#F44336', // Pour problèmes
  info: '#2196F3', // Pour informations
  
  // Domain specific colors
  soil: '#8D6E63', // Couleur terre
  water: '#4FC3F7', // Couleur eau
  animal: '#F06292', // Couleur pour éléments liés aux animaux
  plant: '#66BB6A', // Couleur pour éléments liés aux plantes
  
  // UI colors
  border: '#E0E0E0',
  divider: '#BDBDBD',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Additional colors for gradients
  gradientStart: '#4CAF50',
  gradientEnd: '#81C784',
};

const darkColors: Palette = {
  // Primary colors
  primary: '#81C784', // Vert plus clair pour meilleure lisibilité
  primaryLight: '#A5D6A7',
  primaryLighter: '#C8E6C9',
  primaryDark: '#4CAF50',
  
  // Secondary colors
  secondary: '#BCAAA4',
  secondaryLight: '#D7CCC8',
  secondaryDark: '#8D6E63',
  
  // Background colors
  background: '#121212',
  card: '#1E1E1E',
  surface: '#2C2C2C',
  
  // Text colors
  text: '#E0E0E0',
  textSecondary: '#9E9E9E',
  textDisabled: '#616161',
  
  // Status colors
  success: '#69F0AE',
  warning: '#FFD54F',
  error: '#FF8A80',
  info: '#82B1FF',
  
  // Domain specific colors
  soil: '#A1887F',
  water: '#4DD0E1',
  animal: '#F48FB1',
  plant: '#A5D6A7',
  
  // UI colors
  border: '#424242',
  divider: '#616161',
  overlay: 'rgba(255, 255, 255, 0.1)',
  
  // Additional colors for gradients
  gradientStart: '#69F0AE',
  gradientEnd: '#A5D6A7',
};

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const defaultSpacing: Spacing = {
  xsmall: 4,
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 32,
  xxlarge: 48,
};

const defaultFontSize: FontSize = {
  xsmall: 10,
  small: 12,
  medium: 14,
  large: 16,
  xlarge: 20,
  xxlarge: 24,
};

const defaultTypography: Typography = {
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subheader: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: 'normal',
    lineHeight: 22,
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal',
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  }
};

const defaultBorderRadius: BorderRadius = {
  small: 4,
  medium: 8,
  large: 12,
  xlarge: 16,
  round: 999,
};

const createShadows = (isDark: boolean) => ({
  small: {
    shadowColor: isDark ? '#000' : '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.3 : 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: isDark ? '#000' : '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.4 : 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: isDark ? '#000' : '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.5 : 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
});

// ============================================================================
// CONTEXT
// ============================================================================

const ThemeContext = createContext<AgricultureTheme>({
  colors: lightColors,
  isDark: false,
  spacing: defaultSpacing,
  fontSize: defaultFontSize,
  typography: defaultTypography,
  borderRadius: defaultBorderRadius,
  shadows: createShadows(false),
});

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const colorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(colorScheme === 'dark');
  const [customTheme, setCustomTheme] = useState<Partial<AgricultureTheme>>({});

  // Synchronisation avec le système
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDark(colorScheme === 'dark');
    });
    return () => subscription.remove();
  }, []);

  const toggleTheme = () => setIsDark(!isDark);

  const updateCustomTheme = (theme: Partial<AgricultureTheme>) => {
    setCustomTheme(theme);
  };

  const baseColors = isDark ? darkColors : lightColors;
  
  // Fusion des thèmes
  const colors = {
    ...baseColors,
    ...(customTheme.colors || {}),
  };

  const spacing = {
    ...defaultSpacing,
    ...(customTheme.spacing || {}),
  };

  const fontSize = {
    ...defaultFontSize,
    ...(customTheme.fontSize || {}),
  };

  const typography = {
    ...defaultTypography,
    ...(customTheme.typography || {}),
  };

  const borderRadius = {
    ...defaultBorderRadius,
    ...(customTheme.borderRadius || {}),
  };

  const shadows = {
    ...createShadows(isDark),
    ...(customTheme.shadows || {}),
  };

  const themeValue = useMemo(() => ({
    colors,
    isDark,
    spacing,
    fontSize,
    typography,
    borderRadius,
    shadows,
    toggleTheme,
    setCustomTheme: updateCustomTheme,
  }), [colors, isDark, spacing, fontSize, typography, borderRadius, shadows]);

  return (
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// ============================================================================
// EXPORTS
// ============================================================================

export type { AgricultureTheme, Palette, FontSize, Typography, Spacing, BorderRadius };
export { lightColors, darkColors };