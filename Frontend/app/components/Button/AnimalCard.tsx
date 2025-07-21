import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type ButtonCardVariant = 'Avicole' | 'Bovin' | 'Ovin' | 'Caprin' | 'Piscicole';

export interface AnimalCardProps {
  variant: ButtonCardVariant;
  title?: string;
  subtitle?: string;
  count?: number;
  health?: number;
  production?: number;
  lastUpdate?: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: any;
  showDetails?: boolean;
  isNew?: boolean;
  isUrgent?: boolean;
}

interface VariantConfig {
  icon: string;
  gradientColors: string[];
  accentColor: string;
  lightColor: string;
  darkColor: string;
  iconBackgroundColor: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const VARIANT_CONFIGS: Record<ButtonCardVariant, VariantConfig> = {
  Avicole: {
    icon: 'bird',
    gradientColors: ['#FFF9C4', '#FFE082', '#FFD54F'],
    accentColor: '#F9A825',
    lightColor: '#FFF59D',
    darkColor: '#F57F17',
    iconBackgroundColor: 'rgba(255, 235, 59, 0.2)',
  },
  Bovin: {
    icon: 'cow',
    gradientColors: ['#EFEBE9', '#D7CCC8', '#BCAAA4'],
    accentColor: '#6D4C41',
    lightColor: '#D7CCC8',
    darkColor: '#3E2723',
    iconBackgroundColor: 'rgba(121, 85, 72, 0.2)',
  },
  Ovin: {
    icon: 'sheep',
    gradientColors: ['#FAFAFA', '#F5F5F5', '#EEEEEE'],
    accentColor: '#616161',
    lightColor: '#E0E0E0',
    darkColor: '#212121',
    iconBackgroundColor: 'rgba(158, 158, 158, 0.2)',
  },
  Caprin: {
    icon: 'sheep',
    gradientColors: ['#FFEBEE', '#FFCDD2', '#EF9A9A'],
    accentColor: '#D32F2F',
    lightColor: '#FFCDD2',
    darkColor: '#B71C1C',
    iconBackgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  Piscicole: {
    icon: 'fish',
    gradientColors: ['#E0F7FA', '#B2EBF2', '#80DEEA'],
    accentColor: '#0097A7',
    lightColor: '#B2EBF2',
    darkColor: '#006064',
    iconBackgroundColor: 'rgba(0, 188, 212, 0.2)',
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AnimalCard: React.FC<AnimalCardProps> = ({
  variant,
  title,
  subtitle,
  count = 0,
  health = 0,
  production = 0,
  lastUpdate,
  onPress,
  disabled = false,
  loading = false,
  style,
  showDetails = true,
  isNew = false,
  isUrgent = false,
}) => {
  const { t } = useTranslation();
  const { colors, borderRadius, shadows, isDark } = useTheme();
  const config = VARIANT_CONFIGS[variant];
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // State
  const [isPressed, setIsPressed] = useState(false);

  // =========================================================================
  // EFFECTS
  // =========================================================================
  
  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for urgent items
    if (isUrgent) {
      const pulse = Animated.loop(
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
      pulse.start();
      return () => pulse.stop();
    }
  }, [isUrgent]);

  // =========================================================================
  // HANDLERS
  // =========================================================================
  
  const handlePressIn = () => {
    setIsPressed(true);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        speed: 50,
        bounciness: 4,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        speed: 50,
        bounciness: 4,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // =========================================================================
  // RENDER HELPERS
  // =========================================================================
  
  const getHealthColor = (value: number) => {
    if (value >= 80) return colors.success;
    if (value >= 60) return colors.warning;
    return colors.error;
  };

  const getProductionColor = (value: number) => {
    if (value >= 85) return colors.success;
    if (value >= 70) return colors.info;
    return colors.warning;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Animated.View 
        style={[
          styles.iconContainer,
          {
            backgroundColor: config.iconBackgroundColor,
            transform: [
              {
                rotate: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '10deg'],
                }),
              },
            ],
          },
        ]}
      >
        <MaterialCommunityIcons
          name={config.icon}
          size={32}
          color={config.accentColor}
        />
      </Animated.View>
      
      <View style={styles.headerText}>
        <Text style={[styles.title, { color: isDark ? colors.text : config.darkColor }]}>
          {title || t(`animals.${variant}.title`)}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>

      {(isNew || isUrgent) && (
        <View style={[
          styles.badge,
          { backgroundColor: isUrgent ? colors.error : colors.info }
        ]}>
          <Text style={styles.badgeText}>
            {isUrgent ? t('common.urgent') : t('common.new')}
          </Text>
        </View>
      )}
    </View>
  );

  const renderStats = () => {
    if (!showDetails) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons
            name="counter"
            size={20}
            color={config.accentColor}
          />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {count.toLocaleString()}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {t('animals.count')}
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <MaterialCommunityIcons
            name="heart-pulse"
            size={20}
            color={getHealthColor(health)}
          />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {health}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {t('animals.health')}
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <MaterialCommunityIcons
            name="trending-up"
            size={20}
            color={getProductionColor(production)}
          />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {production}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {t('animals.production')}
          </Text>
        </View>
      </View>
    );
  };

  const renderProgressBars = () => {
    if (!showDetails) return null;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressItem}>
          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
            {t('animals.healthStatus')}
          </Text>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: `${health}%`,
                  backgroundColor: getHealthColor(health),
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.progressItem}>
          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
            {t('animals.productionRate')}
          </Text>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: `${production}%`,
                  backgroundColor: getProductionColor(production),
                },
              ]}
            />
          </View>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!lastUpdate && !loading) return null;

    return (
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        {loading ? (
          <ActivityIndicator size="small" color={config.accentColor} />
        ) : (
          <>
            <MaterialCommunityIcons
              name="clock-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              {t('common.lastUpdate')}: {lastUpdate}
            </Text>
          </>
        )}
      </View>
    );
  };

  // =========================================================================
  // MAIN RENDER
  // =========================================================================
  
  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [
            { scale: isUrgent ? pulseAnim : scaleAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.container,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            ...shadows.medium,
          },
          disabled && styles.disabled,
          style,
        ]}
      >
        <LinearGradient
          colors={isDark ? [colors.card, colors.background] : config.gradientColors}
          style={[styles.gradient, { borderRadius: borderRadius.large }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          locations={[0, 0.5, 1]}
        />

        <View style={styles.content}>
          {renderHeader()}
          {renderStats()}
          {renderProgressBars()}
          {renderFooter()}
        </View>

        {isPressed && (
          <Animated.View
            style={[
              styles.ripple,
              {
                backgroundColor: config.accentColor,
                opacity: 0.1,
                borderRadius: borderRadius.large,
              },
            ]}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.6,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: 8,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressItem: {
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerText: {
    fontSize: 12,
    marginLeft: 6,
  },
  ripple: {
    ...StyleSheet.absoluteFillObject,
  },
});

// ============================================================================
// PRESET COMPONENTS
// ============================================================================

export const ChickenCard: React.FC<Omit<AnimalCardProps, 'variant'>> = (props) => (
  <AnimalCard {...props} variant="Avicole" />
);

export const CowCard: React.FC<Omit<AnimalCardProps, 'variant'>> = (props) => (
  <AnimalCard {...props} variant="Bovin" />
);

export const SheepCard: React.FC<Omit<AnimalCardProps, 'variant'>> = (props) => (
  <AnimalCard {...props} variant="Ovin" />
);

export const GoatCard: React.FC<Omit<AnimalCardProps, 'variant'>> = (props) => (
  <AnimalCard {...props} variant="Caprin" />
);

export const FishCard: React.FC<Omit<AnimalCardProps, 'variant'>> = (props) => (
  <AnimalCard {...props} variant="Piscicole" />
);

export default AnimalCard;