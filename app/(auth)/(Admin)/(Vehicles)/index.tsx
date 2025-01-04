import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from "expo-router";
import { Appbar, Card, Chip } from 'react-native-paper';
import { IconButton, FAB, Avatar } from 'react-native-paper';
import { db } from '../../../../FirebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useSociety } from "../../../../utils/SocietyContext";

const Index = () => {
  const router = useRouter();
  const { source } = useLocalSearchParams(); // Retrieve the source ("Admin" or "Member")
  const { societyName } = useSociety();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [societyData, setSocietyData] = useState<any>(null);
  const [selectedWing, setSelectedWing] = useState<string | null>(null);
  
   
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const docRef = doc(db, "Societies", societyName);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setSocietyData(data.wings);
          setSelectedWing(Object.keys(data.wings)[0]); // Default to the first wing
        } else {
          console.log("No data found");
        }
      } catch (error) {
        console.error("Error fetching vehicle data:", error);
      }
    };

    fetchVehicles();
  }, []);

  useEffect(() => {
    if (selectedWing && societyData) {
      const wingData = societyData[selectedWing];
      const vehiclesList: any[] = [];

      // Extract vehicles for the selected wing
      Object.entries(wingData.floorData).forEach(([floor, flats]: any) => {
        Object.entries(flats).forEach(([flatNumber, flatData]: any) => {
          Object.entries(flatData.Vehicles || {}).forEach(([vehicleNumber, vehicleData]: any) => {
            vehiclesList.push({
              floor,
              flatNumber,
              vehicleNumber,
              ...vehicleData,
            });
          });
        });
      });

      setVehicles(vehiclesList);
    }
  }, [selectedWing, societyData]);

  const getFlatVehicles = () => {
    if (!selectedWing || !societyData) return [];

    const wingData = societyData[selectedWing];
    const flatVehicles: any[] = [];

    Object.entries(wingData.floorData).forEach(([floor, flats]: any) => {
      Object.entries(flats).forEach(([flatNumber, flatData]: any) => {
        const vehicles = Object.entries(flatData.Vehicles || {}).map(
          ([vehicleNumber, vehicleDetails]: any) => ({
            vehicleNumber,
            ...vehicleDetails,
          })
        );
        if (vehicles.length > 0) {
          flatVehicles.push({
            floor,
            flatNumber,
            ownerName: flatData.ownerName || "No Name",
            vehicles,
          });
        }
      });
    });

    return flatVehicles;
  };

  const renderVehicle = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => {
        if (source === "Admin") {
          router.push({
            pathname: "/myVehicles",
            params: {
              source: "Admin",
              societyName,
              wing: selectedWing,
              floorName: item.floor,
              flatNumber: item.flatNumber,
              vehicleNumber: item.vehicleNumber,
            },
          });
        } else {
          console.log("Pressed Card");
        }
      }}
    >
      <Card style={styles.card} mode="elevated">
        <Card.Title
          title={item.ownerName}
          subtitle={`Flat: ${item.flatNumber}`}
          left={(props) => (
            <Avatar.Text
              {...props}
              label={item.ownerName.charAt(0)}
              style={styles.avatar}
            />
          )}
          right={(props) => (
            <IconButton {...props} icon="phone" onPress={() => {}} />
          )}
        />
        <Card.Content>
          <ScrollView horizontal contentContainerStyle={styles.vehicleContainer}>
            {item.vehicles.map((vehicle: any, index: number) => (
              <Chip
                key={index}
                icon="car"
                style={styles.vehicleChip}
                onPress={() => console.log(vehicle.vehicleNumber)}
              >
                <View style={styles.vehicleChipContent}>
                  <Text style={styles.vehicleNumber}>{vehicle.vehicleNumber}</Text>
                  {vehicle.parkingAllotment && (
                    <Text style={styles.parkingInfo}>
                      {`P - ${vehicle.parkingAllotment}`}
                    </Text>
                  )}
                  {vehicle.notes && (
                    <Text style={styles.vehicleNote}>{vehicle.notes}</Text>
                  )}
                </View>
              </Chip>
            ))}
          </ScrollView>
        </Card.Content>
      </Card>
    </Pressable>
  );
  

  return (
    <View style={styles.container}>
      {/* Top Appbar */}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Vehicles index" />
        <IconButton icon="bell" onPress={() => {}} />
      </Appbar.Header>

      {/* Wing Selector */}
      <View style={styles.toggleContainer}>
        {societyData
          ? Object.keys(societyData)
              .sort((a, b) => a.localeCompare(b)) // Sort wings alphabetically
              .map((wing) => (
                <Pressable
                  key={wing}
                  onPress={() => setSelectedWing(wing)}
                  style={[
                    styles.toggleButton,
                    selectedWing === wing && styles.selectedToggle,
                  ]}
                >
                  <Text style={styles.toggleText}>{wing}</Text>
                </Pressable>
              ))
          : <Text>Loading Wings...</Text>}
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        <FlatList
          data={getFlatVehicles()}
          keyExtractor={(item) => `${item.flatNumber}-${item.vehicleNumber}`}
          renderItem={renderVehicle}
          scrollEnabled={false} // Disable scrolling
        />
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          const targetRoute = source === "Admin" ? "/AddVehicle" : "/myVehicles";
          router.push(targetRoute); // Navigate based on source
          // router.push('/AddVehicle'); // Navigate to AddVehicle screen
        }}
      />
    </View>
  );
};
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  selectedToggle: {
    backgroundColor: '#6200ee',
  },
  toggleText: {
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardText: {
    fontSize: 14,
    marginVertical: 4,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#6200ee',
  },
  avatar: {
    backgroundColor: "#6200ee",
  },
  vehicleContainer: {
    flexDirection: "row",
    alignItems: "center", // Ensures Chips are vertically aligned
    gap: 8, // Space between Chips
  },
  vehicleChip: {
    backgroundColor: "#e3f2fd",
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4, // Adds spacing between Chips
  },
  vehicleChipContent: {
    flexDirection: "column",
    alignItems: "center",
  },
  vehicleNumber: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  parkingInfo: {
    fontSize: 12,
    color: "#0288d1",
    textAlign: "center",
  },
  vehicleNote: {
    fontSize: 12,
    color: "#555",
    textAlign: "center",
  },
});

export default Index;
