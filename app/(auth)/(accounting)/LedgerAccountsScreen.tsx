import React, { useState, useEffect } from "react";
import { View, StyleSheet, SectionList, TouchableOpacity } from "react-native";
import { Text, FAB, List, ActivityIndicator, Button, TextInput } from "react-native-paper";
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";
import { db } from "../../../FirebaseConfig";

interface LedgerGroup {
  id: string;
  name: string;
  accounts: string[];
}

interface Transaction {
  paidFrom: string;
  paidTo: string;
  amount: number;
  type: string;
}

const LedgerAccountsScreen: React.FC = () => {
  const [ledgerGroups, setLedgerGroups] = useState<LedgerGroup[]>([]);
  const [sectionedAccounts, setSectionedAccounts] = useState<{ title: string; data: { account: string; amount: number }[] }[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchLedgerGroups = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "ledgerGroups"));
        const groups: LedgerGroup[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          groups.push({ id: doc.id, ...data } as LedgerGroup);
        });

        setLedgerGroups(groups);
      } catch (error) {
        console.error("Error fetching ledger groups:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchTransactions = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Transaction"));
        const transactionData: Transaction[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          transactionData.push({
            paidFrom: data.paidFrom,
            paidTo: data.paidTo,
            amount: data.amount,
            type: data.type,
          });
        });

        setTransactions(transactionData);
        
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };

    fetchLedgerGroups();
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (ledgerGroups.length > 0 && transactions.length > 0) {
      // Calculate net amounts for each account
      const accountBalances: Record<string, number> = {};
      transactions.forEach((txn) => {
        if (txn.paidFrom) {
          accountBalances[txn.paidFrom] = (accountBalances[txn.paidFrom] || 0) - txn.amount;
        }
        if (txn.paidTo) {
          accountBalances[txn.paidTo] = (accountBalances[txn.paidTo] || 0) + txn.amount;
        }
      });

      // Organize accounts into sections
      const sections = ledgerGroups.map((group) => ({
        title: group.name,
        data: group.accounts
          .map((account) => ({
            account,
            amount: accountBalances[account] || 0,
          }))
          .filter((item) => item.account.trim() !== ""), // Exclude empty account names
      }));

      setSectionedAccounts(sections);
      setExpandedSections(sections.reduce((acc, section) => ({ ...acc, [section.title]: false }), {}));
    }
  }, [ledgerGroups, transactions]);

  

  

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          label="As on Date"
          value={selectedDate.toISOString().split("T")[0]}
          style={styles.dateInput}
          onFocus={() => setShowDatePicker(true)}
        />
        <Button mode="contained" style={styles.goButton}>
          Go
        </Button>
      </View>

      {showDatePicker && (
        <DateTimePicker value={selectedDate} mode="date" display="default" onChange={(event, date) => setSelectedDate(date || selectedDate)} />
      )}

<SectionList
        sections={sectionedAccounts}
        keyExtractor={(item, index) => index.toString()}
        renderSectionHeader={({ section: { title } }) => (
          <TouchableOpacity onPress={() => toggleSection(title)}>
            <List.Subheader>{title}</List.Subheader>
          </TouchableOpacity>
        )}
        renderItem={({ item, section }) =>
          expandedSections[section.title] ? (
            <TouchableOpacity
              style={styles.inlineItem}
              onPress={() => {
                router.push({
                  pathname: "/AccountDetailScreen",
                  params: {
                    account: item.account,
                    amount: item.amount,
                  },
                });
              }}
              >

              <Text style={styles.accountName}> {item.account}</Text>
              <Text style={styles.accountAmount}>
                ₹ {item.amount.toFixed(2)}
              </Text>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={<Text style={styles.emptyText}>No accounts to display</Text>}
      />

      <FAB style={styles.fab} icon="plus" onPress={() => router.push("/AddLedgerAccountScreen")} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  dateInput: {
    flex: 1,
    marginRight: 8,
    backgroundColor: "#fff",
  },
  goButton: {
    backgroundColor: "#4caf50",
  },
  inlineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  accountName: {
    fontSize: 14,
  },
  accountAmount: {
    fontSize: 14,
    fontWeight: "bold",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "#6200ee",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 16,
  },
});

export default LedgerAccountsScreen;
 