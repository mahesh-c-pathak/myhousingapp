import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { router } from "expo-router";
import { Link } from 'expo-router';

const LandingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>
        Landing Screen
      </Text>

      {/* React Native Paper Button with styling */}
      <Button 
        mode="contained" 
        style={styles.button} 
        onPress={() => router.push("/(sign)/login")}
      >
        Login
      </Button>

      <Button 
        mode="outlined" 
        style={styles.button} 
        onPress={() => router.push("/(sign)/signup")}
      >
        Signup
      </Button>
      
      

    </View>
  );
};

export default LandingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  button: {
    width: "80%",
    marginVertical: 10,
  },
});
