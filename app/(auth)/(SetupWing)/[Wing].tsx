import React, { useState } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from "../../../FirebaseConfig";
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const WingScreen: React.FC = () => {
  const { Wing, name } = useLocalSearchParams(); // Retrieves wing name from the route params
  const router = useRouter();

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
    const result: Record<string, Record<string, any>> = {};
  
    const generateFlatObject = (flatNumber: string) => ({
      resident: 'owner', // Default resident value
      flatType: 'owner',
      bills: {
        bill1: { status: 'unpaid', amount: 0 },
        bill2: { status: 'unpaid', amount: 0 },
      }, // Default bill objects as key-value pairs
    });
  
    if (formatType === 'floorUnit') {
      for (let floor = 1; floor <= floors; floor++) {
        result[`Floor ${floor}`] = {};
        for (let unit = 1; unit <= units; unit++) {
          const flatNumber = `${floor}0${unit}`;
          result[`Floor ${floor}`][flatNumber] = generateFlatObject(flatNumber);
        }
      }
    } else if (formatType === 'sequential') {
      let counter = 1;
      for (let floor = 1; floor <= floors; floor++) {
        result[`Floor ${floor}`] = {};
        for (let unit = 1; unit <= units; unit++) {
          const flatNumber = counter.toString();
          result[`Floor ${floor}`][flatNumber] = generateFlatObject(flatNumber);
          counter++;
        }
      }
    } else if (formatType === 'groundUnit') {
      for (let floor = 0; floor < floors; floor++) {
        const floorKey = `Floor ${floor === 0 ? 'G' : floor}`;
        result[floorKey] = {};
        for (let unit = 1; unit <= units; unit++) {
          const flatNumber = floor === 0 ? `G${unit}` : `${floor}0${unit}`;
          result[floorKey][flatNumber] = generateFlatObject(flatNumber);
        }
      }
    } else if (formatType === 'vertical') {
      for (let unit = 1; unit <= units; unit++) {
        for (let floor = 1; floor <= floors; floor++) {
          const floorKey = `Floor ${floor}`;
          if (!result[floorKey]) result[floorKey] = {};
          const flatNumber = `${floor}0${unit}`;
          result[floorKey][flatNumber] = generateFlatObject(flatNumber);
        }
      }
    }
  
    return result;
  };
  
  

  const handleNext = async () => {
    if (totalFloors && unitsPerFloor && selectedFormat !== null) {
      try {
        
        const sanitizedWing = (Wing as string).trim(); // Trim any trailing spaces
        const docRef = doc(db, 'Societies', name as string);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          alert('Society does not exist!');
          return;
        }

        const floorWiseNumbers = generateFloorWiseNumbers();
        if (!floorWiseNumbers) return;

        const wingData = {
          totalFloors: parseInt(totalFloors),
          unitsPerFloor: parseInt(unitsPerFloor),
          format: numberFormats[selectedFormat].type,
          floorData: floorWiseNumbers,
        };

        // Update or add the wing field in the document
        await updateDoc(docRef, {
          [`wings.${sanitizedWing}`]: wingData,
        });
 
        alert(`Data for Wing ${Wing} saved successfully!`);
        
        router.push({
          pathname: '/WingSetupScreen',
          params: { Wing, name },
        });
      } catch (error) {
        console.error('Error saving data:', error);
        alert('Failed to save data. Please try again.');
      }
    } else {
      alert('Please fill all fields and select a format!');
    }
  };

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
