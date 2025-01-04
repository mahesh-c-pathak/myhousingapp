import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Appbar, Card, Text, FAB, Divider } from 'react-native-paper';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../FirebaseConfig';
import { useRouter, useLocalSearchParams } from "expo-router";

interface Transaction {
  id: string;
  type: string; // "Income" or "Expense"
  voucher: string;
  paidTo: string;
  narration: string;
  paidFrom: string; // "Bank" or "Cash"
  amount: number;
  transactionDate: string;
}

const TransactionScreen = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch transactions from Firebase
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'Transaction'));
        const fetchedTransactions: Transaction[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Transaction[];
        setTransactions(fetchedTransactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Calculate Totals
  const totalIncome = transactions
    .filter((transaction) => transaction.type === 'Income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalExpenses = transactions
    .filter((transaction) => transaction.type === 'Expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  // Calculate Opening and Closing Balances
  const openingBalanceBank = 0;
  const openingBalanceCash = 0;

  const closingBalanceBank = transactions.reduce((balance, transaction) => {
    if (transaction.paidFrom === 'Bank') {
      return transaction.type === 'Income'
        ? balance + transaction.amount
        : balance - transaction.amount;
    }
    if (transaction.paidTo === 'Bank') {
        return balance + transaction.amount;
      }
    return balance;
  }, openingBalanceBank);

  const closingBalanceCash = transactions.reduce((balance, transaction) => {
    if (transaction.paidFrom === 'Cash') {
      return transaction.type === 'Income'
        ? balance + transaction.amount
        : balance - transaction.amount;
    }
    if (transaction.paidTo === 'Cash') {
        return balance + transaction.amount;
      }
    return balance;
  }, openingBalanceCash);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => {}} />
        <Appbar.Content title="Transactions" />
        <Appbar.Action icon="dots-vertical" onPress={() => {}} />
      </Appbar.Header>

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Date Range and Ledger */}
        <View style={styles.section}>
          <Text variant="bodyLarge">From: 01 Nov 2024 To: 24 Nov 2024</Text>
          <Text variant="bodyMedium">Ledger Account: Transactions</Text>
        </View>

        {/* Account Summary Cards */}
        <View style={styles.summary}>
          <Card style={[styles.card, { backgroundColor: '#E0F7FA' }]}>
            <Card.Content>
              <Text variant="titleMedium">Bank</Text>
              <Text>Opening Bal: ₹ {openingBalanceBank.toFixed(2)}</Text>
              <Text>Closing Bal: ₹ {closingBalanceBank.toFixed(2)}</Text>
            </Card.Content>
          </Card>
          <Card style={[styles.card, { backgroundColor: '#FFEBEE' }]}>
            <Card.Content>
              <Text variant="titleMedium">Cash</Text>
              <Text>Opening Bal: ₹ {openingBalanceCash.toFixed(2)}</Text>
              <Text>Closing Bal: ₹ {closingBalanceCash.toFixed(2)}</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Income and Expense Summary */}
        <View style={styles.summary}>
          <Card style={[styles.card, { backgroundColor: '#E8F5E9' }]}>
            <Card.Content>
              <Text>Total Income</Text>
              <Text variant="titleLarge" style={{ color: 'green' }}>
                ₹ {totalIncome.toFixed(2)}
              </Text>
            </Card.Content>
          </Card>
          <Card style={[styles.card, { backgroundColor: '#FFEBEE' }]}>
            <Card.Content>
              <Text>Total Expenses</Text>
              <Text variant="titleLarge" style={{ color: 'red' }}>
                ₹ {totalExpenses.toFixed(2)}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Transaction List */}
        {transactions.map((transaction) => (
  <View key={transaction.id}>
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/TransactionDetailScreen",
          params: {
            id: transaction.id,
            type: transaction.type,
            voucher: transaction.voucher,
            transactionDate: transaction.transactionDate,
            paidFrom: transaction.paidFrom,
            paidTo: transaction.paidTo,
            amount: transaction.amount,
            narration: transaction.narration,
          },
        })
      }
    >
      <View style={styles.transaction}>
        <View>
          
        <Text variant="titleMedium">
          {transaction.type} - {transaction.voucher}
        </Text>
        </View>
        <View style={styles.transactioncontent}>
          <View style={styles.transactionLeft}>
            <Text>{transaction.paidTo}</Text>
            <Text>{transaction.narration}</Text>
            <Text>Via: {transaction.paidFrom}</Text>
          </View>
          <View style={styles.transactionRight}>
            <Text
              variant="titleLarge"
              style={{ color: transaction.type === "Income" ? "green" : "red" }}
            >
              ₹ {transaction.amount.toFixed(2)}
            </Text>
            <Text>{transaction.transactionDate}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
    <Divider />
  </View>
))}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB style={styles.fab} icon="plus" onPress={() => router.push({
          pathname: "/vouchers"})} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 10 },
  section: { marginVertical: 10 },
  summary: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 },
  card: { flex: 1, marginHorizontal: 5, padding: 10 },
  transaction: { paddingVertical: 10 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  transactioncontent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  transactionLeft: {
    flex: 3,
    justifyContent: "flex-start",
  },
  transactionRight: {
    flex: 2,
    alignItems: "flex-end",
    justifyContent: "center",
  },
});

export default TransactionScreen;
