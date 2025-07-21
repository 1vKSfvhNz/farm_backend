import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
enableScreens();


// Context Providers
import { AuthProvider } from './app/contexts/AuthContext';
import { LocationProvider } from './app/contexts/LocationContext';
import { NotificationProvider } from './app/contexts/NotificationContext';

// Screens
import WelcomeScreen from './app/Screens/Welcome';
import LoginScreen from './app/Screens/Login/Login';
import UserManagement from './app/Screens/Management/Users/UsersGestion';
import UserDetails from './app/Screens/Management/Users/UserDetails';
import AddUser from './app/Screens/Management/Users/AddUser';
import ElevageManagement from './app/Screens/Management/Elevage/__init__';

// Avicole Screens
import AvicoleManagement from './app/Screens/Management/Elevage/Avicole/__init__';
import LotManagement from './app/Screens/Management/Elevage/Avicole/LotManagement';
import { AnalyseManagement } from './app/Screens/Management/Elevage/Avicole/AnalyseManagement';
import { PerformanceManagement } from './app/Screens/Management/Elevage/Avicole/PerformanceManagement';
import { PredictionManagement } from './app/Screens/Management/Elevage/Avicole/PredictionManagement';

import { RootStackParamList, AvicoleStackParamList, BovinStackParamList, CaprinStackParamList, OvinStackParamList, PiscicoleStackParamList } from './app/types/navigations';
import RecoveryScreen from './app/Screens/Login/Recovery';
import Setting from './app/Screens/Management/Users/Setting';
import ChangePhone from './app/components/Phone/ChangePhone';
import Language from './app/components/Language/Language';
import GestionPonte from './app/Screens/Management/Elevage/Avicole/PonteManagement';
import CreateLot from './app/Screens/Management/Elevage/Avicole/Lot/CreateLot';
import BatimentManagement from './app/Screens/Management/Elevage/BatimentManagement';
import PiscicoleManagement from './app/Screens/Management/Elevage/Piscicole/__init__';
import BassinManagement from './app/Screens/Management/Elevage/Piscicole/BassinManagement';
import PoissonManagement from './app/Screens/Management/Elevage/Piscicole/PoissonManagement';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AvicoleStack = createNativeStackNavigator<AvicoleStackParamList>();
const BovinStack = createNativeStackNavigator<BovinStackParamList>();
const CaprinStack = createNativeStackNavigator<CaprinStackParamList>();
const OvinStack = createNativeStackNavigator<OvinStackParamList>();
const PiscicoleStack = createNativeStackNavigator<PiscicoleStackParamList>();

// Avicole Stack Navigator
function AvicoleStackNavigator() {
  return (
    <AvicoleStack.Navigator screenOptions={{ headerShown: false }}>
      <AvicoleStack.Screen name="Home" component={AvicoleManagement} />
      <AvicoleStack.Screen name="LotManagement" component={LotManagement} />
      {/* <AvicoleStack.Screen name="LotList" component={LotList} /> */}
      <AvicoleStack.Screen name="CreateLot" component={CreateLot} />
      {/* <AvicoleStack.Screen name="LotStats" component={LotStats} />*/}
      <AvicoleStack.Screen name="PonteManagement" component={GestionPonte} /> 
      <AvicoleStack.Screen name="PerformanceManagement" component={PerformanceManagement} />
      {/* <AvicoleStack.Screen name="PeseeManagement" component={PeseeManagement} /> */}
      <AvicoleStack.Screen name="AnalyseManagement" component={AnalyseManagement} />
      <AvicoleStack.Screen name="PredictionManagement" component={PredictionManagement} />
      {/* <AvicoleStack.Screen name="ExportManagement" component={ExportManagement} /> */}
    </AvicoleStack.Navigator>
  );
}

// // Bovin Stack as nested navigator
// function BovinStackNavigator() {
//   return (
//     <BovinStack.Navigator screenOptions={{ headerShown: false }}>
//       <BovinStack.Screen name="BovinDetails" component={BovinDetails} />
//       <BovinStack.Screen name="CreateBovin" component={CreateBovin} />
//       <BovinStack.Screen name="EditBovin" component={EditBovin} />
//       <BovinStack.Screen name="ProductionLaitiere" component={ProductionLaitiere} />
//       <BovinStack.Screen name="ControleLaitier" component={ControleLaitier} />
//       <BovinStack.Screen name="ReproductionManagement" component={ReproductionManagement} />
//       <BovinStack.Screen name="VelageManagement" component={VelageManagement} />
//       <BovinStack.Screen name="TraitementManagement" component={TraitementManagement} />
//       <BovinStack.Screen name="AlertesManagement" component={AlertesManagement} />
//       <BovinStack.Screen name="AnalyseProduction" component={AnalyseProduction} />
//       <BovinStack.Screen name="PredictionProduction" component={PredictionProduction} />
//     </BovinStack.Navigator>
//   );
// }

// // Caprin Stack Navigator
// function CaprinStackNavigator() {
//   return (
//     <CaprinStack.Navigator screenOptions={{ headerShown: false }}>
//       <CaprinStack.Screen name="CaprinDetails" component={CaprinDetails} />
//       <CaprinStack.Screen name="CreateCaprin" component={CreateCaprin} />
//       <CaprinStack.Screen name="EditCaprin" component={EditCaprin} />
//       <CaprinStack.Screen name="ProductionLaitiere" component={ProductionLaitiere} />
//       <CaprinStack.Screen name="ControleLaitier" component={ControleLaitier} />
//       <CaprinStack.Screen name="AlertesManagement" component={CaprinAlertes} />
//       <CaprinStack.Screen name="AnalyseProduction" component={CaprinAnalyse} />
//     </CaprinStack.Navigator>
//   );
// }

// // Ovin Stack Navigator
// function OvinStackNavigator() {
//   return (
//     <OvinStack.Navigator screenOptions={{ headerShown: false }}>
//       <OvinStack.Screen name="OvinDetails" component={OvinDetails} />
//       <OvinStack.Screen name="CreateOvin" component={CreateOvin} />
//       <OvinStack.Screen name="EditOvin" component={EditOvin} />
//       <OvinStack.Screen name="TonteManagement" component={TonteManagement} />
//       <OvinStack.Screen name="AlertesManagement" component={OvinAlertes} />
//       <OvinStack.Screen name="ProductionLaineStats" component={ProductionLaineStats} />
//     </OvinStack.Navigator>
//   );
// }

// Piscicole Stack Navigator
function PiscicoleStackNavigator() {
  return (
    <PiscicoleStack.Navigator screenOptions={{ headerShown: false }}>
      <PiscicoleStack.Screen name="Home" component={PiscicoleManagement} />
      <PiscicoleStack.Screen name="BassinManagement" component={BassinManagement} />
      <PiscicoleStack.Screen name="PoissonManagement" component={PoissonManagement} />
{/*       <PiscicoleStack.Screen name="BassinDetails" component={BassinDetails} />
      <PiscicoleStack.Screen name="CreatePoisson" component={CreatePoisson} />
      <PiscicoleStack.Screen name="ControleEau" component={ControleEau} />
      <PiscicoleStack.Screen name="RecolteManagement" component={RecolteManagement} />
      <PiscicoleStack.Screen name="AlertesPiscicoles" component={AlertesPiscicoles} />
      <PiscicoleStack.Screen name="PredictionCroissance" component={PredictionCroissance} />
 */}    
    </PiscicoleStack.Navigator>
  );
}

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AuthProvider>
{/*         <NotificationProvider> */}
          <LocationProvider>
              <StatusBar 
                barStyle="dark-content" 
                backgroundColor="transparent"
                translucent
              />
              <NavigationContainer>
                <RootStack.Navigator
                  initialRouteName="Welcome"
                  screenOptions={{
                    headerShown: false,
                    animation: 'fade',
                    gestureEnabled: true,
                  }}
                >
                  {/* Auth Screens */}
                  <RootStack.Screen name="Welcome" component={WelcomeScreen} />
                  <RootStack.Screen name="Login" component={LoginScreen} />
                  <RootStack.Screen name="Recovery" component={RecoveryScreen} />
                  <RootStack.Screen name="Settings" component={Setting} />
                  <RootStack.Screen name="ChangePhone" component={ChangePhone} />
                  <RootStack.Screen name="Language" component={Language} />

                  {/* Main App Screens */}
                  <RootStack.Screen name="UserManagement" component={UserManagement} />
                  <RootStack.Screen name="BatimentManagement" component={BatimentManagement} />
                  <RootStack.Screen name="UserDetails" component={UserDetails} />
                  <RootStack.Screen name="AddUser" component={AddUser} />
                  <RootStack.Screen name="ElevageManagement" component={ElevageManagement} />

                  {/* Avicole Stack (nested) */}
                  <RootStack.Screen name="Avicole" component={AvicoleStackNavigator} />
                  <RootStack.Screen name="Piscicole" component={PiscicoleStackNavigator} />
                </RootStack.Navigator>
              </NavigationContainer>
          </LocationProvider>
{/*         </NotificationProvider> */}
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
