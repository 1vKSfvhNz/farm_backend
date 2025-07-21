import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';
import { IconType } from '../../enums/Button/buttons';

interface GestionButtonProps {
  text: string;
  icon?: string;
  iconType?: IconType;
  onPress: () => void;
  primary?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradientColors?: string[];
  isTablet?: boolean;
  disabled?: boolean;
}

const GestionButton: React.FC<GestionButtonProps> = ({
  text,
  icon,
  iconType = IconType.MaterialCommunityIcons,
  onPress,
  primary = false,
  style,
  textStyle,
  gradientColors,
  isTablet = false,
  disabled = false,
}) => {
  const { colors, spacing, typography } = useTheme();

  const defaultGradientColors = gradientColors || [
    primary ? colors.primary : colors.secondary,
    primary ? colors.primaryDark : colors.secondaryDark,
  ];

  const renderIcon = () => {
    if (!icon) return null;

    const iconSize = isTablet ? 26 : 24; // Taille réduite pour éviter le débordement
    const iconStyle = [
      styles.icon, 
      { 
        color: colors.white,
        textAlign: 'center',
        // Assure que l'icône reste centrée
        minWidth: iconSize,
        textAlignVertical: 'center',
      }
    ];

    switch (iconType) {
      case IconType.Ionicons:
        return <Ionicons name={icon} size={iconSize} style={iconStyle} />;
      case IconType.FontAwesome:
        return <FontAwesome name={icon} size={iconSize} style={iconStyle} />;
      case IconType.Feather:
        return <Feather name={icon} size={iconSize} style={iconStyle} />;
      case IconType.MaterialCommunityIcons:
      default:
        return <Icon name={icon} size={iconSize} style={iconStyle} />;
    }
  };

  const buttonContent = (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: gradientColors ? 'transparent' : (primary ? colors.primary : colors.secondary),
          opacity: disabled ? 0.6 : 1,
          paddingHorizontal: isTablet ? spacing.large : spacing.medium,
          paddingVertical: isTablet ? spacing.medium : spacing.small,
          minHeight: isTablet ? 88 : 80,
        },
        style,
      ]}
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      <View style={[
        styles.content,
        {
          paddingHorizontal: 8, // Padding interne pour éviter les débordements
        }
      ]}>
        {icon && (
          <View style={styles.iconContainer}>
            {renderIcon()}
          </View>
        )}
        <Text
          style={[
            styles.text,
            {
              color: colors.white,
              fontSize: isTablet ? typography.button.fontSize * 1.05 : typography.button.fontSize * 0.95,
              fontWeight: typography.button.fontWeight,
              flex: 1, // Permet au texte de prendre l'espace disponible
            },
            textStyle,
          ]}
          numberOfLines={2} // Permet le retour à la ligne si nécessaire
          adjustsFontSizeToFit={true} // Ajuste la taille si nécessaire
          minimumFontScale={0.8} // Taille minimale
        >
          {text}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (gradientColors) {
    return (
      <LinearGradient
        colors={defaultGradientColors}
        style={[styles.gradientContainer, style]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {buttonContent}
      </LinearGradient>
    );
  }

  return buttonContent;
};

const styles = StyleSheet.create({
  gradientContainer: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  container: {
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    overflow: 'hidden', // Évite le débordement du contenu
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
    minHeight: 48, // Hauteur minimale pour le contenu
  },
  iconContainer: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32, // Largeur minimale pour l'icône
  },
  icon: {
    // Styles pour l'icône définis dans renderIcon
  },
  text: {
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.4,
    lineHeight: 20,
    flexShrink: 1, // Permet au texte de se rétrécir si nécessaire
  },
});

export default GestionButton;