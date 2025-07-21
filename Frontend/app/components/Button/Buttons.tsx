import React, { useRef, useEffect, useState } from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  DimensionValue, 
  StyleProp, 
  TextStyle, 
  ViewStyle,
  ActivityIndicator,
  Animated,
  View
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import { 
  IconType
} from '../../enums/Button/buttons';

// Types pour plus de flexibilité avec nouveaux styles
export type ButtonVariant = 'primary' | 'agriculture' | 'elevage' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning' | 'admin' | 'manager' | 'neon' | 'glass' | 'minimal';
export type ButtonSize = 'small' | 'medium' | 'large' | 'xlarge';
export type ButtonShape = 'rounded' | 'square' | 'circle' | 'pill' | 'organic';

export interface FlexibleButtonProps {
  // Contenu
  text?: string;
  icon?: string;
  iconType?: IconType;
  iconPosition?: 'left' | 'right' | 'top' | 'bottom';
  
  // Nouvelles propriétés pour les icônes Lucide
  commonIcon?: string;  
  // Apparence
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  fullWidth?: boolean;
  
  // Couleurs personnalisées
  backgroundColor?: string;
  textColor?: string;
  iconColor?: string;
  borderColor?: string;
  gradientColors?: string[];
  
  // Tailles personnalisées
  width?: number | string;
  height?: number;
  iconSize?: number;
  fontSize?: number;
  borderRadius?: number;
  borderWidth?: number;
  
  // États
  disabled?: boolean;
  loading?: boolean;
  
  // Comportement
  onPress?: () => void;
  onLongPress?: () => void;
  activeOpacity?: number;
  
  // Styles personnalisés
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  iconStyle?: StyleProp<TextStyle>;
  
  // Accessibilité
  accessibilityLabel?: string;
  accessibilityHint?: string;
  
  // Responsive
  isTablet?: boolean;
  
  // Espacement
  margin?: number;
  marginHorizontal?: number;
  marginVertical?: number;
  marginBottom?: number;
  padding?: number;
  paddingHorizontal?: number;
  paddingVertical?: number;

  // Nouveaux props pour animations
  animationDelay?: number;
  enableHoverEffect?: boolean;
  enablePulseEffect?: boolean;
  enableShimmerEffect?: boolean;
}

export const FlexibleButton: React.FC<FlexibleButtonProps> = ({
  text,
  icon,
  iconType = IconType.Ionicons,
  iconPosition = 'left',
  variant = 'primary',
  size = 'medium',
  shape = 'rounded',
  fullWidth = false,
  backgroundColor,
  textColor,
  iconColor,
  borderColor,
  gradientColors,
  width,
  height,
  iconSize,
  fontSize,
  borderRadius,
  borderWidth,
  disabled = false,
  loading = false,
  onPress,
  onLongPress,
  activeOpacity = 0.8,
  style,
  textStyle,
  iconStyle,
  accessibilityLabel,
  accessibilityHint,
  isTablet = false,
  margin,
  marginHorizontal,
  marginVertical,
  marginBottom,
  padding,
  paddingHorizontal,
  paddingVertical,
  animationDelay = 0,
  enableHoverEffect = true,
  enablePulseEffect = false,
  enableShimmerEffect = false,
}) => {
  // Animation refs
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  // Initialisation des animations
  useEffect(() => {    
    // Animation d'entrée
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 600,
      delay: animationDelay,
      useNativeDriver: true,
    }).start();

    // Animation shimmer si activée
    if (enableShimmerEffect && !disabled) {
      const shimmerLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      shimmerLoop.start();
      return () => shimmerLoop.stop();
    }

    // Animation pulse si activée
    if (enablePulseEffect && !disabled) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    }
  }, [animationDelay, enableShimmerEffect, enablePulseEffect, disabled]);

  // Configuration des tailles avec nouveaux styles
  const sizeConfig = {
    small: {
      height: isTablet ? 42 : 38,
      paddingHorizontal: isTablet ? 16 : 14,
      paddingVertical: isTablet ? 10 : 8,
      fontSize: isTablet ? 14 : 12,
      iconSize: isTablet ? 18 : 16,
      borderRadius: 12,
      shadowRadius: 4,
    },
    medium: {
      height: isTablet ? 54 : 48,
      paddingHorizontal: isTablet ? 7 : 5,
      paddingVertical: isTablet ? 7 : 6,
      fontSize: isTablet ? 16 : 14,
      iconSize: isTablet ? 22 : 20,
      borderRadius: 10,
      shadowRadius: 6,
    },
    large: {
      height: isTablet ? 64 : 56,
      paddingHorizontal: isTablet ? 24 : 20,
      paddingVertical: isTablet ? 18 : 14,
      fontSize: isTablet ? 18 : 16,
      iconSize: isTablet ? 26 : 22,
      borderRadius: 16,
      shadowRadius: 8,
    },
    xlarge: {
      height: isTablet ? 74 : 64,
      paddingHorizontal: isTablet ? 28 : 24,
      paddingVertical: isTablet ? 22 : 18,
      fontSize: isTablet ? 20 : 18,
      iconSize: isTablet ? 30 : 26,
      borderRadius: 18,
      shadowRadius: 10,
    },
  };

  // Nouvelle configuration des variantes avec styles modernes
  interface VariantConfig {
    backgroundColor: string;
    textColor: string;
    iconColor: string;
    borderColor: string;
    borderWidth: number;
    gradientColors?: string[];
  }

  const variantConfig: Record<ButtonVariant, VariantConfig> = {
    primary: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      textColor: '#222',
      iconColor: '#222',
      borderColor: 'rgba(255, 255, 255, 0.3)',
      borderWidth: 1,
    },
    agriculture: {
      backgroundColor: 'rgba(76, 175, 80, 0.2)', // Fond vert semi-transparent
      textColor: '#C8E6C9', // Texte vert clair
      iconColor: '#A5D6A7', // Icône vert pastel
      borderColor: '#81C784', // Bordure vert moyen
      gradientColors: ['rgba(129, 199, 132, 0.3)', 'rgba(76, 175, 80, 0.4)'], // Dégradé subtil
      borderWidth: 1.5,
    },
    elevage: {
      backgroundColor: 'rgba(255, 167, 38, 0.2)', // Fond orange semi-transparent
      textColor: '#FFE0B2', // Texte orange clair
      iconColor: '#FFCC80', // Icône orange pastel
      borderColor: '#FFA726', // Bordure orange moyen
      gradientColors: ['rgba(255, 183, 77, 0.3)', 'rgba(255, 167, 38, 0.4)'], // Dégradé subtil
      borderWidth: 1.5,
    },
    admin: {
      backgroundColor: 'transparent',
      textColor: '#FFFFFF',
      iconColor: '#FFFFFF',
      borderColor: '#FFD700',
      gradientColors: ['#FFD700', '#FFA000', '#FF8F00'],
      borderWidth: 1,
    },
    manager: {
      backgroundColor: 'transparent',
      textColor: '#FFFFFF',
      iconColor: '#FFFFFF',
      borderColor: '#FF6B35',
      gradientColors: ['#FF6B35', '#E64A19'],
      borderWidth: 1,
    },
    success: {
      backgroundColor: 'transparent',
      textColor: '#FFFFFF',
      iconColor: '#FFFFFF',
      borderColor: '#00E676',
      gradientColors: ['#00E676', '#00C853', '#00BFA5'],
      borderWidth: 1,
    },
    neon: {
      backgroundColor: 'transparent',
      textColor: '#00FFFF',
      iconColor: '#00FFFF',
      borderColor: '#00FFFF',
      gradientColors: ['rgba(0, 255, 255, 0.1)', 'rgba(255, 0, 255, 0.1)'],
      borderWidth: 1,
    },
    glass: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      textColor: '#FFFFFF',
      iconColor: '#FFFFFF',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 1,
    },
    minimal: {
      backgroundColor: 'transparent',
      textColor: '#666666',
      iconColor: '#666666',
      borderColor: 'transparent',
      borderWidth: 0,
    },
    outline: {
      backgroundColor: 'transparent',
      textColor: '#667eea',
      iconColor: '#667eea',
      borderColor: '#667eea',
      borderWidth: 1,
    },
    ghost: {
      backgroundColor: 'transparent',
      textColor: '#FFFFFF',
      iconColor: '#FFFFFF',
      borderColor: 'rgba(255, 255, 255, 0.4)',
      borderWidth: 3,
    },
    danger: {
      backgroundColor: 'transparent',
      textColor: '#FFFFFF',
      iconColor: '#FFFFFF',
      borderColor: 'transparent',
      gradientColors: ['#ff416c', '#ff4757', '#ff3838'],
      borderWidth: 0,
    },
    warning: {
      backgroundColor: 'transparent',
      textColor: '#FFFFFF',
      iconColor: '#FFFFFF',
      borderColor: 'transparent',
      gradientColors: ['#ffa726', '#ff9800', '#f57c00'],
      borderWidth: 0,
    },
  };

  const currentSizeConfig = sizeConfig[size];
  const currentVariantConfig = variantConfig[variant];

  // *** UTILISATION DES COULEURS PERSONNALISÉES ***
  // Appliquer les couleurs personnalisées avec fallback sur les couleurs du variant
  const finalBackgroundColor = backgroundColor || currentVariantConfig.backgroundColor;
  const finalTextColor = textColor || currentVariantConfig.textColor;
  const finalIconColor = iconColor || currentVariantConfig.iconColor;
  const finalBorderColor = borderColor || currentVariantConfig.borderColor;
  const finalGradientColors = gradientColors || currentVariantConfig.gradientColors;

  // Gestion des interactions avec animations
  const handlePressIn = () => {
    if (enableHoverEffect && !disabled) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          useNativeDriver: true,
          speed: 50,
          bounciness: 4,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handlePressOut = () => {
    if (enableHoverEffect && !disabled) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 50,
          bounciness: 4,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  // Rendu de l'icône avec couleurs personnalisées et animations
  const renderIcon = () => {
    if (loading) {
      return (
        <Animated.View
          style={[
            iconPosition === 'right' ? { marginLeft: 8 } : { marginRight: 8 },
            iconPosition === 'top' ? { marginBottom: 4 } : {},
            iconPosition === 'bottom' ? { marginTop: 4 } : {},
          ]}
        >
          <ActivityIndicator 
            size="small" 
            color={finalIconColor} // Utilise la couleur personnalisée
          />
        </Animated.View>
      );
    }

    // Rendu des icônes legacy avec couleur personnalisée et animation
    if (icon) {
      const IconComponent = (() => {
        switch (iconType) {
          case IconType.MaterialCommunityIcons: return MaterialCommunityIcons;
          case IconType.FontAwesome: return FontAwesome;
          case IconType.Feather: return Feather;
          default: return Ionicons;
        }
      })();

      return (
        <Animated.View
          style={[
            iconPosition === 'right' ? { marginLeft: 8 } : { marginRight: 8 },
            iconPosition === 'top' ? { marginBottom: 4 } : {},
            iconPosition === 'bottom' ? { marginTop: 4 } : {},
            {
              transform: [{
                scale: enableHoverEffect ? scaleAnim.interpolate({
                  inputRange: [0.95, 1],
                  outputRange: [1.1, 1],
                }) : 1
              }]
            }
          ]}
        >
          <IconComponent
            name={icon}
            size={iconSize || currentSizeConfig.iconSize}
            color={finalIconColor} // Utilise la couleur personnalisée
            style={iconStyle}
          />
        </Animated.View>
      );
    }

    return null;
  };

  // Calcul du borderRadius selon la forme
  const getBorderRadius = () => {
    if (borderRadius !== undefined) return borderRadius;
    
    switch (shape) {
      case 'pill':
        return (height || currentSizeConfig.height) / 2;
      case 'circle':
        return (height || currentSizeConfig.height) / 2;
      case 'square':
        return 0;
      case 'organic':
        return currentSizeConfig.borderRadius * 2;
      default:
        return currentSizeConfig.borderRadius;
    }
  };

  // Styles du bouton avec couleurs personnalisées appliquées
  const buttonStyle: StyleProp<ViewStyle> = StyleSheet.flatten([
    {
      height: height || currentSizeConfig.height,
      paddingHorizontal: paddingHorizontal || currentSizeConfig.paddingHorizontal,
      paddingVertical: paddingVertical || currentSizeConfig.paddingVertical,
      borderRadius: getBorderRadius(),
      borderWidth: borderWidth ?? currentVariantConfig.borderWidth,
      borderColor: finalBorderColor, // Utilise la couleur personnalisée
      opacity: disabled ? 0.5 : 1,
      flexDirection: iconPosition === 'top' || iconPosition === 'bottom' ? 'column' : 'row',
      justifyContent: 'center',
      alignItems: 'center',
      shadowRadius: currentSizeConfig.shadowRadius,
      overflow: 'hidden',
    },
    shape === 'circle'
      ? {
          width: height || currentSizeConfig.height,
          paddingHorizontal: 0,
        }
      : undefined,
    fullWidth ? { width: '100%' } : undefined,
    width ? { width: typeof width === 'number' ? width : width as DimensionValue } : undefined,
    margin ? { margin } : undefined,
    marginHorizontal ? { marginHorizontal } : undefined,
    marginBottom ? { marginBottom } : undefined,
    marginVertical ? { marginVertical } : undefined,
    padding ? { padding } : undefined,
    style,
  ]);

  const textStyleConfig: StyleProp<TextStyle> = [
    {
      fontSize: fontSize || currentSizeConfig.fontSize,
      color: finalTextColor, // Utilise la couleur personnalisée
      fontWeight: '700',
      textAlign: 'center',
      letterSpacing: 0.5,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    textStyle,
  ];

  // Composant de contenu avec animations
  const ButtonContent = () => {
    const iconElement = renderIcon();
    const textElement = text ? (
      <Animated.Text 
        style={[
          textStyleConfig,
          {
            transform: [{
              scale: enableHoverEffect ? scaleAnim.interpolate({
                inputRange: [0.95, 1],
                outputRange: [1.02, 1],
              }) : 1
            }]
          }
        ]}
      >
        {text}
      </Animated.Text>
    ) : null;

    const content = (() => {
      switch (iconPosition) {
        case 'right': return <>{textElement}{iconElement}</>;
        case 'top': return <>{iconElement}{textElement}</>;
        case 'bottom': return <>{textElement}{iconElement}</>;
        default: return <>{iconElement}{textElement}</>;
      }
    })();

    return (
      <View style={{ flexDirection: iconPosition === 'top' || iconPosition === 'bottom' ? 'column' : 'row', alignItems: 'center', justifyContent: 'center' }}>
        {content}
      </View>
    );
  };

  // Shimmer effect overlay
  const ShimmerOverlay = () => {
    if (!enableShimmerEffect || disabled) return null;
    
    return (
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: getBorderRadius(),
            opacity: shimmerAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.3],
            }),
          }
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.5)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    );
  };

  // Rendu avec animations et effets - couleurs personnalisées appliquées
  return (
    <Animated.View
      style={[
        buttonStyle,
        {
          opacity: opacityAnim,
          transform: [
            { scale: enablePulseEffect ? pulseAnim : scaleAnim },
          ],
        }
      ]}
    >
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={disabled || loading ? undefined : onPress}
        onLongPress={disabled || loading ? undefined : onLongPress}
        activeOpacity={activeOpacity}
        disabled={disabled || loading}
        style={{ flex: 1, width: '100%' }}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
      >

        {/* Application des couleurs personnalisées pour le fond */}
        {finalGradientColors && variant !== 'outline' && variant !== 'ghost' && variant !== 'minimal' ? (
          <LinearGradient
            colors={finalGradientColors} // Utilise les couleurs personnalisées du gradient
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: getBorderRadius() }
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        ) : (
          <View 
            style={[
              StyleSheet.absoluteFill,
              { 
                backgroundColor: finalBackgroundColor, // Utilise la couleur de fond personnalisée
                borderRadius: getBorderRadius()
              }
            ]} 
          />
        )}
        
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
          <ButtonContent />
        </View>
        
        <ShimmerOverlay />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Composants de boutons prédéfinis avec nouveaux styles
export const ModernButton: React.FC<Omit<FlexibleButtonProps, 'variant'>> = (props) => (
  <FlexibleButton {...props} variant="primary" enableHoverEffect enableShimmerEffect />
);

export const NeonButton: React.FC<Omit<FlexibleButtonProps, 'variant'>> = (props) => (
  <FlexibleButton {...props} variant="neon" enableHoverEffect enablePulseEffect />
);

export const GlassButton: React.FC<Omit<FlexibleButtonProps, 'variant'>> = (props) => (
  <FlexibleButton {...props} variant="glass" enableHoverEffect />
);

export const GhostButton: React.FC<Omit<FlexibleButtonProps, 'variant'>> = (props) => (
  <FlexibleButton {...props} variant="ghost" enableHoverEffect />
);

export const AdminButton: React.FC<Omit<FlexibleButtonProps, 'variant'>> = (props) => (
  <FlexibleButton {...props} variant="admin" enableHoverEffect enableShimmerEffect />
);

export const ManagerButton: React.FC<Omit<FlexibleButtonProps, 'variant'>> = (props) => (
  <FlexibleButton {...props} variant="manager" enableHoverEffect enableShimmerEffect />
);

// Composants de boutons prédéfinis pour l'agriculture
export const AgricultureButton: React.FC<Omit<FlexibleButtonProps, 'iconPreset'>> = (props) => (
  <FlexibleButton {...props} variant='agriculture' enableHoverEffect />
);

// Composants de boutons prédéfinis pour l'élevage
export const ElevageButton: React.FC<Omit<FlexibleButtonProps, 'iconPreset'>> = (props) => (
  <FlexibleButton {...props} variant='elevage' enableHoverEffect />
);

export default FlexibleButton;