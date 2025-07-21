import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

import enCommon from './en/common.json';
import enAvicole from './en/avicole.json';
import enBovin from './en/bovin.json';
import enOvin from './en/ovin.json';
import enCaprin from './en/caprin.json';
import enPiscicole from './en/piscicole.json';

import frCommon from './fr/common.json';
import frAvicole from './fr/avicole.json';
import frBovin from './fr/bovin.json';
import frOvin from './fr/ovin.json';
import frCaprin from './fr/caprin.json';
import frPiscicole from './fr/piscicole.json';

import { FetchPOST } from '../constants/constantsFetch';

const resources = {
  en: {
    common: enCommon,
    avicole: enAvicole,
    bovin: enBovin,
    ovin: enOvin,
    caprin: enCaprin,
    piscicole: enPiscicole,
  },
  fr: {
    common: frCommon,
    avicole: frAvicole,
    bovin: frBovin,
    ovin: frOvin,
    caprin: frCaprin,
    piscicole: frPiscicole,
  },
};

export const sendLangToServer = async (lang) => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) return;
    await FetchPOST(token, `api/v1/managers/preferences/language/${lang}`, {});
  } catch (error) {
    console.error("Erreur lors de l'envoi de la langue au serveur:", error);
  }
};

const getUserPreferredLanguage = async () => {
  try {
    const storedLanguage = await AsyncStorage.getItem('@language');
    if (storedLanguage) return storedLanguage;
  } catch (error) {
    console.error('Erreur lors de la récupération de la langue:', error);
  }

  const locales = RNLocalize.getLocales();
  const deviceLang = locales[0]?.languageCode || 'fr';
  return Object.keys(resources).includes(deviceLang) ? deviceLang : 'fr';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    ns: ['common', 'avicole', 'bovin', 'ovin', 'caprin', 'piscicole'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

(async () => {
  const userLang = await getUserPreferredLanguage();
  if (i18n.language !== userLang) {
    await i18n.changeLanguage(userLang);
    sendLangToServer(userLang);
  }
})();

export default i18n;
