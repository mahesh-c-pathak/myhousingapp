import React, { useState, useEffect } from "react";
import { View, ScrollView, TextInput, Alert, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { Appbar, Button, Text, Avatar, Switch } from "react-native-paper";
import Dropdown from "../../../utils/DropDown";
import { collection, doc, getDoc, getDocs, query, where, setDoc } from "firebase/firestore";
import { useSociety } from "../../../utils/SocietyContext";
import { db } from "../../../FirebaseConfig";
import PaymentDatePicker from "../../../utils/paymentDate";
import { generateVoucherNumber } from "../../../utils/generateVoucherNumber";
import { updateLedger } from "../../../utils/updateLedger";
import paymentModeOptions from "../../../constants/paymentModeOptions";

const Advance = () => {
  const router = useRouter();
  const { societyName } = useSociety();
  const params = useLocalSearchParams();

  const wing = params.wing as string;
  const floorName = params.floorName as string;
  const flatNumber = params.flatNumber as string;

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [ledgerAccount, setLedgerAccount] = useState<any>("");
  const [accountFromOptions, setAccountFromOptions] = useState<{ label: string; value: string }[]>([]);
  const [paymentDate, setPaymentDate] = useState(new Date(params.paymentDate as string || Date.now()));

  const [isDeposit, setIsDeposit] = useState(false);

  

  const [paymentMode, setpaymentMode] = useState<string>("");
  const [showPaymentMode, setShowPaymentMode] = useState<boolean>(false);
  const [bankAccountOptions, setBankAccountOptions] = useState<string[]>([]);
  
  // Format date as YYYY-MM-DD
  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const [formattedDate, setFormattedDate] = useState(formatDate(paymentDate));

  useEffect(() => {
    setFormattedDate(formatDate(paymentDate))
  }, [paymentDate]);

  useEffect(() => {
    const fetchAccountOptions = async () => {
      try {
        const ledgerGroupsRef = collection(db, "ledgerGroups");
        const fromQuerySnapshot = await getDocs(
          query(ledgerGroupsRef, where("name", "in", ["Bank Accounts", "Cash in Hand"]))
        );

        const fromAccounts = fromQuerySnapshot.docs
          .map((doc) => doc.data().accounts || [])
          .flat()
          .filter((account) => account.trim() !== "")
          .map((account) => ({ label: account, value: account }));

        const bankAccountsSnapshot = await getDocs(
            query(ledgerGroupsRef, where("name", "in", ["Bank Accounts"]))
          );

        const bankAccounts = bankAccountsSnapshot.docs
        .map((doc) => doc.data().accounts || [])
        .flat();

        setAccountFromOptions(fromAccounts);
        setBankAccountOptions(bankAccounts);
      } catch (error) {
        console.error("Error fetching account options:", error);
        Alert.alert("Error", "Failed to fetch account options.");
      }
    };

    fetchAccountOptions();
  }, []);

  useEffect(() => {
    if (bankAccountOptions.includes(ledgerAccount)) {
      setShowPaymentMode(true);
    } else {
      setShowPaymentMode(false);
      setpaymentMode("Cash");
    }

  }, [bankAccountOptions, ledgerAccount]);

  const handleSave = async () => {
    try {
      if (!ledgerAccount || !amount) {
        Alert.alert("Error", "Please enter an amount and select a ledger account.");
        return;
      }
  
      const docRef = doc(db, "Societies", societyName);
      const societyDocSnap = await getDoc(docRef);
  
      if (societyDocSnap.exists()) {
        const societyData = societyDocSnap.data();
        const societyWings = societyData.wings;
  
        const relevantWing = societyWings?.[wing]?.floorData?.[floorName]?.[flatNumber];
        const voucherNumber = await generateVoucherNumber();
  
        if (relevantWing) {
          const advanceAmount = parseFloat(amount);
  
          // Update deposit or current balance based on `isDeposit`
          if (isDeposit) {
            relevantWing.deposit = (relevantWing.deposit || 0) + advanceAmount;
          } else {
            relevantWing.currentBalance = (relevantWing.currentBalance || 0) + advanceAmount;
          }
  
          // Create a new advance entry
          const newAdvanceEntry = {
            amount: advanceAmount,
            paymentDate,
            ledgerAccount,
            note,
            voucherNumber,
            isDeposit,
            paymentMode,
            formattedDate,
            type: "Advance",
          };
  
          // Update the Advance array
          relevantWing.Advance = [...(relevantWing.Advance || []), newAdvanceEntry];
  
          // Update the flat data in Firestore
          const updatedFlatData = {
            ...relevantWing,
          };
  
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
                    [flatNumber]: updatedFlatData,
                  },
                },
              },
            },
          };
  
          await setDoc(docRef, updatedSocietyData);

          const updatePromises = [];

          const LedgerUpdate1 = await updateLedger(ledgerAccount, parseFloat(amount as string), "Add" ); // Update Ledger
          const LedgerUpdate2 = await updateLedger("Members Advanced", parseFloat(amount as string), "Add" ); // Update Ledger

          updatePromises.push(
            LedgerUpdate1, LedgerUpdate2
          );

          // Wait for all updates to complete
          await Promise.all(updatePromises);
  
          Alert.alert("Success", "Advance entry saved successfully.", [
            {
              text: "OK",
              onPress: () =>
                router.replace({
                  pathname: "/FlatCollectionSummary",
                  params: { wing, floorName, flatNumber },
                }),
            },
          ]);
        } else {
          Alert.alert("Error", "Flat data not found.");
        }
      } else {
        Alert.alert("Error", "Society document not found.");
      }
    } catch (error) {
      console.error("Error saving advance entry:", error);
      Alert.alert("Error", "Failed to save advance entry. Please try again.");
    }
  };
  

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} color="#fff" />
        <Appbar.Content title="Advance" titleStyle={styles.titleStyle} />
      </Appbar.Header>
      <View style={styles.profileContainer}>
        <Avatar.Text size={44} label="XD" style={styles.avatar} />
        <View style={styles.textContainer}>
          <Text style={styles.profileText}>{`${wing} ${flatNumber}`}</Text>
        </View>
      </View>
      <ScrollView style={styles.formContainer}>
        
        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          value={amount}
          keyboardType="numeric"
          onChangeText={setAmount}
        />
        <Text style={styles.label}>Note</Text>
        <TextInput
          style={[styles.input, styles.noteInput]}
          value={note}
          placeholder="Enter a note (optional)"
          onChangeText={setNote}
          multiline
        />
            {/* Ledger Account */}
        <View style={styles.section}>
          <Text style={styles.label}>Ledger Account</Text>
          <Dropdown
            data={accountFromOptions}
            onChange={setLedgerAccount}
            placeholder="Select Account"
          />
        </View>

            {/* Payment Mode */}
          {showPaymentMode && (
            <View style={styles.section}>
              <Text style={styles.label}>Payment Mode</Text>
              <Dropdown
                data={paymentModeOptions}
                onChange={setpaymentMode}
                placeholder="Select Account"
              />
            </View>
        )}

            {/* Payment Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Payment Date</Text>
          <PaymentDatePicker
            initialDate={paymentDate}
            onDateChange={setPaymentDate}
          />
        </View>

        {/* switch - for Deposit */}
        <View style={styles.switchContainer}>
              <Text style={styles.label}>Is this deposit?</Text>
              <Switch
                value={isDeposit}
                onValueChange={() => setIsDeposit(!isDeposit)}
                color="#4CAF50"
              />
        </View>
        <Text style={styles.redlabel}>Deposit amount will not be used for bill settlement</Text>

      </ScrollView>

      <Button mode="contained" style={styles.saveButton} onPress={() => handleSave()}>
        Save
      </Button>
    </View>
  );
};

export default Advance;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { backgroundColor: "#6200ee" },
  titleStyle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  profileContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, backgroundColor: "#6200ee", paddingBottom: 10 },
  profileText: { fontSize: 14, color: "white" },
  textContainer: { justifyContent: "center" },
  avatar: { backgroundColor: "#6200ee", marginRight: 10, borderColor: "#fff", borderWidth: 2 },
  formContainer: { padding: 16 },
  redlabel: { fontSize: 14, marginBottom: 16, color: "red" },
  label: { fontSize: 14, fontWeight: "bold", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 4, padding: 10, marginBottom: 16, fontSize: 16 },
  noteInput: { height: 80, textAlignVertical: "top" },
  section: { marginBottom: 16 },
  switchContainer: { flexDirection: "row", justifyContent: "space-between", marginVertical: 10 },
  saveButton: { backgroundColor: "#6200ee", marginTop: 10, marginHorizontal: 20 },
});
