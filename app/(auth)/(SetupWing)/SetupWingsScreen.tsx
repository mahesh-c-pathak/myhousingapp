import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from "../../../FirebaseConfig";
import { doc, getDoc } from 'firebase/firestore';

const SetupWingsScreen: React.FC = () => {
  const { totalWings: localTotalWings, name: localName } = useLocalSearchParams();
  const router = useRouter();

  const [totalWings, setTotalWings] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [wings, setWings] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
 
  useEffect(() => {
    const fetchSocietyData = async () => {
      try {
        const docRef = doc(db, 'Societies', localName);
        const docSnapshot = await getDoc(docRef);

        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setTotalWings(data.totalWings || localTotalWings); // Fallback to localTotalWings if undefined
          setName(data.name || localName); // Fallback to localName if undefined
          setWings(data.wings || null);
        } else {
          // Fallback to local search params if Firestore document doesn't exist
          setTotalWings(localTotalWings as string);
          setName(localName as string);
          setWings(null);
        }
      } catch (error) {
        console.error('Error fetching data from Firestore:', error);
        // Fallback to local search params in case of error
        setTotalWings(localTotalWings as string);
        setName(localName as string);
        setWings(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSocietyData();
  }, [localTotalWings, localName]);

  const generateCards = () => {
    const numberOfWings = parseInt(totalWings || '0', 10); // Default to 0 if totalWings is null
    const cards = [];
    for (let i = 1; i <= numberOfWings; i++) {
      const wingLetter = String.fromCharCode(64 + i); // Convert 1 -> A, 2 -> B, etc.
      const wingKey = `Wing-${wingLetter}`;
      const wingExists = wings && wings[wingKey];
      

      cards.push(
        <Card
          key={wingKey}
          style={styles.card}
          onPress={() => {
            if (wingExists) {
              // Navigate to WingSetupScreen if Wing-${wingLetter} exists
              router.push({
                pathname: `/(auth)/(SetupWing)/WingSetupScreen`,
                params: { name, totalWings, Wing: wingKey },
              });
            } else {
              // Navigate to the default route
              
              router.push({
                pathname: `/Wing-${wingLetter}`,
                params: { name:localName, totalWings, wing: wingLetter },
              });
            }
          }}
        >
          <Card.Title title={`Setup ${wingLetter}`} />
        </Card>
      );
    }
    return cards;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5e35b1" />
      </View>
    );
  }

  if (!totalWings || !name) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to fetch data. Please check your connection.</Text>
      </View>
    );
  }

  return <View style={styles.container}>{generateCards()}</View>;
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
});

export default SetupWingsScreen;
