import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, ScrollView, StyleSheet, Alert, Button } from "react-native";
import { collection, doc, getDoc, updateDoc, addDoc, setDoc } from "firebase/firestore";
import { db } from "../../../../FirebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateVoucherNumber } from "../../../../utils/generateVoucherNumber";

// Define the types for parsed items
interface BillItem {
  itemName: string;
  ownerAmount?: number;
  rentAmount?: number;
  closedAmount?: number;
  ledgerAccount?: string;
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

const NextScreen = () => {
  const {
    name,
    note,
    balancesheet,
    startDate,
    endDate,
    dueDate,
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
                wings,
                items: parsedItems,
                billType: "Maintenance Bill",
                billNumber,
              };
  
              await setDoc(doc(db, "bills", billNumber), billData);
  
              const societiesDocRef = doc(db, "Societies", "New Home Test");
              const societyDocSnap = await getDoc(societiesDocRef);
  
              if (societyDocSnap.exists()) {
                const societyData = societyDocSnap.data();
                const societyWings: Record<string, WingData> = societyData.wings;
                const selectedWings = typeof wings === "string"
                  ? wings.split(",").map((wing) => wing.trim())
                  : [];
  
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
                      const details = flatDetails as FlatDetails;
                      const residentType = details.resident;
  
                      let amount = 0;
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
  
                      let status = "unpaid";
                      let advanceBillSettleVoucherNumber = "";
                      let received =  [];
  
                      if (isAdvancePaymentSettelement === "true") {
                        const currentBalance = details.currentBalance || 0;
                        if (currentBalance >= amount) {
                          advanceBillSettleVoucherNumber = await generateVoucherNumber();
                          received.push({
                            receiptAmount: amount,
                            paymentDate: dueDate as string,
                            voucherNumber: advanceBillSettleVoucherNumber,
                          });
                          
                          details.currentBalance = currentBalance - amount;
                          status = "paid";
                        }
                      }
  
                      const billEntry:any  = {
                        status,
                        amount,
                        paidAmount: 0.0,
                        dueDate: dueDate as string,
                        billType: "Maintenance Bill",
                        isAdvancePaymentSettelement: isAdvancePaymentSettelement === "true",
                      };

                      // Conditionally add 'received' if it's not empty
                      if (received.length > 0) {
                        billEntry.received = received;
                      }
  
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
                      onPress: () => router.push("/generate-maintenance-bills"),
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
        <Text>Wings: {wings}</Text>
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

export default NextScreen;
