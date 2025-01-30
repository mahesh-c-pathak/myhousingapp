import React, { useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { getFirestore, doc, setDoc, collection, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from "../../../FirebaseConfig";
import { useSession } from "@utils/ctx";
import {addSocietyWithLedgerGroups, addPredefinedAccountsWithBalances} from '@utils/SetupWIngs/setUpLedger'

const RequestTrialScreen: React.FC = () => {
  const [societyName, setSocietyName] = useState('');
  const [totalWings, setTotalWings] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [city, setCity] = useState('Pune');
  const [pincode, setPincode] = useState('');
  const router = useRouter();
  const { user } = useSession();
  const userId = user?.uid

  const [loading, setLoading] = useState<boolean>(false); 

  const assignAdminRole = async (userId: string, societyName: string) => {
    try {
      const userDocRef = doc(db, "users", userId);
  
      // Update the user's mySociety field to include the Admin role
      await updateDoc(userDocRef, {
        mySociety: arrayUnion({
          [societyName]: {
            memberRole: ["Admin"], // Assign "Admin" role
          },
        }),
      });
  
      console.log(`Admin role assigned successfully for society: ${societyName}`);
    } catch (error) {
      console.error("Error assigning Admin role:", error);
    }
  };

  const validateAndSubmit = async () => {
    if (!societyName || !totalWings || !pincode) {
      Alert.alert('Validation Error', 'Please fill in all the fields.');
      return;
    }
    setLoading(true);

    try {
      const societiesRef = collection(db, 'Societies');
      const societyDocRef = doc(societiesRef, societyName);

      // Check if the society already exists
      const societyDocSnap = await getDoc(societyDocRef);
      if (societyDocSnap.exists()) {
        Alert.alert(
          'Duplicate Society',
          `A society with the name "${societyName}" already exists. Please choose a different name.`
        );
        return;
      }

      // Create society-level document
      await setDoc(societyDocRef, {
        name: societyName,
        totalWings: Number(totalWings),
        state,
        city,
        pincode,
        societycode:"99999"
      });

      // Initialize wing structure
      for (let i = 1; i <= Number(totalWings); i++) {
        const wingLetter = String.fromCharCode(64 + i); // Convert 1 -> A, 2 -> B, etc
        const wingName =  wingLetter; // "Wing A", "Wing B", etc.
        const customWingsSubcollectionName = `${societyName} wings`;
        const wingRef = doc(collection(societyDocRef, customWingsSubcollectionName), wingName);

        await setDoc(wingRef, {
          totalFloors: 0,
          unitsPerFloor: 0,
          format: '',
        });
      }

      // Assign Admin role 
      assignAdminRole(user.uid, societyName);

      // add Society LedgerGroups
      await addSocietyWithLedgerGroups(societyName);

      // 
      await addPredefinedAccountsWithBalances(societyName);

      Alert.alert('Success', 'Society and wings initialized successfully!');
      router.push({ pathname: '/SetupWingsScreen', params: { societyName, totalWings } });
    } catch (error) {
      Alert.alert('Error', 'Failed to save data. Please try again.');
      console.error('Firebase Error:', error);
    } finally {
      setLoading(false);
    }
  };

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5e35b1" />
        </View>
      );
    }

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
        onPress={()=>{validateAndSubmit()}}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
