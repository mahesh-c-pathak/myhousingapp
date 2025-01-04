import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { Appbar, IconButton, Card, FAB } from "react-native-paper";
import { useSociety } from "../../../utils/SocietyContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../FirebaseConfig";
import { useRouter, useLocalSearchParams } from "expo-router";

const MyVehicles = () => {
  const router = useRouter();
  const { source } = useLocalSearchParams(); // Retrieve the source ("Admin" or "Member")
  const localParams = useLocalSearchParams();
  const societyContext = useSociety();
  
  // Determine which context to use based on source
  const societyName = source === "Admin" ? localParams.societyName : societyContext.societyName;
  const wing = source === "Admin" ? localParams.wing : societyContext.wing;
  const flatNumber = source === "Admin" ? localParams.flatNumber : societyContext.flatNumber;
  const floorName = source === "Admin" ? localParams.floorName : societyContext.floorName;

  const [vehicles, setVehicles] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        // Fetch the society document
        const societyDocRef = doc(db, "Societies", societyName);
        const societyDocSnap = await getDoc(societyDocRef);
  
        if (societyDocSnap.exists()) {
          const societyData = societyDocSnap.data();
          const wingsData = societyData.wings;
  
          // Check if the specified wing exists
          if (wingsData && wingsData[wing]) {
            const wingData = wingsData[wing];
            const floorData = wingData.floorData;
  
            // Navigate to the specific floor and flat
            if (floorData && floorData[floorName] && floorData[floorName][flatNumber]) {
              const flatData = floorData[floorName][flatNumber];
  
              // Extract vehicles
              const vehicleData = flatData.Vehicles || {};
              const vehicleList = Object.entries(vehicleData).map(
                ([vehicleNumber, vehicleDetails]) => ({
                  vehicleNumber,
                  ...vehicleDetails,
                })
              );
  
              setVehicles(vehicleList);
            } else {
              console.warn("No data found for the specified flat.");
            }
          } else {
            console.warn("No data found for the specified wing.");
          }
        } else {
          console.error("Society document does not exist.");
        }
      } catch (error) {
        console.error("Error fetching vehicle data:", error);
      }
    };
  
    fetchVehicles();
  }, [societyName, wing, floorName, flatNumber]);
  
  const handleCardPress = (vehicleNumber: string) => {
    router.push({
      pathname: "/(auth)/(Admin)/(Vehicles)/AddVechileDetails",
      params: {
        source,
        societyName,
        wing,
        flatNumber,
        floorName,
        vehicleNumber,
      },
    });
  };

  const renderVehicle = ({ item }: { item: any }) => (
    <Card style={styles.card} mode="elevated" onPress={() => handleCardPress(item.vehicleNumber)}>
      <Card.Content>
        <Text style={styles.cardTitle}>{item.vehicleNumber}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Top Appbar */}
      <Appbar.Header>
        <Appbar.Action icon="menu" onPress={() => {}} />
        <Appbar.Content
          title={`${wing || "-"} ${floorName || "-"} Flat: ${flatNumber || "-"}`}
        />
        <IconButton icon="bell" onPress={() => {}} />
      </Appbar.Header>

      {/* Vehicle List */}
      {vehicles.length > 0 ? (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.vehicleNumber}
          renderItem={renderVehicle}
          contentContainerStyle={styles.scrollContent}
        />
      ) : (
        <Text style={styles.noDataText}>No vehicles found.</Text>
      )}

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          router.push({
            pathname: "/(auth)/(Admin)/(Vehicles)/AddVechileDetails",
            params: { source, societyName, wing, flatNumber, floorName },
          });
        }}
      />
    </View>
  );
};

export default MyVehicles;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  appBar: {
    backgroundColor: "#5e35b1",
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  noDataText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#555",
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#6200ee',
  },
});
