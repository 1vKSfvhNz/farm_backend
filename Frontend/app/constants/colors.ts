const colors = {
  // Couleurs de base
  primary: '#4CAF50', // Vert agricole
  background: '#F5F5F5', 
  card: '#FFFFFF',
  text: '#333333',
  border: '#E0E0E0',
  notification: '#FF5722',
  
  // Couleurs sémantiques
  error: '#F44336', // Rouge pour erreurs
  success: '#4CAF50', // Vert pour succès (récoltes, etc.)
  warning: '#FFC107', // Jaune pour avertissements
  info: '#2196F3',   // Bleu pour informations
  
  // Couleurs spécifiques à l'agriculture/élevage
  subtext: '#757575',
  soil: '#8D6E63',      // Couleur terre
  water: '#00BCD4',     // Couleur eau
  animal: '#795548',    // Couleur bétail
  plant: '#8BC34A',     // Vert végétal
  harvest: '#FF9800',   // Orange récolte
  organic: '#607D8B',   // Couleur matière organique
  danger: '#D32F2F',    // Rouge danger (maladies, etc.)
  
  // Variantes de verts pour différentes cultures
  greenLight: '#C8E6C9',
  greenMedium: '#81C784',
  greenDark: '#388E3C',
  
  // Dégradés pour les graphiques
  gradientStart: '#2E7D32',
  gradientEnd: '#81C784',
  
  // Thème clair/sombre
  light: {
    background: '#FFFFFF',
    text: '#212121',
    surface: '#F5F5F5',
  },
  dark: {
    background: '#121212',
    text: '#E0E0E0',
    surface: '#1E1E1E',
  }
};


export { colors };