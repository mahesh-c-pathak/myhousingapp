import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet, Alert, Platform } from "react-native";
import { TextInput, Button, Card, Menu } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../FirebaseConfig";
import DateTimePicker from "@react-native-community/datetimepicker";
import { updateLedger } from "../../../utils/updateLedger";
import { useSociety } from "../../../utils/SocietyContext";

const Purchase: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams(); // Extracts params such as `id` for edit mode.
  const { assetAccounts, liabilityAccounts, incomeAccounts, expenditureAccounts,} = useSociety();

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
            setTransactionDate(transactionData.transactionDate ? new Date(transactionData.transactionDate) : new Date());
          } else {
            Alert.alert("Error", "Transaction not found.");
          }
        } catch (error) {
          console.error("Error fetching transaction details:", error);
          Alert.alert("Error", "Failed to fetch transaction details.");
        }
      }
    };

    const fetchAccounts = async () => {
      try {
        const ledgerGroupsRef = collection(db, "ledgerGroups");

        // Fetch "Paid From" accounts
        const fromQuerySnapshot = await getDocs(
          query(ledgerGroupsRef, where("name", "in", ["Bank Accounts", "Cash in Hand"]))
        );
        const fromAccounts = fromQuerySnapshot.docs
          .map((doc) => doc.data().accounts || [])
          .flat()
          .filter((account) => account.trim() !== "");
        setAccountFromOptions(fromAccounts);

        // Fetch "Paid To" accounts
        const toQuerySnapshot = await getDocs(
          query(ledgerGroupsRef, where("name", "in", [
            "Indirect Expenses",
            "Indirect Income",
            "Account Receivable",
            "Current Liabilities",
            "Reserve and Surplus",
            "Current Assets",
            "Deposit", 
            "Direct Expenses",
            "Direct Income",
            "Investment",
            "Capital Account",
            "Account Payable",
            "Late Payment",
            "Loan and Advances",
            "Maintenance & Repairing",
            "Provision",
            "Share Capital",
            "Sundry Creditors",
            "Sundry Debtors",
            "Suspense Account", 
            "Fixed Assets", 
            
          ]))
        );
        const toAccounts = toQuerySnapshot.docs
          .map((doc) => doc.data().accounts || [])
          .flat()
          .filter((account) => account.trim() !== "")
          .sort((a, b) => a.localeCompare(b)); // Sort alphabetically;;
        setAccountToOptions(toAccounts);
      } catch (error) {
        console.error("Error fetching accounts:", error);
        Alert.alert("Error", "Failed to fetch account options.");
      }
    };

    fetchTransactionDetails();
    fetchAccounts();
  }, [params?.id]);

  const generateVoucherNumber = async () => {
    try {
      const counterRef = doc(db, "Meta", "transactionCounter");
      const counterDoc = await getDoc(counterRef);

      let count = 1;
      if (counterDoc.exists()) {
        count = counterDoc.data().count + 1;
      }

      await updateDoc(counterRef, { count });
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
        transactionDate: transactionDate.toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
        type: "Purchase",
      };


      if (isEditMode && params?.id) {
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

         // Revert original ledger updates
          await updateLedger(
            originalPaidTo,
            originalAmount,
            liabilityAccounts.includes(originalPaidTo) ? "Add" : "Subtract"
          );
          await updateLedger(
            originalPaidFrom,
            originalAmount,
            "Add"
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
          "Subtract"
        );


        Alert.alert("Success", "Transaction updated successfully!", [
          {
            text: "OK",
            onPress: () => router.replace("/TransactionScreen"),
          },
        ]);
      } else {
        const voucher = customVoucher || (await generateVoucherNumber());
        transaction.voucher = voucher;

        await addDoc(collection(db, "Transaction"), transaction);

        // Update ledger            
         await updateLedger(paidFrom, parsedAmount, "Subtract");
         await updateLedger(
                       paidTo,
                       parsedAmount,
                       liabilityAccounts.includes(paidTo) ? "Subtract" : "Add"
                     );

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
    if (selectedDate) setTransactionDate(selectedDate);
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
          value={transactionDate.toISOString().split("T")[0]}
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
            value={transactionDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleDateChange}
          />
        )}
      </Card>

      <Button mode="contained" onPress={handleSave} style={styles.button}>
        Save Transaction
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
  button: {
    marginTop: 16,
    backgroundColor: "#6200ee",
  },
});

export default Purchase;
