import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  createContext,
  useContext,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FetchGET } from '../constants/constantsFetch';
import { showErrorToast } from '../constants/shows';

export type UserData = {
  username: string;
  phone: string;
  role: string;
};

interface AuthContextType {
  authToken: string | null;
  tokenExpire: string | null;
  userData: UserData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  getUserData: () => Promise<UserData | null>;
  checkTokenExpiration: () => Promise<boolean>;
  login: (token: string, tokenExpire: string) => Promise<void>;
  logout: () => Promise<void>;
}

const defaultAuthContext: AuthContextType = {
  authToken: null,
  tokenExpire: null,
  userData: null,
  isLoading: true,
  isAuthenticated: false,
  getUserData: async () => null,
  checkTokenExpiration: async () => false, // ✅ retourne bien un boolean
  login: async () => {},
  logout: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState({
    authToken: null as string | null,
    tokenExpire: null as string | null,
    userData: null as UserData | null,
    isLoading: true,
  });

  const isLoadingAuth = useRef(false);
  const roleCache = useRef<{ role: UserData | null; timestamp: number }>({
    role: null,
    timestamp: 0,
  });

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(['access_token', 'token_expire']);
      roleCache.current = { role: null, timestamp: 0 };
      setAuthState({
        userData: null,
        authToken: null,
        tokenExpire: null,
        isLoading: false,
      });
    } catch (error) {
      showErrorToast('Erreur lors de la déconnexion');
    }
  }, []);

  const checkTokenExpiration = useCallback(
    async () => {
      const expireTime = await AsyncStorage.getItem('token_expire');
      if (!expireTime) return false;
      const now = new Date().getTime();
      const expire = new Date(expireTime).getTime();
      if (now >= expire) {
        await logout();
        return false;
      }
      return true;
    },
    [logout]
  );

  const getUserData = useCallback(
    async (forceRefresh = false): Promise<UserData | null> => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        if (!token) return null;

        const now = Date.now();
        const cacheValid = now - roleCache.current.timestamp < 5 * 60 * 1000;

        if (!forceRefresh && roleCache.current.role && cacheValid) {
          return roleCache.current.role;
        }

        const response = await FetchGET(token, 'api/v1/managers/profile');
        const role = await response.json();

        roleCache.current = { role, timestamp: now };
        return role;
      } catch (error) {
        if (forceRefresh) {
          showErrorToast("Erreur lors de la récupération du rôle utilisateur");
        }
        return null;
      }
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    const loadAuthState = async () => {
      if (isLoadingAuth.current) return;
      isLoadingAuth.current = true;

      try {
        const [token, expire] = await AsyncStorage.multiGet([
          'access_token',
          'token_expire',
        ]).then((values) => values.map((entry) => entry[1]));

        const isValid = await checkTokenExpiration();

        let role = null;
        if (token && isValid && isMounted) {
          role = await getUserData();
        }

        if (isMounted) {
          setAuthState({
            authToken: token,
            tokenExpire: expire,
            userData: role,
            isLoading: false,
          });
        }
      } catch (error) {
        if (isMounted) {
          showErrorToast("Erreur de chargement des données d'authentification");
          setAuthState((prev) => ({ ...prev, isLoading: false }));
        }
      } finally {
        isLoadingAuth.current = false;
      }
    };

    loadAuthState();
    return () => {
      isMounted = false;
    };
  }, [getUserData, checkTokenExpiration]);

  const login = useCallback(
    async (token: string, tokenExpire: string) => {
      setAuthState((prev) => ({ ...prev, isLoading: true }));
      try {
        await AsyncStorage.multiSet([
          ['access_token', token],
          ['token_expire', tokenExpire],
        ]);

        setAuthState((prev) => ({
          ...prev,
          authToken: token,
          tokenExpire,
        }));

        const role = await getUserData(true);

        setAuthState((prev) => ({
          ...prev,
          userData: role,
          isLoading: false,
        }));
      } catch (error) {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        showErrorToast('Erreur lors de la connexion');
      }
    },
    [getUserData]
  );

  const authContextValue = useMemo(
    () => ({
      ...authState,
      getUserData: () => getUserData(true),
      login,
      logout,
      checkTokenExpiration, // ✅ ajouter cette méthode pour respecter AuthContextType
      isAuthenticated: Boolean(authState.authToken),
    }),
    [authState, getUserData, login, logout, checkTokenExpiration] // ✅ ne pas oublier de l’ajouter dans les dépendances
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
