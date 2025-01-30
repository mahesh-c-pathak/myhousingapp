import { View, Text, TouchableOpacity, StyleSheet, Pressable, ActivityIndicator, FlatList, ScrollView, Modal, Alert } from 'react-native'
import React, { useEffect, useState } from 'react';
import { Appbar} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";

import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '@firebaseConfig';
import { doc, getDoc, collection, getDocs, updateDoc, collectionGroup, setDoc, arrayUnion } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons'; // Using Expo vector icons
import { useSession } from "@utils/ctx";
import { useSociety } from "../../../utils/SocietyContext";


// Define the structure of flatsData
type FlatData = {
  flatType: string;
  resident: string;
  memberStatus: string;
  ownerRegisterd?: string; // Optional property
  renterRegisterd?: string; // Optional property
  
};

type FlatsData = Record<string, Record<string, Record<string, FlatData>>>;

const flatTypes = ['owner', 'Closed', 'Rent', 'Dead', 'Shop', 'Registerd'];
const StatusType = ['paid', 'unpaid', 'Pending Approval', 'overdue', 'Advanced Payment'];

const flatColors: Record<string, string> = {
  owner: '#2196F3', // Blue
  Closed: '#808080', // Grey
  Rent: '#FFA500', // Orange
  Dead: '#000000', // Black
  Shop: '#FF00FF', // Magenta
  Registerd: '#2E8B57', // Green
};

const StatusColor: Record<string, string> = {
  "paid": "#4CAF50", // Green
  "unpaid": "#FA8072", // Salmon
  "Pending Approval": "#FFEB3B", // Yellow
  "overdue": "#FF0000", // Red
  "Advanced Payment": "#2196F3", // Blue
};

type UserDetails = {
  [userId: string]: {
    userName: string;
    userStatus: string;
    userType: string;
  };
};

const CollectionNew = () => {
  const { societyName: mysocietyName } = useSociety();
  
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useSession();
  
  const userId = user?.uid

  const navigation = useNavigation();

  const customWingsSubcollectionName = `${mysocietyName} wings`;
  const customFloorsSubcollectionName = `${mysocietyName} floors`;
  const customFlatsSubcollectionName = `${mysocietyName} flats`;
  const customFlatsBillsSubcollectionName = `${mysocietyName} bills`;

  const [selectedWing, setSelectedWing] = useState<string | null>(null);

  const [flatsData, setFlatsData] = useState<FlatsData>({}); // Explicit type for flatsData
  const [flatTypeCounts, setFlatTypeCounts] = useState<Record<string, number>>({});

  const [selectedFlat, setSelectedFlat] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [selectedFlatType, setSelectedFlatType] = useState<string | null>(null);
  
  const [userTypeModalVisible, setUserTypeModalVisible] = useState(false); // For user type selection
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false); // For current modal content
  const [userType, setUserType] = useState<"Owner" | "Renter" | null>(null); // Selected user type

  useEffect(() => {
        // Dynamically hide the header for this screen
        navigation.setOptions({ headerShown: false });
      }, [navigation]);


  const fetchFlatsData = async () => {
    setLoading(true);
    try {
      const flatsQuerySnapshot = await getDocs(collectionGroup(db, customFlatsSubcollectionName));
      const data: Record<string, any> = {};
      
  
      flatsQuerySnapshot.forEach((doc) => {
        const flatData = doc.data();
        const flatId = doc.id;
  
        const flatPath = doc.ref.path;
        const pathSegments = flatPath.split("/");
        const wing = pathSegments[3];
        const floor = pathSegments[5];
  
        if (!data[wing]) data[wing] = {};
        if (!data[wing][floor]) data[wing][floor] = {};
  
        const flatType = flatData.flatType || "";
        
        data[wing][floor][flatId] = {
          flatType,
          resident: flatData.resident || "",
          memberStatus: flatData.memberStatus || "",
          ownerRegisterd: flatData.ownerRegisterd || "",
          renterRegisterd: flatData.renterRegisterd || "",
        };
  
        
      });
  
      setFlatsData(data);
      
    } catch (error) {
      console.error("Error fetching flats data:", error);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    fetchFlatsData();
  }, []);



  useEffect(() => {
    // Set the first wing as selected when flatsData is loaded
    if (!selectedWing && Object.keys(flatsData).length > 0) {
      setSelectedWing(Object.keys(flatsData)[0]); // Select the first wing (e.g., "A")
    }
  }, [flatsData]);

  useEffect(() => {
    if (selectedWing && flatsData[selectedWing]) {
      const counts: Record<string, number> = {};
      Object.values(flatsData[selectedWing]).forEach((floor) => {
        Object.values(floor).forEach((flat) => {
          const flatType = flat.flatType || "";
          counts[flatType] = (counts[flatType] || 0) + 1;
        });
      });
      setFlatTypeCounts(counts);
    } else {
      setFlatTypeCounts({});
    }
  }, [selectedWing, flatsData]);

  const handleFlatPress = (flatId: string, flatType: string, floor: string, wing: string) => {

    console.log(
      `Yes pressed for flat: ${flatId}, flatType: ${flatType}, Floor: ${floor}, Wing: ${wing}` );

      router.push({
        pathname: "/FlatCollectionSummary",
        params: {
          wing: wing,
          floorName: floor,
          flatNumber: flatId,
        },
      });
         
   
  };

    


    
    
    


  
  const renderFlats = () => {
    if (!selectedWing || !flatsData[selectedWing]) return null;
  
    return (
      <View style={styles.outerscrollContent}>
        <ScrollView horizontal style={styles.scrollView}>
          <View style={styles.scrollContent}>
            {Object.keys(flatsData[selectedWing]).map((floor) => (
              <View key={floor} style={styles.floorContainer}>
                <View style={styles.row}>
                  {Object.keys(flatsData[selectedWing][floor]).map((flat) => {
                    const flatData = flatsData[selectedWing][floor][flat];
                    const flatColor =
                    flatData.memberStatus === "Registered"
                      ? "#2E8B57" // Green for registered
                      : flatColors[flatData.flatType] || flatColors["owner"]; // Default to owner color if flatType is missing
                    return (
                      <TouchableOpacity
                        key={flat}
                        style={[styles.flatContainer, { backgroundColor: flatColor }]}
                        onPress={() => handleFlatPress(flat, flatData.flatType, floor,selectedWing)}
                      >
                        <Text style={styles.flatText}>{flat}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
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
      {/* Top Appbar */}
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} color="#fff" />
        <Appbar.Content title="Collection New" titleStyle={styles.titleStyle} />
      </Appbar.Header>

      {/* Select Wing */}
      <View style={styles.toggleContainer}>
        {Object.keys(flatsData).map((wing) => (
          <Pressable
            key={wing}
            onPress={() => setSelectedWing(wing)}
            style={[
              styles.toggleButton,
              selectedWing === wing && styles.selectedToggle,
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                selectedWing === wing && styles.selectedtoggleText,
              ]}
             >
              {wing}</Text>
          </Pressable>
        ))}
      </View>

      {/* Legend Container */}

      <View style={styles.legendContainer}>
  {StatusType.map((type) => (
    <View key={type} style={styles.legendItem}>
      <View style={styles.legendcountContainer}>
        <View style={[styles.legendColor, { backgroundColor: StatusColor[type] }]} />
        <Text style={styles.legendText}>
          ({flatTypeCounts[type] || 0}) {/* Show count or 0 */}
        </Text>
      </View>
      <Text style={[styles.legendText, { flexWrap: 'wrap' }]}>
        {type.split(' ').map((word, index) => (
          <Text key={index}>{word}{'\n'}</Text>
        ))}
      </Text>
    </View>
  ))}
</View>

      {/* Selected Wings Flat Grid */}

      {selectedWing && <Text style={styles.headingText}>Wing {selectedWing}</Text>}
      
      {renderFlats()}

      
    </View>
  )
}

export default CollectionNew

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: "#0288d1", // Match background color from the attached image
    elevation: 4,
  },
  titleStyle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
    marginTop:16,
    alignItems:'center'
  },
  toggleButton: {
    margin:8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    height: 50, // Default height
    minWidth: 50, // Optional for consistency
    alignItems: "center", // Center content horizontally
    justifyContent: "center", // Center content vertically
  },
  selectedToggle: {
    backgroundColor: "#6200ee",
    height: 60, // Explicitly set a larger height for the selected button
    minWidth: 60, // Optional for a bigger width
    alignItems: "center", // Center content horizontally
    justifyContent: "center", // Center content vertically
  },
  toggleText: {
    fontWeight: "bold",
    textAlign: "center",
  },
  selectedtoggleText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
  },
  flatList: {
    justifyContent: "center",
    alignItems: "center",
  },

  flatText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  headingText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 8,
  },
  scrollView: {
    flexGrow: 0,
  },
  outerscrollContent:{
    margin: 16,
    paddingHorizontal:4,
    paddingTop:8,
    backgroundColor:'#dddddd',

    borderWidth: 1, // Optional for outline
    borderColor: "#e0e0e0", // Optional for outline
    borderRadius: 8,

  },
  scrollContent: {
    flexDirection: "column", // Stack floors vertically
    paddingHorizontal: 16,
  },
  floorContainer: {
    marginBottom: 8,
  },
  floorTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row", // Flats in a row
  },
  flatContainer: {
    backgroundColor: "#4caf50",
    margin: 4,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },

  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8, // Add spacing between legend items (React Native 0.71+)
  },
  legendItem: {
    alignItems: 'center', // Center align both color and text
    marginHorizontal: 4, // Space between items
    marginBottom: 8, // Space between rows
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginBottom: 4, // Space between color box and text
  },
  legendText: {
    fontSize: 12, // Adjust text size as needed
    textAlign: 'center',
  },
  legendcountContainer: {
    flexDirection: 'row',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
 
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)", // Dimmed background
    },
    modalContent: {
      width: "80%", // Adjust modal width
      backgroundColor: "#fff", // Modal background color
      borderRadius: 10, // Rounded corners
      padding: 20, // Inner padding
      alignItems: "center", // Center content horizontally
      shadowColor: "#000", // Shadow for iOS
      shadowOffset: { width: 0, height: 2 }, // Shadow position
      shadowOpacity: 0.25, // Shadow transparency
      shadowRadius: 4, // Shadow blur radius
      elevation: 5, // Shadow for Android
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 15,
      textAlign: "center",
    },
    modalText: {
      fontSize: 16,
      marginBottom: 20,
      textAlign: "center",
    },
    modalButtons: {
      flexDirection: "row", // Arrange buttons horizontally
      justifyContent: "space-around", // Space between buttons
      width: "100%",
    },
    button: {
      padding: 10,
      borderRadius: 5,
      minWidth: 80,
      alignItems: "center",
    },
    buttonYes: {
      backgroundColor: "#2196F3", // Blue for Yes
    },
    buttonNo: {
      backgroundColor: "#FFA500", // Orange for No
    },
    buttonText: {
      color: "#fff",
      fontWeight: "bold",
    },
    closeButton: {
      position: "absolute",
      top: 5,
      right: 5,
      borderRadius: 20,
      padding: 5,
    },

});