import firebase from '@react-native-firebase/app';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import auth from '@react-native-firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAy-1o45y-3omz-351SnOk1Z4uqxuHwsac",
  authDomain: "myfarm-6079a.firebaseapp.com",
  projectId: "myfarm-6079a",
  storageBucket: "myfarm-6079a.appspot.com",
  messagingSenderId: "920831671386",
  appId: "1:920831671386:android:3324bcd14635c019a86c63"
};

// Initialisation Firebase (généralement fait automatiquement avec React Native Firebase)
let app;

try {
  // Vérifier si Firebase est déjà initialisé
  if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
  } else {
    app = firebase.app();
  }
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error', error);
  throw new Error('Failed to initialize Firebase');
}

// Instance de messaging
const messagingInstance = messaging();

// Instance d'auth
const authInstance = auth();

// Fonctions utilitaires
export const getToken = async (): Promise<string> => {
  try {
    const token = await messagingInstance.getToken();
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    throw error;
  }
};

export const onMessage = (callback: (message: FirebaseMessagingTypes.RemoteMessage) => void) => {
  return messagingInstance.onMessage(callback);
};

export const getAuth = () => authInstance;

export { messagingInstance, authInstance, app };
export default app;