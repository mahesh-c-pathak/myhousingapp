import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Appbar, Text, FAB, Button } from "react-native-paper";
import { useRouter } from "expo-router";

const index: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<"User" | "Admin">("User");
  const router = useRouter();

  const userItems = ["Owner", "Rent", "Shop"];
  const adminItems = ["Vice President", "Treasurer", "Committee"];

  const handlePress = (item: string) => {
    const targetScreen =
      selectedTab === "User" ? "/UserRolePermissions" : "/AdminRolePermissions";

    router.push({
      pathname: targetScreen,
      params: { item, selectedTab },
    });
  };
 
  return (
    <View style={styles.container}>
      {/* Header */}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Setup Permission" />
      </Appbar.Header>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <Button
          mode={selectedTab === "User" ? "contained" : "outlined"}
          onPress={() => setSelectedTab("User")}
          style={styles.tabButton}
        >
          User
        </Button>
        <Button
          mode={selectedTab === "Admin" ? "contained" : "outlined"}
          onPress={() => setSelectedTab("Admin")}
          style={styles.tabButton}
        >
          Admin
        </Button>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {(selectedTab === "User" ? userItems : adminItems).map((item) => (
          <TouchableOpacity
            key={item}
            style={styles.item}
            onPress={() => handlePress(item)}
          >
            <Text style={styles.itemText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* FAB for Admin */}
      {selectedTab === "Admin" && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => console.log("FAB Pressed")}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  contentContainer: {
    padding: 16,
    alignItems: "center",
  },
  item: {
    width: "90%",
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
  },
  itemText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "#6200ee",
  },
});

export default index;
