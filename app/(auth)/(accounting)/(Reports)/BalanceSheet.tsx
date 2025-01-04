import React, { useState, useEffect } from "react";
import { View, StyleSheet, SectionList, TouchableOpacity } from "react-native";
import { Text, FAB, List, ActivityIndicator } from "react-native-paper";
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../FirebaseConfig";

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
  const [sectionedAccounts, setSectionedAccounts] = useState<{ title: string; data: { group: string; accounts: string[] }[] }[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accountBalances, setAccountBalances] = useState<Record<string, number>>({});
  const [totals, setTotals] = useState<{ liabilities: number; assets: number }>({
    liabilities: 0,
    assets: 0,
  });

  const liabilityCategories = [
    "Account Payable",
    "Capital Account",
    "Current Liabilities",
    "Deposit",
    "Loan and Advances",
    "Provision",
    "Reserve and Surplus",
    "Share Capital",
    "Sundry Creditors",
    "Suspense Account",
    "Income & Expenditure Account",
  ];

  const assetCategories = [
    "Account Receivable",
    "Bank Accounts",
    "Cash in Hand",
    "Current Assets",
    "Fixed Assets",
    "Investment",
    "Sundry Debtors",
  ];

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
      const balances: Record<string, number> = {};
      transactions.forEach((txn) => {
        if (txn.paidFrom) {
          balances[txn.paidFrom] = (balances[txn.paidFrom] || 0) - txn.amount;
        }
        if (txn.paidTo) {
          balances[txn.paidTo] = (balances[txn.paidTo] || 0) + txn.amount;
        }
      });
  
      setAccountBalances(balances); // Save to state
  
      // Organize accounts into liabilities and assets
      const liabilities = ledgerGroups
        .filter((group) => liabilityCategories.includes(group.name))
        .map((group) => ({
          group: group.name,
          accounts: group.accounts.filter((account) => account.trim() !== ""), // Remove empty account names
        }))
        .filter((group) => group.accounts.length > 0); // Remove groups with no valid accounts
  
      const assets = ledgerGroups
        .filter((group) => assetCategories.includes(group.name))
        .map((group) => ({
          group: group.name,
          accounts: group.accounts.filter((account) => account.trim() !== ""), // Remove empty account names
        }))
        .filter((group) => group.accounts.length > 0); // Remove groups with no valid accounts
  
      // Calculate totals for liabilities and assets
      const totalLiabilities = liabilities.reduce(
        (sum, group) =>
          sum +
          group.accounts.reduce(
            (acc, account) => acc + (balances[account] || 0),
            0
          ),
        0
      );
  
      const totalAssets = assets.reduce(
        (sum, group) =>
          sum +
          group.accounts.reduce(
            (acc, account) => acc + (balances[account] || 0),
            0
          ),
        0
      );
  
      setTotals({ liabilities: totalLiabilities, assets: totalAssets });
  
      const sections = [
        { title: "Liabilities", data: liabilities },
        { title: "Assets", data: assets },
      ];
  
      setSectionedAccounts(sections);
      setExpandedSections(
        sections.reduce((acc, section) => ({ ...acc, [section.title]: true }), {})
      ); // Default expanded
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
      <SectionList
  sections={sectionedAccounts}
  keyExtractor={(item, index) => index.toString()}
  renderSectionHeader={({ section: { title } }) => (
    <TouchableOpacity onPress={() => toggleSection(title)}>
      <Text style={styles.headerText}>{title}</Text>
    </TouchableOpacity>
  )}
  renderItem={({ item, section }) =>
    expandedSections[section.title] ? (
      <View>
        <Text style={styles.groupTitle}>{item.group || "Unknown Group"}</Text>
        {item.accounts.map((account, idx) => (
          <View key={idx} style={styles.accountRow}>
            <Text style={styles.accountName}>
              {account || "Unnamed Account"}
            </Text>
            <Text style={styles.accountAmount}>
              ₹ {accountBalances[account]?.toFixed(2) || "0.00"}
            </Text>
          </View>
        ))}
      </View>
    ) : null
  }
  renderSectionFooter={({ section: { title } }) => {
    const total =
      title === "Liabilities" ? totals.liabilities : totals.assets;
    return (
      <View style={styles.footerRow}>
        <Text style={styles.totalLabel}>Total {title}</Text>
        <Text style={styles.totalAmount}>₹ {total.toFixed(2)}</Text>
      </View>
    );
  }}
  ListEmptyComponent={
    <Text style={styles.emptyText}>No accounts to display</Text>
  }
/>


      
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
  groupTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginVertical: 8,
    marginLeft: 16,
  },
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  emptyText: {
    textAlign: "center",
    marginTop: 16,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#ddd",
    backgroundColor: "#f9f9f9",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
});

export default LedgerAccountsScreen;
