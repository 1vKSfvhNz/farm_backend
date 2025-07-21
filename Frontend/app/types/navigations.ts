import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { BassinResponse, PoissonCreate, PoissonUpdate, PopulationBassinCreate, PopulationBassinUpdate } from "../interfaces/Elevage/piscicole";

/**
 * Root Stack Parameter List definition
 * Maps all possible routes in the application and their parameters
 */
export type RootStackParamList = {
  // Auth Flow Screens
  Welcome: undefined;
  Login: undefined;

  // Main App Screens
  AdminDashboard: undefined;

  // User Management Screens
  UserManagement: undefined;
  UserDetails: { userId: string };
  AddUser: { userId?: string; isEdit?: boolean };

  // Elevage
  ElevageManagement: undefined;

  // Nested Navigators
  Avicole: undefined;
  Piscicole: undefined;

  // Optional / Future Screens
  Recovery: undefined;
  ChangePhone: undefined;
  AdminModelManagement?: undefined;
  Settings: undefined;
  Language: undefined;
  BatimentManagement?: undefined;
  AgroManagement?: undefined;
  FarmDetails?: { farmId: string };
  AddFarm?: undefined;
  EditFarm?: { farmId: string };
};

/**
 * Avicole nested stack
 */
export type AvicoleStackParamList = {
  Home: undefined;
  LotManagement: undefined;
  LotList: undefined;
  CreateLot: undefined;
  LotStats: undefined;
  PonteManagement: undefined;
  PerformanceManagement: undefined;
  PeseeManagement: undefined;
  AnalyseManagement: undefined;
  PredictionManagement: undefined;
  ExportManagement: undefined;
};

// Ajouter dans navigations.ts après AvicoleStackParamList
export type BovinStackParamList = {
  BovinHome: undefined;
  BovinList: undefined;
  BovinDetails: { animalId: string };
  CreateBovin: undefined;
  EditBovin: { animalId: string };
  BovinStats: undefined;
  ProductionLaitiere: undefined;
  ControleLaitier: undefined;
  ReproductionManagement: undefined;
  VelageManagement: undefined;
  TraitementManagement: undefined;
  AlertesManagement: undefined;
  AnalyseProduction: undefined;
  PredictionProduction: undefined;
};

// Ajouter après les autres StackParamList dans navigations.ts

export type CaprinStackParamList = {
  Home: undefined;
  CaprinList: undefined;
  CaprinDetails: { animalId: string };
  CreateCaprin: undefined;
  EditCaprin: { animalId: string };
  CaprinStats: undefined;
  ProductionLaitiere: undefined;
  ControleLaitier: undefined;
  AlertesManagement: undefined;
  AnalyseProduction: undefined;
  ExportData: undefined;
};

export type OvinStackParamList = {
  Home: undefined;
  OvinList: undefined;
  OvinDetails: { animalId: string };
  CreateOvin: undefined;
  EditOvin: { animalId: string };
  OvinStats: undefined;
  TonteManagement: undefined;
  AlertesManagement: undefined;
  ProductionLaineStats: undefined;
  ExportData: undefined;
};

export type PiscicoleStackParamList = {
  // Navigation principale
  Home: undefined;
  
  // Gestion des bassins
  BassinManagement: undefined;
  BassinDetails: { bassinId: string };
  WaterQuality: { bassinId?: string };
  
  // Gestion des poissons
  PoissonManagement: undefined;
  CreatePoisson: { poisson: PopulationBassinCreate | PopulationBassinUpdate | PoissonCreate | PoissonUpdate};
  
  // Récoltes et production
  HarvestRecords: { bassinId?: string };
  ProductionReports: undefined;
  
  // Opérations
  BatchOperations: undefined;
  ControleFood: undefined;
  ControleEau: undefined;
  
  // Alertes et monitoring
  BassinAlerts: undefined;
  AlertesPiscicoles: undefined;
  
  // Analyse et prédiction
  PredictionCroissance: { bassinId?: string };
  
  // Export de données
  ExportData: undefined;
  
  // Autres écrans
  RecolteManagement: undefined;
  PoissonDetails: undefined;
};

/**
 * Generic screen prop type (navigation + route)
 */
export type ScreenProps<T extends keyof RootStackParamList> = {
  route: RouteProp<RootStackParamList, T>;
  navigation: StackNavigationProp<RootStackParamList, T>;
};

/**
 * Strongly typed screen props for commonly used screens
 */
export type WelcomeScreenProps = ScreenProps<'Welcome'>;
export type LoginScreenProps = ScreenProps<'Login'>;
export type SettingScreenProps = ScreenProps<'Settings'>;
export type AdminDashboardProps = ScreenProps<'AdminDashboard'>;
export type UserManagementProps = ScreenProps<'UserManagement'>;
export type UserDetailsProps = ScreenProps<'UserDetails'>;
export type AddUserProps = ScreenProps<'AddUser'>;
export type ElevageManagementProps = ScreenProps<'ElevageManagement'>;

/**
 * Generic navigation prop (if you only need navigation, no route)
 */
export type NavigationProp = StackNavigationProp<RootStackParamList>;