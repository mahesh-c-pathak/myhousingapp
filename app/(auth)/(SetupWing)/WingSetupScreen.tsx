import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, useWindowDimensions, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card, Text, Button } from 'react-native-paper';
import { db } from '../../../FirebaseConfig';
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';

const flatTypes = ['Owner', 'Closed', 'Rent', 'Dead', 'Shop'];
const flatColors: Record<string, string> = {
  Owner: '#2196F3', // Blue
  Closed: '#808080', // Grey
  Rent: '#FFA500', // Orange
  Dead: '#000000', // Black
  Shop: '#FF00FF', // Magenta
};

type FlatData = {
  resident: string;
  flatType: string;
};

type FloorData = {
  [flatNumber: string]: FlatData;
};

type WingData = {
  totalFloors: number;
  unitsPerFloor: number;
  format: string;
};
 
const WingSetupScreen: React.FC = () => {
  const { Wing, societyName } = useLocalSearchParams() as { Wing: string; societyName: string };
  const [floorData, setFloorData] = useState<Record<string, FloorData> | null>(null);
  const [originalFloorData, setOriginalFloorData] = useState<Record<string, FloorData> | null>(null);
  const [loading, setLoading] = useState(true);

  const screenWidth = useWindowDimensions().width;
  const router = useRouter(); // Expo router for navigation

  useEffect(() => {
    const fetchWingData = async () => {
      try {
        const wingRef = doc(db, 'Societies', societyName as string, 'wings', Wing as string);
        const wingSnap = await getDoc(wingRef);

        if (!wingSnap.exists()) {
          alert('Wing does not exist!');
          return;
        }

        const floorsRef = collection(wingRef, 'floors');
        const floorSnaps = await getDocs(floorsRef);

        if (floorSnaps.empty) {
          alert(`No data found for Wing ${Wing}`);
          return;
        }

        const fetchedFloorData: Record<string, FloorData> = {};
        for (const floorDoc of floorSnaps.docs) {
          const flatsRef = collection(floorDoc.ref, 'flats');
          const flatSnaps = await getDocs(flatsRef);

          const flatData: FloorData = {};
          flatSnaps.forEach((flatDoc) => {
            const { flatType = 'Owner', resident = 'Owner' } = flatDoc.data() as FlatData;
            flatData[flatDoc.id] = { flatType, resident };
          });

          fetchedFloorData[floorDoc.id] = flatData;
        }

        setFloorData(fetchedFloorData);
        setOriginalFloorData(JSON.parse(JSON.stringify(fetchedFloorData)));
      } catch (error) {
        console.error('Error fetching wing data:', error);
        alert('Failed to fetch data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchWingData();
  }, [Wing, societyName]);

  const handleFlatPress = (floor: string, flatNumber: string) => {
    if (floorData) {
      setFloorData((prevFloorData) => {
        if (!prevFloorData) return null;

        // Ensure flatType exists before calling indexOf
        const currentFlatData = prevFloorData[floor]?.[flatNumber];
        if (!currentFlatData) return prevFloorData;

        const currentType = currentFlatData.flatType;
        const currentIndex = flatTypes.indexOf(currentType);

      // Default to the first type if the current type is invalid
      const nextType = flatTypes[(currentIndex + 1) % flatTypes.length] || flatTypes[0];
        return {
          ...prevFloorData,
          [floor]: {
            ...prevFloorData[floor],
            [flatNumber]: { ...currentFlatData, flatType: nextType },
          },
        };
      });
    }
  }; 

  const renderFlat = ({ item, floor }: { item: string; floor: string }) => {
    const flatType = floorData?.[floor]?.[item]?.flatType || 'Owner'; // Default to 'Owner'
    const backgroundColor = flatColors[flatType] || flatColors['Owner']; // Fallback color

    return (
      <TouchableOpacity onPress={() => handleFlatPress(floor, item)}>
        <Card style={[styles.card, { width: screenWidth / 3 - 10, backgroundColor }]} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardText}>
              {item}
            </Text>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderFloor = ({ item }: { item: [string, FloorData] }) => {
    const [floor, flats] = item;

    const flatNumbers = Object.keys(flats);

    return (
      <View>
        
        <FlatList
          data={flatNumbers}
          keyExtractor={(flatNumber) => `${floor}-${flatNumber}`}
          renderItem={({ item }) => renderFlat({ item, floor })}
          //numColumns={3}
          contentContainerStyle={styles.flatListContent}
          horizontal={true}
          scrollEnabled={false} // Disable scrolling
        />
      </View>
    );
  };

  const handleContinue = async () => {
    if (!floorData || !originalFloorData) return;
  
    const changes: string[] = [];
    const updates: { floor: string; flatNumber: string; oldType: string; newType: string }[] = [];
  
    // Identify modified fields
    for (const [floor, flats] of Object.entries(floorData)) {
      for (const [flatNumber, flat] of Object.entries(flats)) {
        const originalFlat = originalFloorData[floor]?.[flatNumber];
        if (!originalFlat || flat.flatType !== originalFlat.flatType) {
          changes.push(
            `Flat ${flatNumber}: ${originalFlat?.flatType || 'N/A'} → ${flat.flatType}`
          );
          updates.push({
            floor,
            flatNumber,
            oldType: originalFlat?.flatType || 'N/A',
            newType: flat.flatType,
          });
        }
      }
    }
  
    if (changes.length > 0) {
      Alert.alert(
        'Confirm Changes',
        changes.join('\n'),
        [
          {
            text: 'NO',
            onPress: () => router.push({
              pathname: '/SetupWingsScreen',
              params: { societyName },
            }),
            style: 'cancel',
          },
          {
            text: 'YES',
            onPress: async () => {
              try {
                // Apply updates to Firestore
                for (const update of updates) {
                  const { floor, flatNumber, newType } = update;
                  const flatRef = doc(
                    db,
                    'Societies',
                    societyName as string,
                    'wings',
                    Wing as string,
                    'floors',
                    floor,
                    'flats',
                    flatNumber
                  );
  
                  await updateDoc(flatRef, { flatType: newType });
                }
                // After all updates, navigate to SetupWingsScreen
                router.push({
                  pathname: '/SetupWingsScreen',
                  params: { societyName },
                  
                });
              } catch (error) {
                console.error('Error updating data:', error);
                alert('Failed to save changes.');
              }
            },
          },
        ]
      );
    } else {
      router.push({
        pathname: '/SetupWingsScreen',
        params: { societyName },
      })
    }
  };
  
  
  

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Loading Wing Setup...</Text>
      </View>
    );
  }

  return (
    <>
    <View style={styles.container}>
      <Text style={styles.heading}>Wing Setup - {Wing}</Text>
      <Button
        mode="text"
        onPress={() =>
          Alert.alert(
            "Do you want to Setup again?",
            "This will remove your current setup and can't recover again",
          [
            {
              text: "NO",
              onPress: () => {}, // Dismiss the alert
              style: "cancel",
            },
            {
              text: "YES",
              onPress: () =>
              router.push({
                pathname: `/(auth)/(SetupWing)/[Wing]`,
                params: { societyName, Wing },
              }),
            },
          ]
        )}>
          Setup Again?
      </Button>
      <View style={styles.legendContainer}>
        {flatTypes.map((type) => (
          <View key={type} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: flatColors[type] }]} />
            <Text>{type}</Text>
          </View>
        ))}
      </View>
      <ScrollView
       style={styles.scrollcontainer}
       horizontal={true}
       >
        <FlatList
          data={Object.entries(floorData || {})}
          keyExtractor={([floor]) => floor}
          renderItem={renderFloor}
          //scrollEnabled={false} // Disable scrolling
          contentContainerStyle={styles.flatListContent}
        />
      </ScrollView>
      <View style={styles.container}></View>
      <Button mode="contained" onPress={handleContinue} style={styles.button}>
        Continue
      </Button>
    </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  scrollcontainer: {margin: 8, flexGrow:1, backgroundColor: '#DAD8C9', padding:8 },
  heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  floorHeading: { fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  flatListContent: { paddingHorizontal: 8, flexGrow:1 },
  card: { margin: 4, alignItems: 'center', justifyContent: 'center', borderRadius: 8, elevation: 2 },
  cardText: { textAlign: 'center', fontSize: 14, fontWeight: 'bold', color: '#fff' },
  button: { marginTop: 16, alignSelf: 'center' },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  legendItem: {
    alignItems: 'center',
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginBottom: 4,
  },
});

export default WingSetupScreen;
