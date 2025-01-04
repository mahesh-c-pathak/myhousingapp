import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { auth } from "../../../FirebaseConfig";
import { Link } from 'expo-router';
import { Button } from 'react-native-paper';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';

import { useSession } from "../../../utils/ctx";
 
export default function TabOneScreen() {
  const { logOut, user } = useSession();
  
  const handlefirebaseLogout = async () => {
    await logOut();
  }

  // useEffect(() => { console.log('user',user) }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab One</Text>
      
      <Button 
        mode="contained" 
        onPress={handlefirebaseLogout} 
        buttonColor="#6200ea" 
        textColor="#ffffff"
        style={styles.button}
      >
        Firebase Logout
      </Button>

      <Link href="/(auth)/(expense)" asChild>
        <Button mode="contained" buttonColor="#6200ea" style={styles.button}>
          Go to test screen!
        </Button>
      </Link>

      <Link href="/(auth)/(directory)" asChild>
        <Button mode="contained" buttonColor="#6200ea" style={styles.button}>
          Go to directory screen!
        </Button>
      </Link>

      <Link href="/(auth)/(accounting)" asChild>
        <Button mode="contained" buttonColor="#6200ea" style={styles.button}>
          Go to Accounting screen!
        </Button>
      </Link>

      <Link href="/(auth)/(Bills)" asChild>
        <Button mode="contained" buttonColor="#6200ea" style={styles.button}>
          Go to Bills screen!
        </Button>
      </Link>

      <Link href="/(auth)/(SetupWing)" asChild>
        <Button mode="contained" buttonColor="#6200ea" style={styles.button}>
          Go to SetupWing screen!
        </Button>
      </Link>

      <Link href="/(auth)/(Admin)" asChild>
        <Button mode="contained" buttonColor="#6200ea" style={styles.button}>
          Go to Admin screen!
        </Button>
      </Link>

      <Link href="/(auth)/(Member)" asChild>
        <Button mode="contained" buttonColor="#6200ea" style={styles.button}>
          Go to Member screen!
        </Button>
      </Link>
 
      <Link href="/(auth)/startPage" asChild>
        <Button mode="contained" buttonColor="#6200ea" style={styles.button}>
          Go to startPage screen!
        </Button>
      </Link>

      
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  button: {
    width: "80%",
    marginVertical: 10,
    
  },
  text: {
    color: '#FFFFFF', // Maintained white for clear visibility
    fontSize: 18, // Slightly larger for emphasis
    fontWeight: '600', // Semi-bold for a balanced weight
  },
  
});
