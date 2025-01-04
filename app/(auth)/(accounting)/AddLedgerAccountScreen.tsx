import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, Platform } from "react-native";
import { TextInput, Button } from "react-native-paper";
import { useRouter } from "expo-router";
import { db } from "../../../FirebaseConfig";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  addDoc,
} from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";

const AddLedgerAccountScreen: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [group, setGroup] = useState<string>("");
  const [ledgerGroups, setLedgerGroups] = useState<
    { id: string; name: string }[]
  >([]);
  const [openingBalance, setOpeningBalance] = useState<string>("0.00");
  const [asOnDate, setAsOnDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [note, setNote] = useState<string>("");

  const router = useRouter();

  // Fetch ledger groups from Firestore
  useEffect(() => {
    const fetchLedgerGroups = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "ledgerGroups"));
        const groups = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setLedgerGroups(groups);
      } catch (error) {
        console.error("Error fetching ledger groups:", error);
        Alert.alert("Error", "Failed to fetch ledger groups.");
      }
    };

    fetchLedgerGroups();
  }, []);

  const handleSave = async () => {
    try {
      if (!name || !group) {
        Alert.alert("Error", "Please fill in all required fields.");
        return;
      }
  
      const selectedGroup = ledgerGroups.find((g) => g.name === group);
      if (!selectedGroup) {
        Alert.alert("Error", "Invalid group selection.");
        return;
      }
  
      const specialGroups = [
        "Current Liabilities",
        "Reserve and Surplus",
        "Direct Income",
        "Indirect Income",
        "Deposit",
        "Capital Account",
        "Account Payable",
        "Provision",
        "Share Capital",
        "Sundry Creditors",
        "Suspense Account",
      ];
  
      // Add to the selected group
      const selectedGroupDocRef = doc(db, "ledgerGroups", selectedGroup.id);
      await updateDoc(selectedGroupDocRef, {
        accounts: arrayUnion(name),
      });
  
      // Add to "Account Receivable" group if in specialGroups
      if (specialGroups.includes(group)) {
        const accountReceivableGroup = ledgerGroups.find(
          (g) => g.name === "Account Receivable"
        );
        if (accountReceivableGroup) {
          const accountReceivableDocRef = doc(
            db,
            "ledgerGroups",
            accountReceivableGroup.id
          );
          await updateDoc(accountReceivableDocRef, {
            accounts: arrayUnion(`${name} Receivable`),
          }
        );
        
        } else {
          Alert.alert(
            "Error",
            "'Account Receivable' group not found in ledger groups."
          );
          return;
        }
      }
  
      // Save payment details
      await addDoc(collection(db, "payments"), {
        name,
        group,
        openingBalance: parseFloat(openingBalance),
        asOnDate: asOnDate.toISOString().split("T")[0],
        note,
      });
  
      Alert.alert("Success", "Ledger account added successfully!");
      router.back();
    } catch (error) {
      console.error("Error saving ledger account:", error);
      Alert.alert("Error", "Failed to save ledger account.");
    }
  };
  

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) setAsOnDate(selectedDate);
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={group}
          onValueChange={(itemValue) => setGroup(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Select Ledger Group" value="" />
          {ledgerGroups.map((group) => (
            <Picker.Item key={group.id} label={group.name} value={group.name} />
          ))}
        </Picker>
      </View>
      <TextInput
        label="Opening Balance"
        value={openingBalance}
        keyboardType="numeric"
        onChangeText={setOpeningBalance}
        style={styles.input}
      />
      <TextInput
        label="As on Date"
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
      <TextInput
        label="Note (optional)"
        value={note}
        onChangeText={setNote}
        style={styles.input}
      />
      <Button mode="contained" onPress={handleSave} style={styles.button}>
        Save
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  input: {
    marginBottom: 16,
  },
  pickerContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 4,
    borderColor: "#BDBDBD",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  picker: {
    height: 56,
    color: "#000",
    marginLeft: 8,
  },
  button: {
    marginTop: 16,
    backgroundColor: "#6200ee",
  },
});

export default AddLedgerAccountScreen;
