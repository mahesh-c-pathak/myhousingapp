import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Appbar, Text, Card } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";

const SelectPaymentMode = () => {
  const router = useRouter();
  const { amountPayable, selectedIds, selectedBills } = useLocalSearchParams();

  // Function to handle navigation to the payment mode screen
  const navigateToPaymentMode = (mode: string) => {
    router.push({
      pathname: "/[paymentmode]",
      params: { paymentMode: mode, amount:amountPayable, selectedIds, selectedBills },
    });
  };

  return (
    <View style={styles.container}>
      {/* Appbar */}
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Select Payment Mode" />
      </Appbar.Header>

      {/* Amount Payable */}
      <Card style={styles.amountCard}>
        <Card.Content>
          <Text style={styles.amountTitle}>Amount Payable</Text>
          <Text style={styles.amountValue}>₹ {amountPayable}</Text>
        </Card.Content>
      </Card>

      {/* Payment Options */}
      <View style={styles.optionsContainer}>
        {/* Cash */}
        <TouchableOpacity
          style={styles.option}
          onPress={() => navigateToPaymentMode("Cash")}
        >
          <Text style={styles.optionText}>Cash</Text>
          <Text style={styles.arrow}>&gt;</Text>
        </TouchableOpacity>

        {/* Upload Transaction Receipt */}
        <TouchableOpacity
          style={styles.option}
          onPress={() => navigateToPaymentMode("Upload Transaction Receipt")}
        >
          <Text style={styles.optionText}>Upload Transaction Receipt</Text>
          <Text style={styles.arrow}>&gt;</Text>
        </TouchableOpacity>

        {/* Cheque */}
        <TouchableOpacity
          style={styles.option}
          onPress={() => navigateToPaymentMode("Cheque")}
        >
          <Text style={styles.optionText}>Cheque</Text>
          <Text style={styles.arrow}>&gt;</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { backgroundColor: "#2196F3" },
  amountCard: {
    margin: 16,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    padding: 8,
  },
  amountTitle: { fontSize: 14, color: "#666" },
  amountValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2196F3",
    marginTop: 6,
  },
  optionsContainer: { margin: 16 },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderColor: "#E0E0E0",
    borderWidth: 1,
  },
  optionText: { fontSize: 16, fontWeight: "500", color: "#333" },
  arrow: { fontSize: 18, fontWeight: "bold", color: "#666" },
});

export default SelectPaymentMode;


