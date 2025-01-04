import React, { useState, useEffect } from "react";
import {View,Image,StyleSheet,Modal,TouchableOpacity,Text,Alert} from "react-native";
import { Appbar, Button, Switch, Menu, TextInput } from "react-native-paper";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import Dropdown from "../../../utils/DropDown";
import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../../../FirebaseConfig";
import { useSociety } from "../../../utils/SocietyContext";

const paymentRecipt = () => {
  const router = useRouter();
  const { societyName } = useSociety();
  const { wing,floorName,flatNumber, amount, paymentDate, transactionId, paymentMode, notes, receiptImage, selectedIds } = useLocalSearchParams();

  // Ensure these are strings
    const formattedWing = String(wing);
    const formattedFloorName = String(floorName);
    const formattedFlatNumber = String(flatNumber);
    const formattedAmount = String(amount);
    const formattedPaymentDate = String(paymentDate);
    const formattedTransactionId = String(transactionId);
    const formattedPaymentMode = String(paymentMode);
    const formattednotes = String(notes);

  
  const [isModalVisible, setIsModalVisible] = useState(false); // Modal state
  const [reason, setReason] = useState(""); // Reason for rejection
  const [note, setNote] = useState(""); // Optional note
  // Toggle modal visibility
  const toggleModal = () => setIsModalVisible(!isModalVisible);

  const reasonOptions = [
    { label: "Already Accepted Receipt", value: "Already Accepted Receipt" },
    { label: "Older Receipt", value: "Older Receipt" },
    { label: "Screenshot Not clear", value: "Screenshot Not clear" },
    { label: "Other", value: "Other" },
  ]

  const [reasonFromOptions, setReasonFromOptions] = useState<{ label: string; value: string }[]>(reasonOptions);
 
  
  // Format date as YYYY-MM-DD
  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  
  const [formattedDate, setFormattedDate] = useState<any>(formatDate(new Date(paymentDate as string)));

  const handleModalReject = async () => {
    try {
            // Check if a Reason to reject is selected
            if (!reason) {
              Alert.alert("Error", "Please select a Reason.");
              return;
            }

            const societiesDocRef = doc(db, "Societies", societyName as string);
            const societyDocSnap = await getDoc(societiesDocRef);
        
            if (!societyDocSnap.exists()) {
              console.error("Societies document does not exist");
              Alert.alert("Error", "Society document not found.");
              return;
            }

            const societyData = societyDocSnap.data();

            const relevantFlatData =
              societyData?.wings?.[formattedWing]?.floorData?.[formattedFloorName]?.[formattedFlatNumber];

            if (relevantFlatData) {
                        // Find and update the specific uncleared balance entry
                        const updatedUnclearedBalance = await Promise.all(
                          (relevantFlatData.unclearedBalance || []).map(async (entry: any) => {
                            if (entry.transactionId === transactionId) {
                              // Return the updated entry
                              return {
                                ...entry,
                                
                                status: "Rejected",
                                reason,
                                note,
                              };
                            }
                            return entry; // Keep other entries unchanged
                          })
                        );
               // Update the specific flat's data with the modified unclearedBalance array
                        const updatedFlatData = {
                          ...relevantFlatData,
                          unclearedBalance: updatedUnclearedBalance,
                        };
                  
                        // Construct the updated society structure
                        const updatedSocietyData = {
                          ...societyData,
                          wings: {
                            ...societyData.wings,
                            [formattedWing]: {
                              ...societyData.wings[formattedWing],
                              floorData: {
                                ...societyData.wings[formattedWing].floorData,
                                [formattedFloorName]: {
                                  ...societyData.wings[formattedWing].floorData[formattedFloorName],
                                  [formattedFlatNumber]: updatedFlatData, // Update only this flat
                                },
                              },
                            },
                          },
                        };
                  
                        // Save the updated data back to Firestore
                        await setDoc(societiesDocRef, updatedSocietyData);
                        
                  
                        Alert.alert("Success", "Payment Request Rejected successfully.");
                        router.push(
                          {
                            pathname: "/FlatCollectionSummary",
                            params: {
                              wing: formattedWing,
                              floorName: formattedFloorName,
                              flatNumber: formattedFlatNumber,
                            },
                          }
                        );
                      } else {
                        console.error("Relevant flat data not found.");
                        Alert.alert("Error", "Flat data not found.");
                      }
            
            // Handle rejection logic here
          // console.log("Reason:", reason, "Note:", note);
          toggleModal(); // Close modal
    } catch (error) {
            console.error("Failed to reject receipt:", error);
            Alert.alert("Error", "Failed to reject receipt. Please try again.");
          }
    
  }
  

  return (
    <View style={styles.container}>
      {/* Remove Stack Header */}
      <Stack.Screen options={{ headerShown: false }} />
      {/* Appbar Header */}
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Payment Receipt" />
      </Appbar.Header>

      {/* Payment Details */}
      <View style={styles.card}>
        <DetailItem label="Flat Number:" value={formattedFlatNumber} />
        <DetailItem label="Transaction Id:" value={formattedTransactionId} />
        <DetailItem label="Payment Date:" value={formattedDate} />
        <DetailItem label="Amount:" value={`₹ ${parseFloat(formattedAmount).toFixed(2)}`} />
        <DetailItem label="Payment Method:" value={formattedPaymentMode || "N/A"} />
        <DetailItem label="Receipt Notes:" value={formattednotes || ""} />
      </View>

      {/* Receipt Image 
      {receiptImage && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: receiptImage }} style={styles.receiptImage} />
        </View>
      )}
        */}

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <Button mode="contained" style={styles.acceptButton} onPress={() => {
          router.push({
            pathname: "/AcceptReceipt",
            params: {
              wing: formattedWing,
              floorName: formattedFloorName,
              flatNumber: formattedFlatNumber,
              amount: formattedAmount,
              paymentDate: formattedPaymentDate,
              paymentMode: formattedPaymentMode,
              transactionId: formattedTransactionId,
              selectedIds,
              // Add other necessary params if available
          },
            
        });
        }}>
          Accept
        </Button>
        
        <Button mode="contained" style={styles.rejectButton}
         onPress={toggleModal}
         >
          Reject
        </Button>
      </View>

      

      


      {/* Modal */}
      <Modal visible={isModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Receipt</Text>
              <TouchableOpacity onPress={toggleModal}>
                <Text style={{ fontSize: 20, fontWeight: "bold" }}>×</Text>
              </TouchableOpacity>
            </View>
            
            {/* Reason to Reject */}
            <View style={styles.section}>
                <Text style={styles.label}>Reason For</Text>
                <Dropdown
                  data={reasonFromOptions}
                  onChange={setReason}
                  placeholder="Select Reason"
                />
            </View>
            <Text style={styles.label}>Note (optional)</Text>
            <TextInput
              mode="outlined"
              placeholder="Enter a note"
              value={note}
              onChangeText={setNote}
              style={[styles.input, styles.noteInput]}
              multiline
            />
            <Button
              mode="contained"
              style={styles.rejectButton}
              onPress={() => {handleModalReject()}}
            >
              Reject
            </Button>
          </View>
        </View>
      </Modal>

      

      
    </View>
  );
};

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { backgroundColor: "#2196F3" },
  card: {
    backgroundColor: "#FFF",
    elevation: 3,
    borderRadius: 8,
    padding: 16,
    marginVertical: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  detailLabel: { fontWeight: "bold", color: "#333" },
  detailValue: { color: "#555" },
  imageContainer: { alignItems: "center", marginVertical: 10 },
  receiptImage: { width: 150, height: 150, borderRadius: 8 },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  acceptButton: { backgroundColor: "#5E35B1" },
  rejectButton: { backgroundColor: "#D32F2F" },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: { backgroundColor: "#FFF", width: "90%", borderRadius: 8, padding: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 4,
    padding: 10,
    marginVertical: 8,
  },
  noteInput: { height: 80, textAlignVertical: "top" },
  dateInputContainer: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  dateInput: { flex: 1, borderBottomWidth: 1, paddingVertical: 8 },
  calendarIcon: { fontSize: 20, marginLeft: 8 },
  switchContainer: { flexDirection: "row", justifyContent: "space-between", marginVertical: 10 },
  modalAcceptButton: { backgroundColor: "#4CAF50", marginTop: 10 },
  label: { fontSize: 14, fontWeight: "bold", marginBottom: 6 },
  section: {
    marginBottom: 16, // Adds consistent spacing between sections
  },
});

export default paymentRecipt;
