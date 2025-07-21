import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Linking, 
  Platform, 
  Alert,
  ActivityIndicator,
  Share
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { ProductProps } from '../../types/products';
import { OrderProps } from '../../types/order';

interface LocationData {
  latitude: number | null;
  longitude: number | null;
  name: string;
  imageUrl?: string;
}

interface DirectionsButtonProps {
  product?: ProductProps;
  order?: OrderProps;
  style?: any;
  textStyle?: any;
  iconSize?: number;
  buttonText?: string;
  isLoading?: boolean;
  onPress?: () => void;
  showMarkerImage?: boolean;
}

/**
 * Composant qui affiche un bouton pour ouvrir l'itinéraire vers le lieu de vente du produit ou de livraison d'une commande
 */
const DirectionsButton: React.FC<DirectionsButtonProps> = ({ 
  product, 
  order, 
  style, 
  textStyle,
  iconSize = 18,
  buttonText,
  isLoading = false,
  onPress,
  showMarkerImage = false
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  // Extraire les données de localisation
  const locationData: LocationData = useMemo(() => {
    // Si un gestionnaire de clic personnalisé est fourni, retourner des données fictives
    if (onPress) {
      return { latitude: 0, longitude: 0, name: '' };
    }
    
    // Priorité au produit si les deux sont fournis
    if (product) {
      return {
        latitude: product.latitude || null,
        longitude: product.longitude || null,
        name: product.name || '',
        imageUrl: product.imageUrl || undefined
      };
    } else if (order) {
      // Pour une commande, utiliser le nom du produit ou le numéro de commande
      const name = order.product_name || `Order #${order.order_number}`;
      return {
        latitude: order.latitude || null,
        longitude: order.longitude || null,
        name,
        imageUrl: order.product_url || undefined
      };
    }
    
    // Cas par défaut: aucune donnée valide
    return { latitude: null, longitude: null, name: '' };
  }, [product, order, onPress]);

  // Vérifier si les coordonnées sont disponibles et valides
  const hasCoordinates = Boolean(
    locationData.latitude !== null && 
    locationData.longitude !== null &&
    locationData.latitude !== undefined && 
    locationData.longitude !== undefined &&
    !isNaN(Number(locationData.latitude)) &&
    !isNaN(Number(locationData.longitude))
  );

  // Préparer l'envoi de l'image vers l'application de navigation (iOS uniquement)
  const shareLocationWithImage = async () => {
    if (Platform.OS === 'ios' && showMarkerImage && locationData.imageUrl) {
      try {
        // Créer une URL personnalisée avec un lien vers l'image et les coordonnées
        const customMapUrl = `https://maps.apple.com/?q=${encodeURIComponent(locationData.name)}&ll=${locationData.latitude},${locationData.longitude}`;
        
        // Partager l'adresse avec prévisualisation
        await Share.share({
          title: locationData.name,
          message: `${locationData.name} - ${t('directions.checkLocation') || 'Check this location'}`,
          url: customMapUrl
        }, {
          dialogTitle: t('directions.viewInMaps') || 'View in Maps',
          subject: locationData.name
        });
        return true; // Partage réussi
      } catch (error) {
        console.log('Erreur lors du partage avec image:', error);
        return false; // Échec du partage
      }
    }
    return false; // Pas de partage nécessaire
  };

  // Ouvrir l'itinéraire dans Google Maps ou Apple Maps
  const openDirections = async () => {
    // Si un gestionnaire de clic personnalisé est fourni, l'utiliser
    if (onPress) {
      onPress();
      return;
    }
    
    if (!hasCoordinates) {
      Alert.alert(
        t('directions.errorTitle') || 'Error',
        t('directions.noCoordinates') || 'Location coordinates are not available.'
      );
      return;
    }

    // Essayer de partager avec image d'abord si demandé
    if (showMarkerImage && await shareLocationWithImage()) {
      // Si le partage avec image a réussi, ne pas continuer
      return;
    }

    // Si pas de partage ou échec du partage, continuer avec l'ouverture standard
    const { latitude, longitude, name } = locationData;
    if (latitude === null || longitude === null) return;
    
    const destination = `${latitude},${longitude}`;
    const label = encodeURIComponent(name);

    try {
      if (Platform.OS === 'ios') {
        // Vérifier d'abord si Google Maps est installé
        const googleMapsUrl = 'comgooglemaps://';
        const canOpenGoogleMaps = await Linking.canOpenURL(googleMapsUrl);
        
        if (canOpenGoogleMaps) {
          // Utiliser Google Maps si disponible
          const googleUrl = `comgooglemaps://?daddr=${destination}&directionsmode=driving`;
          await Linking.openURL(googleUrl);
        } else {
          // Sinon, utiliser Apple Maps
          const appleUrl = `maps://app?daddr=${destination}&ll=${destination}&q=${label}`;
          await Linking.openURL(appleUrl);
        }
      } else {
        // Pour Android, essayer d'abord l'app native Google Maps
        const nativeUrl = `google.navigation:q=${destination}&mode=d`;
        
        try {
          await Linking.openURL(nativeUrl);
        } catch (error) {
          // Si l'app native ne s'ouvre pas, utiliser l'URL web
          const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
          await Linking.openURL(webUrl);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de l\'application Maps:', error);
      
      // Tentative de repli sur l'URL web de Google Maps dans tous les cas
      try {
        const webFallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
        await Linking.openURL(webFallbackUrl);
      } catch (fallbackError) {
        // Si tout échoue, afficher une alerte
        Alert.alert(
          t('directions.errorTitle') || 'Error',
          t('directions.cannotOpenMaps') || 'Unable to open Maps application on your device.'
        );
      }
    }
  };

  // Si les coordonnées ne sont pas disponibles et qu'il n'y a pas de gestionnaire personnalisé, ne pas afficher le bouton
  if (!hasCoordinates && !onPress) return null;

  return (
    <TouchableOpacity 
      style={[
        styles.directionsButton, 
        { backgroundColor: colors.primary },
        style
      ]} 
      onPress={openDirections}
      disabled={isLoading}
      accessibilityLabel={t('directions.getDirections') || "Get directions"}
      accessibilityRole="button"
      accessibilityHint={t('directions.hint') || "Opens navigation to the destination"}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <>
          <Ionicons name="navigate" size={iconSize} color="#FFFFFF" />
          <Text style={[styles.directionsText, textStyle]}>
            {buttonText || t('directions.getDirections') || "Get Directions"}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  directionsText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  }
});

export default DirectionsButton;