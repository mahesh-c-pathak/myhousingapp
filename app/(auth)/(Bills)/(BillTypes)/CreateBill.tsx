import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Platform, ActivityIndicator, Alert, FlatList } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MultiSelectDropdown } from "react-native-paper-dropdown";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../FirebaseConfig";
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  TextInput,
  Button,
  Switch,
  Checkbox,
  Text,
  Divider,
  Menu,
  List,
  IconButton,
} from 'react-native-paper';

interface Wing {
  label: string;
  value: string;
}

// Define TypeScript type for a bill item
interface BillItem {
  id: string;
  itemName: string;
  notes?: string;
  type?: string;
  ownerAmount?: number;
  rentAmount?: number;
  closedUnitAmount?: number;
  ledgerAccount?: string;
}

const CreateBill = () => {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [balancesheet, setBalancesheet] = useState("");
  const [balancesheetVisible, setBalancesheetVisible] = useState(false);

  const balancesheets = ["Main Balance"];

  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date>(new Date());

  const [wings, setWings] = useState<Wing[]>([]);
  const [selectedWings, setSelectedWings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdvancePaymentSettelement, setisAdvancePaymentSettelement] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState<{
    visible: boolean;
    type: "start" | "end" | "invoice" | "due";
  }>({
    visible: false,
    type: "start",
  });

  const router = useRouter();
  const params = useLocalSearchParams();
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [billItems, setBillItems] = useState<BillItem[]>([]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker({ ...showDatePicker, visible: false });

    if (selectedDate) {
      switch (showDatePicker.type) {
        case "start":
          setStartDate(selectedDate);
          break;
        case "end":
          setEndDate(selectedDate);
          break;
        case "invoice":
          setInvoiceDate(selectedDate);
          break;
        case "due":
          setDueDate(selectedDate);
          break;
      }
    }
  };

  useEffect(() => {
    const fetchWings = async () => {
      setLoading(true);
      try {
        // Reference the "Happy Home" document in the "Societies" collection
        const docRef = doc(db, "Societies", "New Home Test");
        const docSnapshot = await getDoc(docRef);

        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          if (data.wings && typeof data.wings === "object") {
            // Extract keys (e.g., "Wing-A", "Wing-B") as wing names
            const wingOptions = Object.keys(data.wings).map((key) => ({
              label: key,
              value: key,
            }));
            setWings(wingOptions);
          }
        } else {
          console.error("Document not found!");
        }
      } catch (error) {
        console.error("Error fetching wings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWings();
  }, []);

  // Fetch Bill Items from Firestore
  useEffect(() => {
    if (params?.id) {
        setIsEditMode(true)};
        const fetchBillItems = async () => {
            try {
              const storedItem = await AsyncStorage.getItem("@createdBillItem");
              if (storedItem) {
                const parsedItems: BillItem[] = JSON.parse(storedItem);
                const uniqueItems = parsedItems.filter(
                  (newItem) => !billItems.some((existingItem) => existingItem.id === newItem.id)
                );
                setBillItems((prevItems) => [...prevItems, ...uniqueItems]);
              }
            } catch (error) {
              console.error("Error fetching bill items:", error);
              Alert.alert("Error", "Failed to load bill items.");
            }
          };

    fetchBillItems();
  }, [params?.id]);

  // Save Bill Items to AsyncStorage
  const saveBillItems = async (items: BillItem[]) => {
    try {
      await AsyncStorage.setItem("@createdBillItem", JSON.stringify(items));
    } catch (error) {
      console.error("Error saving bill items:", error);
      Alert.alert("Error", "Failed to save bill items.");
    }
  };
 
  // Handle Edit Action
  const handleEdit = (item: BillItem) => {
    router.push({
      pathname: "/AddBillItem",
      params: { itemId: item.id }, // Pass item ID for editing
    });
  };

  // Handle Delete Action
  const handleDelete = (id: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this item?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updatedItems = billItems.filter((item) => item.id !== id);
          setBillItems(updatedItems);
          await saveBillItems(updatedItems);
        },
      },
    ]);
  };

  const navigateToNextScreen = () => {
    // Validation logic
 if (!name.trim()) {
   Alert.alert("Validation Error", "Please enter a Name.");
   return;
 }
 if (!startDate) {
   Alert.alert("Validation Error", "Please select a Start Date.");
   return;
 }
 if (!endDate) {
   Alert.alert("Validation Error", "Please select a endDate.");
   return;
 }
 if (!dueDate) {
   Alert.alert("Validation Error", "Please select a dueDate.");
   return;
 }
 if (selectedWings.length === 0) {
  Alert.alert("Validation Error", "Please select at least one Wing.");
  return;
  }
 if (billItems.length === 0) {
   Alert.alert("Validation Error", "Please add at least one Bill Item.");
   return;
 }

 // Construct parameters for navigation
 const params = {
   name,
   note,
   balancesheet,
   startDate: startDate.toISOString().split("T")[0],
   endDate: endDate.toISOString().split("T")[0],
   dueDate: dueDate.toISOString().split("T")[0],
   wings: selectedWings.join(", "),
   items: JSON.stringify(billItems),
   isAdvancePaymentSettelement: isAdvancePaymentSettelement.toString(), // Include the new parameter, Convert to string 
 };

 // Navigate to the next screen
 router.push({
   pathname: "/NextScreen",
   params,
 });

 };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Bill Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Bill Details</Text>
        <Divider style={styles.divider} />
        <TextInput
          label="Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Note (optional)"
          value={note}
          onChangeText={setNote}
          mode="outlined"
          multiline
          style={styles.input}
        />
        {/* Dropdown for Balancesheet */}
        <View style={styles.dropdownContainer}>
          <Menu
            visible={balancesheetVisible}
            onDismiss={() => setBalancesheetVisible(false)}
            anchor={
              <TextInput
                label="Select Balancesheet"
                value={balancesheet || "Select"}
                editable={false}
                right={<TextInput.Icon icon="chevron-down" onPress={() => setBalancesheetVisible(true)} />}
                mode="outlined"
                style={styles.input}
              />
            }
          >
            {balancesheets.map((item, index) => (
              <Menu.Item
                key={index}
                onPress={() => {
                  setBalancesheet(item);
                  setBalancesheetVisible(false);
                }}
                title={item}
              />
            ))}
          </Menu>
        </View>
      </View>

      {/* Bill Duration Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Bill Duration</Text>
        <Divider style={styles.divider} />

        {/* Date Pickers */}
        <TextInput
          label="Start From"
          value={startDate.toISOString().split("T")[0]}
          style={styles.input}
          mode="outlined"
          editable={false}
          placeholder="YYYY-MM-DD"
          right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker({ visible: true, type: "start" })} />}
        />
        <TextInput
          label="End On"
          value={endDate.toISOString().split("T")[0]}
          style={styles.input}
          mode="outlined"
          editable={false}
          right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker({ visible: true, type: "end" })} />}
        />
        <TextInput
          label="Due Date"
          value={dueDate.toISOString().split("T")[0]}
          style={styles.input}
          mode="outlined"
          editable={false}
          right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker({ visible: true, type: "due" })} />}
        />
        <TextInput
          label="Invoice Date"
          value={invoiceDate.toISOString().split("T")[0]}
          style={styles.input}
          mode="outlined"
          editable={false}
          right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker({ visible: true, type: "invoice" })} />}
        />

        {/* Date Picker Modal */}
        {showDatePicker.visible && (
          <DateTimePicker
            value={
              showDatePicker.type === "start"
                ? startDate
                : showDatePicker.type === "end"
                ? endDate
                : showDatePicker.type === "invoice"
                ? invoiceDate
                : dueDate
            }
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleDateChange}
          />
        )}
        <MultiSelectDropdown
          label="Wings"
          placeholder="Select Wings"
          options={wings}
          value={selectedWings}
          onSelect={setSelectedWings}
          mode="outlined"
        />
      </View>

      {/* Added Items to bill */}

      {isEditMode && (
  <View style={styles.section}>
    <Text style={styles.sectionHeader}>Bill Items</Text>
    <FlatList
      data={billItems}
      contentContainerStyle={{ paddingBottom: 100 }}
      keyExtractor={(item) => item.id}
      scrollEnabled={false} // Disable scrolling
      renderItem={({ item }) => (
        <View style={styles.listItem}>
          <View style={styles.listItemContent}>
          <Text style={styles.listItemText}>Item Name: {item.itemName}</Text>
          {item.notes && <Text style={styles.listItemText}>Notes: {item.notes}</Text>}
          {item.type && <Text style={styles.listItemText}>Type: {item.type}</Text>}
          {item.ownerAmount && <Text style={styles.listItemText}>Owner Amount: {item.ownerAmount}</Text>}
          {item.rentAmount && <Text style={styles.listItemText}>Rent Amount: {item.rentAmount}</Text>}
          {item.closedUnitAmount && <Text style={styles.listItemText}>Closed Unit Amount: {item.closedUnitAmount}</Text>}
          
          </View>
          <View style={styles.listItemActions}>
                {/* Edit Button */}
                <IconButton
                  icon="pencil"
                  size={20}
                  onPress={() => handleEdit(item)}
                  style={styles.actionButton}
                />
                {/* Delete Button */}
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={() => handleDelete(item.id)}
                  style={styles.actionButton}
                />
              </View>
        </View>
      )}
      ListEmptyComponent={<Text>No items available</Text>}
    />
  </View>
)}

      {/* Buttons */}
      <Button
      mode="contained"
      onPress={() => {
        if (!balancesheet) {
          Alert.alert('Generate Bill', 'Select Balancesheet');
        } else {
          // Navigate to the Items Page and pass balancesheet as a parameter
          router.push({
            pathname: '/Billitems', // Adjust this path based on your routing structure
            params: { balancesheet }, // Pass the balancesheet value
          });
        }
      }}
      style={styles.addButton}
    >
      Add Bill Item
    </Button>
    {/* switch - for Advance Payment Settelment */}
      <View style={styles.switchContainer}>
          <Text style={styles.label}>Advance Payment Settelement?</Text>
          <Switch
            value={isAdvancePaymentSettelement}
            onValueChange={() => setisAdvancePaymentSettelement(!isAdvancePaymentSettelement)}
            color="#4CAF50"
          />
      </View>

    <Button mode="contained" onPress={navigateToNextScreen}>
        Next
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 15,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  divider: {
    marginBottom: 10,
  },
  input: {
    marginBottom: 15,
  },
  dropdownContainer: {
    marginBottom: 15,
  },
  addButton: {
    marginTop: 10,
    marginBottom: 15,
  },
  listItem: {
    position: "relative",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "#ffffff",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    elevation: 2,
  },
  listItemText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  listItemContent: {
    flex: 1,
  },
  listItemActions: {
    position: "absolute",
    top: 10, // Distance from the top of the card
    right: 10, // Distance from the right edge
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    marginLeft: 8, // Space between icons
  },
  switchContainer: { flexDirection: "row", justifyContent: "space-between", marginVertical: 10 },
  label: { fontSize: 14, fontWeight: "bold", marginBottom: 6 },
});

export default CreateBill;
