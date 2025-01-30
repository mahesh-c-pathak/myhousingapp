import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from "../../../FirebaseConfig";
import { collection, getDocs, doc } from 'firebase/firestore';
import { MaterialIcons } from "@expo/vector-icons"; // Import icon library

const SetupWingsScreen: React.FC = () => {
  const { societyName: localName } = useLocalSearchParams() as {societyName: string }; // Society name

  const customWingsSubcollectionName = `${localName} wings`;
  const customFloorsSubcollectionName = `${localName} floors`;
  const customFlatsSubcollectionName = `${localName} flats`;
  const customFlatsBillsSubcollectionName = `${localName} bills`;

  const router = useRouter();

  const [wings, setWings] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState<boolean>(true); 
  const [alreadySetupWings, setAlreadySetupWings] = useState<string[]>([]);

  useEffect(() => {
    const fetchWingsData = async () => {
      if (!localName) {
        console.error("Error: Society name (localName) is missing.");
        setLoading(false);
        return;
      }
    
      try {
        const wingsCollectionRef = collection(db, "Societies", localName, customWingsSubcollectionName);
        const wingsSnapshot = await getDocs(wingsCollectionRef);
    
        if (!wingsSnapshot.empty) {
          const wingsData: Record<string, any> = {};
          const alreadySetupWings: string[] = []; // To store wings with floors
    
          // Iterate through each wing and fetch data
          await Promise.all(
            wingsSnapshot.docs.map(async (doc) => {
              const wingKey = doc.id; // Get wing document ID
              wingsData[wingKey] = doc.data(); // Store wing data
    
              // Construct reference to the floors collection for the current wing
              const floorsCollectionRef = collection(
                db,
                "Societies",
                localName,
                customWingsSubcollectionName,
                wingKey,
                customFloorsSubcollectionName
              );
    
              // Check if the floors collection exists and has documents
              const floorsSnapshot = await getDocs(floorsCollectionRef);
              if (!floorsSnapshot.empty) {
                alreadySetupWings.push(wingKey); // Add wing to the setup array
              }
            })
          );
    
          setWings(wingsData); // Set the wings data state
          setAlreadySetupWings(alreadySetupWings); // Update alreadySetupWings state
        } else {
          setWings(null); // No wings found
        }
      } catch (error) {
        console.error("Error fetching wings data:", error);
        setWings(null);
      } finally {
        setLoading(false);
      }
    };
    

    fetchWingsData();
  }, [localName]);

  const generateCards = () => {
    if (!wings) return null;

    const cards = Object.keys(wings).map((wingKey) => {
      const wingData = wings[wingKey];
      const wingLetter = wingKey.split('-').pop(); // Extracts the wing identifier (e.g., 'A' from 'Wing-A')
      const isSetup = alreadySetupWings.includes(wingKey); // Check if the wing is in alreadySetupWings

      return (
        <Card
          key={wingKey}
          style={styles.card}
          onPress={() => {
            if (isSetup) {
              // Route to WingSetupScreen if alreadySetupWings includes this wingKey
              router.push({
                pathname: "/WingSetupScreen",
                params: {
                  societyName: localName,
                  Wing: wingLetter,
                },
              });
            } else {
              // Default route for wings not in alreadySetupWings
              router.push({
                pathname: `/Wing-${wingLetter}`,
                params: {
                  societyName: localName,
                  wing: wingLetter,
                  totalFloors: wingData.totalFloors,
                  unitsPerFloor: wingData.unitsPerFloor,
                },
              });
            }
          }}
        >
          <Card.Title
           title={`Setup Wing ${wingLetter}`} 
           right={() =>
            isSetup ? (
              <MaterialIcons name="check-circle" size={24} color="green" />
            ) : (
              <MaterialIcons name="cancel" size={24} color="red" />
            )
          }
           />
        </Card>
      );
    });

    return cards;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5e35b1" />
      </View>
    );
  }

  if (!wings) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No wings data found. Please check your connection or society details.</Text>
      </View>
    );
  }
  const allWingsSetUp = wings && Object.keys(wings).length === alreadySetupWings.length;

  return (
    <View style={styles.container}>
      {generateCards()}
      {allWingsSetUp && (
        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: "/(auth)/startPage",
            })
          }
        >
          <Text style={styles.buttonText}>Proceed to Home Screen</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  card: {
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
  },
  button: {
    backgroundColor: '#5e35b1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SetupWingsScreen;
 