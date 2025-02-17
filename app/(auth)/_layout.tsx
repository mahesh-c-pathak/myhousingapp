import { Redirect, Stack, Slot } from "expo-router";

import { useSession } from "../../utils/ctx";
import { Text } from "@/components/Themed";

export default function AppLayout() {
  const { session, isLoading } = useSession();
  // You can keep the splash screen open, or render a loading screen like we do here.
  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  // Only require authentication within the (app) group's layout as users
  // need to be able to access the (auth) group and sign in again.

  return (
    <Stack initialRouteName="(tabs)">
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      <Stack.Screen name="(expense)" options={{ title: "Top expense" }} />
      <Stack.Screen
        name="(directory)"
        options={{ title: "Society Directory", headerShown: false }}
      />
      <Stack.Screen name="(accounting)" options={{ headerShown: false }} />
      <Stack.Screen name="(Bills)" options={{ headerShown: false }} />
      <Stack.Screen name="(SetupWing)" options={{ headerShown: false }} />
      <Stack.Screen name="(Admin)" options={{ headerShown: false }} />
      <Stack.Screen name="(Member)" options={{ headerShown: false }} />
    </Stack>
  );
}
