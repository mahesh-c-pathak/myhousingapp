import React, { useState, useEffect } from "react";
import { View, StyleSheet, SectionList, TouchableOpacity } from "react-native";
import { Text, FAB, ActivityIndicator } from "react-native-paper";
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../FirebaseConfig";

interface Account {
  account: string;
  balance: number;
}

const BalanceSheetNew: React.FC = () => {
  const [sectionedAccounts, setSectionedAccounts] = useState<
    { title: string; data: { group: string; accounts: Account[] }[] }[]
  >([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState<{ liabilities: number; assets: number }>({
    liabilities: 0,
    assets: 0,
  });
  const router = useRouter();

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

  const incomeExpenditureCategories = [
    "Direct Income",
    "Indirect Income",
    "Direct Expenses",
    "Indirect Expenses",
    "Maintenance & Repairing",
  ];

  const IncomeCategories = [
    "Direct Income",
    "Indirect Income",
  ];

  const ExpenditureCategories = [
    "Direct Expenses",
    "Indirect Expenses",
    "Maintenance & Repairing",
  ];

  useEffect(() => {
    const fetchLedgerGroupsNew = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "ledgerGroupsNew"));
        const ledgerGroups: { name: string; accounts: Account[] }[] = [];
  
        querySnapshot.forEach((doc) => {
          const data = doc.data();
  
          const accounts = Object.keys(data).map((key) => ({
            account: key,
            balance: data[key]?.balance || 0, // Extract the balance value for each account
          }));
  
          ledgerGroups.push({ name: doc.id, accounts });
        });
  
        // let incomeExpenditureSurplus = 0; // To hold the net balance of income & expenditure groups
  
        const liabilities = ledgerGroups
          .filter((group) => liabilityCategories.includes(group.name))
          .map((group) => ({
            group: group.name,
            accounts: group.accounts.filter((account) => account.account.trim() !== ""),
          }))
          .filter((group) => group.accounts.length > 0);
  
        const assets = ledgerGroups
          .filter((group) => assetCategories.includes(group.name))
          .map((group) => ({
            group: group.name,
            accounts: group.accounts.filter((account) => account.account.trim() !== ""),
          }))
          .filter((group) => group.accounts.length > 0);
  
        // Process Income & Expenditure Account logic
        let incomeTotal = 0;
        let expenditureTotal = 0;
  
        ledgerGroups.forEach((group) => {
          if (IncomeCategories.includes(group.name)) {
            incomeTotal += group.accounts.reduce(
              (sum, account) => sum + (account.balance || 0),
              0
            );
          } else if (ExpenditureCategories.includes(group.name)) {
            expenditureTotal += group.accounts.reduce(
              (sum, account) => sum + (account.balance || 0),
              0
            );
          }
        });
  
        const incomeExpenditureSurplus = incomeTotal - expenditureTotal;
  
        // Always add "Income & Expenditure Account" under liabilities
        liabilities.push({
          group: "Income & Expenditure Account",
          accounts: [
            {
              account: "Surplus Amount",
              balance: incomeExpenditureSurplus, // This will show 0 if there are no balances
            },
          ],
        });
  
        // Calculate totals for liabilities and assets
        const totalLiabilities = liabilities.reduce(
          (sum, group) =>
            sum +
            group.accounts.reduce(
              (acc, account) => acc + (account.balance || 0),
              0
            ),
          0
        );
  
        const totalAssets = assets.reduce(
          (sum, group) =>
            sum +
            group.accounts.reduce(
              (acc, account) => acc + (account.balance || 0),
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
      } catch (error) {
        console.error("Error fetching ledger groups:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchLedgerGroupsNew();
  }, []);
  

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
          <TouchableOpacity onPress={() => toggleSection(title)} style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
          </TouchableOpacity>
        )}
        renderItem={({ item, section }) =>
          expandedSections[section.title] ? (
            <View>
              <Text style={styles.groupTitle}>{item.group || "Unknown Group"}</Text>
              {item.accounts.map((account, idx) => (
                <View key={idx} style={styles.accountRow}>
                  <Text style={styles.accountName}>{`   ${account.account}`}</Text>
                  <Text style={styles.accountBalance}>₹ {account.balance.toFixed(2)}</Text>
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
        ListEmptyComponent={<Text style={styles.emptyText}>No accounts to display</Text>}
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
  sectionHeader: {
    backgroundColor: "#eaeaea",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
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
  accountBalance: {
    fontSize: 14,
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 16,
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
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "#6200ee",
  },
});

export default BalanceSheetNew;




