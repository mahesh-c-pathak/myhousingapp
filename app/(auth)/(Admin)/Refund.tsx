import { StyleSheet,  View, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native'
import React, { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams, useNavigation, Stack } from 'expo-router';
import { Appbar, Button, Card, Text, TouchableRipple, Avatar, Menu, Divider } from "react-native-paper";
import { db } from "../../../FirebaseConfig";
import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, setDoc } from "firebase/firestore";
// import { Dropdown } from 'react-native-paper-dropdown';
import Dropdown from "../../../utils/DropDown";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useSociety } from "../../../utils/SocietyContext";
import { generateVoucherNumber } from "../../../utils/generateVoucherNumber";
import { updateLedger } from "../../../utils/updateLedger";


const Refund = () => {
  const router = useRouter();
  const { societyName } = useSociety();

  const params = useLocalSearchParams();
  const wing = params.wing as string;
  const floorName = params.floorName as string;
  const flatNumber = params.flatNumber as string;

  // State to manage editable amount and note input
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [ledgerAccount, setledgerAccount] = useState<any>('');
  const [accountFromOptions, setAccountFromOptions] = useState<{ label: string; value: string }[]>([]);

  

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
      const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (selectedDate) {
          setPaymentDate(selectedDate);
          setFormattedDate(formatDate(selectedDate));
        }
        setShowDatePicker(false);
      };


  // Example useEffect to fetch and format options
      useEffect(() => {
        const fetchAccountOptions = async () => {
          try {
            const ledgerGroupsRef = collection(db, 'ledgerGroups');
  
            const fromQuerySnapshot = await getDocs(
              query(ledgerGroupsRef, where('name', 'in', ['Bank Accounts', 'Cash in Hand']))
            );
  
            const fromAccounts = fromQuerySnapshot.docs
              .map((doc) => doc.data().accounts || [])
              .flat()
              .filter((account) => account.trim() !== '')
              .map((account) => ({ label: account, value: account })); // Format for Dropdown
  
            setAccountFromOptions(fromAccounts);
          } catch (error) {
            console.error('Error fetching account options:', error);
            Alert.alert('Error', 'Failed to fetch account options.');
          }
        };
  
        fetchAccountOptions();
      }, []);


  const handleSave = async () => {
    try { 
      // Check if a ledger account is selected
        if (!ledgerAccount) {
          Alert.alert("Error", "Please select a ledger account.");
          return;
        }     
      // Path to the relevant society document
      const docRef = doc(db, "Societies", societyName);
      const societyDocSnap = await getDoc(docRef);

      if (societyDocSnap.exists()) {
        const societyData = societyDocSnap.data();
        const societyWings = societyData.wings;

        // Locate the specific flat data
        const relevantWing = societyWings?.[wing]?.floorData?.[floorName]?.[flatNumber];
        // generate Voucher number
        const voucherNumber = await generateVoucherNumber();

        if (relevantWing) {
          // Reduce Current Balance
          const receiptValue = parseFloat(amount as string);
          if (relevantWing.currentBalance >= receiptValue) {
            relevantWing.currentBalance = 
              (relevantWing.currentBalance) - receiptValue;
          } else {
            Alert.alert("Refund", "User don't have enough balance");
            return
          }

          // Append the new Refund entry while preserving existing data
          const newRefundEntry = {
            amount: parseFloat(amount as string), // Save amount as a number
            paymentDate: formattedDate, // Save formatted date
            ledgerAccount,
            note,
            voucherNumber
          };

          const updatedFlatData = {
            ...relevantWing, // Preserve all existing data

            Refund: [
              ...(relevantWing.Refund || []), // Preserve existing Refund array
              newRefundEntry, // Add the new entry
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

          const updatePromises = [];
          
          const LedgerUpdate1 = await updateLedger(ledgerAccount, parseFloat(amount as string), "Subtract" ); // Update Ledger
          const LedgerUpdate2 = await updateLedger("Members Advanced", parseFloat(amount as string), "Subtract" ); // Update Ledger

          updatePromises.push(
            LedgerUpdate1, LedgerUpdate2
          );

          // Wait for all updates to complete
          await Promise.all(updatePromises);

          Alert.alert(
            "Refund",
            "Refund entry added successfully",
            [
              {
                text: "OK",
                onPress: () => {
                  // Navigate to FlatCollectionSummary route
                  router.replace({
                    pathname: "/FlatCollectionSummary",
                    params: {
                      wing: wing,
                      floorName: floorName,
                      flatNumber: flatNumber,
                    },
                  });
                },
              },
            ],
            { cancelable: false } // Ensure user cannot dismiss the alert without pressing OK
          );

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
      {/* Remove Stack Header */}
        <Stack.Screen options={
            {headerShown:false}
        } />

      {/* Appbar Header */}
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} color="#fff" />
        <Appbar.Content title="Refund" titleStyle={styles.titleStyle} /> 
      </Appbar.Header>

      {/* Profile Header */}
      <View style={styles.profileContainer}>
          <Avatar.Text size={44} label="XD" style={styles.avatar} />
          <View style={styles.textContainer}>
              <Text style={styles.profileText}>{wing} {flatNumber}</Text>
          </View>
      </View>

      <ScrollView  style={styles.formContainer}>

      <Text style={styles.redlabel}>Refund option is only available for users who already has advance balance</Text>

        {/* Amount Input */}
        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          value={amount.toString()}
          keyboardType="numeric"
          onChangeText={(text) => setAmount(text)}
        />

        {/* Note Input */}
        <Text style={styles.label}>Note</Text>
        <TextInput
          style={[styles.input, styles.noteInput]}
          value={note}
          placeholder="Enter a note (optional)"
          onChangeText={(text) => setNote(text)}
          multiline
        />

        {/* Ledger Account */}
        <View style={styles.section}>
          <Text style={styles.label}>Ledger Account</Text>
          <Dropdown
            data={accountFromOptions}
            onChange={setledgerAccount}
            placeholder="Select Account"
          />
        </View>

            {/* Payment Date */}
          <View style={styles.section}> 
            <Text style={styles.label}>Payment Date</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={styles.dateInputContainer}
            >
              <TextInput
                style={styles.dateInput}
                value={formattedDate}
                editable={false}
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
          </View>
      
      </ScrollView> 

      {/* Accept Button */}
        <Button
          mode="contained"
          style={styles.saveButton}
          onPress={() => handleSave()}
        >
          Save
        </Button>



    </View>
  )
}

export default Refund

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { backgroundColor: "#6200ee" },
  titleStyle: { color: '#fff', fontSize: 18, fontWeight: 'bold',},
  profileContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, backgroundColor: "#6200ee", paddingBottom:10},
  profileText: { fontSize: 14, color: "white",},
  textContainer: {justifyContent: 'center',},
  avatar: { backgroundColor: '#6200ee', marginRight: 10, borderColor:'#fff', borderWidth:2},
  formContainer: { padding: 16 },
  redlabel: { fontSize: 14, marginBottom: 16, color:"red" },
  label: { fontSize: 14, fontWeight: "bold", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  noteInput: { height: 80, textAlignVertical: "top" },
  dropdown: {backgroundColor: '#6200ee'},
  dateInputContainer: { flexDirection: "row", alignItems: "center", marginVertical: 8, },
  dateInput: { flex: 1, borderWidth: 1, paddingVertical: 8, borderColor: "#ddd", borderRadius: 4,padding: 10,fontSize: 16, },
  calendarIcon: { fontSize: 20, marginLeft: 8 },
  section: {
    marginBottom: 16, // Adds consistent spacing between sections
  },
  saveButton: { backgroundColor: "#6200ee", marginTop: 10, marginHorizontal:20, },
})