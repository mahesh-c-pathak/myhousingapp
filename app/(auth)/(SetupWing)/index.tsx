import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { getFirestore, doc, setDoc, collection } from 'firebase/firestore';
import { db } from "../../../FirebaseConfig";

const RequestTrialScreen: React.FC = () => {
  const [societyName, setSocietyName] = useState('');
  const [totalWings, setTotalWings] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [city, setCity] = useState('Pune');
  const [pincode, setPincode] = useState('');
  const router = useRouter();

  const validateAndSubmit = async () => {
    if (!societyName || !totalWings || !pincode) {
      Alert.alert('Validation Error', 'Please fill in all the fields.');
      return;
    }

    try {
      const societiesRef = collection(db, 'Societies');
      const societyDocRef = doc(societiesRef, societyName);

      // Create society-level document
      await setDoc(societyDocRef, {
        name: societyName,
        totalWings: Number(totalWings),
        state,
        city,
        pincode,
      });

      // Initialize wing structure
      for (let i = 1; i <= Number(totalWings); i++) {
        const wingLetter = String.fromCharCode(64 + i); // Convert 1 -> A, 2 -> B, etc
        const wingName = wingLetter; // "Wing A", "Wing B", etc.
        const wingRef = doc(collection(societyDocRef, 'wings'), wingName);

        await setDoc(wingRef, {
          totalFloors: 0,
          unitsPerFloor: 0,
          format: '',
        });
      }

      Alert.alert('Success', 'Society and wings initialized successfully!');
      router.push({ pathname: '/SetupWingsScreen', params: { societyName, totalWings } });
    } catch (error) {
      Alert.alert('Error', 'Failed to save data. Please try again.');
      console.error('Firebase Error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Society Name"
        mode="outlined"
        style={styles.input}
        placeholder="Happy Home"
        value={societyName}
        onChangeText={setSocietyName}
      />
      <TextInput
        label="Total Wings/Blocks/Buildings"
        mode="outlined"
        style={styles.input}
        value={totalWings}
        onChangeText={setTotalWings}
        keyboardType="numeric"
      />
      <TextInput
        label="State"
        mode="outlined"
        style={styles.input}
        value={state}
        onChangeText={setState}
      />
      <TextInput
        label="City"
        mode="outlined"
        style={styles.input}
        value={city}
        onChangeText={setCity}
      />
      <TextInput
        label="Pincode"
        mode="outlined"
        style={styles.input}
        value={pincode}
        onChangeText={setPincode}
      />
      <Button
        mode="contained"
        style={styles.submitButton}
        onPress={validateAndSubmit}
      >
        Submit
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  input: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 16,
  },
});

export default RequestTrialScreen;
