import React, { useState, useEffect } from "react";
import {View, StyleSheet, TouchableOpacity, Text, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Appbar } from "react-native-paper";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import {
  Menu,
  TextInput 
} from 'react-native-paper';
import { collection, getDocs, doc, getDoc, setDoc  } from "firebase/firestore";
import { db } from "../../../../FirebaseConfig";
import { useSociety } from "../../../../utils/SocietyContext";
import { generateTransactionId } from "../../../../utils/generateTransactionId";


const PaymentModeScreen = () => {
  const societyContext = useSociety();
  // Determine which context to use based on source
  const societyName =  societyContext.societyName;
  const wing =  societyContext.wing;
  const flatNumber =  societyContext.flatNumber;
  const floorName = societyContext.floorName;

  const { paymentMode, amount, selectedIds } = useLocalSearchParams();
  const router = useRouter();
  const [balancesheetVisible, setbalancesheetVisible] = useState(false);
  const [balancesheet, setBalancesheet] = useState('');
  const paymentMethods = [ 'Google Pay', 'Phone pe' , 'UPI', 'Other'];


  // Function to format date as "YYYY-MM-DD"
  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  // State for Payment Date
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [formattedDate, setFormattedDate] = useState(formatDate(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);

  // State for Cheque Inputs
  const [bankName, setBankName] = useState("");
  const [chequeNo, setChequeNo] = useState("");

  // Handle Date Change
  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (selectedDate) {
      setPaymentDate(selectedDate);
      setFormattedDate(formatDate(selectedDate));
    }
    setShowDatePicker(false);
  };

  // Handle save
   
  const handleSave = async () => {
    try {
      // Parse selectedIds from JSON string to array
      const parsedSelectedIds = selectedIds ? JSON.parse(selectedIds as string) : [];
      // Path to the relevant society document
      const docRef = doc(db, "Societies", societyName);
      const societyDocSnap = await getDoc(docRef);

      if (societyDocSnap.exists()) {
        const societyData = societyDocSnap.data();
        const societyWings = societyData.wings;

        // Locate the specific flat data
        const relevantWing = societyWings?.[wing]?.floorData?.[floorName]?.[flatNumber];
        // generate Transaction Id
        const transactionId = generateTransactionId();

        if (relevantWing) {
          // Append the new uncleared balance entry while preserving existing data
          const newUnclearedBalanceEntry = {
            amount: parseFloat(amount as string), // Save amount as a number
            paymentDate: formattedDate, // Save formatted date
            paymentMode: paymentMode || "Other", // Add payment mode
            bankName: bankName || null, // Include bank name if applicable
            chequeNo: chequeNo || null, // Include cheque number if applicable
            transactionId,
            status:"Uncleared",
            selectedIds: parsedSelectedIds, // Include parsed selected IDs
          };

          const updatedFlatData = {
            ...relevantWing, // Preserve all existing data
            unclearedBalance: [
              ...(relevantWing.unclearedBalance || []), // Preserve existing unclearedBalance array
              newUnclearedBalanceEntry, // Add the new entry
            ],
          };

          // Update only the specific flat's data
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
                    [flatNumber]: updatedFlatData, // Update this specific flat
                  },
                },
              },
            },
          };

          // Save the updated society data back to Firestore
          await setDoc(docRef, updatedSocietyData);

          Alert.alert("Cash", "Your Payment request has been successfully submited to Admin. You will get notification after verification");
          
          // Replace the current route with /(myBill) to prevent back navigation
          router.replace("/(myBill)");
        } else {
          Alert.alert("Error", "Flat data not found.");
        }
      } else {
        console.error("Society document does not exist.");
        Alert.alert("Error", "Society document not found.");
      }
    } catch (error) {
      console.error("Error saving uncleared balance:", error);
      Alert.alert("Error", "Failed to save payment. Please try again.");
    }
  };


  return (
    <View style={styles.container}>
      {/* Appbar */}
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={paymentMode} />
      </Appbar.Header>

      {/* Payment Date Input */}
      <View style={styles.formContainer}>
        <Text style={styles.label}>Payment Date</Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={styles.dateInputContainer}
        >
          <TextInput
            style={styles.dateInput}
            value={formattedDate}
            editable={false}
            mode="outlined"
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

        {/* Conditional UI based on Payment Mode */}
        {paymentMode === "Upload Transaction Receipt" && (
          <>
            <Text style={styles.label}>Payment Method</Text>
            {/* Dropdown for Balancesheet */}
        <View style={styles.dropdownContainer}>
          <Menu
            visible={balancesheetVisible}
            onDismiss={() => setbalancesheetVisible(false)}
            anchor={
                <TextInput
                    value={balancesheet || 'Select'}
                    editable={false}
                    right={<TextInput.Icon icon="chevron-down" onPress={() => setbalancesheetVisible(true)} />}
                    mode="outlined"
                    style={styles.input}
                />
              
            }
          >
            {paymentMethods.map((item, index) => (
              <Menu.Item
                key={index}
                onPress={() => {
                  setBalancesheet(item);
                  setbalancesheetVisible(false);
                }}
                title={item}
              />
            ))}
          </Menu>
        </View>
          </>
        )}

        {paymentMode === "Cheque" && (
          <>
            <Text style={styles.label}>Bank Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Bank Name"
              value={bankName}
              onChangeText={setBankName}
            />

            <Text style={styles.label}>Cheque No.</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Cheque Number"
              keyboardType="numeric"
              value={chequeNo}
              onChangeText={setChequeNo}
            />
          </>
        )}

        {/* Choose Image Button */}

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Choose Image</Text>
        </TouchableOpacity>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { backgroundColor: "#2196F3" },
  formContainer: { flex: 1, padding: 16 },
  label: { fontSize: 16, marginBottom: 8 },
  input: {
    borderColor: "#ccc",
    padding: 8,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#fff", // Match container background
    borderWidth: 0, // Remove border
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: { color: "#fff", fontSize: 16 },
  saveButton: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontSize: 16 },
  dropdownContainer: {
    marginBottom: 15,
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    backgroundColor: "#fff", // Match container background
    borderWidth: 0, // Remove border
    paddingVertical: 4, // Adjust padding for alignment
  },
  calendarIcon: {
    fontSize: 22, // Match size with TextInput
    color: "#aaa",
    marginLeft: 8, // Provide spacing
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 8, // Adjust horizontal padding
    marginBottom: 16,
    backgroundColor: "#fff", // Match container background
  },
  
});

export default PaymentModeScreen;
