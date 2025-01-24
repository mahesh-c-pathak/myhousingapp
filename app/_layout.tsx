import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useEffect, useState } from "react";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { SessionProvider, useSession } from "../utils/ctx";
import { Slot } from "expo-router";
import { useRouter } from "expo-router"
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import { StatusBar } from 'expo-status-bar';
import { SocietyProvider } from "../utils/SocietyContext";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '/(sign)/login',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SessionProvider>
      <SocietyProvider>
        <SafeAreaProvider>
          <PaperProvider>
            <RootLayoutNav />
          </PaperProvider>
        </SafeAreaProvider>
      </SocietyProvider>
    </SessionProvider>
  );
}
 
function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated } = useSession();
  
  const { isApproved } = useSession();
  const router = useRouter()
  useEffect(()=>{
    if (typeof isAuthenticated == 'undefined' ) return;
    if (isApproved == true && isAuthenticated == true){
      router.replace('/(auth)/(tabs)');
    } else if (isAuthenticated == false) {
      router.replace('/(sign)/landing');
    }
  },[isAuthenticated])

  return (
    <>
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Slot />
      
    </ThemeProvider>
    <StatusBar style='light'/>
    </>
  );
}
