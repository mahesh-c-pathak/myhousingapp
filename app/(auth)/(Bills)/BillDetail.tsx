import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  Pressable,
  Alert
} from "react-native";
import { Card, Text, Appbar, Menu } from "react-native-paper";
import { db } from "../../../FirebaseConfig";
import { doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { useLocalSearchParams, useNavigation, useRouter, Stack  } from "expo-router";

const BillDetail: React.FC = () => {
  const [societyData, setSocietyData] = useState<any>(null);
  const [selectedWing, setSelectedWing] = useState<string | null>(null);
  const router = useRouter(); // Initialize router for navigation
  const [loading, setLoading] = useState(true);
  // Define valid status keys
  type StatusType = "paid" | "unpaid" | "overdue" | "advanced" | "no bill";
  // Initialize counts
  const counts: Record<StatusType, number> = {
    paid: 0,
    unpaid: 0,
    overdue: 0,
    advanced: 0,
    "no bill": 0,
  };
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    paid: 0,
    unpaid: 0,
    overdue: 0,
    advanced: 0,
    "no bill": 0,
  });

  const screenWidth = useWindowDimensions().width;

  const navigation = useNavigation();
  const { title, id } = useLocalSearchParams();
  const [menuVisible, setMenuVisible] = useState(false);

  interface FlatDetails {
    bills?: Record<string, { status: string; amount: number; dueDate: string }>;
    resident: string;
    unclearedBalance?: Array<{
      amount: number;
      paymentDate: string;
      paymentMode: string;
      bankName?: string | null;
      chequeNo?: string | null;
      transactionId: string;
      status: string;
      selectedIds: string[];
      voucherNumber?: string | null;
      ledgerAccount?: string | null;
    }>;
  }
  
  interface WingData {
    floorData: Record<string, Record<string, FlatDetails>>;
  }
  
  interface SocietyData {
    wings: Record<string, WingData>;
  }
  



  useEffect(() => {
    const fetchSocietyData = async () => {
      try {
        const docRef = doc(db, "Societies", "New Home Test"); // Update society name as needed
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setSocietyData(data.wings);
          setSelectedWing(Object.keys(data.wings)[0]); // Default to the first wing
          calculateStatusCounts(data.wings);
        } else {
          alert("Society does not exist!");
        }
      } catch (error) {
        console.error("Error fetching society data:", error);
        alert("Failed to fetch data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSocietyData();
  }, []);

  const calculateStatusCounts = (wingData: any) => {
    const counts = { paid: 0, unpaid: 0, overdue: 0, advanced: 0, "no bill": 0 };
  
    if (wingData?.floorData) {
      Object.values(wingData.floorData).forEach((flats: any) => {
        Object.values(flats).forEach((flat: any) => {
          const status = (flat?.bills?.[id as string]?.status || "no bill") as StatusType; // Ensure status is a valid key
          counts[status] = (counts[status] || 0) + 1;
        });
      });
    }
  
    setStatusCounts(counts);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "#4CAF50"; // Green
      case "unpaid":
        return "#F44336"; // Red
      case "overdue":
        return "#FF9800"; // Orange
      case "advanced":
        return "#2196F3"; // Blue
      default:
        return "#9E9E9E"; // Gray for no bill
    }
  };

  const renderFlat = ({ item, flats, floor }: { item: string; flats: Record<string, any>, floor:string }) => {
    const flatData = flats[item]; // Get data for the specific flat
    const billData = flatData.bills?.[id as string]; // Get the bill data for the matching `id`
    const status = billData?.status || "no bill"; // Default to "no bill"
    const unpaidAmount = status === "unpaid" ? billData.amount : 0; // Unpaid amount, if applicable
  
    
  
    return (
      <Pressable
        onPress={() => {
          router.push({
            pathname: "/billdetailperflat", // Update with your route path
            params: {
              wing: selectedWing,
              flatNumber: item,
              billNumber: id,
              amount:unpaidAmount,
              status:status,
              floorName:floor
            },
          });
        }}
      >
        <Card
          style={[
            styles.card,
            { width: screenWidth / 3 - 10, backgroundColor: getStatusColor(status) },
          ]}
          mode="elevated"
        >
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardText}>
              {item}
            </Text>
            <Text style={styles.amountText}>
              ₹{unpaidAmount || billData?.amount || 0}
            </Text>
          </Card.Content>
        </Card>
      </Pressable>
    );
  };

  const renderFloor = ({ item }: { item: [string, Record<string, any>] }) => {
    const [floor, flats] = item;
    const flatNumbers = Object.keys(flats);

    return (
      <View>
        <Text style={styles.floorHeading}>{floor}</Text>
        <FlatList
          data={flatNumbers}
          keyExtractor={(flatNumber) => `${floor}-${flatNumber}`}
          renderItem={({ item }) => renderFlat({ item, flats, floor  })}
          numColumns={3}
          contentContainerStyle={styles.flatListContent}
        />
      </View>
    );
  };

  // Trigger recalculation whenever selectedWing changes
    useEffect(() => {
      if (selectedWing && societyData) {
        calculateStatusCounts(societyData[selectedWing]);
      }
    }, [selectedWing, societyData]);

    const handleDeleteBill = async (billNumber: string) => {
      Alert.alert(
        "Confirmation",
        "Are you sure to delete? You can't recover this data.",
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes",
            onPress: async () => {
              try {
                // Delete the bill from the "bills" collection
                const billDocRef = doc(db, "bills", billNumber);
                await deleteDoc(billDocRef);
    
                const societiesDocRef = doc(db, "Societies", "New Home Test");
                const societyDocSnap = await getDoc(societiesDocRef);
    
                if (societyDocSnap.exists()) {
                  setMenuVisible(false)
                  const societyData = societyDocSnap.data() as SocietyData;
                  const societyWings = societyData.wings;
    
                  // Iterate through each wing, floor, and flat to delete the bill
                  for (const [wing, wingData] of Object.entries(societyWings)) {
                    const floorData = wingData.floorData;
    
                    for (const [floor, flats] of Object.entries(floorData)) {
                      for (const [flatNumber, flatDetails] of Object.entries(flats)) {
                        const details = flatDetails;
    
                        if (details.bills && details.bills[billNumber]) {
                          const billAmount = details.bills[billNumber]?.amount || 0; // Extract billAmount safely
                          delete details.bills[billNumber]; // Remove the bill entry
                        
                          if (details.unclearedBalance) {
                            details.unclearedBalance = details.unclearedBalance
                              .map((entry) => {
                                // Ensure selectedIds is an array
                                entry.selectedIds = Array.isArray(entry.selectedIds) ? entry.selectedIds : [];
                        
                                // Remove the billNumber from selectedIds
                                entry.selectedIds = entry.selectedIds.filter((id) => id !== billNumber);
                        
                                // If selectedIds is empty, return null
                                if (entry.selectedIds.length === 0) {
                                  return null; // Mark for removal
                                }
                        
                                // If other billNumbers still exist in selectedIds, adjust the amount
                                if (entry.amount) {
                                  entry.amount -= billAmount;
                                }
                                return entry; // Keep this entry
                              })
                              .filter((entry) => entry !== null); // Remove null entries
                          }
                        }
                        
                        
                      }
                    }
                  }
    
                  // Update the Societies document with the modified wings data
                  await updateDoc(societiesDocRef, { wings: societyWings });
    
                  Alert.alert(
                    "Success",
                    `Bill ${billNumber} deleted successfully from all records.`,
                    [
                      {
                        text: "OK",
                        onPress: () => {
                          // Navigate to the desired screen
                          router.push("/generate-maintenance-bills");
                        },
                      },
                    ]
                  );
                } else {
                  console.error("Society document does not exist.");
                  Alert.alert("Error", "Failed to delete bill. Society not found.");
                }
              } catch (error) {
                console.error("Error deleting bill:", error);
                Alert.alert("Error", "Failed to delete the bill. Please try again.");
              }
            },
          },
        ],
        { cancelable: false }
      );
    };
    
    
  

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Loading Wing Setup...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Remove Stack Header */}
      <Stack.Screen options={
                {headerShown:false}
            } />

            {/* Appbar Header */}
            <Appbar.Header style={styles.header}>
                <Appbar.BackAction onPress={() => router.back()} color="#fff" />
                <Appbar.Content title={title as string || "Default Title"} titleStyle={styles.titleStyle} />
                <Menu
                    visible={menuVisible}
                    onDismiss={() => setMenuVisible(false)}
                    anchor={<Appbar.Action icon="dots-vertical" color="#fff" onPress={() => setMenuVisible(true)} />}
                    >
                    <Menu.Item onPress={() => {}} title="View Bill Details" />
                    <Menu.Item onPress={() => {}} title="Statistics" />
                    <Menu.Item onPress={() => {}} title="Print Bills" />
                    <Menu.Item onPress={() => {}} title="Overview PDF" />
                    <Menu.Item onPress={() => {}} title="Overview" />
                    <Menu.Item onPress={() => handleDeleteBill(id as string)} title="Delete" />
                </Menu>
            </Appbar.Header>




      {/* Wing Selector */}
      <View style={styles.toggleContainer}>
        {Object.keys(societyData).map((wing) => (
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
        ))}
      </View>
       

      {/* Legends */}
      <View style={styles.legendsContainer}>
        {Object.entries(statusCounts).map(([status, count]) => (
          <View key={status}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: getStatusColor(status) }]} />
            <Text>{`(${count})`}</Text>
          </View>
          <Text>{`${status.charAt(0).toUpperCase() + status.slice(1)}`}</Text>
          </View>
           
        ))}
      </View>

      

      {/* Floor Data */}
      {selectedWing && societyData[selectedWing]?.floorData ? (
        <FlatList
          data={Object.entries(societyData[selectedWing].floorData).sort(
            ([floorA], [floorB]) => {
              // Extract the numeric part of the floor names (e.g., "Floor 1", "Floor 2")
              const numA = parseInt(floorA.replace(/\D/g, ""), 10);
              const numB = parseInt(floorB.replace(/\D/g, ""), 10);
              return numA - numB; // Sort numerically in ascending order
            }
          ) as [string, Record<string, any>][]} // Type assertion here} 
          keyExtractor={([floor]) => floor}
          renderItem={renderFloor}
          contentContainerStyle={styles.flatListContent}
        />
      ) : (
        <Text style={styles.info}>
          No floor data available for Wing {selectedWing}.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: "#fff",
  },
  header: { backgroundColor: "#6200ee" },
  titleStyle: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  legendsContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendColor: {
    width: 16,
    height: 16,
    marginRight: 8,
    borderRadius: 8,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
    padding:10,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  selectedToggle: {
    backgroundColor: "#6200ee",
  },
  toggleText: {
    color: "#000",
    fontWeight: "bold",
    textAlign: "center",
  },
  floorHeading: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  info: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 16,
  },
  flatListContent: {
    paddingHorizontal: 8,
  },
  card: {
    margin: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    elevation: 2,
  },
  cardText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "bold",
  },
  amountText: {
    textAlign: "center",
    fontWeight: "bold",
    marginTop: 4,
  },
  
});

export default BillDetail;
