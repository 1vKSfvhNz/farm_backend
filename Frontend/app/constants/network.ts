import NetInfo from '@react-native-community/netinfo';

export const IP = "http://192.168.11.116:8000";

export const checkNetwork = async (): Promise<void> => {
  const state = await NetInfo.fetch();
  
  if (!state.isConnected || !state.isInternetReachable) {
    throw new Error('Veuillez activer votre connexion internet');
  }
};