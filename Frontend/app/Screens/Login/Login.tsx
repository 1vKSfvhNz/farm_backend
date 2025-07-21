import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  Text, 
  Image, 
  Keyboard, 
  SafeAreaView,
  StatusBar,
  Platform,
  useWindowDimensions,
  ScrollView,
  Animated,
  TouchableOpacity
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import { RootStackParamList } from '../../types/navigations';
import { LOGO } from '../../constants/assets';
import { showErrorToast } from '../../constants/shows';
import { IP } from '../../constants/network';
import { GhostButton } from '../../components/Button/Buttons';
import { IconName } from '../../constants/icons';
import LinearGradient from 'react-native-linear-gradient';
import { IconType } from '../../enums/Button/buttons';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
} 

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { width, height } = useWindowDimensions();
  
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const formSlideAnim = useRef(new Animated.Value(50)).current;
  const bgScaleAnim = useRef(new Animated.Value(1.1)).current;
  const recoveryLinkAnim = useRef(new Animated.Value(0)).current;

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
      Animated.timing(formSlideAnim, {
        toValue: 0,
        duration: 600,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.timing(bgScaleAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(recoveryLinkAnim, {
        toValue: 1,
        duration: 700,
        delay: 600,
        useNativeDriver: true,
      })
    ]);

    animationSequence.start();
  }, [fadeAnim, logoScaleAnim, formSlideAnim, bgScaleAnim, recoveryLinkAnim]);

  const isFormValid = (): boolean => {
    return phone.trim().length > 10 && code.trim().length === 6;
  };

  const handleLogin = async (): Promise<void> => {
    if (!isFormValid()) {
      showErrorToast(t('auth.verifyPhoneOrPassword'));
      return;
    }

    Keyboard.dismiss();
    setIsLoading(true);

    try {
      const response = await fetch(`${IP}/api/v1/managers/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone,
          code: code,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await login(data.access_token, data.token_expire);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        });
      } else {
        showErrorToast(data.message);
      }
    } catch (error) {
      showErrorToast(t('general.server_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToWelcome = () => {
    navigation.navigate('Welcome');
  };

  const handleRecovery = () => {
    navigation.navigate('Recovery');
  };

  const RecoveryLink = () => (
    <Animated.View style={[
      styles.recoveryContainer,
      {
        opacity: recoveryLinkAnim,
        transform: [{
          translateY: recoveryLinkAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [10, 0]
          })
        }]
      }
    ]}>
      <TouchableOpacity 
        onPress={handleRecovery}
        style={styles.recoveryLink}
        disabled={isLoading}
        activeOpacity={0.7}
        accessibilityLabel={t('auth.forgotPassword')}
        accessibilityRole="button"
      >
        <Text style={[
          styles.recoveryText,
          isTablet && styles.recoveryTextTablet
        ]}>
          {t('auth.forgotPassword')}
        </Text>
        <View style={styles.recoveryUnderline} />
      </TouchableOpacity>
    </Animated.View>
  );

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
            keyboardShouldPersistTaps="handled"
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
                        source={LOGO} 
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
                  
                  <Animated.View 
                    style={[
                      styles.titleContainer,
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
                    <Text style={[
                      styles.title, 
                      isTablet && styles.titleTablet
                    ]}>
                      {t('auth.login')}
                    </Text>
                  </Animated.View>

                  <RecoveryLink />
                </View>
                
                <View style={styles.rightSection}>
                  <Animated.View style={[
                    styles.formContainer,
                    {
                      opacity: fadeAnim,
                      transform: [{
                        translateY: formSlideAnim
                      }]
                    }
                  ]}>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={[
                          styles.input,
                          isTablet && styles.inputTablet
                        ]}
                        placeholder={t('auth.phone')}
                        value={phone}
                        onChangeText={setPhone}
                        autoCapitalize="none"
                        placeholderTextColor="rgba(255, 255, 255, 0.6)"
                        accessibilityLabel={t('auth.phone')}
                        keyboardType="phone-pad"
                        editable={!isLoading}
                      />
                    </View>
                    
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={[
                          styles.input,
                          isTablet && styles.inputTablet
                        ]}
                        placeholder={t('auth.code')}
                        value={code}
                        onChangeText={setCode}
                        secureTextEntry
                        placeholderTextColor="rgba(255, 255, 255, 0.6)"
                        accessibilityLabel={t('auth.code')}
                        keyboardType="phone-pad"
                        editable={!isLoading}
                      />
                    </View>
                    
                    <View style={styles.buttonsContainer}>
                      <GhostButton
                        text={isLoading ? t('auth.loading') : t('auth.loginButton')}
                        onPress={handleLogin}
                        size={isTablet ? 'large' : 'medium'}
                        fullWidth
                        disabled={!isFormValid() || isLoading}
                        loading={isLoading}
                        icon={isLoading ? undefined : IconName.Login}
                        enableHoverEffect
                        enableShimmerEffect={!isLoading}
                        accessibilityLabel={t('auth.loginButton')}
                      />
                      
                      <GhostButton
                        text={t('auth.backToWelcome')}
                        onPress={handleBackToWelcome}
                        size={isTablet ? 'large' : 'medium'}
                        fullWidth
                        icon="arrow-back"
                        disabled={isLoading}
                        accessibilityLabel={t('auth.backToWelcome')}
                      />
                    </View>
                  </Animated.View>
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
                      source={LOGO} 
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
                
                <View style={styles.headerSection}>
                  <Animated.View 
                    style={[
                      styles.titleContainer,
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
                    <Text style={[
                      styles.title, 
                      isTablet && styles.titleTablet
                    ]}>
                      {t('auth.login')}
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
                  </Animated.View>

                  <RecoveryLink />
                </View>
                
                <Animated.View style={[
                  styles.formContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{
                      translateY: formSlideAnim
                    }]
                  }
                ]}>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        isTablet && styles.inputTablet
                      ]}
                      placeholder={t('auth.phone')}
                      value={phone}
                      onChangeText={setPhone}
                      autoCapitalize="none"
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                      accessibilityLabel={t('auth.phone')}
                      keyboardType="phone-pad"
                      editable={!isLoading}
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        isTablet && styles.inputTablet
                      ]}
                      placeholder={t('auth.code')}
                      value={code}
                      onChangeText={setCode}
                      secureTextEntry
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                      accessibilityLabel={t('auth.code')}
                      keyboardType="phone-pad"
                      editable={!isLoading}
                    />
                  </View>
                  
                  <View style={styles.buttonsContainer}>
                    <GhostButton
                      text={isLoading ? t('auth.loading') : t('auth.loginButton')}
                      onPress={handleLogin}
                      size={isTablet ? 'large' : 'medium'}
                      fullWidth
                      disabled={!isFormValid() || isLoading}
                      loading={isLoading}
                      icon={isLoading ? undefined : IconName.Login}
                      iconType={IconType.MaterialCommunityIcons}
                      enableHoverEffect
                      enableShimmerEffect={!isLoading}
                      accessibilityLabel={t('auth.loginButton')}
                      marginBottom={16}
                    />
                    
                    <GhostButton
                      text={t('auth.backToWelcome')}
                      onPress={handleBackToWelcome}
                      size={isTablet ? 'large' : 'medium'}
                      fullWidth
                      icon="arrow-back"
                      disabled={isLoading}
                      accessibilityLabel={t('auth.backToWelcome')}
                    />
                  </View>
                </Animated.View>
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
    paddingBottom: 40,
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
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  logoTablet: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 5,
  },
  logoSmall: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
  },
  logoGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 100,
    backgroundColor: 'rgba(76, 175, 80, 0.25)',
    zIndex: -1,
  },
  
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  titleTablet: {
    fontSize: 40,
    marginBottom: 16,
  },
  titleUnderline: {
    width: 80,
    height: 4,
    backgroundColor: '#81C784',
    borderRadius: 2,
    transformOrigin: 'center',
    shadowColor: '#81C784',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  
  recoveryContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  recoveryLink: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  recoveryText: {
    fontSize: 16,
    color: '#81C784',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  recoveryTextTablet: {
    fontSize: 18,
  },
  recoveryUnderline: {
    width: '100%',
    height: 2,
    backgroundColor: '#81C784',
    borderRadius: 1,
    opacity: 0.7,
  },
  
  formContainer: {
    width: '100%',
    marginBottom: 50,
    maxWidth: 400,
  },
  inputContainer: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  inputTablet: {
    height: 64,
    fontSize: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  
  buttonsContainer: {
    marginTop: 20,
    width: '100%',
  },
});

export default React.memo(LoginScreen);