import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Appbar, Card, Text, Divider, Avatar } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSociety } from "../../../../utils/SocietyContext";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../../../FirebaseConfig";

const Wallet = () => {
  const router = useRouter();
    const { source } = useLocalSearchParams();
    const localParams = useLocalSearchParams();
    const societyContext = useSociety();
    const [totalDue, setTotalDue] = useState(0);
  
    // Determine params based on source
    const societyName =
      source === "Admin" ? localParams.societyName : societyContext.societyName;
    const wing =
      source === "Admin" ? localParams.wing : societyContext.wing;
    const flatNumber =
      source === "Admin" ? localParams.flatNumber : societyContext.flatNumber;
    const floorName =
      source === "Admin" ? localParams.floorName : societyContext.floorName;
  
    const [myStatementData, setMyStatementData] = useState<any>([]);
    const [currentBalance, setCurrentBalance] = useState<number>(0);
    const [unclearedBalance, setUnclearedBalance] = useState<number>(0); // NEW STATE


    useEffect(() => {
        fetchBills();
      }, []);

     // Fetch and filter bills for the specific flat
      const fetchBills = async () => {
        try {
          const societiesDocRef = doc(db, "Societies", societyName as string);
          const societyDocSnap = await getDoc(societiesDocRef);
    
          if (!societyDocSnap.exists()) {
            console.error("Societies document does not exist");
            return;
          }
    
          const societyData = societyDocSnap.data();
          const societyWings = societyData.wings;
    
          const relevantWing = societyWings?.[wing as string]?.floorData?.[floorName as string]?.[flatNumber as string];
          if (!relevantWing) {
            console.error("No relevant wing data found for this flat.");
            return;
          }
              // Set Current Balance and Deposit
          setCurrentBalance(relevantWing.currentBalance || 0);
    
          const billCollection = await getDocs(collection(db, "bills"));
          const billsData: any[] = []; // Explicitly define the type for billsData
          let totalUnpaidDue = 0; // Initialize total unpaid amount
    
          billCollection.forEach((billDoc) => {
            const bill = billDoc.data();
            const billNumber = bill.billNumber;
    
            const flatBill = relevantWing.bills?.[billNumber];
            if (flatBill.status === "paid") {
              billsData.push({
                id: billDoc.id,
                title: `Paid bill For ${bill.name}`,
                dueDate: bill.startDate,
                amount: flatBill.amount,
                status: flatBill.status,
                type: "Paid bill",
              });
            } else if (flatBill.status === "Unpaid") {
              // Sum up unpaid bills for totalDue
              totalUnpaidDue += flatBill.amount || 0;
            }
          });
    
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
                  type: "cleared Balance",
                });
              }
            });
          }

          // Add Refund Details 
          const refundData: any[] = []; // Explicitly define the type for refundData
          if (relevantWing.Refund) {
            relevantWing.Refund.forEach((entry: any) => {
              refundData.push({
                id: entry.voucherNumber,
                title: "Refund Money",
                dueDate: entry.paymentDate,
                amount: entry.amount,
                type: "Refund",                
              });
            });
          };

          // Add Advance Details 
          const advanceData: any[] = []; // Explicitly define the type for refundData
          if (relevantWing.Advance) {
            relevantWing.Advance.forEach((entry: any) => {
              const dueDate = new Date(entry.paymentDate.seconds * 1000).toISOString().split("T")[0]; // Convert timestamp to date-only string
              advanceData.push({
                id: entry.voucherNumber,
                title: "Add Money",
                dueDate,
                amount: entry.amount, 
                isDeposit: entry.isDeposit, // Include isDeposit property
                type: "Advance",               
              });
            });
          };

          if (relevantWing && relevantWing.unclearedBalance) {
            // Filter for entries with status "Uncleared"
          const unclearedEntries = relevantWing.unclearedBalance.filter(
            (entry: { status: string }) => entry.status === "Uncleared"
          );
  
          // Sum the amounts of filtered entries
          const totalUncleared = unclearedEntries.reduce(
            (sum: number, entry: { amount: number }) => sum + (entry.amount || 0),
            0
          );
            setUnclearedBalance(totalUncleared);
          } else {
            setUnclearedBalance(0);
          }

          // Set total unpaid amount in totalDue
          setTotalDue(totalUnpaidDue);
    
          // Combine both data arrays and set them in myStatementData
          setMyStatementData([...billsData, ...addMoneyData, ...refundData, ...advanceData]);
        } catch (error) {
          console.error("Error fetching bills:", error);
        }
      };


  // Render each item in the statement
    const renderStatementItem = ({ item }: { item: any }) => (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/WalletDetails",
            params: { 
              source,
              societyName,
              wing,
              flatNumber,
              floorName,
              item: JSON.stringify(item) 
            }, // Pass item as a string
          })
        }
      >
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
      </TouchableOpacity>
    );
    





  return (
    <View style={styles.container}>
        {/* Appbar */}
      <Appbar.Header style={[styles.header, { backgroundColor: source === "Admin" ? "#6200ee" : "#2196F3" },]}>
        <Appbar.BackAction onPress={() => router.back()} color="#fff" />
        <Appbar.Content title="Wallet" titleStyle={styles.titleStyle} />
      </Appbar.Header>

        <View style={[styles.headerContainer, { backgroundColor: source === "Admin" ? "#6200ee" : "#2196F3" },]}> 
          {/* Profile Header */}
        {source === "Admin" && (
          <View style={styles.profileContainer}>
            <Avatar.Text size={44} label="XD" style={[styles.avatar, { backgroundColor: source === "Admin" ? "#6200ee" : "#2196F3" } ]} />
            <View style={styles.textContainer}>
              <Text style={styles.profileText}>{`${wing} ${flatNumber}`}</Text>
            </View>
          </View>
        )}

        {/* Balance Summary */}

          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryTitle}>Current Balance</Text>
              <Text style={[styles.summaryValue, { color: "green" }]}>
                ₹{currentBalance.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryTitle}>Uncleared Balance</Text>
              <Text style={[styles.summaryValue, { color: "red" }]}>
                ₹{unclearedBalance.toFixed(2)}
              </Text>
            </View>
            
          </View>

          {/* Add Money  Actions */}
          {source !== "Admin" && (
            <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push({
                pathname: "/MakePayments",
                params: {
                  totalDue: totalDue.toFixed(2),
                  currentBalance: currentBalance.toFixed(2),
                  unclearedBalance: unclearedBalance.toFixed(2),
                },
              })}
            >
              <Text style={styles.actionText}>Add Money</Text>
            </TouchableOpacity>
            </View>
          )}
      </View>   

      <FlatList
              data={myStatementData}
              renderItem={renderStatementItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                        <Text style={styles.emptyMessage}>
                          No Wallet Transactions yet
                        </Text>
                      }
            />

    </View>
  )
}

export default Wallet

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: { backgroundColor: "#2196F3" },
  titleStyle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerContainer:{backgroundColor: "#2196F3",},
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    marginBottom: 5,
    elevation: 2,
  },
  summaryItem: {
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    width:150,
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
  list: {
    padding: 10,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "#2196F3",
    padding: 10,
  },
  actionButton: {
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2196F3",
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "bold",
    paddingHorizontal:10,    
  },
  emptyMessage: {
    textAlign: "center",
    fontSize: 16,
    color: "#888",
    marginVertical: 20,
  },
  profileContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingBottom: 10 },
  profileText: { fontSize: 14, color: "white" },
  textContainer: { justifyContent: "center" },
  avatar: { backgroundColor: "#2196F3", marginRight: 10, borderColor: "#fff", borderWidth: 2 },
  
})