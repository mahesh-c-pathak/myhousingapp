import React, { useState, useEffect } from "react";
import { View, StyleSheet, SectionList, TouchableOpacity } from "react-native";
import { Text, FAB, List, ActivityIndicator, Button, TextInput } from "react-native-paper";
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";
import { db } from "../../../FirebaseConfig";

const LedgerAccountsScreenNew: React.FC = () => {
  const [sectionedAccounts, setSectionedAccounts] = useState<{ title: string; data: { account: string; amount: number }[] }[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchLedgerGroups = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "ledgerGroupsNew"));
        const groups: { title: string; accounts: { account: string; amount: number }[] }[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();

          const accounts = Object.keys(data).map((key) => ({
            account: key,
            amount: data[key]?.balance || 0, // Extract the balance value for each account
          }));

          groups.push({ title: doc.id, accounts }); // Use the document ID as the section title
        });

        const sections = groups.map((group) => ({
          title: group.title,
          data: group.accounts,
        }));

        setSectionedAccounts(sections);
        setExpandedSections(sections.reduce((acc, section) => ({ ...acc, [section.title]: true }), {})); // Default to collapsed
      } catch (error) {
        console.error("Error fetching ledger groups:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLedgerGroups();
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
          <TouchableOpacity onPress={() => toggleSection(title)} style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
          </TouchableOpacity>
        )}
        renderItem={({ item, section }) =>
          expandedSections[section.title] ? (
            <View style={styles.inlineItem}>
              <Text style={styles.accountName}>{`   ${item.account}`}</Text>
              <Text style={styles.accountAmount}>₹ {item.amount.toFixed(2)}</Text>
            </View>
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
  sectionHeader: {
    backgroundColor: "#eaeaea",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  inlineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 16,
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

export default LedgerAccountsScreenNew;
