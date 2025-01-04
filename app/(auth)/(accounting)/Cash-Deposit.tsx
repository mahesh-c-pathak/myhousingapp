import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet, Alert, Text, Platform } from "react-native";
import { TextInput, Button, Card, Menu } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../FirebaseConfig";
import DateTimePicker from "@react-native-community/datetimepicker";
import { updateLedger } from "../../../utils/updateLedger";
 
const CashDeposit: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams(); // Extract parameters like `id`

  const [paidFrom, setPaidFrom] = useState<string>("");
  const [paidTo, setPaidTo] = useState<string>("");
  const [narration, setNarration] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [customVoucher, setCustomVoucher] = useState<string>("");
  const [paymentNote, setPaymentNote] = useState<string>("");
  const [transactionDate, setTransactionDate] = useState<Date>(new Date());

  const [menuFromVisible, setMenuFromVisible] = useState<boolean>(false);
  const [menuToVisible, setMenuToVisible] = useState<boolean>(false);

  const [accountFromOptions, setAccountFromOptions] = useState<string[]>([]);
  const [accountToOptions, setAccountToOptions] = useState<string[]>([]);

  const [asOnDate, setAsOnDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      if (params?.id) {
        setIsEditMode(true);
        try {
          const transactionRef = doc(db, "Transaction", params.id as string);
          const transactionDoc = await getDoc(transactionRef);

          if (transactionDoc.exists()) {
            const transactionData = transactionDoc.data();
            setPaidFrom(transactionData.paidFrom || "");
            setPaidTo(transactionData.paidTo || "");
            setNarration(transactionData.narration || "");
            setAmount(transactionData.amount ? transactionData.amount.toString() : "");
            setCustomVoucher(transactionData.customVoucher || "");
            setPaymentNote(transactionData.paymentNote || "");
            setAsOnDate(transactionData.transactionDate ? new Date(transactionData.transactionDate) : new Date());
          } else {
            Alert.alert("Error", "Transaction not found.");
          }
        } catch (error) {
          console.error("Error fetching transaction details:", error);
          Alert.alert("Error", "Failed to fetch transaction details.");
        }
      }
    };

    const fetchAccountOptions = async () => {
      try {
        const ledgerGroupsRef = collection(db, "ledgerGroups");

        const fromQuerySnapshot = await getDocs(
          query(ledgerGroupsRef, where("name", "in", [ "Cash in Hand",]))
        );
        const fromAccounts = fromQuerySnapshot.docs
          .map((doc) => doc.data().accounts || [])
          .flat()
          .filter((account) => account.trim() !== "");
        setAccountFromOptions(fromAccounts);

        const toQuerySnapshot = await getDocs(
          query(
            ledgerGroupsRef,
            where("name", "in", [
              "Bank Accounts",
            ])
          )
        );
        const toAccounts = toQuerySnapshot.docs
          .map((doc) => doc.data().accounts || [])
          .flat()
          .filter((account) => account.trim() !== "");
        setAccountToOptions(toAccounts);
      } catch (error) {
        console.error("Error fetching account options:", error);
        Alert.alert("Error", "Failed to fetch account options.");
      }
    };


    

    fetchTransactionDetails();
    fetchAccountOptions();
  }, [params?.id]);

  
  const handleSave = async () => {
    if (!paidFrom || !paidTo || !amount) {
        Alert.alert("Error", "Please fill in all required fields.");
        return;
    }

    try {
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            Alert.alert("Error", "Please enter a valid amount.");
            return;
        }

        const transaction: {
          paidFrom: string;
          paidTo: string;
          narration: string;
          amount: number;
          customVoucher: string | null;
          paymentNote: string | null;
          transactionDate: string;
          createdAt: string;
          type: string;
          voucher?: string;
        } = {
          paidFrom,
          paidTo,
          narration,
          amount: parsedAmount,
          customVoucher: customVoucher || null,
          paymentNote: paymentNote || null,
          transactionDate: asOnDate.toISOString().split("T")[0],
          createdAt: new Date().toISOString(),
          type: "Cash-Deposit",
        };

        

        if (isEditMode && params?.id) {
            // Update existing transaction
            const transactionRef = doc(db, "Transaction", params.id as string);
            const transactionDoc = await getDoc(transactionRef);
            if (!transactionDoc.exists()) {
              Alert.alert("Error", "Transaction not found.");
              return;
            }
            const originalTransaction = transactionDoc.data();
            const originalPaidFrom = originalTransaction.paidFrom
            const originalPaidTo = originalTransaction.paidTo;
            const originalAmount = parseFloat(originalTransaction.amount);
    
            // Update the transaction in Firestore
            await updateDoc(transactionRef, transaction);

            // Ledger updates based on changes
            if (originalPaidFrom !== paidFrom) {
              // Revert original `paidFrom` and apply new `paidFrom`
              await updateLedger(originalPaidFrom, originalAmount, "Add");
              await updateLedger(paidFrom, parsedAmount, "Subtract");
            } else if (originalAmount !== parsedAmount) {
              // Only update `paidFrom` amount if it changed
              const diff = Math.abs(parsedAmount - originalAmount);
              await updateLedger(paidFrom, diff, parsedAmount > originalAmount ? "Subtract" : "Add");
            }
    
            if (originalPaidTo !== paidTo) {
              // Revert original `paidTo` and apply new `paidTo`
              await updateLedger(originalPaidTo, originalAmount, "Subtract");
              await updateLedger(paidTo, parsedAmount, "Add");
            } else if (originalAmount !== parsedAmount) {
              // Only update `paidTo` amount if it changed
              const diff = Math.abs(parsedAmount - originalAmount);
              await updateLedger(paidTo, diff, parsedAmount > originalAmount ? "Add" : "Subtract");
            }

            Alert.alert("Success", "Transaction updated successfully!", [
                {
                    text: "OK",
                    onPress: () => router.replace("/TransactionScreen"),
                },
            ]);
        } else {
            // Generate voucher number and create new transaction
            const voucher = await generateVoucherNumber();
            transaction.voucher = voucher;

            await addDoc(collection(db, "Transaction"), transaction);

            // Update ledger        
            const updatePromises = [];
            const LedgerUpdate1 = await updateLedger(paidFrom, parsedAmount, "Subtract" ); // Update Ledger
            const LedgerUpdate2 = await updateLedger( paidTo, parsedAmount, "Add" ); // Update Ledger
            updatePromises.push(
              LedgerUpdate1, LedgerUpdate2
            );
            // Wait for all updates to complete
            await Promise.all(updatePromises);

            Alert.alert("Success", "Transaction saved successfully!", [
                {
                    text: "OK",
                    onPress: () => router.replace("/TransactionScreen"),
                },
            ]);
        }
    } catch (error) {
        console.error("Error saving transaction:", error);
        Alert.alert("Error", "Failed to save transaction.");
    }
};

const generateVoucherNumber = async () => {
    try {
        const counterRef = doc(db, "Meta", "transactionCounter");
        const counterDoc = await getDoc(counterRef);

        let count = 1;
        if (counterDoc.exists()) {
            count = counterDoc.data().count + 1;
        }

        await updateDoc(counterRef, { count });

        // Format the voucher number
        return `V/2024-25/${count}`;
    } catch (error) {
        console.error("Error generating voucher number:", error);
        Alert.alert("Error", "Failed to generate voucher number.");
        throw error;
    }
};

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) setAsOnDate(selectedDate);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        {/* Paid From */}
        <Menu
          visible={menuFromVisible}
          onDismiss={() => setMenuFromVisible(false)}
          anchor={
            <TextInput
              label="Account From"
              value={paidFrom}
              onFocus={() => setMenuFromVisible(true)}
              style={styles.input}
            />
          }
        >
          {accountFromOptions.map((option, index) => (
            <Menu.Item
              key={index}
              onPress={() => {
                setPaidFrom(option);
                setMenuFromVisible(false);
              }}
              title={option}
            />
          ))}
        </Menu>

        {/* Paid To */}
        <Menu
          visible={menuToVisible}
          onDismiss={() => setMenuToVisible(false)}
          anchor={
            <TextInput
              label="Account To"
              value={paidTo}
              onFocus={() => setMenuToVisible(true)}
              style={styles.input}
            />
          }
        >
          {accountToOptions.map((option, index) => (
            <Menu.Item
              key={index}
              onPress={() => {
                setPaidTo(option);
                setMenuToVisible(false);
              }}
              title={option}
            />
          ))}
        </Menu>

        <TextInput
          label="Narration"
          value={narration}
          onChangeText={setNarration}
          style={styles.input}
          multiline
        />
      </Card>

      <Card style={styles.card}>
        <TextInput
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          style={styles.input}
        />
        <TextInput
          label="Custom Voucher No. (optional)"
          value={customVoucher}
          onChangeText={setCustomVoucher}
          style={styles.input}
        />
        <TextInput
          label="Payment Note"
          value={paymentNote}
          onChangeText={setPaymentNote}
          style={styles.input}
          multiline
        />
        <TextInput
        label="Transaction Date"
        value={asOnDate.toISOString().split("T")[0]}
        style={styles.input}
        editable={false}
        right={
          <TextInput.Icon
            icon="calendar"
            onPress={() => setShowDatePicker(true)}
          />
        }
      />
      {showDatePicker && (
        <DateTimePicker
          value={asOnDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
        />
      )}
      </Card>

      <Button mode="contained" onPress={handleSave} style={styles.saveButton}>
        Save
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: "#6200ee",
  },
});



export default CashDeposit