type ErrorLike = 
  | Error
  | { message: string }
  | string
  | number
  | boolean
  | null
  | undefined
  | unknown;

/**
 * Transforme n'importe quelle forme d'erreur en message lisible
 * - Gère les erreurs Firebase, les exceptions natives, les strings, etc.
 * - Préserve le stack trace pour les vrais objets Error
 * - Typage strict TypeScript
 */
export function getErrorMessage(error: ErrorLike, fallback = "Erreur inconnue"): string {
  // Cas null/undefined
  if (error == null) return fallback;

  // Erreurs Firebase (ex: FirebaseError)
  if (typeof error === 'object' && 'code' in error && 'message' in error) {
    return `[${error.code}] ${error.message}`;
  }

  // Objets Error standard
  if (error instanceof Error) {
    return error.message || fallback;
  }

  // Objets avec propriété message (ex: AxiosError)
  if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }

  // Strings (déjà formatées)
  if (typeof error === 'string') {
    return error.trim() || fallback;
  }

  // Nombres/booléens (convertis)
  if (typeof error === 'number' || typeof error === 'boolean') {
    return String(error);
  }

  // Cas extrêmes (symbol, bigint, fonctions...)
  try {
    return JSON.stringify(error) || fallback;
  } catch {
    return fallback;
  }
}