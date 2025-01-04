import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Appbar, Button, Card, FAB, Surface, Text } from "react-native-paper";
import { useRouter } from "expo-router";

const index = () => {
  const router = useRouter();
  return (
    <View style={styles.container}>
      {/* Bill Card */}
      <Surface style={styles.cardContainer}>
        <Card>
          <Card.Title
            title="Monthly Maintenance"
            right={(props) => <Button {...props} icon="chevron-right" />}
          />
          <Card.Actions>
            <Button mode="contained" style={styles.updateButton}>
              Update
            </Button>
            <Button mode="contained" style={styles.deleteButton}>
              Delete
            </Button>
          </Card.Actions>
        </Card>
      </Surface>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push("../ScheduleBill")} 
      />

    </View>
  )
}

export default index

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  cardContainer: {
    margin: 16,
    elevation: 2,
    borderRadius: 8,
  },
  updateButton: {
    flex: 1,
    backgroundColor: "green",
    margin: 4,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "red",
    margin: 4,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "#6200ee",
  },
})