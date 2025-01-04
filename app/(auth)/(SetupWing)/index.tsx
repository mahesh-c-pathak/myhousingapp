import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, } from 'react-native-paper'; // Ensure dropdown is installed or replaced with Picker
import { useRouter } from 'expo-router';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from "../../../FirebaseConfig";

const RequestTrialScreen: React.FC = () => {
  const [type, setType] = useState('');
  const [name, setName] = useState('');
  const [totalWings, setTotalWings] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [city, setCity] = useState('Pune');
  const [pincode, setPincode] = useState('');
  const router = useRouter();

  const validateAndSubmit = async () => {
    if (!name || !totalWings || !pincode) {
      Alert.alert('Validation Error', 'Please fill in all the fields.');
      return;
    }

    try {
      const societyDocRef = doc(db, 'Societies', name);
      const societyDoc = await getDoc(societyDocRef);

      if (societyDoc.exists()) {
        Alert.alert(
          'Duplicate Entry',
          `A society with the name "${name}" already exists. Please choose a different name.`
        );
        return;
      }

      const societyData = {
        type,
        name,
        totalWings: Number(totalWings),
        state,
        city,
        pincode,
      };

      // Save to Firebase using `setDoc`
      await setDoc(societyDocRef, societyData);
      Alert.alert('Success', 'Society information saved successfully!');

      // Navigate to next screen
      router.push({
        pathname: '/SetupWingsScreen',
        params: { totalWings, name },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to save data. Please try again.');
      console.error('Firebase Error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
       label="Type" 
       mode="outlined"
       style={styles.input}
       placeholder="Buildings (Multiple Floors)" 
       value={type}
       onChangeText={setType}
        
       />
      <TextInput
        label="Name"
        mode="outlined"
        style={styles.input}
        placeholder="Happy home"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        label="Total Wings/Blocks/Building"
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
        placeholder="Enter State" 
        value={state}
        onChangeText={setState}
      />
      <TextInput 
        label="City" 
        mode="outlined"
        style={styles.input}
        placeholder="Enter City"
        value={city}
        onChangeText={setCity}   
        />
      <TextInput
        label="Pincode"
        mode="outlined"
        style={styles.input}
        placeholder="Enter Pincode"
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
