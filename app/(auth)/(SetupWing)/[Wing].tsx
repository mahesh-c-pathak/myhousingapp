import React, { useState } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from "../../../FirebaseConfig";
import { doc, getDoc, setDoc, collection, addDoc, getDocs,deleteDoc,query, writeBatch } from 'firebase/firestore';

const WingScreen: React.FC = () => {
  const { Wing, societyName } = useLocalSearchParams(); // Retrieves wing name from the route params
  const sanitizedWing = (Wing as string).trim(); // Sanitize the wing name
  const wingLetter = sanitizedWing.split('-').pop(); // Extracts the wing identifier (e.g., 'A' from 'Wing-A')

  const customWingsSubcollectionName = `${societyName} wings`;
  const customFloorsSubcollectionName = `${societyName} floors`;
  const customFlatsSubcollectionName = `${societyName} flats`; 
  const customFlatsBillsSubcollectionName = `${societyName} bills`;

  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [totalFloors, setTotalFloors] = useState<string>('');
  const [unitsPerFloor, setUnitsPerFloor] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<number | null>(null);

  const numberFormats = [
    { label: '101, 102, ...', type: 'floorUnit' },
    { label: '1, 2, 3...', type: 'sequential' },
    { label: 'G1, G2, ...', type: 'groundUnit' },
    { label: 'Vertical 103, 203...', type: 'vertical' },
  ];

  const generateFloorWiseNumbers = () => {
    const floors = parseInt(totalFloors);
    const units = parseInt(unitsPerFloor);
  
    if (isNaN(floors) || isNaN(units) || selectedFormat === null) {
      alert('Please enter valid numbers for floors, units, and select a format!');
      return null;
    }
  
    const formatType = numberFormats[selectedFormat].type;
    const result: Record<string, string[]> = {}; // Store floor -> flat numbers mapping
  
    if (formatType === 'floorUnit') {
      for (let floor = 1; floor <= floors; floor++) {
        result[`Floor ${floor}`] = [];
        for (let unit = 1; unit <= units; unit++) {
          result[`Floor ${floor}`].push(`${floor}0${unit}`);
        }
      }
    } else if (formatType === 'sequential') {
      let counter = 1;
      for (let floor = 1; floor <= floors; floor++) {
        result[`Floor ${floor}`] = [];
        for (let unit = 1; unit <= units; unit++) {
          result[`Floor ${floor}`].push(counter.toString());
          counter++;
        }
      }
    } else if (formatType === 'groundUnit') {
      for (let floor = 0; floor < floors; floor++) {
        const floorKey = `Floor ${floor === 0 ? 'G' : floor}`;
        result[floorKey] = [];
        for (let unit = 1; unit <= units; unit++) {
          result[floorKey].push(floor === 0 ? `G${unit}` : `${floor}0${unit}`);
        }
      }
    } else if (formatType === 'vertical') {
      for (let unit = 1; unit <= units; unit++) {
        for (let floor = 1; floor <= floors; floor++) {
          const floorKey = `Floor ${floor}`;
          if (!result[floorKey]) result[floorKey] = [];
          result[floorKey].push(`${floor}0${unit}`);
        }
      }
    }
  
    return result;
  };

  const userWingUpdate = async (
    societyname: string,
    wingname: string
  ) => {
    
  
    try {
      // Step 1: Query all users
      const usersQuery = query(collection(db, "users"));
      const usersSnap = await getDocs(usersQuery);
      console.log('societyname in user wing update', societyname)
      console.log('wingname in user wing update', wingname)
  
      if (usersSnap.empty) {
        console.log("No users found in the database.");
        return;
      }
  
      // Step 2: Iterate through each user and update their data
      const batch = writeBatch(db); // Use a batch to optimize multiple updates
  
      usersSnap.forEach((userDoc) => {
        const userData = userDoc.data();
        const mySociety = userData.mySociety || [];
  
        const societyIndex = mySociety.findIndex(
          (society: any) => Object.keys(society)[0] === societyname
        );
  
        if (societyIndex !== -1) {
          const societyData = mySociety[societyIndex][societyname];
  
          if (societyData?.myWing?.[wingname]) {
            // Remove the specified wing
            const updatedMyWing = { ...societyData.myWing };
            delete updatedMyWing[wingname];
  
            const updatedSocietyData = {
              ...societyData,
              myWing: updatedMyWing,
            };
  
            const updatedMySociety = [...mySociety];
            updatedMySociety[societyIndex] = { [societyname]: updatedSocietyData };
  
            // Add the update to the batch
            batch.update(doc(db, "users", userDoc.id), {
              mySociety: updatedMySociety,
            });
  
            console.log(`Wing "${wingname}" removed for user "${userDoc.id}".`);
          }
        }
      });
  
      // Commit the batch
      await batch.commit();
      console.log(`Wing "${wingname}" removed successfully for all users.`);
    } catch (error) {
      console.error("Error updating user data:", error);
    } 
  };
  

  const handleNext = async () => {
    if (totalFloors && unitsPerFloor && selectedFormat !== null) {
      try {
        setLoading(true);
  
        const docRef = doc(db, "Societies", societyName as string);
        const docSnap = await getDoc(docRef);
  
        if (!docSnap.exists()) {
          alert("Society does not exist!");
          return;
        }
  
        const wingRef = doc(docRef, customWingsSubcollectionName, wingLetter as string);
        const floorsRef = collection(wingRef, customFloorsSubcollectionName);
        const floorsSnap = await getDocs(floorsRef);
  
        if (!floorsSnap.empty) {
          console.log(`Floors collection exists. Proceeding with Step 1 and Step 2...`);
  
          // Step 1: Call userWingUpdate before deleting old floors and flats
          await userWingUpdate(societyName as string, wingLetter as string);
  
          // Step 2: Delete old floors and flats in the wing
          for (const floorDoc of floorsSnap.docs) {
            const flatsRef = collection(floorsRef, floorDoc.id, customFlatsSubcollectionName);
            const flatsSnap = await getDocs(flatsRef);
  
            // Delete all flats under the floor
            for (const flatDoc of flatsSnap.docs) {
              const billsRef = collection(flatsRef, flatDoc.id, customFlatsBillsSubcollectionName);
              const billsSnap = await getDocs(billsRef);
  
              // Delete all bills under the flat
              for (const billDoc of billsSnap.docs) {
                await deleteDoc(doc(billsRef, billDoc.id));
              }
  
              await deleteDoc(doc(flatsRef, flatDoc.id)); // Delete flat document
            }
  
            await deleteDoc(doc(floorsRef, floorDoc.id)); // Delete floor document
          }
        } else {
          console.log("Floors collection does not exist. Skipping Step 1 and Step 2.");
        }
  
        // Step 3: Generate floor numbers and save new data
        const floorWiseNumbers = generateFloorWiseNumbers();
        if (!floorWiseNumbers) return;
  
        const wingData = {
          totalFloors: parseInt(totalFloors),
          unitsPerFloor: parseInt(unitsPerFloor),
          format: numberFormats[selectedFormat].type,
        };
  
        // Update the wing data
        await setDoc(wingRef, wingData, { merge: true });
  
        // Add new floors and flats
        for (const floorName in floorWiseNumbers) {
          const floorRef = doc(wingRef, customFloorsSubcollectionName, floorName);
          await setDoc(floorRef, {
            floorNumber: parseInt(floorName.replace("Floor ", "")),
          });
  
          const flatsRef = collection(floorRef, customFlatsSubcollectionName);
          floorWiseNumbers[floorName].forEach(async (flatNumber) => {
            const flatRef = doc(flatsRef, flatNumber);
  
            // Construct the flat reference string
            const flatReference = `${Wing}-${floorName}-${flatNumber}`;
  
            await setDoc(flatRef, {
              resident: "owner",
              flatType: "owner",
              flatreference: flatReference,
              memberStatus: "Notregistered",
              ownerRegisterd: "Notregistered",
            });
  
          });
        }
  
        alert(`Data for Wing ${Wing} saved successfully!`);
  
        router.push({
          pathname: "/WingSetupScreen",
          params: { Wing: wingLetter, societyName },
        });
      } catch (error) {
        console.error("Error saving data:", error);
        alert("Failed to save data. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      alert("Please fill all fields and select a format!");
    }
  };
  
  

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  
  
  

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Wing - {Wing}</Text>
      
      <TextInput
        label="Name"
        mode="outlined"
        value={Wing as string}
        disabled
        style={styles.input}
      />
      <TextInput
        label="Total Floor"
        mode="outlined"
        value={totalFloors}
        onChangeText={setTotalFloors}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        label="Maximum Unit Per Floor"
        mode="outlined"
        value={unitsPerFloor}
        onChangeText={setUnitsPerFloor}
        keyboardType="numeric"
        style={styles.input}
      />
      <Text style={styles.subheading}>Choose Number Format</Text>
      <FlatList
        data={numberFormats}
        numColumns={2}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[
              styles.formatCard,
              selectedFormat === index && styles.selectedFormatCard,
            ]}
            onPress={() => setSelectedFormat(index)}
          >
            <Text style={styles.unitText}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />
      <Button mode="contained" onPress={handleNext} style={styles.nextButton}>
        Next
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
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  subheading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  formatCard: {
    flex: 1,
    margin: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedFormatCard: {
    borderColor: '#6200ee',
    backgroundColor: '#e7e4f9',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '500',
  },
  nextButton: {
    marginTop: 16,
  },
});

export default WingScreen;
