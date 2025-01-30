import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Appbar, Button, Card, Text, TouchableRipple, Avatar, Checkbox, Divider } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSociety } from "../../../../utils/SocietyContext";
import { collection, getDocs, doc, getDoc, query, where  } from "firebase/firestore";
import { db } from "../../../../FirebaseConfig";

interface BillsData {
    id: string;
    title: string;
    date?: string;
    unpaidAmount?: number;
    paidAmount?: number;
    dueDate:string;
    overdueDays: number; // Include overdueDays
    amount: number; // Include amount
    status: string; // Include status (e.g., 'unpaid', 'paid', etc.)
  }

const index = () => {
  const [bills, setBills] = useState<BillsData[]>([]);
  const [selectedBills, setSelectedBills] = useState<string[]>([]); // NEW STATE
  const [activeTab, setActiveTab] = useState<"Unpaid" | "Paid">("Unpaid");
  const [unclearedBalance, setUnclearedBalance] = useState<number>(0); // NEW STATE

  const router = useRouter();
  const { source } = useLocalSearchParams();
  const localParams = useLocalSearchParams();
  const societyContext = useSociety();
  const [currentBalance, setCurrentBalance] = useState<number>(0);

  // Determine params based on source
  const societyName =
    source === "Admin" ? localParams.societyName : societyContext.societyName;
  const wing =
    source === "Admin" ? localParams.wing : societyContext.wing;
  const flatNumber =
    source === "Admin" ? localParams.flatNumber : societyContext.flatNumber;
  const floorName =
    source === "Admin" ? localParams.floorName : societyContext.floorName;

    const customWingsSubcollectionName = `${societyName} wings`;
    const customFloorsSubcollectionName = `${societyName} floors`;
    const customFlatsSubcollectionName = `${societyName} flats`;
    const customFlatsBillsSubcollectionName = `${societyName} bills`;

    const unclearedBalanceSubcollectionName = `unclearedBalances_${societyName}`

  useEffect(() => {
    fetchBills();
    fetchUnclearedBalance(); // Fetch uncleared balance   
  }, []);

  // Fetch and filter bills for the specific flat
 
    const fetchBills = async () => {
      try {
        const billsData: BillsData[] = []; // Explicitly define the type for billsData
        
        const flatRef = `Societies/${societyName}/${customWingsSubcollectionName}/${wing}/${customFloorsSubcollectionName}/${floorName}/${customFlatsSubcollectionName}/${flatNumber}`;
        const flatDocRef = doc(db, flatRef);
        const billsCollectionRef = collection(flatDocRef, customFlatsBillsSubcollectionName);
        const flatbillCollection = await getDocs(billsCollectionRef);

        flatbillCollection.forEach((billDoc) => {
          const billData = billDoc.data();
          const billStatus = billData.status;
          const billAmount = billData.amount || 0;


          billsData.push({
            id: billDoc.id,
            title: billData.name || "My bill",
            dueDate: billData.dueDate,
            overdueDays: calculateOverdueDays(billData.dueDate),
            amount: billAmount,
            status: billStatus,
          });
        });

        setBills(billsData);
        
      } catch (error) {
        console.error("Error fetching bills:", error);
      }
    };

    const fetchUnclearedBalance = async () => {
      try {
        // Reference to the uncleared balance subcollection
        const flatRef = `Societies/${societyName}/${customWingsSubcollectionName}/${wing}/${customFloorsSubcollectionName}/${floorName}/${customFlatsSubcollectionName}/${flatNumber}`;
        const flatDocRef = doc(db, flatRef);
        const unclearedBalanceRef = collection(flatDocRef, unclearedBalanceSubcollectionName);
    
        // Query to fetch all documents with status "Uncleared"
        const querySnapshot = await getDocs(query(unclearedBalanceRef, where("status", "==", "Uncleared")));
    
        let totalUnclearedBalance = 0; // Temporary variable to calculate the total balance
    
        // Iterate over the query results
        querySnapshot.forEach((doc) => {
          const docData = doc.data();
          const amountPaid = docData.amountPaid || 0; // Use 0 as default if amountPaid is undefined
          totalUnclearedBalance += amountPaid; // Accumulate the amount
        });
    
        // Update the state with the calculated total
        setUnclearedBalance(totalUnclearedBalance);
        console.log(`Total uncleared balance: ${totalUnclearedBalance}`);
      } catch (error) {
        console.error("Error fetching uncleared balance:", error);
      }
    };
    


  const calculateOverdueDays = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    return Math.max(Math.floor(diffTime / (1000 * 60 * 60 * 24)), 0);
  };

  const toggleSelection = (id: string) => {
    setSelectedBills((prev) =>
      prev.includes(id) ? prev.filter((billId) => billId !== id) : [...prev, id]
    );
  };


  const renderBillItem = ({ item }: { item: any }) => {
    if (
      activeTab === "Unpaid" &&
      !["unpaid", "Pending Approval"].includes(item.status)
    ) {
      return null;
    }
    if (activeTab === "Paid" && item.status !== "paid") {
      return null;
    }

    const isSelected = selectedBills.includes(item.id);

    return (
      <Card style={styles.card} elevation={1}>
        <Card.Content>
        <View style={styles.row}>
            <Checkbox
              status={isSelected ? "checked" : "unchecked"}
              onPress={() => toggleSelection(item.id)}
            />
            <View>
              <Text style={styles.billTitle}>{item.title}</Text>
              <Text style={styles.overdue}>Overdue by {item.overdueDays} days</Text>
              <Text style={styles.dueDate}>Due Date: {item.dueDate}</Text>
              
            </View>
            <Text style={styles.amount}>₹ {item.amount.toFixed(2)}</Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  
    
  const totalDue = bills
        .filter((b) => b.status === "unpaid")
        .reduce((sum, b) => sum + b.amount, 0);

  const handlePayNow = () => {
    const selectedItems = bills.filter((bill) => selectedBills.includes(bill.id));
    const totalAmount = selectedItems.reduce((sum, bill) => sum + bill.amount, 0);
    
    //const unclearedBalance = 0; // Replace with actual uncleared balance logic if needed

    router.push({
      pathname: "/MakePayments",
      params: {
        selectedIds: JSON.stringify(selectedBills),
        totalAmount: totalAmount.toFixed(2),
        totalDue: totalDue.toFixed(2),
        currentBalance: currentBalance.toFixed(2),
        unclearedBalance: unclearedBalance.toFixed(2),
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Appbar */}
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} color="#fff" />
        <Appbar.Content title="My Bills" titleStyle={styles.titleStyle} />
      </Appbar.Header>

      {/* Balance Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryTitle}>Total Due</Text>
          <Text style={styles.summaryValue}>
            ₹ {totalDue.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryTitle}>Current Balance</Text>
          <Text style={styles.summaryValue}>₹ {currentBalance.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryTitle}>Uncleared Balance</Text>
          <Text style={styles.summaryValue}>₹ {unclearedBalance.toFixed(2)}</Text>
        </View>
      </View>

      <Divider style={{ backgroundColor: "white", height: 1 }} />

      {/* Wallet and My Statement Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/Wallet')}
        >
          <Text style={styles.actionText}>Wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.activeActionButton]}
          onPress={() => router.push('/MyStatement')}
        >
          <Text style={[styles.actionText, styles.activeActionText]}>My Statement</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableRipple
          style={[styles.tabButton, activeTab === "Unpaid" && styles.activeTab]}
          onPress={() => setActiveTab("Unpaid")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Unpaid" && styles.activeTabText,
            ]}
          >
            Unpaid
          </Text>
        </TouchableRipple>
        <TouchableRipple
          style={[styles.tabButton, activeTab === "Paid" && styles.activeTab]}
          onPress={() => setActiveTab("Paid")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Paid" && styles.activeTabText,
            ]}
          >
            Paid
          </Text>
        </TouchableRipple>
      </View>

      {/* Bill List */}
      <FlatList
        data={bills.filter((bill) =>
          activeTab === "Unpaid"
            ? ["unpaid", "Pending Approval"].includes(bill.status)
            : bill.status === "paid"
        )}
        keyExtractor={(item) => item.id}
        renderItem={renderBillItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyMessage}>
            {activeTab === "Unpaid" ? "No Unpaid Bills" : "No Paid Bills"}
          </Text>
        }
      />

      {/* Pay Now Button */}
      <Button
        mode="contained"
        style={styles.payButton}
        onPress={handlePayNow}
        >
  Pay Now
</Button>

      
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { backgroundColor: "#2196F3" },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#2196F3",
  },
  summaryItem: { alignItems: "center" },
  summaryTitle: { color: "white", fontSize: 12 },
  summaryValue: { color: "white", fontWeight: "bold", fontSize: 16 },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#E3F2FD",
  },
  tabButton: { padding: 12 },
  activeTab: { borderBottomWidth: 2, borderColor: "#2196F3" },
  tabText: { fontSize: 16, color: "#888" },
  activeTabText: { color: "#2196F3", fontWeight: "bold" },
  listContainer: { paddingHorizontal: 16, paddingTop: 8 },
  card: { marginVertical: 8 },
  billTitle: { fontWeight: "bold", fontSize: 16 },
  overdue: { color: "red", fontSize: 12 },
  dueDate: { color: "#555", fontSize: 12 },
  amount: {
    position: "absolute",
    right: 0,
    top: 10,
    color: "red",
    fontWeight: "bold",
  },
  payButton: { margin: 16, backgroundColor: "#2196F3" },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: "#2196F3",
  },
  profileText: {
    fontSize: 14,
    color: "white",
  },
  textContainer: {
    justifyContent: 'center',
  },
  avatar: {
    backgroundColor: '#2196F3', // Match avatar background
    marginRight: 10,
  },
  emptyMessage: {
    textAlign: "center",
    fontSize: 16,
    color: "#888",
    marginVertical: 20,
  },
  row: { flexDirection: "row", alignItems: "center" },
  titleStyle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#2196F3",
    padding: 10,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2196F3",
    alignItems: "center",
    justifyContent: "center",
  },
  activeActionButton: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2196F3",
  },
  activeActionText: {
    color: "#2196F3",
  },
  divider: {color: "#fff"}
  
  
});

export default index;
