import { StyleProp, TextStyle, ViewStyle } from "react-native";
import { IconName, IconType } from "../enums/Button/buttons";

export interface ActionButtonProps {
  /** 
   * Détermine si le bouton est de type primaire (accentué) ou secondaire 
   * @default false
   */
  primary?: boolean;
  
  /** 
   * Fonction appelée lors du clic sur le bouton 
   */
  onPress?: () => void;
  
  /** 
   * Nom de l'icône à afficher 
   */
  icon: IconName;
  
  /** 
   * Type de l'icône (Ionicons ou MaterialCommunityIcons)
   * @default IconType.Ionicons
   */
  iconType?: IconType;
  
  /** 
   * Taille personnalisée pour l'icône (remplace la taille par défaut)
   */
  iconSize?: number;
  
  /** 
   * Couleur personnalisée pour l'icône (remplace la couleur par défaut)
   */
  iconColor?: string;
  
  /** 
   * Texte à afficher dans le bouton 
   */
  text?: string;
  
  /** 
   * Adapte la taille pour les tablettes 
   * @default false
   */
  isTablet?: boolean;
  
  /** 
   * Désactive le bouton si true 
   * @default false
   */
  disabled?: boolean;
  
  /** 
   * Label d'accessibilité pour les utilisateurs de lecteurs d'écran 
   */
  accessibilityLabel?: string;
  
  /** 
   * Style personnalisé pour le conteneur du bouton 
   */
  style?: StyleProp<ViewStyle>;
  
  /** 
   * Style personnalisé pour le texte du bouton 
   */
  textStyle?: StyleProp<TextStyle>;
  
  /** 
   * Couleurs personnalisées pour le dégradé (bouton primaire seulement) 
   * @default ['#4CAF50', '#2E7D32']
   */
  gradientColors?: string[];
}