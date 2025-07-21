import React, { createContext, useContext, useEffect, useState } from 'react';
import firebase from '@react-native-firebase/app';
import { getErrorMessage } from '../constants/errot';

type IntegrityContextType = {
  isAppIntegrityValid: boolean;
  isLoading: boolean;
  error: string | null;
};

const IntegrityContext = createContext<IntegrityContextType>({
  isAppIntegrityValid: false,
  isLoading: true,
  error: null,
});

export const IntegrityProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState({
    isAppIntegrityValid: false,
    isLoading: true,
    error: null as string | null,
  });

  useEffect(() => {
    const verifyIntegrity = async () => {
      try {
        // 1. Vérifier Firebase
        if (!firebase.apps.length) throw new Error("Configuration Firebase manquante !");

        setState({ isAppIntegrityValid: true, isLoading: false, error: null });
      } catch (err) {
        setState({
          isAppIntegrityValid: false,
          isLoading: false,
          error: getErrorMessage(err), // Utilisation de notre helper
        });
      }
    };

    verifyIntegrity();
  }, []);

  return (
    <IntegrityContext.Provider value={state}>
      {children}
    </IntegrityContext.Provider>
  );
};

export const useIntegrity = () => useContext(IntegrityContext);