import { StyleSheet, View, FlatList } from "react-native";
import React, { useEffect, useState } from "react";
import { useRouter, Stack } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../FirebaseConfig";
import { Appbar, Card, Text, Divider } from "react-native-paper";
import { useSociety } from "../../../../utils/SocietyContext";

const ReceiptSummary = () => {
  const router = useRouter();
  const { societyName } = useSociety();
  const [unclearedBalance, setUnclearedBalance] = useState<any[]>([]);

  

  useEffect(() => {
    const fetchUnclearedBalance = async () => {
      try {
        const docRef = doc(db, "Societies", "New Home Test");
        const docSnap = await getDoc(docRef);
  
        if (docSnap.exists()) {
          const data = docSnap.data();
          const wingsData = data.wings;
          const unclearedBalanceList: any[] = [];
  
          Object.entries(wingsData).forEach(([wing, wingData]: any) => {
            Object.entries(wingData.floorData).forEach(([floor, flats]: any) => {
              Object.entries(flats).forEach(([flatNumber, flatData]: any) => {

                // Process bill entries
                Object.entries(flatData.bills || []).forEach(([billNo, billData]: any) => {
                  if (billData.received) {
                    const received = billData.received
                    if (Array.isArray(received) && received.length > 0) {
                      received.forEach((entry, index) => {
                        unclearedBalanceList.push({
                          wing,
                          floor,
                          flatNumber,
                          type: "Bill Paid",
                          index, // Include index for unique identification
                          amount:entry.receiptAmount,
                          voucherNumber:entry.voucherNumber,
                          paymentDate:entry.paymentDate,
                                                                         
                        });
                      });
                    }
                }

                });
  
                // Process Advance: include all entries
                Object.entries(flatData.Advance || []).forEach(([index, entry]: any) => {
                  const paymentDate = entry.paymentDate?.toDate?.().toISOString().split('T')[0]; // Extract and format the date
                  unclearedBalanceList.push({
                    wing,
                    floor,
                    flatNumber,
                    type: "Advance",
                    index,
                    ...entry,
                    paymentDate, // Replace timestamp with formatted date
                  });
                });
  
                // Process Refund: include all entries
                Object.entries(flatData.Refund || []).forEach(([index, entry]: any) => {
                  unclearedBalanceList.push({
                    wing,
                    floor,
                    flatNumber,
                    type: "Refund",
                    index,
                    ...entry,
                  });
                });
              });
            });
          });
  
          setUnclearedBalance(unclearedBalanceList);
        } else {
          console.log("No data found");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    fetchUnclearedBalance();
  }, []);
  

  return (
    <View style={styles.container}>
      {/* Remove Stack Header */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Appbar Header */}
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} color="#fff" />
        <Appbar.Content title="Receipt Summary" titleStyle={styles.titleStyle} />
        <Appbar.Action icon="filter" onPress={() => {}} color="#fff" />
        <Appbar.Action icon="dots-vertical" onPress={() => {}} color="#fff" />
      </Appbar.Header>

      {/* Date and Ledger Summary */}
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryText}>From: 01 Dec 2024 To: 19 Dec 2024</Text>
        <Text style={styles.summaryText}>Ledger Account: All</Text>
      </View>

      {/* Totals */}
      <View style={styles.totalsContainer}>
        <Card style={styles.totalCard}>
          <Card.Content>
            <Text style={styles.totalTitle}>Total Cash</Text>
            <Text style={styles.totalAmount}>
              ₹{" "}
              {unclearedBalance
                .filter((item) => item.ledgerAccount === "Cash")
                .reduce((sum, item) => sum + parseFloat(item.amount), 0)
                .toFixed(2)}
            </Text>
          </Card.Content>
        </Card>
        <Card style={styles.totalCard}>
          <Card.Content>
            <Text style={styles.totalTitle}>Total Bank</Text>
            <Text style={styles.totalAmount}>
              ₹{" "}
              {unclearedBalance
                .filter((item) => item.ledgerAccount === "Bank")
                .reduce((sum, item) => sum + parseFloat(item.amount), 0)
                .toFixed(2)}
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Receipt List */}
      <FlatList
        data={unclearedBalance}
        keyExtractor={(item) => `${item.type}-${item.index}-${item.voucherNumber}`}
        renderItem={({ item }) => (
          <Card
            style={styles.receiptCard}
            onPress={() => router.push({
              pathname: "/VoucherDetails", 
              params: { 
                wing : item.wing,
                floor: item.floor,
                flatNumber:item.flatNumber,
                type: item.type,
                amount:item.amount,
                paymentDate:item.paymentDate,
                voucherNumber:item.voucherNumber,
              }
            })}
      >
      <Card.Content>
        <Text style={styles.receiptId}>{item.voucherNumber}</Text>
        <Text>Received From: {item.wing} {item.flatNumber}</Text>
        <Text>Ledger Name: {item.ledgerAccount}</Text>
        <Text>Payment Mode: {item.paymentMode}</Text>
        {item.bankName && <Text>Bank Name: {item.bankName}</Text>}
        {item.chequeNo && <Text>Cheque No: {item.chequeNo}</Text>}
        <View style={styles.receiptFooter}>
          <Text style={styles.receiptAmount}>₹ {parseFloat(item.amount).toFixed(2)}</Text>
          <Text style={styles.receiptDate}>{item.paymentDate}</Text>
        </View>
      </Card.Content>
    </Card>
  )}
  ItemSeparatorComponent={() => <Divider />}
  contentContainerStyle={styles.listContent}
/>

    </View>
  );
};

export default ReceiptSummary;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { backgroundColor: "#2196F3" },
  summaryHeader: { padding: 16 },
  summaryText: { fontSize: 14, color: "#666" },
  totalsContainer: { flexDirection: "row", justifyContent: "space-around", padding: 16 },
  totalCard: { flex: 1, marginHorizontal: 8, backgroundColor: "#E3F2FD" },
  totalTitle: { fontSize: 14, color: "#666" },
  totalAmount: { fontSize: 20, fontWeight: "bold", color: "#000" },
  receiptCard: { marginHorizontal: 16, marginVertical: 8, backgroundColor: "#fff", elevation: 2 },
  receiptId: { fontWeight: "bold", marginBottom: 4 },
  receiptFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  receiptAmount: { fontSize: 16, fontWeight: "bold", color: "#4CAF50" },
  receiptDate: { fontSize: 12, color: "#666" },
  listContent: { paddingBottom: 16 },
  titleStyle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
