import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, useTheme, RadioButton } from 'react-native-paper';
import { auth, db } from '../../FirebaseConfig';
import { createUserWithEmailAndPassword, sendEmailVerification, AuthError, updateProfile  } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

type AuthErrorType = AuthError & {
  message: string;
};

const RegisterScreen: React.FC = () => {
  const theme = useTheme();
  
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [apartment, setApartment] = useState<string>('');
  const [flatNumber, setFlatNumber] = useState<string>('');
  const [role, setRole] = useState<'resident' | 'admin'>('resident');

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update the displayName using updateProfile function
      await updateProfile(user, { displayName: name });

      await sendEmailVerification(user);

      await setDoc(doc(db, 'users', user.uid), {
        email,
        approved: false,
        name,
        apartment,
        flatNumber,
        role,
      });

      Alert.alert('Success', 'Verification email sent. Please verify your email.');
    } catch (err) {
      const firebaseError = err as AuthErrorType;
      setError(firebaseError.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>
        Register
      </Text>
      
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Full Name"
        value={name}
        onChangeText={setName}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Apartment"
        value={apartment}
        onChangeText={setApartment}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Flat Number"
        value={flatNumber}
        onChangeText={setFlatNumber}
        mode="outlined"
        style={styles.input}
      />
      
      <View style={styles.radioGroup}>
        <RadioButton.Group onValueChange={(value) => setRole(value as 'resident' | 'admin')} value={role}>
          <View style={styles.radioOption}>
            <RadioButton value="resident" color={theme.colors.primary} />
            <Text style={styles.radioLabel}>Register as Resident</Text>
          </View>
          <View style={styles.radioOption}>
            <RadioButton value="admin" color={theme.colors.primary} />
            <Text style={styles.radioLabel}>Register as Admin</Text>
          </View>
        </RadioButton.Group>
      </View>

      <Button mode="contained" onPress={handleRegister} style={styles.button}>
        Register
      </Button>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 20,
    paddingVertical: 5,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioLabel: {
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
});
