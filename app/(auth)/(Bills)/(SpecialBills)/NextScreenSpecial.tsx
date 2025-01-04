import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, ScrollView, StyleSheet, Alert, Button } from "react-native";
import { collection, doc, getDoc, updateDoc, addDoc, setDoc, getDocs } from "firebase/firestore";
import { db } from "../../../../FirebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateVoucherNumber } from "../../../../utils/generateVoucherNumber";

import { updateLedger } from "../../../../utils/updateLedger";
import { getBillItemsLedger } from "../../../../utils/getBillItemsLedger";

// Define the types for parsed items
interface BillItem {
  itemName: string;
  ownerAmount?: number;
  rentAmount?: number;
  closedAmount?: number;
  ledgerAccount?: string;
  updatedLedgerAccount?: string;
}

// Define the type for flat details
interface FlatDetails {
  resident: "owner" | "Tenant" | "Closed";
  bills?: Record<string, { status: string; amount: number }>;
  currentBalance?: number;
}

// Define the type for wings data
interface FloorData {
  [floor: string]: {
    [flatNumber: string]: FlatDetails;
  };
}

interface WingData {
  floorData: FloorData;
}

const NextScreenSpecial = () => {
  const {
    name,
    note,
    balancesheet,
    startDate,
    endDate,
    dueDate,
    members,
    wings,
    items,
    isAdvancePaymentSettelement,
  } = useLocalSearchParams();
  const router = useRouter();

  

  // Parse the JSON string for items
  let parsedItems: BillItem[] = [];
  try {
    if (items) {
      parsedItems = JSON.parse(items as string); // Safely parse items if it exists
    } else {
      console.warn("Items parameter is undefined or empty.");
    }
  } catch (error) {
    console.error("Error parsing items:", error);
    Alert.alert("Error", "Failed to parse bill items. Please try again.");
  }


  // Generate bill number
  const generateBillNumber = async (): Promise<string> => {
    try {
      const counterRef = doc(db, "Meta", "billgenerationCounter");
      const counterDoc = await getDoc(counterRef);

      let count = 1;
      if (counterDoc.exists()) {
        count = counterDoc.data().count + 1;
      }

      await updateDoc(counterRef, { count });

      return `Bill No.INV-2024-25-${count}`;
    } catch (error) {
      console.error("Error generating bill number:", error);
      Alert.alert("Error", "Failed to generate bill number.");
      throw error;
    }
  };

  // Handle bill generation
  const handleGenerateBill = async () => {
    Alert.alert(
      "Confirmation",
      "Are you sure to generate a new bill?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              const billNumber = await generateBillNumber();
  
              const billData = {
                name,
                note,
                balancesheet,
                startDate,
                endDate,
                dueDate,
                members,
                items: parsedItems,
                billType: "Special Bill",
                billNumber,
                
              };
              let amount = 0;
              let residentType = ""
  
              await setDoc(doc(db, "bills", billNumber), billData);

              const societiesDocRef = doc(db, "Societies", "New Home Test");
              const societyDocSnap = await getDoc(societiesDocRef);
  
              if (societyDocSnap.exists()) {
                const societyData = societyDocSnap.data();
                const societyWings: Record<string, WingData> = societyData.wings;
                
                const selectedMembers = members
                ? (members as string).split(",").map((member) => member.trim())
                : [];

                // Determine unique wings from selected members
              const selectedWings = Array.from(
                new Set(selectedMembers.map((member) => member.split(" ")[0]))
              );

              

              const updatePromises = [];
  
                for (const wing of selectedWings) {
                  const wingData = societyWings[wing];
                  if (!wingData) {
                    console.warn(`Wing ${wing} not found in society.`);
                    continue;
                  }
  
                  const floorData = wingData.floorData;
                  for (const [floor, flats] of Object.entries(floorData)) {
                    for (const [flatNumber, flatDetails] of Object.entries(flats)) {
                      // Check if the current flat is in the selected members
                      const flatKey = `${wing} ${flatNumber}`;
                      
                      if (!selectedMembers.includes(flatKey)) {
                        continue; // Skip flats not in the selected members list
                      }
                      const details = flatDetails as FlatDetails;
                      residentType = details.resident;

                      // Mahesh Start

                      // Call the function to get bill details
                      const billItemLedger = await getBillItemsLedger(billNumber, details.resident );

                      // Process each item: log details and update ledger
                      for (const { updatedLedgerAccount, amount, ledgerAccount } of billItemLedger) {
                        // Update ledger
                        const ledgerUpdate1 = await updateLedger(updatedLedgerAccount, amount, "Add");
                        const ledgerUpdate2 = await updateLedger(ledgerAccount, amount, "Add");
                        console.log(`  Ledger Update Status: ${ledgerUpdate1}`);
                        console.log(`  Ledger Update Status: ${ledgerUpdate2}`);
                }

                      // Mahesh End
                      
  
                      
                      if (residentType === "owner") {
                        amount = parsedItems.reduce(
                          (sum, item) => sum + (item.ownerAmount || 0),
                          0
                        );
                      } else if (residentType === "Tenant") {
                        amount = parsedItems.reduce(
                          (sum, item) => sum + (item.rentAmount || 0),
                          0
                        );
                      } else if (residentType === "Closed") {
                        amount = parsedItems.reduce(
                          (sum, item) => sum + (item.closedAmount || 0),
                          0
                        );
                      }
  
                      const billEntry:any  = {
                        status:"unpaid",
                        amount,
                        originalAmount: amount,
                        dueDate: dueDate as string,
                        billType: "Special Bill",                       
                      };

                     
                      details.bills = {
                        ...details.bills,
                        [billNumber]: billEntry,
                      };
                    }
                  }
                }
  
                // Push each update as a promise
                for (const wing of selectedWings) {
                  updatePromises.push(
                    updateDoc(societiesDocRef, { [`wings.${wing}`]: societyWings[wing] })
                  );
                }
  
                // Wait for all updates to complete
                await Promise.all(updatePromises);
                

                // Completely empty AsyncStorage entry
                await AsyncStorage.removeItem("@createdBillItem");
  
                Alert.alert(
                  "Success",
                  `Bill ${billNumber} created and updated successfully in wings.`,
                  [
                    {
                      text: "OK",
                      onPress: () => router.push("/(SpecialBills)"),
                    },
                  ]
                );
              } else {
                console.error("Society document does not exist.");
                Alert.alert(
                  "Error",
                  "Failed to update wings data. Society not found."
                );
              }
            } catch (error) {
              console.error("Error generating bill:", error);
              Alert.alert("Error", "Failed to create bill. Please try again.");
            }
          },
        },
      ],
      { cancelable: false }
    );
  };
  

  return (
    <ScrollView style={styles.container}>
      <View>
        <Text style={styles.header}>General Details</Text>
        <Text>Name: {name}</Text>
        <Text>Note: {note}</Text>
        <Text>Balance Sheet: {balancesheet}</Text>
        <Text>
          Duration: {startDate} - {endDate}
        </Text>
        <Text>Due Date: {dueDate}</Text>
        <Text>members: {members}</Text>
      </View>

      <View>
        <Text style={styles.header}>Bill Items</Text>
        {parsedItems.map((item, index) => (
          <View key={index} style={styles.itemContainer}>
            <Text>Name: {item.itemName}</Text>
            <Text>Owner Amount: {item.ownerAmount}</Text>
            <Text>Rent Amount: {item.rentAmount}</Text>
            <Text>Closed Amount: {item.closedAmount}</Text>
            <Text>Ledger Account: {item.ledgerAccount}</Text>
            <Text>Ledger Account updated: {item.updatedLedgerAccount}</Text>
          </View>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Generate Bill" onPress={handleGenerateBill} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
  itemContainer: {
    marginVertical: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  buttonContainer: {
    marginVertical: 20,
  },
});

export default NextScreenSpecial;
