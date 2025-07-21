import React, { useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  useWindowDimensions, 
  Image,
  Text,
  Animated,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Platform
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from "../contexts/AuthContext";
import { AdminButton, AgricultureButton, ElevageButton, GhostButton, GlassButton, ManagerButton, NeonButton } from "../components/Button/Buttons";
import { ICON } from "../constants/assets";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from '../types/navigations';
import LinearGradient from 'react-native-linear-gradient';
import { IconName } from '../constants/icons';
import { IconType } from '../enums/Button/buttons';
import { showErrorToast } from '../constants/shows';

type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>;

interface WelcomeScreenProps {
  navigation: WelcomeScreenNavigationProp;
}

interface WelcomeMessageProps {
  username?: string;
  isLandscape: boolean;
  isTablet: boolean;
  message: string;
  subWelcomeUser: string;
  subWelcomeNotUser: string;
  fadeAnim: Animated.Value;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({
  username,
  isLandscape,
  isTablet,
  message,
  subWelcomeUser,
  subWelcomeNotUser,
  fadeAnim
}) => (
  <Animated.View 
    style={[
      styles.messageContainer, 
      isLandscape && styles.messageLandscape,
      isTablet && styles.messageTablet,
      { 
        opacity: fadeAnim,
        transform: [{
          translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })
        }]
      }
    ]}
  >
    <View style={styles.welcomeTextContainer}>
      <Text style={[
        styles.welcomeTitle, 
        isTablet && styles.welcomeTitleTablet
      ]} 
      accessibilityRole="header">
        {message}
        {username && (
          <Text style={styles.usernameHighlight}> {username}!</Text>
        )}
      </Text>
      <Animated.View style={[
        styles.titleUnderline,
        {
          transform: [{
            scaleX: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1]
            })
          }]
        }
      ]} />
      <Text style={[
        styles.welcomeSubtitle,
        isTablet && styles.welcomeSubtitleTablet
      ]}>
        {username ? subWelcomeUser : subWelcomeNotUser}
      </Text>
    </View>
  </Animated.View>
);

const WelcomeScreen = ({ navigation }: WelcomeScreenProps) => {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const { userData, isLoading, isAuthenticated } = useAuth();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const buttonsSlideAnim = useRef(new Animated.Value(100)).current;
  const bgScaleAnim = useRef(new Animated.Value(1.1)).current;

  const isLandscape = width > height;
  const isTablet = width >= 768;
  const isSmallDevice = width < 375;

  // Animation sequence
  useEffect(() => {
    const animationSequence = Animated.parallel([
      Animated.spring(logoScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(buttonsSlideAnim, {
        toValue: 0,
        duration: 600,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.timing(bgScaleAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ]);

    animationSequence.start();
  }, [fadeAnim, logoScaleAnim, buttonsSlideAnim, bgScaleAnim]);

  const handleLogin = useCallback(() => {
    navigation.navigate('Login');
  }, [navigation]);

  const handleAdminDashboard = useCallback(() => {
    showErrorToast('indisponibles');
    // navigation.navigate('AdminDashboard');
  }, [navigation]);

  const handleAgricultureManagement = useCallback(() => {
    showErrorToast('indisponibles');
    // navigation.navigate('AgroManagement');
  }, [navigation]);

  const handleElevageManagement = useCallback(() => {
    navigation.navigate('ElevageManagement');
  }, [navigation]);

  const welcomeMessageProps = useMemo(() => ({
    username: userData?.username,
    isLandscape,
    isTablet,
    message: t('app.welcome'),
    subWelcomeUser: t('app.subWelcomeUser'),
    subWelcomeNotUser: t('app.subWelcomeNotUser'),
    fadeAnim
  }), [userData, isLandscape, isTablet, t, fadeAnim]);

  const actionButtons = useMemo(() => {
    if (isLoading) return null;

    const buttonSize = isTablet ? 'large' : 'medium';

    if (isAuthenticated) {
      if (userData?.role === 'admin') {
        return (
          <View style={styles.buttonsGrid}>
            <AdminButton
              onPress={handleAdminDashboard}
              icon="settings"
              text={t('app.adminDashboard')}
              size={buttonSize}
              isTablet={isTablet}
              accessibilityLabel={t('app.adminDashboard')}
            />
            <View style={styles.managementButtonsRow}>
              <View style={styles.halfButton}>
                <AgricultureButton
                  onPress={handleAgricultureManagement}
                  icon={IconName.Agriculture}
                  text={t('app.agriculture')}
                  variant="success"
                  size={buttonSize}
                  isTablet={isTablet}
                  accessibilityLabel={t('app.agriculture')}
                />
              </View>
              <View style={styles.halfButton}>
                <ManagerButton
                  onPress={handleElevageManagement}
                  icon={IconName.Elevage}
                  text={t('app.elevage')}
                  size={buttonSize}
                  isTablet={isTablet}
                  accessibilityLabel={t('app.elevage')}
                />
              </View>
            </View>
            <GhostButton
              onPress={handleLogin}
              icon={IconName.Login}
              iconType={IconType.MaterialCommunityIcons}
              text={t('auth.changeAccount')}
              size={buttonSize}
              isTablet={isTablet}
              accessibilityLabel={t('auth.changeAccount')}
            />
          </View>
        );
      }

      if (userData?.role === 'manager') {
        return (
          <View style={styles.buttonsGrid}>
            <View style={styles.managementButtonsRow}>
              <View style={styles.halfButton}>
                <AgricultureButton
                  onPress={handleAgricultureManagement}
                  icon={IconName.Agriculture}
                  iconType={IconType.MaterialCommunityIcons}
                  text={t('app.agriculture')}
                  size={buttonSize}
                  isTablet={isTablet}
                  accessibilityLabel={t('app.agriculture')}
                />
              </View>
              <View style={styles.halfButton}>
                <ElevageButton
                  onPress={handleElevageManagement}
                  icon={IconName.Elevage}
                  iconType={IconType.MaterialCommunityIcons}
                  text={t('app.elevage')}
                  size={buttonSize}
                  isTablet={isTablet}
                  accessibilityLabel={t('app.elevage')}
                />
              </View>
            </View>
            <GlassButton
              onPress={handleAdminDashboard}
              icon={IconName.Home}
              text={t('app.dashboard')}
              size={buttonSize}
              isTablet={isTablet}
              marginVertical={20}
              accessibilityLabel={t('app.dashboard')}
            />
            <NeonButton
              onPress={handleLogin}
              icon={IconName.Login}
              iconType={IconType.MaterialCommunityIcons}
              text={t('auth.changeAccount')}
              size={buttonSize}
              isTablet={isTablet}
              accessibilityLabel={t('auth.changeAccount')}
            />
          </View>
        );
      }

      if (userData?.role === 'manager_agro') {
        return (
          <View style={styles.buttonsGrid}>
            <AgricultureButton
              onPress={handleAgricultureManagement}
              icon={IconName.Agriculture}
              text={t('app.agriculture')}
              variant="success"
              size={buttonSize}
              isTablet={isTablet}
              accessibilityLabel={t('app.agriculture')}
            />
            <GhostButton
              onPress={handleLogin}
              icon={IconName.Login}
              text={t('auth.changeAccount')}
              size={buttonSize}
              isTablet={isTablet}
              accessibilityLabel={t('auth.changeAccount')}
            />
          </View>
        );
      }

      if (userData?.role === 'manager_elevage') {
        return (
          <View style={styles.buttonsGrid}>
            <ElevageButton
              onPress={handleElevageManagement}
              icon={IconName.Elevage}
              text={t('app.elevage')}
              variant="manager"
              size={buttonSize}
              isTablet={isTablet}
              accessibilityLabel={t('app.elevage')}
            />
            <GhostButton
              onPress={handleLogin}
              icon={IconName.Login}
              text={t('auth.changeAccount')}
              size={buttonSize}
              isTablet={isTablet}
              accessibilityLabel={t('auth.changeAccount')}
            />
          </View>
        );
      }

      return (
        <View style={styles.buttonsGrid}>
          <GhostButton
            onPress={handleLogin}
            icon={IconName.Login}
            iconType={IconType.MaterialCommunityIcons}
            text={t('auth.changeAccount')}
            size={buttonSize}
            isTablet={isTablet}
            accessibilityLabel={t('auth.changeAccount')}
          />
        </View>
      );
    }

    return (
      <View style={styles.buttonsGrid}>
        <GhostButton
          onPress={handleLogin}
          icon={IconName.Login}
          iconType={IconType.MaterialCommunityIcons}
          text={t('auth.login')}
          size={buttonSize}
          isTablet={isTablet}
          accessibilityLabel={t('auth.login')}
        />
      </View>
    );
  }, [
    isLoading, 
    isAuthenticated, 
    userData?.role, 
    handleLogin, 
    handleAdminDashboard,
    handleAgricultureManagement,
    handleElevageManagement,
    t, 
    isTablet,
    buttonsSlideAnim
  ]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent 
      />
      <Animated.View style={[styles.background, {
        transform: [{ scale: bgScaleAnim }]
      }]}>
        <LinearGradient
          colors={['#0a2f23', '#1a4d3a', '#2d5a47', '#4CAF50']}
          locations={[0, 0.3, 0.7, 1]}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <ScrollView 
            contentContainerStyle={[
              styles.scrollContainer,
              isLandscape && styles.scrollContainerLandscape,
              isTablet && styles.scrollContainerTablet
            ]}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {isLandscape ? (
              <View style={styles.landscapeContainer}>
                <View style={styles.leftSection}>
                  <Animated.View style={[
                    { 
                      transform: [{ 
                        scale: logoScaleAnim.interpolate({
                          inputRange: [0.8, 1],
                          outputRange: [0.8, 1]
                        }) 
                      }] 
                    }
                  ]}>
                    <View style={styles.logoWrapper}>
                      <Image 
                        source={ICON} 
                        style={[
                          styles.logo,
                          isTablet && styles.logoTablet
                        ]} 
                        accessibilityIgnoresInvertColors
                        accessibilityLabel={t('app.logo')}
                      />
                      <Animated.View style={[
                        styles.logoGlow,
                        {
                          opacity: logoScaleAnim.interpolate({
                            inputRange: [0.8, 1],
                            outputRange: [0, 1]
                          })
                        }
                      ]} />
                    </View>
                  </Animated.View>
                  
                  <WelcomeMessage {...welcomeMessageProps} />
                </View>
                
                <View style={styles.rightSection}>
                  <View style={styles.buttonsContainer}>
                    {actionButtons}
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.portraitContainer}>
                <Animated.View style={[
                  { 
                    transform: [{ 
                      scale: logoScaleAnim.interpolate({
                        inputRange: [0.8, 1],
                        outputRange: [0.8, 1]
                      }) 
                    }] 
                  }
                ]}>
                  <View style={styles.logoWrapper}>
                    <Image 
                      source={ICON} 
                      style={[
                        styles.logo,
                        isTablet && styles.logoTablet,
                        isSmallDevice && styles.logoSmall
                      ]} 
                      accessibilityIgnoresInvertColors
                      accessibilityLabel={t('app.logo')}
                    />
                    <Animated.View style={[
                      styles.logoGlow,
                      {
                        opacity: logoScaleAnim.interpolate({
                          inputRange: [0.8, 1],
                          outputRange: [0, 1]
                        })
                      }
                    ]} />
                  </View>
                </Animated.View>
                
                <WelcomeMessage {...welcomeMessageProps} />
                
                <View style={styles.buttonsContainer}>
                  {actionButtons}
                </View>
              </View>
            )}
          </ScrollView>
        </LinearGradient>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a2f23',
  },
  background: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: '100%',
    padding: 24,
  },
  scrollContainerLandscape: {
    paddingHorizontal: 40,
    paddingVertical: 24,
  },
  scrollContainerTablet: {
    paddingHorizontal: 80,
    paddingVertical: 40,
  },
  portraitContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '100%',
    paddingBottom: 100,
  },
  landscapeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  leftSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 40,
  },
  rightSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 40,
    maxWidth: 500,
  },
  
  logoWrapper: {
    position: 'relative',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 20,
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  logoTablet: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 5,
  },
  logoSmall: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
  },
  logoGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 120,
    backgroundColor: 'rgba(76, 175, 80, 0.25)',
    zIndex: -1,
  },
  
  messageContainer: {
    alignItems: 'center',
    marginBottom: 60,
    paddingHorizontal: 20,
  },
  messageLandscape: {
    marginBottom: 20,
    paddingHorizontal: 0,
  },
  messageTablet: {
    marginBottom: 50,
    paddingHorizontal: 40,
  },
  welcomeTextContainer: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  welcomeTitleTablet: {
    fontSize: 44,
    marginBottom: 16,
  },
  usernameHighlight: {
    color: '#81C784',
    fontWeight: '800',
    textShadowColor: 'rgba(129, 199, 132, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleUnderline: {
    width: 100,
    height: 4,
    backgroundColor: '#81C784',
    borderRadius: 2,
    marginBottom: 20,
    transformOrigin: 'center',
    shadowColor: '#81C784',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '400',
    maxWidth: 320,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  welcomeSubtitleTablet: {
    fontSize: 22,
    lineHeight: 32,
    maxWidth: 450,
  },
  
  buttonsContainer: {
    width: '100%',
    maxWidth: 450,
  },
  buttonsGrid: {
    width: '100%',
    marginBottom: 15,
  },
  managementButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  halfButton: {
    flex: 1,
  },
  buttonText: {
    fontWeight: '700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonTextTablet: {
    fontSize: 18,
    letterSpacing: 0.8,
  },
});

export default React.memo(WelcomeScreen);