import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, FlatList, Pressable } from "react-native";
import { TextInput, Button, Card, FAB, Surface } from "react-native-paper";
import { useRouter } from "expo-router";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../../../FirebaseConfig";

interface BillData {
  id: string;
  title: string;
  date: string;
  unpaidAmount: number;
  paidAmount: number;
}

const GenerateSpecialBills = () => {
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
      try {
        const billsSnapshot = await getDocs(collection(db, "bills"));
        const societiesDocRef = doc(db, "Societies", "New Home Test");
        const societyDocSnap = await getDoc(societiesDocRef);
  
        if (!societyDocSnap.exists()) {
          console.error("Societies document does not exist");
          return;
        }
  
        const societyData = societyDocSnap.data();
        const societyWings = societyData.wings;
        
  
        const billsData: BillData[] = [];
        billsSnapshot.forEach((billDoc) => {
          const bill = billDoc.data();
          
          // Filter for "Special Bill"
          if (bill.billType !== "Special Bill") return;
          
          const { billNumber, startDate, name } = bill;
  
          let unpaidAmount = 0;
          let paidAmount = 0;
  
          Object.values(societyWings).forEach((wing: any) => {
            const floorData = wing.floorData;
  
            if (floorData) {
              Object.values(floorData).forEach((flats: any) => {
                Object.values(flats).forEach((flat: any) => {
                  if (flat.bills && flat.bills[billNumber]) {
                    const { amount, status } = flat.bills[billNumber];
                    if (status === "unpaid") {
                      unpaidAmount += amount;
                    } else if (status === "paid") {
                      paidAmount += amount;
                    }
                  }
                });
              });
            }
          });
  
          billsData.push({
            id: billDoc.id,
            title: name,
            date: startDate,
            unpaidAmount,
            paidAmount,
          });
        });
  
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
  

  return (
    <View style={styles.container}>
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
        style={styles.fab}
        onPress={() => router.push("/(SpecialBillTypes)")} // Example route for adding a bill
      />
    </View>
  );
};
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 10,
  },
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
    bottom: 80,
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
});

export default GenerateSpecialBills;
