// types.ts
export type Palette = {
  // Couleurs principales
  primary: string;
  primaryLight: string;
  primaryLighter: string;
  secondary: string;
  secondaryLight: string;
  
  // Arrière-plans et surfaces
  background: string;
  card: string;
  
  // Texte
  text: string;
  textSecondary: string;
  
  // Couleurs sémantiques
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Couleurs thématiques agriculture/élevage
  soil: string;       // Couleur terre
  water: string;      // Couleur eau
  animal: string;     // Couleur pour éléments animaux
  plant: string;      // Couleur pour éléments végétaux
  
  // Permet d'ajouter des couleurs supplémentaires si besoin
  [key: string]: string;
};

export type Spacing = {
  small: number;
  medium: number;
  large: number;
  xlarge: number;
  [key: string]: number; // Permet des espacements supplémentaires
};

export type TypographyVariant = {
  fontSize: number;
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
};

export type Typography = {
  header: TypographyVariant;
  subheader: TypographyVariant;
  body: TypographyVariant;
  [key: string]: TypographyVariant; // Permet des variantes supplémentaires
};

export type AgricultureTheme = {
  colors: Palette;
  isDark: boolean;
  spacing: Spacing;
  typography: Typography;
  toggleTheme?: () => void;
  setCustomTheme?: (theme: Partial<AgricultureTheme>) => void;
};