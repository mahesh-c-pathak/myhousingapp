import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  Pressable,
  ScrollView
} from "react-native";
import { Card, Text } from "react-native-paper";
import { db } from "../../../FirebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useSociety } from "../../../utils/SocietyContext";
import CustomButton from '../../../components/CustomButton';

const Collection: React.FC = () => {
  const { societyName } = useSociety();
  const [societyData, setSocietyData] = useState<any>(null);
  const [selectedWing, setSelectedWing] = useState<string | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const screenWidth = useWindowDimensions().width;
  const navigation = useNavigation();
  const { title } = useLocalSearchParams();
  const [maxColumns, setMaxColumns] = useState(0); // State to store max columns

  
  type StatusType =
    | "paid"
    | "unpaid"
    | "Pending Approval"
    | "overdue"
    | "Advanced Payment";

  useEffect(() => {
    navigation.setOptions({
      headerTitle: title,
    });
  }, []);

  useEffect(() => {
    const fetchSocietyData = async () => {
      try {
        const docRef = doc(db, "Societies", societyName);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setSocietyData(data.wings);
          setSelectedWing(Object.keys(data.wings)[0]);
           // Calculate the max number of columns
           let maxFlats = 0;
           Object.values(data.wings).forEach((wing: any) => {
               maxFlats = wing.unitsPerFloor;
           });
           setMaxColumns(maxFlats); // Set max columns
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

  const calculateFlatStatus = (
    bills: Record<string, any>,
    unclearedBalance: Array<{ amount: number; status: string }>
  ): StatusType => {
    // Check for uncleared balances
  const hasUncleared = unclearedBalance.some(
    (entry) => entry.status === "Uncleared"
  );

  if (hasUncleared) return "Pending Approval";
  
    // Check for overdue bills
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set time to midnight to compare only the date part
    const isOverdue = Object.values(bills).some((bill) => {
      if (bill.status === "unpaid") {
        const billDueDate = new Date(bill.dueDate);
        billDueDate.setHours(0, 0, 0, 0); // Set time to midnight to compare only the date part
        return currentDate > billDueDate;
      }
      return false;
    });
    
    if (isOverdue) return "overdue";
    
  
    // Handle other statuses
    const statuses = Object.values(bills).map((bill) => bill.status);
    if (statuses.includes("unpaid")) return "unpaid";
    if (statuses.every((status) => status === "paid")) return "paid";
    if (statuses.every((status) => status === "Advanced Payment"))
      return "Advanced Payment";
  
    return "paid";
  };
  

  const getStatusColor = (status: StatusType): string => {
    switch (status) {
      case "paid":
        return "#4CAF50"; // Green
      case "unpaid":
        return "#FA8072"; // Salmon
      case "Pending Approval":
        return "#FFEB3B"; // Yellow
      case "overdue":
        return "#FF0000"; // Red
      case "Advanced Payment":
        return "#2196F3"; // Blue
      default:
        return "#9E9E9E"; // Gray
    }
  };

  const calculateOverdueDays = (dueDate: string): number => {
    const currentDate = new Date().getTime();
    const billDueDate = new Date(dueDate).getTime();
    const differenceInTime = currentDate - billDueDate;
    return Math.floor(differenceInTime / (1000 * 3600 * 24)); // Convert milliseconds to days
  };

  const renderFlat = ({ item, flats, floor }: { item: string; flats: Record<string, any>; floor: string }) => {
    const flatData = flats[item];
    const bills: Record<string, { status: string; dueDate: string; amount?: number }> = flatData?.bills || {};
    const unclearedBalance: Array<{ amount: number; status: string }> = flatData?.unclearedBalance || [];
    
    const flatStatus = calculateFlatStatus(bills, unclearedBalance);
  
    const totalAmounts = Object.values(bills).reduce(
      (totals: any, bill: any) => {
        if (bill.status === "unpaid") {
          totals.unpaid += bill.amount || 0;
        } else if (bill.status === "paid") {
          totals.paid += bill.amount || 0;
        }
        return totals;
      },
      { unpaid: 0, paid: 0 }
    );

    // Get overdue days for the first overdue bill
  let overdueDays = 0;
  if (flatStatus === "overdue") {
    const overdueBill = Object.values(bills).find(
      (bill) => bill.status === "unpaid" && new Date(bill.dueDate).getTime() < new Date().getTime()
    );
    if (overdueBill) {
      overdueDays = calculateOverdueDays(overdueBill.dueDate);
    }
  }
  
    return (
      <Pressable
        onPress={() => {
          router.push({
            pathname: "/FlatCollectionSummary",
            params: {
              wing: selectedWing,
              floorName: floor,
              flatNumber: item,
            },
          });
        }}
      >
        <Card
          style={[
            styles.card,
            { backgroundColor: getStatusColor(flatStatus) },
          ]}
          mode="elevated"
        >
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardText}>
              {item}
            </Text>
            {flatStatus === "overdue" && overdueDays > 0 && (
            <Text style={styles.overdueText}>{overdueDays} days</Text>
          )}
            {/* Conditionally render unpaid amount */}
          {totalAmounts.unpaid > 0 && (
            <Text style={styles.amountText}> ₹ {totalAmounts.unpaid}</Text>
          )}
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
          renderItem={({ item }) => renderFlat({ item, flats, floor })}
        
          contentContainerStyle={styles.flatListContent}
          scrollEnabled={false} // Disable FlatList's vertical scrolling
          horizontal={true}
        />
      </View>
    );
  };

  const handleSave = async () => {}

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Loading Wing Setup...</Text>
      </View>
    );
  }



  return (
    <View style={styles.container}>
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

      <View style={styles.legendsContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#4CAF50" }]} />
          <Text>Paid</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#FA8072" }]} />
          <Text>Unpaid</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#FF0000" }]} />
          <Text>Overdue</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#FFEB3B" }]} />
          <Text>Pending Approval</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#2196F3" }]} />
          <Text>Advanced</Text>
        </View>
      </View>

      {selectedWing && societyData[selectedWing]?.floorData ? (
        <ScrollView horizontal 
          contentContainerStyle={styles.scrollViewContainer}
          style={styles.scrollView} // Added style for ScrollView
        >
        <FlatList
          data={Object.entries(societyData[selectedWing].floorData).sort(
            ([floorA], [floorB]) => {
              const numA = parseInt(floorA.replace(/\D/g, ""), 10);
              const numB = parseInt(floorB.replace(/\D/g, ""), 10);
              return numA - numB;
            }
          ) as [string, Record<string, any>][]}
          keyExtractor={([floor]) => floor}
          renderItem={renderFloor}
          contentContainerStyle={styles.flatListContent}
          scrollEnabled={false} // Disable FlatList's vertical scrolling
        />
        </ScrollView>
        
      ) : (
        <Text style={styles.info}>
          No floor data available for Wing {selectedWing}.
        </Text>
      )}
      {/* Save Button */}
    <CustomButton
      onPress={handleSave}
      title= {"Send Payment Reminder"}
     />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
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
    marginBottom: 16,
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
    color: "#FFFFFF", // White color for overdue text
  },
  amountText: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 12,
    color: "#FFFFFF", // White color for overdue text
  },
  legendsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 4,
  },
  overdueText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF", // White color for overdue text
    textAlign: "center",
    marginVertical: 4,
  },
  scrollViewContainer: {
    margin: 16,
    padding: 4,
    elevation: 4, // For shadow on Android
    shadowColor: "#000", // For shadow on iOS
    shadowOffset: { width: 0, height: 2 }, // For shadow on iOS
    shadowOpacity: 0.1, // For shadow on iOS
    shadowRadius: 4, // For shadow on iOS
    borderWidth: 1, // Optional for outline
    borderColor: "#e0e0e0", // Optional for outline
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  // Ensure the ScrollView doesn't take up excess space
  scrollView: {
    flexShrink: 1, // Ensures it shrinks to fit its content
  },
  
});

export default Collection;
