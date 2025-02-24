import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableWithoutFeedback,
} from "react-native";
import { Appbar, Card, Text, Divider } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSociety } from "@/utils/SocietyContext";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/FirebaseConfig";

import AppbarComponent from "@/components/AppbarComponent";
import AppbarMenuComponent from "@/components/AppbarMenuComponent";

const MyStatement = () => {
  const router = useRouter();
  const { source } = useLocalSearchParams();
  const localParams = useLocalSearchParams();
  const societyContext = useSociety();
  const [creditBalance, setCreditBalance] = useState(0);
  const [debitBalance, setDebitBalance] = useState(0);
  const [totalDue, setTotalDue] = useState(0);

  // Determine params based on source
  const societyName =
    source === "Admin" ? localParams.societyName : societyContext.societyName;
  const wing = source === "Admin" ? localParams.wing : societyContext.wing;
  const flatNumber =
    source === "Admin" ? localParams.flatNumber : societyContext.flatNumber;
  const floorName =
    source === "Admin" ? localParams.floorName : societyContext.floorName;

  const customWingsSubcollectionName = `${societyName} wings`;
  const customFloorsSubcollectionName = `${societyName} floors`;
  const customFlatsSubcollectionName = `${societyName} flats`;
  const customFlatsBillsSubcollectionName = `${societyName} bills`;
  const unclearedBalanceSubcollectionName = `unclearedBalances_${societyName}`;

  const [myStatementData, setMyStatementData] = useState<any>([]);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      // Construct Firestore references
      const flatRef = `Societies/${societyName}/${customWingsSubcollectionName}/${wing}/${customFloorsSubcollectionName}/${floorName}/${customFlatsSubcollectionName}/${flatNumber}`;
      const flatDocRef = doc(db, flatRef);

      const billsCollectionRef = collection(
        flatDocRef,
        customFlatsBillsSubcollectionName
      );
      const unclearedBalanceRef = collection(
        flatDocRef,
        unclearedBalanceSubcollectionName
      );

      let refundtotalDebit = 0;
      let addtotalCredit = 0;

      // Fetch both collections in parallel
      const [unclearedSnapshot, billsSnapshot] = await Promise.all([
        getDocs(unclearedBalanceRef),
        getDocs(billsCollectionRef),
      ]);

      let totalUnclearedBalance = 0;
      let totalUnpaidDue = 0;
      const balanceData: any[] = [];
      const billsData: any[] = [];

      // Process Uncleared Balance Data
      unclearedSnapshot.forEach((doc) => {
        const docData = doc.data();
        const {
          status,
          type,
          voucherNumber,
          paymentReceivedDate,
          amount,
          amountPaid,
          transactionId,
        } = docData;

        if (status === "Cleared") {
          balanceData.push({
            id: `${voucherNumber}- ${type}` || `${Math.random()}`, // Ensure ID is unique,
            title: type === "Refund" ? "Refund Money" : "Add Money",
            dueDate: paymentReceivedDate,
            amount,
            type,
          });

          if (type === "Refund") {
            refundtotalDebit += amount;
          }
          if (type === "Advance") {
            addtotalCredit += amount;
          }
        } else if (status === "Uncleared") {
          totalUnclearedBalance += amountPaid || 0;
        }
      });

      // Process Bills Data
      billsSnapshot.forEach((doc) => {
        const docData = doc.data();
        const {
          status,
          amount = 0,
          voucherNumber,
          name,
          paymentDate,
        } = docData;

        billsData.push({
          id: voucherNumber || `${voucherNumber}-${Math.random()}`, // Ensure ID is unique,,
          title: `Paid bill for ${name}`,
          dueDate: paymentDate,
          amount,
          status,
          type: "Paid bill",
        });

        if (status === "unpaid") {
          totalUnpaidDue += amount; // Accumulate unpaid dues
        }
      });

      const totalCredit = addtotalCredit - refundtotalDebit;
      const totalDebit = billsData.reduce((sum, item) => sum + item.amount, 0);

      // Update states
      setCreditBalance(totalCredit);
      setDebitBalance(totalDebit);
      setTotalDue(totalUnpaidDue);
      setMyStatementData([...billsData, ...balanceData]);
    } catch (error) {
      console.error("Error fetching bills and balance data:", error);
    }
  };

  // Fetch and filter bills for the specific flat
  const fetchBillsOld = async () => {
    try {
      const societiesDocRef = doc(db, "Societies", societyName as string);
      const societyDocSnap = await getDoc(societiesDocRef);

      if (!societyDocSnap.exists()) {
        console.error("Societies document does not exist");
        return;
      }

      const societyData = societyDocSnap.data();
      const societyWings = societyData.wings;

      const relevantWing =
        societyWings?.[wing as string]?.floorData?.[floorName as string]?.[
          flatNumber as string
        ];
      if (!relevantWing) {
        console.error("No relevant wing data found for this flat.");
        return;
      }

      const billCollection = await getDocs(collection(db, "bills"));
      const billsData: any[] = []; // Explicitly define the type for billsData

      billCollection.forEach((billDoc) => {
        const bill = billDoc.data();
        const billNumber = bill.billNumber;

        const flatBill = relevantWing.bills?.[billNumber];
        if (flatBill) {
          billsData.push({
            id: billDoc.id,
            title: bill.name,
            dueDate: bill.startDate,
            amount: flatBill.amount,
            status: flatBill.status,
          });
        }
      });

      // Add Refund Details
      const refundData: any[] = []; // Explicitly define the type for refundData
      if (relevantWing.Refund) {
        relevantWing.Refund.forEach((entry: any) => {
          refundData.push({
            id: entry.voucherNumber,
            title: "Refund Money",
            dueDate: entry.paymentDate,
            amount: entry.amount,
          });
        });
      }

      // Add Advance Details
      const advanceData: any[] = []; // Explicitly define the type for advanceData
      if (relevantWing.Advance) {
        relevantWing.Advance.forEach((entry: any) => {
          const dueDate = new Date(entry.paymentDate.seconds * 1000)
            .toISOString()
            .split("T")[0]; // Convert timestamp to date-only string
          advanceData.push({
            id: entry.voucherNumber,
            title: "Add Money",
            dueDate,
            amount: entry.amount,
          });
        });
      }

      const addMoneyData: any[] = []; // Explicitly define the type for addMoneyData

      if (relevantWing.unclearedBalance) {
        relevantWing.unclearedBalance.forEach((entry: any) => {
          if (entry.status === "Cleared") {
            addMoneyData.push({
              id: entry.transactionId,
              title: "Add Money",
              dueDate: entry.paymentDate,
              amount: entry.amount,
              status: entry.status,
            });
          }
        });
      }

      // Calculate balances
      const addtotalCredit = addMoneyData.reduce(
        (sum, item) => sum + item.amount,
        0
      );

      const refundtotalDebit = refundData.reduce(
        (sum, item) => sum + item.amount,
        0
      );

      const totalCredit = addtotalCredit - refundtotalDebit;

      const totalDebit = billsData.reduce((sum, item) => sum + item.amount, 0);

      // Calculate total due from unpaid bills
      const totalUnpaidDue = billsData
        .filter((item) => item.status === "unpaid")
        .reduce((sum, item) => sum + item.amount, 0);

      setCreditBalance(totalCredit);
      setDebitBalance(totalDebit);
      setTotalDue(totalUnpaidDue);

      // Combine both data arrays and set them in myStatementData
      setMyStatementData([
        ...billsData,
        ...addMoneyData,
        ...refundData,
        ...advanceData,
      ]);
    } catch (error) {
      console.error("Error fetching bills:", error);
    }
  };

  // Render each item in the statement
  const renderStatementItem = ({ item }: { item: any }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.row}>
          <Text style={styles.title}>{item.title}</Text>
          <Text
            style={[
              styles.amount,
              { color: item.title === "Add Money" ? "green" : "red" },
            ]}
          >
            ₹{item.amount.toFixed(2)}
          </Text>
        </View>
        <Text style={styles.dueDate}>{item.dueDate}</Text>
      </Card.Content>
      <Divider />
    </Card>
  );

  const [menuVisible, setMenuVisible] = useState(false);
  const handleMenuOptionPress = (option: string) => {
    console.log(`${option} selected`);
    if (option === "Download PDF") {
      generatePDF();
    }
    setMenuVisible(false);
  };
  const closeMenu = () => {
    setMenuVisible(false);
  };

  const generatePDF = async () => {
    console.log("Generate PDF pressed");
  };

  return (
    <TouchableWithoutFeedback onPress={closeMenu}>
      <View style={styles.container}>
        {/* Top Appbar */}
        <AppbarComponent
          title="Statement"
          source="Member"
          onPressThreeDot={() => setMenuVisible(!menuVisible)}
        />

        {/* Three-dot Menu */}
        {/* Custom Menu */}
        {menuVisible && (
          <AppbarMenuComponent
            items={["Download PDF"]}
            onItemPress={handleMenuOptionPress}
            closeMenu={closeMenu}
          />
        )}

        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryTitle}>Credit Balance</Text>
            <Text style={[styles.summaryValue, { color: "green" }]}>
              ₹{creditBalance.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryTitle}>Debit Balance</Text>
            <Text style={[styles.summaryValue, { color: "red" }]}>
              ₹{debitBalance.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryTitle}>Total Due</Text>
            <Text style={styles.summaryValue}>₹{totalDue.toFixed(2)}</Text>
          </View>
        </View>

        <FlatList
          data={myStatementData}
          renderItem={renderStatementItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyMessage}>No Statements yet</Text>
          }
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

export default MyStatement;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: { backgroundColor: "#2196F3" },
  titleStyle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#2196F3",
    marginBottom: 10,
    elevation: 2,
  },
  summaryItem: {
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    width: 100,
  },
  summaryTitle: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 4,
  },
  list: {
    padding: 10,
  },
  card: {
    marginBottom: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  amount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  dueDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  emptyMessage: {
    textAlign: "center",
    fontSize: 16,
    color: "#888",
    marginVertical: 20,
  },
});
