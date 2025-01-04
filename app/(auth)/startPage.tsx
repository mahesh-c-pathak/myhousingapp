import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { Appbar, Card } from "react-native-paper";
import { db } from "../../FirebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "expo-router"; // Import useRouter

const MyPropertiesScreen = () => {
  const [cards, setCards] = useState<any[]>([]);
  const router = useRouter(); // Initialize the router

  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const userDocRef = doc(db, "users", "Rn0RkZIkraaadCSglw3HK1qDXzm1"); // Replace with dynamic user ID
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const cardList: any[] = [];

          // Process each society in mySociety
          userData.mySociety.forEach((societyObj: any) => {
            const [societyName, societyDetails] = Object.entries(societyObj)[0]; // Extract name and details

            // Add "Admin" card if user has admin role
            if (
              societyDetails.memberRole &&
              societyDetails.memberRole.includes("Admin")
            ) {
              cardList.push({
                id: `${societyName}-admin`,
                societyName,
                role: "Admin",
                flatDetails: null,
              });
            }

            // Check if myWing exists
            if (societyDetails.myWing) {
              Object.entries(societyDetails.myWing).forEach(([wing, wingData]) => {
                // Check if floorData exists before processing
                if (wingData.floorData) {
                  Object.entries(wingData.floorData).forEach(
                    ([floorName, flats]: [string, any]) => {
                      Object.entries(flats).forEach(([flatNumber, flatDetails]: [string, any]) => {
                        cardList.push({
                          id: `${societyName}-${flatNumber}`,
                          societyName,
                          role: `${wing} ${flatNumber} ${flatDetails.userType || "Owner"}`,
                          flatDetails: flatDetails,
                          wing, // Add wing to the data
                          floorName, // Add floorName to the data
                        });
                      });
                    }
                  );
                } else {
                  console.log(`No floorData for wing: ${wing}`);
                }
              });
            }
          });

          setCards(cardList);
        } else {
          console.error("User document does not exist.");
        }
      } catch (error) {
        console.error("Error fetching society data:", error);
      }
    };

    fetchSocieties();
  }, []);

  const handlePress = (item: any) => {
    // Navigate based on whether the item is Admin or Member
    if (item.role === "Admin") {
      router.push(`/(auth)/(Admin)?role=${item.role}&societyName=${item.societyName}`);
    } else if (item.flatDetails) {
      router.push(
        `/(auth)/(Member)?societyName=${item.societyName}&wing=${item.wing}&floorName=${item.floorName}&flatNumber=${item.id.split('-')[1]}&userType=${item.flatDetails.userType || "Owner"}`
      );
    }
  };

  const renderCard = ({ item }: { item: any }) => (
    <Pressable onPress={() => handlePress(item)}>
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text style={styles.cardTitle}>{item.societyName}</Text>
          <Text style={styles.cardSubtitle}>{item.role}</Text>
        </Card.Content>
      </Card>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* App Bar */}
      <Appbar.Header>
        <Appbar.Content title="My Properties" />
      </Appbar.Header>

      {/* Cards */}
      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        contentContainerStyle={styles.cardList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  cardList: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#555",
  },
});

export default MyPropertiesScreen;
