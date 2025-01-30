import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Appbar, Button, IconButton, Card } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSociety } from "../../../utils/SocietyContext";

const adminDashboardScreen = () => {
  const router = useRouter();
  const { role, societyName: societyNameParam } = useLocalSearchParams();
  const { societyName, setSocietyName } = useSociety();
 
  useEffect(() => {
    if (societyNameParam) {
      setSocietyName(societyNameParam as string); // Update context value
    }
  }, [societyNameParam]);

  const quickAccess = [
    { label: 'Bills', icon: 'file-document', route: "/(Bills)" }, 
    { label: 'Collection', icon: 'cart', route: "/Collection"},
    { label: 'CollectionNew', icon: 'cart', route: "/CollectionNew"},
    { label: 'Accounting', icon: 'book-account', route: "/(accounting)"  },
    { label: 'Complains', icon: 'note-edit' },
  ];

  const directoryItems = [
    { label: 'Members', icon: 'account-group', route: "/(Members)" },
    { label: 'Vehicles', icon: 'car', route: "/(Vehicles)?source=Admin" },
    { label: 'Emergency', icon: 'phone' },
    { label: 'Staff', icon: 'account-tie' },
    { label: 'Admin', icon: 'shield-account' },
    { label: 'Permission', icon: 'lock', route: "/(Permission)" },
    { label: 'Statistics', icon: 'chart-bar' },
  ];

  const interactionItems = [
    { label: 'Meeting', icon: 'calendar-clock' },
    { label: 'Announcements', icon: 'bullhorn' },
    { label: 'Event', icon: 'calendar' },
    { label: 'Voting', icon: 'thumb-up' },
    { label: 'Resources', icon: 'file' },
    { label: 'Proposal', icon: 'book-open-outline' },
    { label: 'Suggestions', icon: 'lightbulb' },
    { label: 'Tasks', icon: 'clipboard-check' },
  ];

  const buildingItems = [
    { label: 'Wings', icon: 'office-building', route: "/(SetupWing)/SetupWingsScreen", params: {societyName } },
    { label: 'Building Info', icon: 'information-outline' },
    { label: 'Rules', icon: 'gavel' },
    { label: 'Documents', icon: 'folder' },
    { label: 'Bank', icon: 'bank' },
    { label: 'Payment Gateway', icon: 'credit-card' },
  ];

  const gateKeeperItems = [
    { label: 'Gate Keepers', icon: 'account-tie' },
    { label: 'Gates', icon: 'gate' },
    { label: 'GatePass', icon: 'card-account-details' },
    { label: 'Daily Helper', icon: 'account-hard-hat' },
    { label: 'Visitor Statistics and History', icon: 'history' },
  ];

  const logItems = [
    { label: 'SMS', icon: 'email' },
    { label: 'Whatsapp', icon: 'whatsapp' },
  ];

  const renderGrid = (items) => (
    <View style={styles.grid}>
      {items.map((item, index) => (
        <TouchableOpacity key={index} style={styles.gridItem}
        onPress={() => {
          if (item.route) {
            // Check if params exist and include them in the navigation
            const params = item.params || {};
            router.push({ pathname: item.route, params });// Navigate to the respective screen
          }
        }}
        >
          <IconButton icon={item.icon} size={30} />
          <Text style={styles.gridLabel}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Appbar */}
      <Appbar.Header >
        <Appbar.Action icon="menu" onPress={() => {}} />
        <Appbar.Content title={societyName} />
        <IconButton icon="bell" onPress={() => {}} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Subscription Section */}
        <Card style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.remainingText}>6 Days remaining</Text>
            <Button mode="text" onPress={() => {}}>
              View Services
            </Button>
          </View>
        </Card>

        {/* Share Code Section */}
        <Card style={styles.card}>
          <Text style={styles.codeText}>9540463870</Text>
          <Text style={styles.description}>
            Click here to share code with building members to join Saiseva Hsg.
          </Text>
          <IconButton icon="share" style={styles.shareIcon} onPress={() => {}} />
        </Card>

        {/* Quick Access Section */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          {renderGrid(quickAccess)}
        </Card>

        {/* Directory Section */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Directory</Text>
          {renderGrid(directoryItems)}
        </Card>

        {/* Interaction Section */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Interaction</Text>
        {renderGrid(interactionItems)}
      </Card>

      {/* My Building Section */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>My Building</Text>
        {renderGrid(buildingItems)}
      </Card>

      {/* Gate Keeper Section */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Gate Keeper</Text>
        {renderGrid(gateKeeperItems)}
      </Card>

      {/* Logs Section */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Logs</Text>
        {renderGrid(logItems)}
      </Card>

      </ScrollView>
    </View>
  );
};

export default adminDashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  appBar: {
    backgroundColor: '#5e35b1',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  codeText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    color: '#555',
    marginBottom: 8,
  },
  shareIcon: {
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginVertical: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '23%',
    alignItems: 'center',
    marginVertical: 8,
  },
  sectionCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  gridLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
