import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { List, FAB } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { collection, onSnapshot, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "../../../../FirebaseConfig"; // Adjust the path to your Firebase config file

// Define TypeScript type for a bill item
interface BillItem {
  id: string;
  itemName: string;
  notes?: string;
  type?: string;
  ownerAmount?: string;
  rentAmount?: string;
  closedUnitAmount?: string;
}

const BillItems: React.FC = () => {
  const router = useRouter();
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const params = useLocalSearchParams();

  // Fetch Bill Items from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "billItems"),
      (snapshot) => {
        const items = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
          id: doc.id,
          ...doc.data(),
        })) as BillItem[];
        setBillItems(items);
      },
      (error) => {
        console.error("Error fetching bill items: ", error);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [params?.id]);

  // Navigate to Update Bill Page
  const handleItemPress = (item: BillItem) => {
    router.push({
      pathname: "/AddBillItem", // Adjust this path based on your routing structure
      params: item, // Pass the full item data as parameters
    });
  };

  // Navigate to Add Bill Item Page
  const handleAddItemPress = () => {
    router.push("/AddBillItem"); // Adjust this path to match the Add Bill Item page route
  };

  return (
    <View style={styles.container}>
      {/* List of Bill Items */}
      <FlatList
        data={billItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleItemPress(item)}>
            <List.Item
              title={item.itemName}
              right={() => <List.Icon icon="chevron-right" />}
              style={styles.listItem}
            />
          </TouchableOpacity>
        )}
      />

      {/* Floating Action Button */}
      <FAB icon="plus" style={styles.fab} onPress={handleAddItemPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingTop: 10,
  },
  listItem: {
    backgroundColor: "#ffffff",
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 5,
    elevation: 2,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "#6200ee", // Change to match your theme
  },
});

export default BillItems;
