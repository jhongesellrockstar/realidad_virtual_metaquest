import { FirebaseError } from "firebase/app";

const messages: Record<string, string> = {
  "auth/email-already-in-use": "Ya existe una cuenta con este correo.",
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/invalid-email": "El correo electrónico no es válido.",
  "auth/network-request-failed": "No se pudo conectar con Firebase. Revisa tu conexión.",
  "auth/too-many-requests": "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
};

export function getFirebaseErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return messages[error.code] ?? "Firebase rechazó la operación. Inténtalo de nuevo.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}
