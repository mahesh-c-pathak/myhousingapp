import React, { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useSession } from '../../utils/ctx';
import { getAuth } from 'firebase/auth';
import { TextInput, Button, Surface } from 'react-native-paper';
import { signInWithEmailAndPassword } from 'firebase/auth';

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const { login, logOut } = useSession();
  const { currentUser } = getAuth();

  const handleFirebaseLogin = async () => {
    const response = await login(email, password);
    if (!response.success) {
      Alert.alert('Sign In', response.msg);
    }
  };

  const handleFirebaseLogout = async () => {
    await logOut();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome! 🌈</Text>
      <Text style={styles.subtitle}>This is a simple repo</Text>
      
      <Surface style={styles.surface}>
        <TextInput
          label="Email"
          mode="outlined"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          label="Password"
          mode="outlined"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />
        <Button
          mode="contained"
          onPress={handleFirebaseLogin}
          style={styles.button}
        >
          Firebase Login
        </Button>
        <Button
          mode="outlined"
          onPress={handleFirebaseLogout}
          style={styles.button}
        >
          Firebase Logout
        </Button>
      </Surface>
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  surface: {
    padding: 20,
    elevation: 4,
    borderRadius: 8,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
});
