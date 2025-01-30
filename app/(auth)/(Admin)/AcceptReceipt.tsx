import { StyleSheet, Text, View, Alert, TouchableOpacity } from 'react-native'
import React, { useState, useEffect } from "react";
// import { Dropdown } from 'react-native-paper-dropdown';
import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../../../FirebaseConfig";
import { Appbar, Button, Switch, Menu, TextInput } from "react-native-paper";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";

import { useSociety } from "../../../utils/SocietyContext";

import { generateVoucherNumber } from "../../../utils/generateVoucherNumber";
import { updateLedger } from "../../../utils/updateLedger";
import { getBillItemsLedger } from "../../../utils/getBillItemsLedger";
import { fetchbankCashAccountOptions } from "@/utils/bankCashOptionsFetcher";
import PaymentDatePicker from "@/utils/paymentDate";

import Dropdown from "@/utils/DropDown";
import { updateFlatCurrentBalance } from "@/utils/updateFlatCurrentBalance"; // Adjust path as needed

const AcceptReceipt = () => {
  const router = useRouter();
  const { societyName } = useSociety();

  const { wing,floorName,flatNumber, amount,  transactionId, paymentMode, notes, receiptImage, selectedIds, bankName, chequeNo } = useLocalSearchParams();

   
  const params = useLocalSearchParams();
  const [receiptAmount, setReceiptAmount] = useState(amount);
  const [note, setNote] = useState("");
  const [billSettlement, setBillSettlement] = useState(false);
  
  const [ledgerAccount, setledgerAccount] = useState<any>('');

   const [accountToOptions, setAccountToOptions] = useState<{ label: string; value: string; group: string }[]>([]);
   const [groupTo, setGroupTo] = useState<string>("");

   const [asOnDate, setAsOnDate] = useState<Date>(new Date());

   const parsedSelectedIds = typeof selectedIds === "string" ? JSON.parse(selectedIds) : selectedIds;
   const customWingsSubcollectionName = `${societyName} wings`;
    const customFloorsSubcollectionName = `${societyName} floors`;
    const customFlatsSubcollectionName = `${societyName} flats`;
    const customFlatsBillsSubcollectionName = `${societyName} bills`;

    const unclearedBalanceSubcollectionName = `unclearedBalances_${societyName}`


    // fetch Paid To List
      useEffect(() => {
        const fetchbankCashOptions = async () => {
          try {
            const { accountFromOptions } = await fetchbankCashAccountOptions(societyName);
            setAccountToOptions(accountFromOptions);
          } catch (error) {
            Alert.alert("Error", "Failed to fetch bank Cash account options.");
          }
        };
        fetchbankCashOptions();
      }, [params?.id]);

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
    const handleDateChange = (newDate: Date) => {
      setAsOnDate(newDate);
      setFormattedDate(formatDate(newDate));
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
    
        const flatRef = `Societies/${societyName}/${customWingsSubcollectionName}/${wing}/${customFloorsSubcollectionName}/${floorName}/${customFlatsSubcollectionName}/${flatNumber}`;
        const flatDocRef = doc(db, flatRef);
        const flatDocSnap = await getDoc(flatDocRef);
                          
        if (!flatDocSnap.exists()) {
          console.warn(`Flat Data Not Exisits.`);
          return;
          
        }
          
      const flatDetails = flatDocSnap.data();
      const residentType = flatDetails.resident;


        const billsCollectionRef = collection(flatDocRef, customFlatsBillsSubcollectionName);
        const parsedSelectedIds = selectedIds ? JSON.parse(selectedIds as string) : [];
    
        if (Array.isArray(parsedSelectedIds) && parsedSelectedIds.length > 0) {
          let remainingReceiptValue = receiptAmountValue; // Track remaining receiptAmount globally
          const billreceiptVoucherNumber = await generateVoucherNumber(); // Generate  voucher for bill receipt
    
          for (const item of parsedSelectedIds) {
            const billDocRef = doc(billsCollectionRef, item);
            const billDoc = await getDoc(billDocRef);
    
            if (billDoc.exists()) {
              console.log("Bill Document:", billDoc.data());
              const billData = billDoc.data();
              const billAmount = billData.amount;
              const balanceToApply = Math.min(billAmount, remainingReceiptValue);
    
              // Deduct from bill amount
              billData.amount -= balanceToApply;
              remainingReceiptValue -= balanceToApply;
    
              // Update bill status
              const billStatus = billData.amount === 0 ? "paid" : "unpaid";
    
              // Update the document
              await updateDoc(billDocRef, {
                status: billStatus,
                receiptAmount: billAmount,
                paymentDate: formattedDate, // Save formatted date
                paymentMode: paymentMode || "Other", // Add payment mode
                bankName: bankName || null, // Include bank name if applicable
                chequeNo: chequeNo || null, // Include cheque number if applicable
                transactionId,
                voucherNumber:billreceiptVoucherNumber,
                type: "Bill Settelment",
                origin:"Bill Settelment",
                note,
              });
    
              console.log(`Updated bill document with ID: ${item}`);
              // Mahesh Entered

                // Call the function to get bill details
                const billItemLedger = await getBillItemsLedger(societyName,item, residentType );

                // Process each item: log details and update ledger
                for (const {  updatedLedgerAccount, ledgerAccount, groupFrom,amount, invoiceDate  } of billItemLedger) {
                  // Update ledger
                  const ledgerUpdate = await updateLedger(societyName,"Account Receivable",updatedLedgerAccount, amount, "Subtract", formattedDate);
                  console.log(`  Ledger Update Status: ${ledgerUpdate}`);
                }

          // Mahesh End

            } else {
              console.log(`Bill document with ID: ${item} does not exist`);
            }
          }
    
          // If all bills are cleared, update uncleared balance status to "Cleared"
          if (remainingReceiptValue === 0) {
            const unclearedBalanceDocRef = doc(db, flatRef, unclearedBalanceSubcollectionName, transactionId as string);
            const docSnap = await getDoc(unclearedBalanceDocRef);
    
            if (docSnap.exists()) {
              await updateDoc(unclearedBalanceDocRef, { 
                status: "Cleared",
                amountReceived: receiptAmountValue,
                paymentReceivedDate: formattedDate, // Save formatted date, 
                ledgerAccount,
                note,
                voucherNumber:billreceiptVoucherNumber,
                origin:"Bill Settelment",
              });
              console.log(`Uncleared balance with ID: ${transactionId} updated to 'Cleared'`);
            } else {
              console.log(`Uncleared balance document with ID: ${transactionId} does not exist`);
            }
          }

          const LedgerUpdate = await updateLedger(societyName,groupTo,ledgerAccount, parseFloat(receiptAmount as string), "Add", formattedDate ); // Update Ledger

          console.log(LedgerUpdate)
          
        } else{
            console.log("No selected IDs or logic unchanged. parsedSelectedIds length is 0");
            // Existing logic for current balance without updating bills
            const receiptValue = parseFloat(receiptAmount as string);
            if (!isNaN(receiptValue)) {
              const memberAdvanceVoucherNumber = await generateVoucherNumber(); // Generate separate voucher for receipt
              // Update  advance entry
              const unclearedBalanceDocRef = doc(db, flatRef, unclearedBalanceSubcollectionName, transactionId as string);
              const docSnap = await getDoc(unclearedBalanceDocRef);
      
              if (docSnap.exists()) {
                await updateDoc(unclearedBalanceDocRef, { 
                  status: "Cleared",
                  amountReceived: receiptValue,
                  paymentReceivedDate: formattedDate, // Save formatted date,
                  ledgerAccount, 
                  note,
                  voucherNumber:memberAdvanceVoucherNumber,
                  isDeposit:false,
                  origin:"Member entered Advance",
                  type: "Advance",
                  
                });
              }

              // Logic to save Advance Entry and Update Current Balance for the Flat

              try {
                 const currentBalanceSubcollectionName = `currentBalance_${flatNumber}`
                const currentbalanceCollectionRef = collection(db, flatRef, currentBalanceSubcollectionName);
            
                const result = await updateFlatCurrentBalance(currentbalanceCollectionRef, parseFloat(receiptAmount as string), "Add", formattedDate);
            
                console.log("Balance update result:", result);
              } catch (error) {
                console.error("Failed to update balance:", error);
              }


              // Update Ledger
              const LedgerUpdate = await updateLedger(societyName,groupTo,ledgerAccount, parseFloat(receiptAmount as string), "Add", formattedDate ); // Update Ledger
              console.log(LedgerUpdate)
              const LedgerUpdate2 = await updateLedger(societyName,"Current Liabilities","Members Advanced", parseFloat(amount as string), "Add", formattedDate ); // Update Ledger
              console.log(LedgerUpdate2)
            } else {
              console.error("Invalid receiptAmount, unable to update currentBalance.");
            }
        }
      } catch (error) {
        console.error("Error in handleAccept:", error);
        Alert.alert("Error", "Something went wrong. Please try again.");
      }
    };
    
    
 
    const handleAcceptOld = async () => {
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
                const billItemLedger = await getBillItemsLedger(societyName,normalizedBillId, relevantFlatData.resident );

                // Process each item: log details and update ledger
                for (const {  updatedLedgerAccount, ledgerAccount, groupFrom,amount, invoiceDate  } of billItemLedger) {
                  // Update ledger
                  const ledgerUpdate = await updateLedger(societyName,"Account Receivable",updatedLedgerAccount, amount, "Subtract", invoiceDate);
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
          
          const LedgerUpdate = await updateLedger(societyName,groupTo,ledgerAccount, parseFloat(receiptAmount as string), "Add", formattedDate ); // Update Ledger

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
                              <View style={styles.section}>
                                <Text style={styles.label}>Ledger Account</Text>
                                <Dropdown
                                  data={accountToOptions.map((option) => ({
                                    label: option.label,
                                    value: option.value,
                                  }))}
                                  onChange={(selectedValue) => {
                                    setledgerAccount(selectedValue);
                
                                    // Find the selected account to get its group
                                    const selectedOption = accountToOptions.find(
                                      (option) => option.value === selectedValue
                                    );
                                    if (selectedOption) {
                                      setGroupTo(selectedOption.group); // Set the group name
                                    }
                                  }}
                                  placeholder="Select Account"
                                  initialValue={ledgerAccount}
                                />
                              </View>
              {/* Transaction Date */}
              <View style={styles.section}>
                              <Text style={styles.label}>Transaction Date</Text>
                              <PaymentDatePicker
                                initialDate={asOnDate}
                                onDateChange={handleDateChange}
                              />
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
  section: { marginBottom: 10 },
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