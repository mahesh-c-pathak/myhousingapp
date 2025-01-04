import React, { useEffect, useState } from "react";
import { View, SectionList } from "react-native";
import { MultiSelectDropdown } from "react-native-paper-dropdown";
import { Provider as PaperProvider, List, Text, ActivityIndicator } from "react-native-paper";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../FirebaseConfig";

interface LedgerGroup {
  id: string;
  name: string;
  accounts: string[];
}

interface Payment {
  account: string;
  amount: number;
}

export default function App() {
  const [ledgerGroups, setLedgerGroups] = useState<LedgerGroup[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [sectionedAccounts, setSectionedAccounts] = useState<{ title: string; data: { account: string; amount: number }[] }[]>([]);
  const [multiSelectOptions, setMultiSelectOptions] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLedgerGroups = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "testmultiselect"));
        const groups: LedgerGroup[] = [];
        const options: { label: string; value: string }[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          groups.push({ id: doc.id, ...data } as LedgerGroup);
          options.push({
            label: data.name || "Unnamed Group",
            value: doc.id,
          });
        });

        setLedgerGroups(groups);
        setMultiSelectOptions(options);
      } catch (error) {
        console.error("Error fetching ledger groups:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchPayments = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "payments"));
        const paymentData: Payment[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          paymentData.push({ account: data.account, amount: data.amount });
        });

        setPayments(paymentData);
      } catch (error) {
        console.error("Error fetching payments:", error);
      }
    };

    fetchLedgerGroups();
    fetchPayments();
  }, []);

  useEffect(() => {
    if (ledgerGroups.length > 0 && payments.length > 0) {
      const sections = ledgerGroups
        .filter((group) => selectedGroups.includes(group.id))
        .map((group) => ({
          title: group.name,
          data: group.accounts.map((account) => {
            const payment = payments.find((payment) => payment.account === account);
            return {
              account,
              amount: payment ? payment.amount : 0,
            };
          }),
        }));

      setSectionedAccounts(sections);
      
    } else {
      setSectionedAccounts([]);
    }
  }, [selectedGroups, ledgerGroups, payments]);

  

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <PaperProvider>
      <View style={{ margin: 16 }}>
        <MultiSelectDropdown
          label="Ledger Groups"
          placeholder="Select Groups"
          options={multiSelectOptions}
          value={selectedGroups}
          onSelect={setSelectedGroups}
        />
      </View>

      <View style={{ margin: 16 }}>
        <List.Section>
          <List.Subheader>Ledger Accounts</List.Subheader>
          <SectionList
            sections={sectionedAccounts}
            keyExtractor={(item, index) => index.toString()}
            renderSectionHeader={({ section: { title } }) => (
              <List.Subheader>{title}</List.Subheader>
            )}
            renderItem={({ item }) => (
              <List.Item
                title={item.account}
                description={`Amount: $${item.amount.toFixed(2)}`}
              />
            )}
            ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 16 }}>No accounts to display</Text>}
          />
        </List.Section>
      </View>
    </PaperProvider>
  );
}
