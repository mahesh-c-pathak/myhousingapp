import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { TextInput, Button, Menu, Provider, Appbar } from "react-native-paper";
import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../FirebaseConfig";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AddSpecialBillItem = () => {
  const [itemName, setItemName] = useState("");
  const [notes, setNotes] = useState("");
  const [type, setType] = useState("");
  const [ownerAmount, setOwnerAmount] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [closedUnitAmount, setClosedUnitAmount] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
 
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  const [accountFromOptions, setAccountFromOptions] = useState<string[]>([]);
  const [menuFromVisible, setMenuFromVisible] = useState<boolean>(false);
  const [ledgerAccount, setLedgerAccount] = useState<string>("");

  // Prefill form in update mode
  useEffect(() => {
    const fetchBillItemsDetails = async () => {
      if (params?.id) {
        setIsEditMode(true);
        try {
          const billItemsRef = doc(db, "billItems", params.id as string);
          const billItemsRefDoc = await getDoc(billItemsRef);

          if (billItemsRefDoc.exists()) {
            const billItemsData = billItemsRefDoc.data();
            setItemName(billItemsData.itemName || "");
            setNotes(billItemsData.notes || "");
            setType(billItemsData.type || "Select");
            setOwnerAmount(billItemsData.ownerAmount ? billItemsData.ownerAmount.toString() : "");
            setRentAmount(billItemsData.rentAmount ? billItemsData.rentAmount.toString() : "");
            setClosedUnitAmount(billItemsData.closedUnitAmount ? billItemsData.closedUnitAmount.toString() : "");
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
              query(ledgerGroupsRef, 
                where("name", "in", [
                    "Indirect Income", 
                    "Current Liabilities",
                    "Reserve and Surplus",
                    "Deposit",
                    "Direct Income",
                    "Capital Account",
                    "Account Payable",
                    "Provision",
                    "Share Capital",
                    "Sundry Creditors",
                    "Suspense Account",
                ]))
            );
            const fromAccounts = fromQuerySnapshot.docs
              .map((doc) => doc.data().accounts || [])
              .flat()
              .filter((account) => account.trim() !== "")
              .sort((a, b) => a.localeCompare(b)); // Sort alphabetically
            setAccountFromOptions(fromAccounts);
        } catch (error) {
            console.error("Error fetching account options:", error);
            Alert.alert("Error", "Failed to fetch account options.");
          }
    };


    fetchBillItemsDetails();
    fetchAccountOptions();
  }, [params?.id]);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const saveItem = async () => {
    const updatedLedgerAccount = `${ledgerAccount} Receivables`;
    const newBillItem = {
      itemName,
      notes,
      type,
      ownerAmount: parseFloat(ownerAmount) || 0,
      rentAmount: parseFloat(rentAmount) || 0,
      closedUnitAmount: parseFloat(closedUnitAmount) || 0,
      updatedAt: new Date().toISOString(),
      ledgerAccount: ledgerAccount || "",
      updatedLedgerAccount, // Add updatedLedgerAccount here
    };

    try {
      if (isEditMode) {
        if (!ledgerAccount) {
            Alert.alert("Update Bill Item ", "Please Select Ledger Account.");
            return;
        }
        

        // Fetch existing items from AsyncStorage
            const existingItemsString = await AsyncStorage.getItem("@createdBillItem");
            const existingItems = existingItemsString ? JSON.parse(existingItemsString) : [];

        // Ensure the existing data is an array
            if (!Array.isArray(existingItems)) {
            throw new Error("Corrupted data in AsyncStorage.");
            }

            // Append the new item
            const updatedBillItem = { ...newBillItem, id: `${Date.now()}-${Math.random()}` };
            const updatedItems = [...existingItems, updatedBillItem];

            // Save back to AsyncStorage
            await AsyncStorage.setItem("@createdBillItem", JSON.stringify(updatedItems));
        


        Alert.alert("Success", "Bill item updated successfully!", [
          { text: "OK", onPress: () => router.push({
            pathname: "/CreateSpecialBill", // Adjust this path based on your routing structure
            params: {
                id: params.id, // Pass the document ID
                ...newBillItem, // Pass the full item data
              },
          }) },
        ]);
        
      } else {
        await addDoc(collection(db, "billItems"), {
          ...newBillItem,
          createdAt: new Date().toISOString(),
        });
        Alert.alert("Success", "Bill item added successfully!", [
          { text: "OK", onPress: () => router.replace("/Billitems") },
        ]);
      }
    } catch (error) {
      console.error("Error saving/updating document: ", error);
      Alert.alert("Error", "Failed to save or update bill item.");
    }
  };


  return (
    <Provider>
      <ScrollView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.form}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TextInput
            label="Item Name"
            value={itemName}
            onChangeText={setItemName}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            style={styles.input}
            mode="outlined"
            multiline
          />
          {isEditMode && (
            <Menu
            visible={menuFromVisible}
            onDismiss={() => setMenuFromVisible(false)}
            anchor={
              <TextInput
                label="Add ledger Account"
                value={ledgerAccount}
                right={<TextInput.Icon icon="chevron-down" onPress={() => {setMenuFromVisible(true)}} />}
                editable={false}
                mode="outlined"
                style={styles.input}
              />
            }
          >
            {accountFromOptions.map((option, index) => (
              <Menu.Item
                key={index}
                onPress={() => {
                  setLedgerAccount(option);
                  setMenuFromVisible(false);
                }}
                title={option}
              />
            ))}
          </Menu>
            
            )}
          <Menu
            visible={menuVisible}
            onDismiss={closeMenu}
            anchor={
              <TextInput
                label="Type"
                value={type}
                style={styles.input}
                mode="outlined"
                editable={false}
                right={<TextInput.Icon icon="chevron-down" onPress={openMenu} />}
              />
            }
          >
            <Menu.Item onPress={() => { setType("Fixed Price"); closeMenu(); }} title="Fixed Price" />
            <Menu.Item onPress={() => { setType("Based on Unit"); closeMenu(); }} title="Based on Unit" />
            <Menu.Item onPress={() => { setType("Based on Sq Feet"); closeMenu(); }} title="Based on Sq Feet" />
          </Menu>

          {type !== "Select" && (
            <View style={styles.fixedPriceInputs}>
              <TextInput
                label="For owner (self occupied)"
                value={ownerAmount}
                onChangeText={setOwnerAmount}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
              />
              <TextInput
                label="For rent"
                value={rentAmount}
                onChangeText={setRentAmount}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
              />
              <TextInput
                label="For closed unit"
                value={closedUnitAmount}
                onChangeText={setClosedUnitAmount}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
              />
            </View>
          )}

          <Button mode="contained" onPress={saveItem} style={styles.saveButton}>
            {isEditMode ? "Update" : "Save"}
          </Button>
        </KeyboardAvoidingView>
      </ScrollView>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  form: {
    flex: 1,
    padding: 20,
  },
  input: {
    marginBottom: 10,
  },
  fixedPriceInputs: {
    marginTop: 20,
  },
  saveButton: {
    marginTop: 20,
  },
});

export default AddSpecialBillItem;