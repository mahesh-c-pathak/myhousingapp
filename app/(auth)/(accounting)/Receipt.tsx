import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet, Alert, Text, Platform } from "react-native";
import { TextInput, Button, Card, Menu } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../FirebaseConfig";
import DateTimePicker from "@react-native-community/datetimepicker";
import { updateLedger } from "../../../utils/updateLedger";
import { useSociety } from "../../../utils/SocietyContext";

const ReceiptScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isEditMode = !!params?.id;
  const { assetAccounts, liabilityAccounts, incomeAccounts, expenditureAccounts,} = useSociety();

  const [paidFrom, setPaidFrom] = useState<string>("");
  const [paidTo, setPaidTo] = useState<string>("");
  const [narration, setNarration] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [customVoucher, setCustomVoucher] = useState<string>("");
  const [paymentNote, setPaymentNote] = useState<string>("");
  const [asOnDate, setAsOnDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  const [menuFromVisible, setMenuFromVisible] = useState<boolean>(false);
  const [menuToVisible, setMenuToVisible] = useState<boolean>(false);

  const [accountFromOptions, setAccountFromOptions] = useState<string[]>([]);
  const [accountToOptions, setAccountToOptions] = useState<string[]>([]);

  // useEffect(() => {console.log('liabilityAccounts', liabilityAccounts)}, [liabilityAccounts]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const ledgerGroupsRef = collection(db, "ledgerGroups");

        const accountTypes = [
          "Bank Accounts",
          "Cash in Hand",
          "Account Receivable",
          "Investment",
          "Fixed Assets",
          "Current Assets",
          "Sundry Debtors",
          "Loan and Advances",
        ];

        const fetchGroupAccounts = async (type: string[]) => {
          const snapshot = await getDocs(
            query(ledgerGroupsRef, where("name", "in", type))
          );
          return snapshot.docs
            .map((doc) => doc.data().accounts || [])
            .flat()
            .filter((account) => account && account.trim() !== "")
            .sort((a, b) => a.localeCompare(b));
        };

        setAccountFromOptions(await fetchGroupAccounts(accountTypes));
        setAccountToOptions(await fetchGroupAccounts(accountTypes));
      } catch (error) {
        console.error("Error fetching accounts:", error);
        Alert.alert("Error", "Failed to fetch accounts.");
      }
    };

    const fetchTransactionDetails = async () => {
      if (isEditMode && params?.id) {
        try {
          const docRef = doc(db, "Transaction", params.id as string);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setPaidFrom(data.paidFrom || "");
            setPaidTo(data.paidTo || "");
            setNarration(data.narration || "");
            setAmount(data.amount ? data.amount.toString() : "");
            setCustomVoucher(data.customVoucher || "");
            setPaymentNote(data.paymentNote || "");
            setAsOnDate(new Date(data.transactionDate || new Date()));
          }
        } catch (error) {
          console.error("Error fetching transaction details:", error);
          Alert.alert("Error", "Failed to fetch transaction details.");
        }
      }
    };

    fetchAccounts();
    fetchTransactionDetails();
  }, [isEditMode, params?.id]);

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
        type: "Receipt",
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
        // Revert original ledger updates
        await updateLedger(
          originalPaidTo,
          originalAmount,
          liabilityAccounts.includes(originalPaidTo) ? "Add" : "Subtract"
        );
        await updateLedger(
          originalPaidFrom,
          originalAmount,
          liabilityAccounts.includes(originalPaidFrom) ? "Subtract" : "Add"
        );

        // Apply new ledger updates
          await updateLedger(
            paidTo,
            parsedAmount,
            liabilityAccounts.includes(paidTo) ? "Subtract" : "Add"
          );
          await updateLedger(
            paidFrom,
            parsedAmount,
            liabilityAccounts.includes(paidFrom) ? "Add" : "Subtract"
          );
       
  
        // Show success alert and navigate to TransactionScreen
        Alert.alert("Success", "Transaction updated successfully!", [
          {
            text: "OK",
            onPress: () => router.replace("/TransactionScreen"),
          },
        ]);
      } else {
        // Add new transaction
        // Generate voucher number and create new transaction
        const voucher = await generateVoucherNumber();
        transaction.voucher = voucher;
        await addDoc(collection(db, "Transaction"), transaction);

        // Update ledger
        await updateLedger(
          paidTo,
          parsedAmount,
          liabilityAccounts.includes(paidTo) ? "Subtract" : "Add"
        );
        await updateLedger(
          paidFrom, 
          parsedAmount,
          liabilityAccounts.includes(paidFrom) ? "Add" : "Subtract"
        );
  
        // Show success alert and navigate to TransactionScreen
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
  

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) setAsOnDate(selectedDate);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Menu
          visible={menuFromVisible}
          onDismiss={() => setMenuFromVisible(false)}
          anchor={
            <TextInput
              label="Paid From"
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

        <Menu
          visible={menuToVisible}
          onDismiss={() => setMenuToVisible(false)}
          anchor={
            <TextInput
              label="Paid To"
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
          label="Custom Voucher No."
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
        {isEditMode ? "Update" : "Save"}
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

export default ReceiptScreen;
