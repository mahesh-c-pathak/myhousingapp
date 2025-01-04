import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { List, Avatar, Divider, Surface } from "react-native-paper";
import { useRouter } from "expo-router";

const BillsScreen = () => {
  const router = useRouter();

  const options = [
    {
      title: "Generate Maintenance Bills",
      description:
        "Create/view routine maintenance bills for utilities such as water and general maintenance for all society members or for a specific society wing.",
      icon: "file-document-outline",
      route: "/generate-maintenance-bills",
    },
    {
      title: "Generate Special Bills",
      description:
        "Create/view special situation bills/penalty challans for a specific society member for breaking rules, parking charges, facility booking charges, etc.",
      icon: "file-alert-outline",
      route: "/(SpecialBills)",
    },
    {
      title: "Bill Collection Status",
      description:
        "Check total unpaid bill amount with detailed graphical information about defaults by individuals and generate invoices in a single click.",
      icon: "chart-bar",
      route: "/bill-collection-status",
    },
    {
      title: "Payment Receipt Summary",
      description: "Check receipt summary by month-wise.",
      icon: "receipt",
      route: "/payment-receipt-summary",
    },
    {
      title: "Print Bills",
      description:
        "Print bills easily by downloading all maintenance and other bills in the form of a single PDF file.",
      icon: "printer",
      route: "/print-bills",
    },
    {
      title: "Download Member Dues & Payment Receipts Record",
      description:
        "Download a detailed spreadsheet containing month-wise payment and receipt information of all society members.",
      icon: "download",
      route: "/download-dues-record",
    },
    {
      title: "Settings",
      description: "Set Bill Instruction content text.",
      icon: "cog-outline",
      route: "/settings",
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {options.map((option, index) => (
        <React.Fragment key={index}>
          <Surface style={styles.card}>
            <List.Item
              title={option.title}
              description={option.description}
              left={(props) => (
                <Avatar.Icon {...props} icon={option.icon} style={styles.icon} />
              )}
              onPress={() => router.push(option.route)} // Navigate to respective route
            />
          </Surface>
          <Divider />
        </React.Fragment>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 10,
  },
  card: {
    marginBottom: 10,
    elevation: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  icon: {
    backgroundColor: "#6200ee",
  },
});

export default BillsScreen;
