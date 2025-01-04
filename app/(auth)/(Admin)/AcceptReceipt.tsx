import { StyleSheet, Text, View, Alert, TouchableOpacity } from 'react-native'
import React, { useState, useEffect } from "react";
import { Dropdown } from 'react-native-paper-dropdown';
import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../../../FirebaseConfig";
import { Appbar, Button, Switch, Menu, TextInput } from "react-native-paper";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useSociety } from "../../../utils/SocietyContext";

import { generateVoucherNumber } from "../../../utils/generateVoucherNumber";
import { updateLedger } from "../../../utils/updateLedger";
import { getBillItemsLedger } from "../../../utils/getBillItemsLedger";

const AcceptReceipt = () => {
  const router = useRouter();
  const { societyName } = useSociety();

  const { wing,floorName,flatNumber, amount,  transactionId, paymentMode, notes, receiptImage, selectedIds } = useLocalSearchParams();

   
  const params = useLocalSearchParams();
  const [receiptAmount, setReceiptAmount] = useState(amount);
  const [note, setNote] = useState("");
  const [billSettlement, setBillSettlement] = useState(false);
  
  const [ledgerAccount, setledgerAccount] = useState<any>('');
  const [accountFromOptions, setAccountFromOptions] = useState<{ label: string; value: string }[]>([]);



    // Example useEffect to fetch and format options
    useEffect(() => {
      const fetchAccountOptions = async () => {
        try {
          const ledgerGroupsRef = collection(db, 'ledgerGroups');

          const fromQuerySnapshot = await getDocs(
            query(ledgerGroupsRef, where('name', 'in', ['Bank Accounts', 'Cash in Hand']))
          );

          const fromAccounts = fromQuerySnapshot.docs
            .map((doc) => doc.data().accounts || [])
            .flat()
            .filter((account) => account.trim() !== '')
            .map((account) => ({ label: account, value: account })); // Format for Dropdown

          setAccountFromOptions(fromAccounts);
        } catch (error) {
          console.error('Error fetching account options:', error);
          Alert.alert('Error', 'Failed to fetch account options.');
        }
      };

      fetchAccountOptions();
    }, []);

    // Payment Date State

    // Format date as YYYY-MM-DD
    const formatDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${year}-${month}-${day}`;
    };

    const [paymentDate, setPaymentDate] = useState(new Date(params.paymentDate as string || new Date()));
    const [formattedDate, setFormattedDate] = useState(formatDate(paymentDate));
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Handle Date Picker Change
    const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (selectedDate) {
        setPaymentDate(selectedDate);
        setFormattedDate(formatDate(selectedDate));
      }
      setShowDatePicker(false);
    };

    // save the data 

    const handleAccept = async () => {
      try {
        // Check if a ledger account is selected
        if (!ledgerAccount) {
          Alert.alert("Error", "Please select a ledger account.");
          return;
        }

        // Parse and validate receiptAmount
        const receiptAmountValue = parseFloat(receiptAmount as string);
        if (isNaN(receiptAmountValue) || receiptAmountValue <= 0) {
          Alert.alert("Error", "Invalid receipt amount. Please enter a valid number.");
          return;
        }
        
    
        const societiesDocRef = doc(db, "Societies", societyName as string);
        const societyDocSnap = await getDoc(societiesDocRef);
    
        if (!societyDocSnap.exists()) {
          console.error("Societies document does not exist");
          Alert.alert("Error", "Society document not found.");
          return;
        }
    
        const societyData = societyDocSnap.data();
        // Explicitly type these variables as strings
          const wing = params.wing as string;
          const floorName = params.floorName as string;
          const flatNumber = params.flatNumber as string;
        const relevantFlatData =
          societyData?.wings?.[wing]?.floorData?.[floorName]?.[flatNumber];

          // Initialize currentBalance as a valid number
          relevantFlatData.currentBalance = parseFloat(relevantFlatData.currentBalance || "0");
          if (isNaN(relevantFlatData.currentBalance)) {
            relevantFlatData.currentBalance = 0; // Default to 0 if invalid
    }
    
        

          // Update the status of bills in the bills map
          const updatedBills = { ...relevantFlatData.bills };

          // Ensure parsedSelectedIds is an array before calling forEach

          // Parse selected IDs from local params
          let parsedSelectedIds: any;

          // Initialize voucherNumber array
          let voucherNumberArray: string[] = [];

          try {
            // Parse `selectedIds` if it's a string
            parsedSelectedIds = typeof selectedIds === "string" ? JSON.parse(selectedIds) : selectedIds;

          } catch (error) {
            console.error('Error parsing selectedIds:', error);
          }
          
          if (Array.isArray(parsedSelectedIds) && parsedSelectedIds.length > 0) {
            let remainingReceiptValue = receiptAmountValue; // Track remaining receiptAmount globally
          
            for (const billId of parsedSelectedIds) {
              const normalizedBillId = billId.trim();
          
              if (updatedBills[normalizedBillId]) {
                const bill = updatedBills[normalizedBillId];
                // Mahesh Entered

                // Call the function to get bill details
                const billItemLedger = await getBillItemsLedger(normalizedBillId, relevantFlatData.resident );

                // Process each item: log details and update ledger
                for (const { updatedLedgerAccount, amount } of billItemLedger) {
                  // Update ledger
                  const ledgerUpdate = await updateLedger(updatedLedgerAccount, amount, "Subtract");
                  console.log(`  Ledger Update Status: ${ledgerUpdate}`);
                }


                // Mahesh End
          
                // Handle current balance first
                if (relevantFlatData.currentBalance > 0) {
                  const balanceVoucherNumber = await generateVoucherNumber(); // Generate voucher for current balance
                  voucherNumberArray.push(balanceVoucherNumber);
                  const balanceToApply = Math.min(relevantFlatData.currentBalance, bill.amount);
          
                  // Deduct from bill amount
                  bill.amount -= balanceToApply;
          
                  // Update received array with current balance
                  bill.received = bill.received || [];
                  bill.received.push({
                    receiptAmount: balanceToApply,
                    paymentDate: formattedDate,
                    voucherNumber: balanceVoucherNumber,
                  });
          
                  // Deduct from current balance
                  relevantFlatData.currentBalance -= balanceToApply;
                  if (relevantFlatData.currentBalance < 0) {
                    relevantFlatData.currentBalance = 0; // Ensure no negative balance
                  }
                }
          
                // Handle remaining bill amount with remainingReceiptValue
                if (remainingReceiptValue > 0) {
                  const remainingVoucherNumber = await generateVoucherNumber(); // Generate separate voucher for receipt
                  voucherNumberArray.push(remainingVoucherNumber);
                  const amountToApply = Math.min(remainingReceiptValue, bill.amount);
          
                  // Deduct from bill amount
                  bill.amount -= amountToApply;
                  remainingReceiptValue -= amountToApply;
          
                  // Update received array with remaining receipt amount
                  bill.received = bill.received || [];
                  bill.received.push({
                    receiptAmount: amountToApply,
                    paymentDate: formattedDate,
                    voucherNumber: remainingVoucherNumber,
                  });
                }
          
                // Update status
                bill.status = bill.amount === 0 ? "paid" : "unpaid";
          
                // Ensure all updates to the bill are saved
                updatedBills[normalizedBillId] = bill;
              } else {
                console.error(`Bill with ID ${normalizedBillId} not found in updatedBills`);
              }
            };
          
            // Log any remaining receiptAmount after processing all bills
            if (remainingReceiptValue > 0) {
              console.log("Remaining receiptAmount after processing all bills:", remainingReceiptValue);
              relevantFlatData.currentBalance = (relevantFlatData.currentBalance || 0) + remainingReceiptValue;
              const remainingReceiptValueVoucherNumber = await generateVoucherNumber(); // Generate separate voucher for receipt
              
              // Create a new advance entry
              const newAdvanceEntry = {
                amount: remainingReceiptValue,
                paymentDate,
                ledgerAccount,
                note,
                voucherNumber:remainingReceiptValueVoucherNumber,
                isDeposit:false,
                origin:"Bill Settelment Remaining receiptAmount"
              };
              // Update the Advance array
              relevantFlatData.Advance = [...(relevantFlatData.Advance || []), newAdvanceEntry];
              voucherNumberArray.push(remainingReceiptValueVoucherNumber);
            }

            
             
          } else {
            console.log("No selected IDs or logic unchanged.");
            // Existing logic for current balance without updating bills
            const receiptValue = parseFloat(receiptAmount as string);
            if (!isNaN(receiptValue)) {
              relevantFlatData.currentBalance = (relevantFlatData.currentBalance || 0) + receiptValue;
              const memberAdvanceVoucherNumber = await generateVoucherNumber(); // Generate separate voucher for receipt
              voucherNumberArray.push(memberAdvanceVoucherNumber);
              // Create a new advance entry
              const newAdvanceEntry = {
                amount: receiptValue,
                paymentDate,
                ledgerAccount,
                note,
                voucherNumber:memberAdvanceVoucherNumber,
                isDeposit:false,
                origin:"Member entered"
              };
              // Update the Advance array
              relevantFlatData.Advance = [...(relevantFlatData.Advance || []), newAdvanceEntry];
              
              
              
            } else {
              console.error("Invalid receiptAmount, unable to update currentBalance.");
            }
          }

         

          if (relevantFlatData) {
            // Find and update the specific uncleared balance entry
            const updatedUnclearedBalance = await Promise.all(
              (relevantFlatData.unclearedBalance || []).map(async (entry: any) => {
                if (entry.transactionId === transactionId) {
                  
                  // If no voucher numbers exist, generate a new one
                  if (voucherNumberArray.length === 0) {
                    const newVoucher = await generateVoucherNumber();
                    voucherNumberArray.push(newVoucher);
                  }
          
                  // Return the updated entry
                  return {
                    ...entry,
                    voucherNumbers: voucherNumberArray,
                    status: "Cleared",
                    ledgerAccount,
                  };
                }
                return entry; // Keep other entries unchanged
              })
            );
            
            // Await resolution of all async updates in the array
            const resolvedUnclearedBalance = await Promise.all(updatedUnclearedBalance);
            

    
          // Update the specific flat's data with the modified unclearedBalance array
          const updatedFlatData = {
            ...relevantFlatData,
            unclearedBalance: updatedUnclearedBalance,
            bills: updatedBills,
          };
    
          // Construct the updated society structure
          const updatedSocietyData = {
            ...societyData,
            wings: {
              ...societyData.wings,
              [wing]: {
                ...societyData.wings[wing],
                floorData: {
                  ...societyData.wings[wing].floorData,
                  [floorName]: {
                    ...societyData.wings[wing].floorData[floorName],
                    [flatNumber]: updatedFlatData, // Update only this flat
                  },
                },
              },
            },
          };
    
          // Save the updated data back to Firestore
          await setDoc(societiesDocRef, updatedSocietyData);
          
          const LedgerUpdate = await updateLedger(ledgerAccount, parseFloat(receiptAmount as string), "Add" ); // Update Ledger

          console.log(LedgerUpdate)
    
          Alert.alert("Success", "Receipt processed successfully.");
          router.push(
            {
              pathname: "/FlatCollectionSummary",
              params: {
                wing: wing,
                floorName: floorName,
                flatNumber: flatNumber,
              },
            }
          );
        } else {
          console.error("Relevant flat data not found.");
          Alert.alert("Error", "Flat data not found.");
        }
      } catch (error) {
        console.error("Failed to update receipt:", error);
        Alert.alert("Error", "Failed to accept receipt. Please try again.");
      }
    };
    

    

  return (
    <View style={styles.container}>
        {/* Remove Stack Header */}
        <Stack.Screen options={{ headerShown: false }} />
        {/* Appbar Header */}
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Accept Receipt" />
        </Appbar.Header>

      <View style={styles.modalContainer}>

        {/* Receipt Amount */}
        <View >
          <Text style={styles.label}>Receipt Amount</Text>
          <TextInput
            style={styles.input}
            placeholder="Receipt amount"
            value={receiptAmount as string}
            onChangeText={setReceiptAmount}
            keyboardType="numeric"
          />
        </View>

        {/* Ledger Account */}
        <View >
          <Text style={styles.label}>Ledger Account</Text>
            <Dropdown
              label="Account"
              placeholder="Select Account"
              options={accountFromOptions}
              value={ledgerAccount}
              onSelect={setledgerAccount}
            />
        </View>
            {/* Payment Date */}
        <View> 
            <Text style={styles.label}>Payment Date</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={styles.dateInputContainer}
            >
              <TextInput
                style={styles.dateInput}
                value={formattedDate}
                editable={false}
              />
              <Text style={styles.calendarIcon}>📅</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={paymentDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
        </View>
          {/* Note */}
            <Text style={styles.label}>Note (optional)</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              placeholder="Note (optional)"
              value={note}
              onChangeText={setNote}
              multiline
            />

            {/* Bill Settlement */}
            <View style={styles.switchContainer}>
              <Text>Bill Settlement</Text>
              <Switch
                value={billSettlement}
                onValueChange={() => setBillSettlement(!billSettlement)}
                color="#4CAF50"
              />
            </View>

            {/* Accept Button */}
            <Button
              mode="contained"
              style={styles.modalAcceptButton}
              onPress={() => handleAccept()} 
            >
              Accept
            </Button>


      </View>
    </View>
  )
}

export default AcceptReceipt

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { backgroundColor: "#2196F3" },
  label: { fontSize: 14, fontWeight: "bold", marginBottom: 6 },
  input: {borderWidth: 1, borderColor: "#CCC", borderRadius: 4, padding: 10, marginVertical: 8,},
  modalContainer: { backgroundColor: "#FFF", width: "90%", borderRadius: 8, padding: 16 },
  dateInputContainer: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  dateInput: { flex: 1, borderBottomWidth: 1, paddingVertical: 8 },
  calendarIcon: { fontSize: 20, marginLeft: 8 },
  noteInput: { height: 80, textAlignVertical: "top" },
  switchContainer: { flexDirection: "row", justifyContent: "space-between", marginVertical: 10 },
  modalAcceptButton: { backgroundColor: "#4CAF50", marginTop: 10 },

})