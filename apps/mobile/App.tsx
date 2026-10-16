import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import { AppContent } from './src/app/AppContent';

export default function App() {
  // En el APK las fuentes ya vienen incrustadas (plugin expo-font); en la web se descargan aquí.
  useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  return (
    <>
      <StatusBar style="dark" />
      <AppContent />
    </>
  );
}
