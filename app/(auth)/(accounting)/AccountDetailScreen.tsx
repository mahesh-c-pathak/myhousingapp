import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView } from "react-native";
import { Text, Card, ActivityIndicator, FAB, Divider } from "react-native-paper";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../FirebaseConfig";

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

const AccountDetailScreen: React.FC = () => {
  const { account } = useLocalSearchParams(); // Dynamically get the account name
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Set dynamic header title
  useEffect(() => {
    if (account) {
      navigation.setOptions({
        headerTitle: account, // Dynamically set the header title
      });
    }
  }, [account, navigation]);

  // Fetch transactions for the specific account
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        // Fetch all transactions
        const querySnapshot = await getDocs(collection(db, "Transaction"));
        const fetchedTransactions: Transaction[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Transaction[];

        // Filter transactions where paidFrom or paidTo matches the account
        const filteredTransactions = fetchedTransactions.filter(
          (txn) => txn.paidFrom === account || txn.paidTo === account
        );

        setTransactions(filteredTransactions);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [account]);

  // Calculate Totals
  const totalIncome = transactions
    .filter((transaction) => transaction.type === 'Income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalExpenses = transactions
    .filter((transaction) => transaction.type === 'Expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.content}>
        {/* Date Range and Ledger */}
        <View style={styles.section}>
          <Text variant="bodyLarge">From: 01 Nov 2024 To: 24 Nov 2024</Text>
          <Text variant="bodyMedium">Ledger Account: {account}</Text>
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
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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


export default AccountDetailScreen;
