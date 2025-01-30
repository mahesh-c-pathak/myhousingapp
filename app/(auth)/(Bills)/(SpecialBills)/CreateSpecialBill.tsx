import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Platform, ActivityIndicator, Alert, FlatList, TouchableOpacity } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../../../FirebaseConfig";
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppbarComponent from '../../../../components/AppbarComponent'; // Adjust the path as per your structure

import DropdownMultiSelect from "../../../../utils/DropdownMultiSelect"
import CustomButton from '../../../../components/CustomButton';
import CustomInput from '../../../../components/CustomInput';
import Dropdown from "../../../../utils/DropDown";
import PaymentDatePicker from "../../../../utils/paymentDate";
import { MaterialIcons } from '@expo/vector-icons'; // Or use another icon library if needed

import { useSociety } from "../../../../utils/SocietyContext"; 
import {fetchMembersUpdated} from "../../../../utils/fetchMembersUpdated";

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
  groupFrom?: string;
  updatedLedgerAccount?: string;
}

interface Member {
  label: string;
  value: string;
  floor: string;
}

const CreateSpecialBill = () => {
  const { societyName } = useSociety();

  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [balancesheet, setBalancesheet] = useState("");
  const [balancesheetVisible, setBalancesheetVisible] = useState(false);

  const balancesheets = ["Main Balance"];

  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date>(new Date());

  const [loading, setLoading] = useState(true);


  const [isAdvancePaymentSettelement, setisAdvancePaymentSettelement] = useState(false);


  const router = useRouter();
  const params = useLocalSearchParams();
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [billItems, setBillItems] = useState<BillItem[]>([]);

  const [fetchedmembers, setFetchedMembers] = useState<Member[]>([]);

  const [selectedfetchedMembers, setSelectedFetchedMembers] = useState<
    { floor: string; label: string; value: string }[]
  >([]);
  
 
  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true);
        const fetchedMembers = await fetchMembersUpdated(societyName);
        setFetchedMembers(fetchedMembers);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, []);

  const handleSelectionChange = (selectedValues: string[]) => {
    const updatedSelectedMembers = selectedValues.map((value) => {
      const selectedMember = fetchedmembers.find((member) => member.value === value);
      if (selectedMember) {
        return {
          floor: selectedMember.floor,
          label: selectedMember.label,
          value: selectedMember.value,
        };
      }
      return null;
    }).filter((member) => member !== null); // Filter out any null values

    setSelectedFetchedMembers(updatedSelectedMembers as { floor: string; label: string; value: string }[]);
  };

  const [formattedMembersData, setFormattedMembersData] = useState<string[]>([]);

  useEffect(()=>{
    console.log("formattedMembersData", formattedMembersData)
  },[formattedMembersData])

  useEffect(() => {
    // Format the data as desired
    // const newData = selectedfetchedMembers.map((item) => `${item.floor} ${item.label}`);
    const newData = selectedfetchedMembers.map(
      (item) => `${item.floor}-${item.label.split(" ").join("-")}`
    );
    setFormattedMembersData(newData);
  }, [selectedfetchedMembers]);

  const handleDateChange = (newDate: Date, type: string) => {
    if (type === "start") {
      setStartDate(newDate);
    } else if (type === "end") {
      setEndDate(newDate);
    } else if (type === "invoice") {
      setInvoiceDate(newDate);
    } else if (type === "due") {
      setDueDate(newDate);
    }
  };

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
      pathname: "/AddSpecialBillItem",
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
 if (selectedfetchedMembers.length === 0) {
  Alert.alert("Validation Error", "Please select at least one Member.");
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
   invoiceDate: invoiceDate.toISOString().split("T")[0],
   members:formattedMembersData.join(", "),
   items: JSON.stringify(billItems),
 };
 
 // Navigate to the next screen
 router.push({
   pathname: "/NextScreenSpecial",
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
    <View style={styles.container}>

    {/* Top Appbar */}
    <AppbarComponent
        title="Create Special Bill"
        source="Admin"
      />

      <FlatList
              data={[{}]} // Use a single-item list to render your UI
              renderItem={() => (
                <>
                
                
      {/* Bill Details Section */}
      <View style={styles.cardview}>
        <Text style={styles.sectionHeader}>Bill Details</Text>
        <Divider style={styles.divider} />
        {/* Custom Voucher No */}
        <View style={{ width: '100%' }}>
          <CustomInput
            label="Name"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Notes */}
        <View style={{ width: '100%' }}>
          <CustomInput
            label="Notes (optional)"
            value={note}
            onChangeText={setNote}
            multiline = {true}
          />
        </View>

        {/* Dropdown for Balancesheet */}
        <View style={styles.section}>
          <Text style={styles.label}>Balancesheet</Text>
          <Dropdown
            data={balancesheets.map((option) => ({
              label: option,
              value: option,
            }))}
            onChange={(selectedValue) => {
              setBalancesheet(selectedValue);
            }}
            placeholder="Select "
            initialValue={balancesheet}
          />
        </View>
        
      </View>

      {/* Bill Duration Section */}
      <View style={styles.cardview}>
        <Text style={styles.sectionHeader}>Bill Duration</Text>
        <Divider style={styles.divider} />

        {/* Date Pickers */}
        {/* From Date */}
        <View style={styles.section}>
                <Text style={styles.label}>From Date</Text>
                <PaymentDatePicker
                  initialDate={startDate}
                  onDateChange={(newDate) => handleDateChange(newDate, "start")}
                />
              </View>

              {/* To Date */}
        <View style={styles.section}>
          <Text style={styles.label}>To Date</Text>
          <PaymentDatePicker
            initialDate={endDate}
            onDateChange={(newDate) => handleDateChange(newDate, "end")}
          />
        </View>
            {/* Due Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Due Date</Text>
          <PaymentDatePicker
            initialDate={dueDate}
            onDateChange={(newDate) => handleDateChange(newDate, "due")}
          />
        </View>
            {/* Invoice Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Invoice Date</Text>
          <PaymentDatePicker
            initialDate={invoiceDate}
            onDateChange={(newDate) => handleDateChange(newDate, "Invoice")}
          />
        </View>
        
            {/* Select Members */}
        <DropdownMultiSelect
        data={fetchedmembers.map((member) => ({ label: member.label, value: member.value }))}
        onChange={handleSelectionChange}
        placeholder="Select Members"
        initialValues={[]} // Pre-select Option 1
      />

      </View>

      {/* Added Items to bill */}

      {isEditMode && (
        <View style={styles.cardview}>
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
                {item.updatedLedgerAccount && <Text style={styles.listItemText}>updated Ledger Account: {item.updatedLedgerAccount}</Text>}
                {item.groupFrom && <Text style={styles.listItemText}>groupFrom: {item.groupFrom}</Text>}
          
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

    <TouchableOpacity
     onPress={() => {
      if (!balancesheet) {
        Alert.alert('Generate Bill', 'Select Balancesheet');
      } else {
        // Navigate to the Items Page and pass balancesheet as a parameter
        router.push({
          pathname: '/specialBillitems', // Adjust this path based on your routing structure
          params: { balancesheet }, // Pass the balancesheet value
        });
      }
    }}
     style={styles.addButtonNew}>
      <View style={styles.buttonContent}>
        <MaterialIcons name="add-circle-outline" size={24} color="#000" />
        <Text style={styles.addButtonText}>Add Bill Item</Text>
      </View>
    </TouchableOpacity>


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
      </>
              )}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.scrollContainer}
            />

    </View>


    
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF",},
  sectiond: {
    marginBottom: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 15,
    elevation: 2,
  },
  cardview: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    elevation: 4, // For shadow on Android
    shadowColor: "#000", // For shadow on iOS
    shadowOffset: { width: 0, height: 2 }, // For shadow on iOS
    shadowOpacity: 0.1, // For shadow on iOS
    shadowRadius: 4, // For shadow on iOS
    borderWidth: 1, // Optional for outline
    borderColor: "#e0e0e0", // Optional for outline
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
  scrollContainer: { padding: 16 },
  section: { marginBottom: 10 },
  
  
  addButtonNew: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    elevation: 4, // For shadow (Android)
    shadowColor: '#000', // For shadow (iOS)
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
});

export default CreateSpecialBill;



 
