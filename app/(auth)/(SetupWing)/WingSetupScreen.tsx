import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, useWindowDimensions, TouchableOpacity, ScrollView, Alert  } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card, Text, Button  } from 'react-native-paper';
import { db } from "../../../FirebaseConfig";
import { doc, getDoc, updateDoc  } from 'firebase/firestore';

const flatTypes = ['Owner', 'Closed', 'Rent', 'Dead', 'Shop'];
const flatColors: Record<string, string>= {
  Owner: '#2196F3', // Blue
  Closed: '#808080', // Grey
  Rent: '#FFA500', // Orange
  Dead: '#000000', // Black
  Shop: '#FF00FF', // Magenta
};

type FlatData = {
  flatType?: string; // Optional since you may need to default it to 'Owner'
};

type FloorData = {
  [flatNumber: string]: FlatData;
};

type WingData = {
  floorData: {
    [floor: string]: FloorData;
  };
};

type SocietyData = {
  wings?: {
    [wing: string]: WingData;
  };
};

const WingSetupScreen: React.FC = () => {
  const { Wing, name } = useLocalSearchParams(); // Retrieve wing and society name from params
  const [floorData, setFloorData] = useState<Record<string, Record<string, string>> | null>(null);
  const [originalFloorData, setOriginalFloorData] = useState<Record<string, Record<string, string>> | null>(null);
  const [loading, setLoading] = useState(true);

  const screenWidth = useWindowDimensions().width;
  const sanitizedWing = (Wing as string).trim();

  const router = useRouter(); // Expo router for navigation

  useEffect(() => {
    const fetchWingData = async () => {
      try {
        const docRef = doc(db, 'Societies', name as string);
        const docSnap = await getDoc(docRef);
     
        if (docSnap.exists()) {
          const societyData = docSnap.data() as SocietyData;
          const wingInfo = societyData.wings?.[sanitizedWing as string];
          if (wingInfo?.floorData) {
            // Set default 'Owner' type for any missing flatType field
            const updatedFloorData = Object.fromEntries(
              Object.entries(wingInfo.floorData).map(([floor, flats]) => [
                floor,
                Object.fromEntries(
                  Object.entries(flats).map(([flatNumber, flatData]) => [
                    flatNumber,
                    flatData.flatType || 'Owner', // Default to 'Owner' if flatType is not present
                  ])
                ),
              ])
            );
            setFloorData(updatedFloorData); // Use updatedFloorData here
            setOriginalFloorData(JSON.parse(JSON.stringify(updatedFloorData))); // Save original data for comparison
            
          } else {
            alert(`No data found for Wing ${Wing}`);
          }
        } else {
          alert('Society does not exist!');
        }
      } catch (error) {
        console.error('Error fetching wing data:', error);
        alert('Failed to fetch data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchWingData();
  }, [Wing, name]);

  const handleFlatPress = (floor: string, flatNumber: string) => {
    if (floorData) {
      setFloorData((prevFloorData) => {
        if (!prevFloorData) return null;

        const currentType = prevFloorData[floor][flatNumber];
        const nextTypeIndex = (flatTypes.indexOf(currentType) + 1) % flatTypes.length;
        const nextType = flatTypes[nextTypeIndex];

        return {
          ...prevFloorData,
          [floor]: {
            ...prevFloorData[floor],
            [flatNumber]: nextType,
          },
        };
      });
    }
  };

  const renderFlat = ({ item, floor }: { item: string; floor: string }) => {
    const flatType = floorData?.[floor]?.[item] || 'Owner'; // Default to 'Owner'
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

  const renderFloor = ({ item }: { item: [string, Record<string, string>] }) => {
    const [floor, flats] = item;

    const flatNumbers = Object.keys(flats);

    return (
      <View>
        <Text style={styles.floorHeading}>{floor}</Text>
        <FlatList
          data={flatNumbers}
          keyExtractor={(flatNumber) => `${floor}-${flatNumber}`}
          renderItem={({ item }) => renderFlat({ item, floor })}
          numColumns={3}
          contentContainerStyle={styles.flatListContent}
        />
      </View>
    );
  };

  const handleContinue = () => {
    if (!floorData || !originalFloorData) return;
  
    const changes: string[] = [];
    const updates: Record<string, any> = {};
  
    Object.entries(floorData).forEach(([floor, flats]) => {
      Object.entries(flats).forEach(([flatNumber, flatType]) => {
        if (flatType !== originalFloorData[floor][flatNumber]) {
          changes.push(`${Wing} ${flatNumber}: ${originalFloorData[floor][flatNumber]} → ${flatType}`);
          
          // Construct the Firestore update path
          updates[`wings.${sanitizedWing}.floorData.${floor}.${flatNumber}.flatType`] = flatType;
        }
      });
    });
  
    if (changes.length > 0) {
      Alert.alert(
        'Confirm Changes',
        changes.join('\n'),
        [
          {
            text: 'NO',
            onPress: () => router.push('/SetupWingsScreen'),
            style: 'cancel',
          },
          {
            text: 'YES',
            onPress: async () => {
              try {
                const docRef = doc(db, 'Societies', name as string);
  
                // Update only the modified flatType fields
                await updateDoc(docRef, updates);
  
                router.push({
                  pathname: '/SetupWingsScreen',
                  params: { name },
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
      alert('No changes detected.');
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
    <ScrollView  style={styles.container}>
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
                params: { name, Wing },
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
      {floorData ? (
        <>
        <FlatList
          data={Object.entries(floorData)}
          keyExtractor={([floor]) => floor}
          renderItem={renderFloor}
          scrollEnabled={false} // Disable scrolling
        />
        <Button mode="contained" onPress={handleContinue} style={styles.button}>
          Continue
        </Button>
      </>
      ) : (
        <Text style={styles.info}>No floor data available for this wing.</Text>
      )}

      
    </ScrollView >
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
  floorHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  info: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  flatListContent: {
    paddingHorizontal: 8,
  },
  card: {
    margin: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    elevation: 2,
  },
  cardText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
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
  button: {
    marginTop: 16,
    alignSelf: 'center',
  },
});

export default WingSetupScreen;
