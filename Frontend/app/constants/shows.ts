import { Alert, Platform, ToastAndroid } from "react-native";

// Types de toast disponibles
export type ToastType = 'success' | 'error' | 'info' | 'warning' | '';

// Structure pour les actions cliquables
export interface ToastAction {
  text: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

// Durées de toast
export const DURATION = {
  SHORT: ToastAndroid.SHORT,
  LONG: ToastAndroid.LONG
};

/**
 * Affiche un toast (notification) sur Android et iOS
 * @param message - Le message à afficher
 * @param type - Le type de toast (success, error, info, warning)
 * @param duration - La durée d'affichage (SHORT ou LONG)
 * @param actions - Actions cliquables (uniquement pour iOS, ignorées sur Android)
 */
export const showToast = (
  message: string, 
  type: ToastType = '', 
  duration: number = DURATION.SHORT,
  actions?: ToastAction[]
) => {
  if (Platform.OS === 'android') {
    // Sur Android, on utilise ToastAndroid standard
    // Note: Android ne supporte pas les actions cliquables dans les toasts natifs
    switch (type) {
      case 'success':
        ToastAndroid.showWithGravity(
          `✅ ${message}`,
          duration,
          ToastAndroid.BOTTOM
        );
        break;
      case 'error':
        ToastAndroid.showWithGravity(
          `❌ ${message}`,
          duration,
          ToastAndroid.CENTER
        );
        break;
      case 'warning':
        ToastAndroid.showWithGravity(
          `⚠️ ${message}`,
          duration,
          ToastAndroid.CENTER
        );
        break;
      case 'info':
        ToastAndroid.showWithGravity(
          `ℹ️ ${message}`,
          duration,
          ToastAndroid.BOTTOM
        );
        break;
      default:
        ToastAndroid.show(message, duration);
        break;
    }
  } else {
    // Sur iOS, on utilise Alert qui supporte les actions
    let title = '';
    
    switch (type) {
      case 'success':
        title = '✅ Succès';
        break;
      case 'error':
        title = '❌ Erreur';
        break;
      case 'warning':
        title = '⚠️ Attention';
        break;
      case 'info':
        title = 'ℹ️ Information';
        break;
    }
    
    // Préparer les buttons pour l'alerte
    const buttons = actions?.length 
      ? actions.map(action => ({
          text: action.text,
          onPress: action.onPress,
          style: action.style
        }))
      : [{ text: 'OK' }];
    
    Alert.alert(
      title, 
      message, 
      buttons, 
      { 
        // Pour les messages d'erreur, on désactive la possibilité de fermer en touchant en dehors
        cancelable: type !== 'error'
      }
    );
  }
};

/**
 * Affiche un toast avec des messages et actions contextuels
 * @param title - Titre de l'alerte
 * @param message - Message détaillé
 * @param actions - Tableau d'actions (boutons)
 */
export const showInfoToastWithActions = (
  title: string,
  message: string,
  actions: ToastAction[]
) => {
  if (Platform.OS === 'android') {
    // Sur Android, on montre d'abord un toast, puis une alerte si l'utilisateur interagit
    ToastAndroid.showWithGravityAndOffset(
      `${title} - Touchez pour plus d'options`,
      ToastAndroid.LONG,
      ToastAndroid.BOTTOM,
      0,
      50
    );
    
    // Sur Android, pour simuler un toast cliquable, on peut utiliser un délai court
    // et afficher ensuite une alerte standard
    setTimeout(() => {
      Alert.alert(
        title,
        message,
        actions.map(action => ({
          text: action.text,
          onPress: action.onPress,
          style: action.style
        })),
        { cancelable: true }
      );
    }, 300);
  } else {
    // Sur iOS, on utilise directement Alert
    Alert.alert(
      title,
      message,
      actions.map(action => ({
        text: action.text,
        onPress: action.onPress,
        style: action.style
      })),
      { cancelable: true }
    );
  }
};

// Fonctions d'aide pour une utilisation plus simple
export const showSuccessToast = (message: string, duration = DURATION.SHORT, actions?: ToastAction[]) => 
  showToast(message, 'success', duration, actions);

export const showErrorToast = (message: string, duration = DURATION.SHORT, actions?: ToastAction[]) => 
  showToast(message, 'error', duration, actions);

export const showWarningToast = (message: string, duration = DURATION.SHORT, actions?: ToastAction[]) => 
  showToast(message, 'warning', duration, actions);

export const showInfoToast = (message: string, duration = DURATION.SHORT, actions?: ToastAction[]) => 
  showToast(message, 'info', duration, actions);

// Exemples spécifiques pour des cas d'usage communs

/**
 * Affiche un toast d'erreur avec option de réessayer
 */
export const showRetryToast = (message: string, onRetry: () => void) => {
  showErrorToast(message, DURATION.LONG, [
    { text: 'Réessayer', onPress: onRetry },
  ]);
};

/**
 * Affiche un toast de confirmation avec actions Oui/Non
 */
export const showConfirmToast = (message: string, onConfirm: () => void, onCancel?: () => void) => {
  showInfoToastWithActions(
    'Confirmation',
    message,
    [
      { 
        text: 'Oui', 
        onPress: onConfirm,
        style: 'default' 
      },
      { 
        text: 'Non', 
        onPress: onCancel || (() => {}),
        style: 'cancel' 
      }
    ]
  );
};

/**
 * Affiche une alerte/toast pour les modifications non enregistrées
 * @param onContinue - Fonction appelée si l'utilisateur veut continuer les modifications
 * @param onDiscard - Fonction appelée si l'utilisateur veut quitter sans sauvegarder
 */
export const showUnsavedChangesToast = (onContinue: () => void, onDiscard: () => void) => {
  showInfoToastWithActions(
    'Modifications non enregistrées',
    'Vous avez des modifications non enregistrées. Que souhaitez-vous faire?',
    [
      {
        text: 'Continuer à modifier',
        onPress: onContinue,
        style: 'cancel'
      },
      {
        text: 'Quitter sans sauvegarder',
        onPress: onDiscard,
        style: 'destructive'
      }
    ]
  );
};

/**
 * Affiche une notification pour les médias téléchargés
 * @param mediaType - Type de média (photo, vidéo, document...)
 * @param onView - Fonction pour visualiser le média
 * @param onShare - Fonction pour partager le média
 */
export const showMediaDownloadedToast = (mediaType: string, onView: () => void, onShare?: () => void) => {
  const actions: ToastAction[] = [
    { text: 'Voir', onPress: onView }
  ];
  
  if (onShare) {
    actions.push({ text: 'Partager', onPress: onShare });
  }
  
  showSuccessToast(`${mediaType} téléchargé`, DURATION.LONG, actions);
};

/**
 * Affiche une notification pour une connexion perdue
 * @param onRetry - Fonction pour retenter la connexion
 */
export const showConnectionLostToast = (onRetry: () => void) => {
  showWarningToast(
    'Connexion Internet perdue',
    DURATION.LONG, 
    [{ text: 'Réessayer', onPress: onRetry }]
  );
};