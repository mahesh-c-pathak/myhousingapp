{/* update paid for section for bill amount and name */}

import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import React from "react";
import { Card, Avatar, Button, Divider, Appbar } from "react-native-paper";

const VoucherDetails = () => {
  const { wing,floor,flatNumber, type, amount, paymentDate, voucherNumber, paymentMode, transactionId } = useLocalSearchParams();
  //const parsedDetails = JSON.parse(voucherDetails); // Parse the stringified object
  const formattedvoucherNumber = voucherNumber as string;
  const formattedamount = amount as string;
 
  const router = useRouter();
  const _handleMore = () => console.log('Shown more');

  return (
    <View style={styles.container}>
        <Stack.Screen options={
      {headerShown:false}
    } />
    {/* Appbar Header */}
    <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => router.back()} color="#fff" />
        <Appbar.Content title={formattedvoucherNumber} titleStyle={styles.titleStyle} />
        <Appbar.Action icon="dots-vertical" onPress={_handleMore} color="#fff" />
      </Appbar.Header>

    <View style={styles.header}>

    <View style={styles.profileContainer}>
            <Avatar.Text size={44} label="XD" style={styles.avatar} />
            <View style={styles.textContainer}>
              <Text style={styles.profileText}>{wing} {flatNumber}</Text>
              <Text style={styles.profileText}>{wing} {flatNumber}</Text>
            </View>
          </View>
        </View>


      

      {/* Transaction Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.transactionText}>
          <Text style={styles.label}>Transaction ID: </Text>
          {transactionId}
        </Text>
        <Text style={styles.transactionText}>
          <Text style={styles.label}>Amount: </Text>
          <Text style={styles.amount}>₹ {parseFloat(formattedamount).toFixed(2)}</Text>
        </Text>
        <Text style={styles.transactionText}>
          <Text style={styles.label}>Payment Mode: </Text>
          {paymentMode}
        </Text>
        <Text style={styles.transactionText}>
          <Text style={styles.label}>Payment Date: </Text>
          {paymentDate}
        </Text>
        <Text style={styles.transactionText}>
          <Text style={styles.label}>Receiver Name: </Text>
          Mahesh Pathak
        </Text>
      </View>

      {/* Payments Section */}
        <Text style={styles.sectionTitle}>Payment For</Text>
        <View style={styles.paymentsContainer}>
       
        </View>

      {/* Balance Section */}
      <Card style={styles.balanceCard}>
        <Text style={styles.balanceText}>Current Balance: ₹ 5.00</Text>
      </Card>

      {/* Download Button */}
      <Button mode="contained" style={styles.downloadButton}>
        Download
      </Button>
    </View>
  );
};

export default VoucherDetails;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff"},
  headerCard: { backgroundColor: "#673AB7", padding: 16, borderRadius: 8 },
  headerContent: { flexDirection: "row", alignItems: "center" },
  
  flatText: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  nameText: { fontSize: 16, color: "#fff", marginTop: 4 },
  contactText: { fontSize: 14, color: "#EDE7F6", marginTop: 2 },
  infoContainer: { padding: 16 },
  transactionText: { fontSize: 14, marginBottom: 8, color: "#333" },
  label: { fontWeight: "bold" },
  amount: { color: "#4CAF50", fontWeight: "bold" },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginTop: 16, marginBottom: 8, color: "#333" },
  paymentsContainer: { padding: 16, backgroundColor: "#FAFAFA", borderRadius: 8 },
  paymentRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  paymentDescription: { fontSize: 14, color: "#333" },
  paymentAmountNegative: { fontSize: 14, color: "#F44336", fontWeight: "bold" },
  invoiceText: { fontSize: 12, color: "#757575", marginTop: 4 },
  divider: { marginVertical: 8 },
  balanceCard: { backgroundColor: "#E0E0E0", padding: 16, alignItems: "center", marginTop: 16 },
  balanceText: { fontSize: 16, fontWeight: "bold", color: "#333" },
  downloadButton: { marginTop: 16, backgroundColor: "#673AB7" },
  appbar: {
    backgroundColor: '#5e35b1', // Consistent background color
    elevation: 0, // Removes shadow
  },
  titleStyle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatar: {
    backgroundColor: '#7e57c2', // Match avatar background
    marginRight: 10,
  },
  textContainer: {
    justifyContent: 'center',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  profileText: {
    fontSize: 14,
    color: '#d1c4e9',
  },
  header: {
    backgroundColor: '#5e35b1',
    paddingHorizontal: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
});
