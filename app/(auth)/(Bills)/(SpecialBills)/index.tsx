import React, { useState, useEffect, useRef  } from "react";
import { View, StyleSheet, Text, FlatList, Pressable, TouchableWithoutFeedback } from "react-native";
import { TextInput, Button, Card, FAB, Surface, Menu, Divider, IconButton } from "react-native-paper";
import { useRouter } from "expo-router";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../../../FirebaseConfig";
import AppbarComponent from '../../../../components/AppbarComponent';
import AppbarMenuComponent from '../../../../components/AppbarMenuComponent';
import { useSociety } from "../../../../utils/SocietyContext"; 

interface BillData {
  id: string;
  title: string;
  date: string;
  unpaidAmount: number;
  paidAmount: number;
}

const GenerateSpecialBills = () => {
  const { societyName } = useSociety();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
        headerTitle:"Generate Special Bills",
    })
  }, []);

  const [bills, setBills] = useState<BillData[]>([]);

  
    useEffect(() => {
      fetchBills();
    }, []);
  
    const fetchBills = async () => {
      console.log('societyName', societyName);
      try {
        // Fetch bills from the "bills" collection
        const billsSnapshot = await getDocs(collection(db, "bills"));
        
        // Fetch society data (main society document)
        const societiesDocRef = doc(db, "Societies", societyName);
        const societyDocSnap = await getDoc(societiesDocRef);
    
        if (!societyDocSnap.exists()) {
          console.error("Societies document does not exist");
          return;
        }
    
        const societyData = societyDocSnap.data();
        console.log('societyData', societyData);
    
        const billsData: BillData[] = [];
    
        // Iterate through each bill document
        for (const billDoc of billsSnapshot.docs) {
          const bill = billDoc.data();
          
          // Filter for "Special Bill"
          if (bill.billType !== "Special Bill") continue;
          
          const { billNumber, startDate, name } = bill;
    
          let unpaidAmount = 0;
          let paidAmount = 0;
    
          // Traverse the new structure in Societies: Fetch data from collections instead of document fields
          const wingsCollectionRef = collection(societiesDocRef, "wings");
          const wingsSnapshot = await getDocs(wingsCollectionRef);
    
          // Use for...of instead of forEach to handle async await properly
          for (const wingDoc of wingsSnapshot.docs) {
            const wingData = wingDoc.data();
            
            // Fetch floors collection for each wing
            const floorsCollectionRef = collection(wingDoc.ref, "floors");
            const floorsSnapshot = await getDocs(floorsCollectionRef);
    
            for (const floorDoc of floorsSnapshot.docs) {
              const floorData = floorDoc.data();
              
              // Fetch flats collection for each floor
              const flatsCollectionRef = collection(floorDoc.ref, "flats");
              const flatsSnapshot = await getDocs(flatsCollectionRef);
    
              for (const flatDoc of flatsSnapshot.docs) {
                const flatData = flatDoc.data();
    
                // Check if the flat contains the bill
                if (flatData.bills && flatData.bills[billNumber]) {
                  const { amount, status } = flatData.bills[billNumber];
                  if (status === "unpaid") {
                    unpaidAmount += amount;
                  } else if (status === "paid") {
                    paidAmount += amount;
                  }
                }
              }
            }
          }
    
          // Push the aggregated bill data
          billsData.push({
            id: billDoc.id,
            title: name,
            date: startDate,
            unpaidAmount,
            paidAmount,
          });
        }
    
        // Update state with the fetched bills data
        setBills(billsData);
      } catch (error) {
        console.error("Error fetching bills:", error);
      }
    };
    
    
    
    
  
    const renderBill = ({ item }: { item: BillData }) => (
      <Pressable onPress={() => router.push(`/BillDetail?title=${item.title}&id=${item.id}`)}>
        <Surface style={styles.billCard}>
          <Card>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text style={styles.billTitle}>{item.title}</Text>
                <View style={styles.amountContainer}>
                  <Text style={styles.paidAmount}>₹ {item.paidAmount.toFixed(2)}</Text>
                  <Text style={styles.unpaidAmount}>₹ {item.unpaidAmount.toFixed(2)}</Text>
                </View>
              </View>
              <Text style={styles.billDate}>{item.date}</Text>
              <Text style={styles.billCreator}>Created By: Mahesh Pathak</Text>
            </Card.Content>
          </Card>
        </Surface>
      </Pressable>
    );

    const [menuVisible, setMenuVisible] = useState(false);

    const handleMenuOptionPress = (option: string) => {
      console.log(`${option} selected`);
      setMenuVisible(false);
    };
    const closeMenu = () => {
      setMenuVisible(false);
    };

    
  

  return (
    <TouchableWithoutFeedback onPress={closeMenu}>
    <View style={styles.container}>
      {/* Top Appbar */}
      <AppbarComponent
        title="Generate Special Bills"
        source="Admin"
        onPressThreeDot={() => setMenuVisible(!menuVisible)} // Toggle menu visibility
      />

      {/* Three-dot Menu */}
      {/* Custom Menu */}
      {menuVisible && (
        <AppbarMenuComponent
        items={["Download PDF", "Download Excel"]}
        onItemPress={handleMenuOptionPress}
        closeMenu={closeMenu}
      />
      )}
      


      {/* Date Range Inputs */}
      <View style={styles.dateInputs}>
        <TextInput
          label="Start Date"
          value={startDate}
          onChangeText={setStartDate}
          mode="outlined"
          placeholder="YYYY-MM-DD"
          style={styles.dateInput}
        />
        <TextInput
          label="End Date"
          value={endDate}
          onChangeText={setEndDate}
          mode="outlined"
          placeholder="YYYY-MM-DD"
          style={styles.dateInput}
        />
        <Button mode="contained" onPress={() => {}} style={styles.goButton}>
          Go
        </Button>
      </View>

      {/* Bill Card */}
      <FlatList
              data={bills}
              renderItem={renderBill}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 80 }}
              ListEmptyComponent={<Text style={styles.emptyText}>No Bills to display</Text>}
            />

      {/* Bill Collection Button */}
      <Button
        mode="contained"
        onPress={() => {}}
        style={styles.billCollectionButton}
      >
        Bill Collection
      </Button>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        color="white" // Set the icon color to white
        style={styles.fab}
        onPress={() => router.push("/(SpecialBillTypes)")} // Example route for adding a bill
      />
    </View>
    </TouchableWithoutFeedback>
  );
};
 
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF",},
  anchor: { position: 'absolute', top: 0, right: 0 }, // Adjust position as needed
  dateInputs: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dateInput: {
    flex: 1,
    marginHorizontal: 5,
  },
  goButton: {
    backgroundColor: "green",
    justifyContent: "center",
    marginHorizontal: 5,
    height: 50,
  },
  billCard: {
    elevation: 2,
    borderRadius: 8,
    marginBottom: 20,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  billTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  paidAmount: {
    color: "#6200ee",
    fontWeight: "bold",
    marginRight: 10,
  },
  unpaidAmount: {
    color: "red",
    fontWeight: "bold",
  },
  billDate: {
    marginTop: 10,
    color: "gray",
  },
  billCreator: {
    color: "gray",
    marginTop: 5,
  },
  billCollectionButton: {
    backgroundColor: "green",
    position: "absolute",
    bottom:2,
    left: 10,
    right: 10,
    borderRadius: 5,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "#6200ee",
  },
  menuIcon: {
    position: "absolute",
    top: 0,
    right: 0,
  },
  customMenu: {
    position: "absolute",
    top: 50,
    right: 10,
    backgroundColor: "white",
    borderRadius: 8,
    elevation: 5,
    padding: 10,
    zIndex: 1,
  },
  menuItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#ccc",
    marginVertical: 5,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 16,
  },
});

export default GenerateSpecialBills;
