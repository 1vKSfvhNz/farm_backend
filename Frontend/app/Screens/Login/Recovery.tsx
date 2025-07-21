import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Platform,
  ScrollView,
  StatusBar,
  Keyboard,
  TouchableOpacity,
  useWindowDimensions,
  Animated
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { StackNavigationProp } from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import { RootStackParamList } from '../../types/navigations';
import { showErrorToast } from '../../constants/shows';
import { LOGO } from '../../constants/assets';
import { IP } from '../../constants/network';
import { GhostButton } from '../../components/Button/Buttons';
import { IconName } from '../../constants/icons';

type RecoveryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Recovery'>;

interface RecoveryScreenProps {
  navigation: RecoveryScreenNavigationProp;
}

type RecoveryState = 'phone' | 'verification' | 'newCode' | 'success';

const RecoveryScreen = ({ navigation }: RecoveryScreenProps) => {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newCode, setNewCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<RecoveryState>('phone');
  const [showCode, setShowCode] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const formSlideAnim = useRef(new Animated.Value(50)).current;
  const bgScaleAnim = useRef(new Animated.Value(1.1)).current;
  const stepAnim = useRef(new Animated.Value(0)).current;

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
      Animated.timing(stepAnim, {
        toValue: 1,
        duration: 700,
        delay: 600,
        useNativeDriver: true,
      })
    ]);

    animationSequence.start();
  }, [fadeAnim, logoScaleAnim, formSlideAnim, bgScaleAnim, stepAnim]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(formSlideAnim, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(formSlideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();
  }, [currentStep]);

  const isPhoneValid = (phone: string): boolean => {
    return phone.trim().length > 10;
  };

  const handleSendCode = async (): Promise<void> => {
    if (!isPhoneValid(phone)) {
      showErrorToast(t('recovery.verifyPhone'));
      return;
    }

    setIsLoading(true);
    Keyboard.dismiss();

    try {
      const response = await fetch(`${IP}/api/v1/managers/auth/forget_code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: phone }),
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentStep('verification');
      } else {
        showErrorToast(data.message || t('general.server_error'));
      }
    } catch (error) {
      showErrorToast(t('general.server_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (): Promise<void> => {
    if (verificationCode.length < 4) {
      showErrorToast(t('recovery.verifyOTP'));
      return;
    }

    setIsLoading(true);
    Keyboard.dismiss();

    try {
      const response = await fetch(`${IP}/api/v1/managers/auth/verify_code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          phone: phone, 
          code: verificationCode 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentStep('newCode');
      } else {
        showErrorToast(data.message || t('recovery.errorOTP'));
      }
    } catch (error) {
      showErrorToast(t('recovery.errorOTP'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetNewCode = async (): Promise<void> => {
    if (newCode.length < 4) {
      showErrorToast(t('recovery.errorLengthCode'));
      return;
    }

    if (newCode !== confirmCode) {
      showErrorToast(t('recovery.errorCorrespondingCode'));
      return;
    }

    setIsLoading(true);
    Keyboard.dismiss();

    try {
      const response = await fetch(`${IP}/api/v1/managers/auth/reset_code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone,
          code: verificationCode,
          new_code: newCode,
          confirm_code: confirmCode
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentStep('success');
      } else {
        showErrorToast(data.message || t('recovery.errorUpdateCode'));
      }
    } catch (error) {
      showErrorToast(t('recovery.errorUpdateCode'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = (): void => {
    navigation.navigate('Login');
  };

  const handleBack = (): void => {
    if (currentStep === 'phone') {
      navigation.goBack();
    } else if (currentStep === 'verification') {
      setCurrentStep('phone');
    } else if (currentStep === 'newCode') {
      setCurrentStep('verification');
    }
  };

  const StepIndicator = () => (
    <Animated.View style={[
      styles.stepIndicator,
      {
        opacity: stepAnim,
        transform: [{
          translateY: stepAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [10, 0]
          })
        }]
      }
    ]}>
      <View style={[
        styles.stepDot, 
        currentStep !== 'phone' ? styles.completedStep : styles.activeStep
      ]}>
        {currentStep !== 'phone' ? (
          <Text style={styles.stepCheck}>✓</Text>
        ) : (
          <Text style={styles.stepNumber}>1</Text>
        )}
      </View>
      <View style={[
        styles.stepLine, 
        currentStep === 'newCode' || currentStep === 'success' ? styles.completedLine : null
      ]} />
      <View style={[
        styles.stepDot, 
        currentStep === 'verification' ? styles.activeStep : 
        currentStep === 'newCode' || currentStep === 'success' ? styles.completedStep : null
      ]}>
        {currentStep === 'newCode' || currentStep === 'success' ? (
          <Text style={styles.stepCheck}>✓</Text>
        ) : (
          <Text style={styles.stepNumber}>2</Text>
        )}
      </View>
      <View style={[
        styles.stepLine,
        currentStep === 'success' ? styles.completedLine : null
      ]} />
      <View style={[
        styles.stepDot, 
        currentStep === 'newCode' ? styles.activeStep : 
        currentStep === 'success' ? styles.completedStep : null
      ]}>
        {currentStep === 'success' ? (
          <Text style={styles.stepCheck}>✓</Text>
        ) : (
          <Text style={styles.stepNumber}>3</Text>
        )}
      </View>
    </Animated.View>
  );

  const renderFormContent = () => {
    switch (currentStep) {
      case 'phone':
        return (
          <>
            <Text style={[styles.stepTitle, isTablet && styles.stepTitleTablet]}>
              {t('recovery.resetCode')}
            </Text>
            <Text style={[styles.stepDescription, isTablet && styles.stepDescriptionTablet]}>
              {t('recovery.enterPhone')}
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, isTablet && styles.inputTablet]}
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

            <View style={styles.buttonsContainer}>
              <GhostButton
                text={isLoading ? t('auth.loading') : t('recovery.sendCode')}
                onPress={handleSendCode}
                size={isTablet ? 'large' : 'medium'}
                fullWidth
                disabled={!isPhoneValid(phone) || isLoading}
                loading={isLoading}
                icon={isLoading ? undefined : IconName.Send}
                enableHoverEffect
                enableShimmerEffect={!isLoading}
                accessibilityLabel={t('recovery.sendCode')}
                marginBottom={16}
              />
              
              <GhostButton
                text={t('general.back')}
                onPress={handleBack}
                size={isTablet ? 'large' : 'medium'}
                fullWidth
                icon="arrow-back"
                disabled={isLoading}
                accessibilityLabel={t('general.back')}
              />
            </View>
          </>
        );

      case 'verification':
        return (
          <>
            <Text style={[styles.stepTitle, isTablet && styles.stepTitleTablet]}>
              {t('recovery.verifyCode')}
            </Text>
            <Text style={[styles.stepDescription, isTablet && styles.stepDescriptionTablet]}>
              {t('recovery.codeSent', { phone: phone })}
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.codeInput, isTablet && styles.codeInputTablet]}
                placeholder={t('recovery.verificationCode')}
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                maxLength={6}
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                accessibilityLabel={t('recovery.verificationCode')}
                textAlign="center"
                editable={!isLoading}
              />
            </View>

            <View style={styles.buttonsContainer}>
              <GhostButton
                text={isLoading ? t('auth.loading') : t('recovery.verifyCode')}
                onPress={handleVerifyCode}
                size={isTablet ? 'large' : 'medium'}
                fullWidth
                disabled={verificationCode.length < 4 || isLoading}
                loading={isLoading}
                icon={isLoading ? undefined : "checkmark-circle"}
                enableHoverEffect
                enableShimmerEffect={!isLoading}
                accessibilityLabel={t('recovery.verifyCode')}
                marginBottom={16}
              />
              
              <GhostButton
                text={t('recovery.resendCode')}
                onPress={handleSendCode}
                size={isTablet ? 'large' : 'medium'}
                fullWidth
                icon="refresh"
                disabled={isLoading}
                accessibilityLabel={t('recovery.resendCode')}
                marginBottom={16}
              />
              
              <GhostButton
                text={t('general.back')}
                onPress={handleBack}
                size={isTablet ? 'large' : 'medium'}
                fullWidth
                icon="arrow-back"
                disabled={isLoading}
                accessibilityLabel={t('general.back')}
              />
            </View>
          </>
        );

      case 'newCode':
        return (
          <>
            <Text style={[styles.stepTitle, isTablet && styles.stepTitleTablet]}>
              {t('recovery.newCode')}
            </Text>
            <Text style={[styles.stepDescription, isTablet && styles.stepDescriptionTablet]}>
              {t('recovery.createNewCode')}
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, isTablet && styles.inputTablet]}
                placeholder={t('recovery.newCode')}
                value={newCode}
                onChangeText={setNewCode}
                secureTextEntry={!showCode}
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                accessibilityLabel={t('recovery.newCode')}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.codeToggle}
                onPress={() => setShowCode(!showCode)}
                disabled={isLoading}
              >
                <Text style={styles.codeToggleText}>
                  {showCode ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, isTablet && styles.inputTablet]}
                placeholder={t('auth.confirmCode')}
                value={confirmCode}
                onChangeText={setConfirmCode}
                secureTextEntry={!showCode}
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                accessibilityLabel={t('auth.confirmCode')}
                editable={!isLoading}
              />
            </View>
            
            <View style={styles.buttonsContainer}>
              <GhostButton
                text={isLoading ? t('auth.loading') : t('recovery.changeCode')}
                onPress={handleSetNewCode}
                size={isTablet ? 'large' : 'medium'}
                fullWidth
                disabled={newCode.length < 4 || newCode !== confirmCode || isLoading}
                loading={isLoading}
                icon={isLoading ? undefined : "key"}
                enableHoverEffect
                enableShimmerEffect={!isLoading}
                accessibilityLabel={t('recovery.changeCode')}
                marginBottom={16}
              />
              
              <GhostButton
                text={t('general.back')}
                onPress={handleBack}
                size={isTablet ? 'large' : 'medium'}
                fullWidth
                icon="arrow-back"
                disabled={isLoading}
                accessibilityLabel={t('general.back')}
              />
            </View>
          </>
        );

      case 'success':
        return (
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={[styles.stepTitle, isTablet && styles.stepTitleTablet]}>
              {t('recovery.codeUpdated')}
            </Text>
            <Text style={[styles.stepDescription, isTablet && styles.stepDescriptionTablet]}>
              {t('recovery.codeUpdatedSuccess')}
            </Text>
            
            <View style={styles.buttonsContainer}>
              <GhostButton
                text={t('auth.login')}
                onPress={handleFinish}
                size={isTablet ? 'large' : 'medium'}
                fullWidth
                icon={IconName.Login}
                enableHoverEffect
                enableShimmerEffect
                accessibilityLabel={t('auth.login')}
              />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

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
                  
                  <StepIndicator />
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
                    {renderFormContent()}
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
                
                <StepIndicator />
                
                <Animated.View style={[
                  styles.formContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{
                      translateY: formSlideAnim
                    }]
                  }
                ]}>
                  {renderFormContent()}
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
    justifyContent: 'center',
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
  
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  stepDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  stepNumber: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepCheck: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 18,
  },
  stepLine: {
    height: 2,
    width: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 10,
  },
  activeStep: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    borderColor: '#4CAF50',
  },
  completedStep: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  completedLine: {
    backgroundColor: 'rgba(76, 175, 80, 0.6)',
  },
  
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  stepTitleTablet: {
    fontSize: 34,
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  stepDescriptionTablet: {
    fontSize: 18,
    marginBottom: 35,
  },
  
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
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
  codeInput: {
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 4,
  },
  codeInputTablet: {
    height: 64,
    fontSize: 28,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  codeToggle: {
    position: 'absolute',
    right: 15,
    top: 15,
    padding: 5,
  },
  codeToggleText: {
    fontSize: 20,
  },
  
  buttonsContainer: {
    marginTop: 20,
    width: '100%',
  },
  
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
});

export default React.memo(RecoveryScreen);