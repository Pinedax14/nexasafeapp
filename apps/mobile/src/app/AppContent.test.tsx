// Prueba de humo: carga la app completa sin simular librerías. Un módulo que falla al
// importarse (por ejemplo, una dependencia nativa que falta) cierra el APK al abrirlo
// (16/10/2026: el gráfico de E8-01 necesitaba expo-linear-gradient).
// Solo se simulan los módulos nativos que vienen dentro del APK pero no existen en Jest;
// todo lo demás (incluidas las librerías de JavaScript) se carga de verdad.
jest.mock('react-native-webview', () => ({ WebView: () => null }));
jest.mock('expo-task-manager', () => ({
  isTaskDefined: () => false,
  defineTask: jest.fn(),
  isAvailableAsync: jest.fn(),
}));
jest.mock('expo-location', () => ({ Accuracy: { High: 4 } }));
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  AndroidImportance: { MAX: 5 },
  AndroidNotificationVisibility: { PRIVATE: 0 },
  DEFAULT_ACTION_IDENTIFIER: 'default',
}));

describe('AppContent', () => {
  it('todos los módulos de la app se cargan sin errores', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://ejemplo.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'x';

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      expect(() => require('./AppContent')).not.toThrow();
    });
  });
});
