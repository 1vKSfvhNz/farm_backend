/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import "./app/translations/i18n";

AppRegistry.registerComponent(appName, () => App);
