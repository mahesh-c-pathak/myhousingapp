import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Platform, Alert, FlatList  } from 'react-native';
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter, useLocalSearchParams } from 'expo-router';
import { collection, query, where, onSnapshot, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "../../../FirebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  TextInput,
  Button,
  Switch,
  Checkbox,
  Text,
  Divider,
  Menu,
  List,
  IconButton,
} from 'react-native-paper';

// Define TypeScript type for a bill item
interface BillItem {
    id: string;
    itemName: string;
    notes?: string;
    type?: string;
    ownerAmount?: number;
    rentAmount?: number;
    closedUnitAmount?: number;
    ledgerAccount?: string;
  }

const ScheduleBillScreen = () => {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [balancesheet, setBalancesheet] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [duration, setDuration] = useState('');
  const [dueDuration, setDueDuration] = useState('');
  const [penaltyEnabled, setPenaltyEnabled] = useState(false);
  const [advancedPayment, setAdvancedPayment] = useState(true);
  const [wing, setWing] = useState({ A: true, B: true });
  const params = useLocalSearchParams();

  const durations = ['1 Month', '2 Months', '3 Months', '6 Months', '1 Year'];
  const duedurations = ['Net 7', 'Net 10', 'Net 15', 'Net 28', 'Net 30', 'Net 45', 'Due end of the month', 'Due end of the nest month' ];

  
  const [durationMenuVisible, setDurationMenuVisible] = useState(false);
  const [dueDurationMenuVisible, setDueDurationMenuVisible] = useState(false);
  const [balancesheetVisible, setbalancesheetVisible] = useState(false);

  const balancesheets = [ 'Main Balance',];

  const router = useRouter();
  const [billItems, setBillItems] = useState<BillItem[]>([]);

  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  
  

  // Fetch Bill Items from Firestore
  useEffect(() => {
    if (params?.id) {
        setIsEditMode(true)};
        const fetchBillItems = async () => {
            try {
              const storedItem = await AsyncStorage.getItem("@editedBillItem");
              if (storedItem) {
                const parsedItems: BillItem[] = JSON.parse(storedItem);
                const uniqueItems = parsedItems.filter(
                  (newItem) => !billItems.some((existingItem) => existingItem.id === newItem.id)
                );
                setBillItems((prevItems) => [...prevItems, ...uniqueItems]);
              }
            } catch (error) {
              console.error("Error fetching bill items:", error);
              Alert.alert("Error", "Failed to load bill items.");
            }
          };

    fetchBillItems();
  }, [params?.id]);

  

  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) setStartDate(selectedDate);
  };

  const clearEditedBillItem = async () => {
    try {
      await AsyncStorage.removeItem("@editedBillItem");
      Alert.alert("Success", "Edited Bill Item cleared from storage!");
    } catch (error) {
      console.error("Error clearing @editedBillItem:", error);
      Alert.alert("Error", "Failed to clear edited bill item.");
    }
  };

  // Save Bill Items to AsyncStorage
  const saveBillItems = async (items: BillItem[]) => {
    try {
      await AsyncStorage.setItem("@editedBillItem", JSON.stringify(items));
    } catch (error) {
      console.error("Error saving bill items:", error);
      Alert.alert("Error", "Failed to save bill items.");
    }
  };

  // Handle Edit Action
  const handleEdit = (item: BillItem) => {
    router.push({
      pathname: "/AddBillItem",
      params: { itemId: item.id }, // Pass item ID for editing
    });
  };

  // Handle Delete Action
  const handleDelete = (id: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this item?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updatedItems = billItems.filter((item) => item.id !== id);
          setBillItems(updatedItems);
          await saveBillItems(updatedItems);
        },
      },
    ]);
  };

  const navigateToNextScreen = () => {
     // Validation logic
  if (!name.trim()) {
    Alert.alert("Validation Error", "Please enter a Name.");
    return;
  }
  if (!startDate) {
    Alert.alert("Validation Error", "Please select a Start Date.");
    return;
  }
  if (!duration) {
    Alert.alert("Validation Error", "Please select a Duration.");
    return;
  }
  if (!dueDuration) {
    Alert.alert("Validation Error", "Please select a Due Duration.");
    return;
  }
  if (!wing.A && !wing.B) {
    Alert.alert("Validation Error", "Please select at least one Wing.");
    return;
  }
  if (billItems.length === 0) {
    Alert.alert("Validation Error", "Please add at least one Bill Item.");
    return;
  }

  // Construct parameters for navigation
  const params = {
    name,
    note,
    balancesheet,
    startDate: startDate.toISOString().split("T")[0],
    duration,
    dueDuration,
    wings: Object.keys(wing).filter((key) => wing[key]).join(", "),
    items: JSON.stringify(billItems),
  };

  // Navigate to the next screen
  router.push({
    pathname: "/NextScreen",
    params,
  });

  };


  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Bill Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Bill Details</Text>
        <Divider style={styles.divider} />
        <TextInput
          label="Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Note (optional)"
          value={note}
          onChangeText={setNote}
          mode="outlined"
          multiline
          style={styles.input}
        />
        {/* Dropdown for Balancesheet */}
        <View style={styles.dropdownContainer}>
          <Menu
            visible={balancesheetVisible}
            onDismiss={() => setbalancesheetVisible(false)}
            anchor={
                <TextInput
                    label="Select Balancesheet"
                    value={balancesheet || 'Select'}
                    editable={false}
                    right={<TextInput.Icon icon="chevron-down" onPress={() => setbalancesheetVisible(true)} />}
                    mode="outlined"
                    style={styles.input}
                />
              
            }
          >
            {balancesheets.map((item, index) => (
              <Menu.Item
                key={index}
                onPress={() => {
                  setBalancesheet(item);
                  setbalancesheetVisible(false);
                }}
                title={item}
              />
            ))}
          </Menu>
        </View>
      </View>

      {/* Bill Duration Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Bill Duration</Text>
        <Divider style={styles.divider} />
        {/* Date Picker Start Date */}

        <TextInput
          label="Start From"
          value={startDate.toISOString().split("T")[0]}
          style={styles.input}
          mode="outlined"
          editable={false}
          right={
            <TextInput.Icon
              icon="calendar"
              onPress={() => setShowDatePicker(true)}
            />
          }
        />
        {showDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleDateChange}
          />
        )}
        
        {/* Dropdown for Duration */}
        <View style={styles.dropdownContainer}>
          <Menu
            visible={durationMenuVisible}
            onDismiss={() => setDurationMenuVisible(false)}
            anchor={
                <TextInput
                    label="Select Duration"
                    value={duration || 'Select Duration'}
                    editable={false}
                    right={<TextInput.Icon icon="chevron-down" onPress={() => setDurationMenuVisible(true)} />}
                    mode="outlined"
                    style={styles.input}
                />
              
            }
          >
            {durations.map((item, index) => (
              <Menu.Item
                key={index}
                onPress={() => {
                  setDuration(item);
                  setDurationMenuVisible(false);
                }}
                title={item}
              />
            ))}
          </Menu>
        </View>

        {/* Dropdown for Due Duration */}
        <View style={styles.dropdownContainer}>
          <Menu
            visible={dueDurationMenuVisible}
            onDismiss={() => setDueDurationMenuVisible(false)}
            anchor={
                <TextInput
                    label="Due Duration"
                    value={dueDuration || 'Due Duration from Bill Date (days)'}
                    editable={false}
                    right={<TextInput.Icon icon="chevron-down" onPress={() => setDueDurationMenuVisible(true)} />}
                    mode="outlined"
                    style={styles.input}
            />
              
            }
          >
            {duedurations.map((item, index) => (
              <Menu.Item
                key={index}
                onPress={() => {
                  setDueDuration(item);
                  setDueDurationMenuVisible(false);
                }}
                title={item}
              />
            ))}
          </Menu>
        </View>

        <View style={styles.checkboxContainer}>
          <Checkbox.Item
            label="Wing A"
            status={wing.A ? 'checked' : 'unchecked'}
            onPress={() => setWing({ ...wing, A: !wing.A })}
          />
          <Checkbox.Item
            label="Wing B"
            status={wing.B ? 'checked' : 'unchecked'}
            onPress={() => setWing({ ...wing, B: !wing.B })}
          />
        </View>
      </View>

      {/* Additional Options Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Options</Text>
        <Divider style={styles.divider} />
        <View style={styles.switchContainer}>
          <Text>Enable Penalty</Text>
          <Switch
            value={penaltyEnabled}
            onValueChange={setPenaltyEnabled}
            style={styles.switch}
          />
        </View>
        <View style={styles.switchContainer}>
          <Text>Advanced Payment Settlement</Text>
          <Switch
            value={advancedPayment}
            onValueChange={setAdvancedPayment}
            style={styles.switch}
          />
        </View>
      </View>
      {/* Added Items to bill */}

      {isEditMode && (
  <View style={styles.section}>
    <Text style={styles.sectionHeader}>Bill Items</Text>
    <FlatList
      data={billItems}
      contentContainerStyle={{ paddingBottom: 100 }}
      keyExtractor={(item) => item.id}
      scrollEnabled={false} // Disable scrolling
      renderItem={({ item }) => (
        <View style={styles.listItem}>
          <View style={styles.listItemContent}>
          <Text style={styles.listItemText}>Item Name: {item.itemName}</Text>
          {item.notes && <Text style={styles.listItemText}>Notes: {item.notes}</Text>}
          {item.type && <Text style={styles.listItemText}>Type: {item.type}</Text>}
          {item.ownerAmount && <Text style={styles.listItemText}>Owner Amount: {item.ownerAmount}</Text>}
          {item.rentAmount && <Text style={styles.listItemText}>Rent Amount: {item.rentAmount}</Text>}
          </View>
          <View style={styles.listItemActions}>
                {/* Edit Button */}
                <IconButton
                  icon="pencil"
                  size={20}
                  onPress={() => handleEdit(item)}
                  style={styles.actionButton}
                />
                {/* Delete Button */}
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={() => handleDelete(item.id)}
                  style={styles.actionButton}
                />
              </View>
        </View>
      )}
      ListEmptyComponent={<Text>No items available</Text>}
    />
  </View>
)}


      {/* Buttons */}
      <Button
      mode="contained"
      onPress={() => {
        if (!balancesheet) {
          Alert.alert('Generate Bill', 'Select Balancesheet');
        } else {
          // Navigate to the Items Page and pass balancesheet as a parameter
          router.push({
            pathname: '/Billitems', // Adjust this path based on your routing structure
            params: { balancesheet }, // Pass the balancesheet value
          });
        }
      }}
      style={styles.addButton}
    >
      Add Bill Item
    </Button>
      <Button mode="contained" onPress={navigateToNextScreen}>
        Next
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  divider: {
    marginBottom: 10,
  },
  input: {
    marginBottom: 15,
  },
  checkboxContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  switch: {
    marginLeft: 10,
  },
  addButton: {
    marginTop: 10,
    marginBottom: 15,
  },
  nextButton: {
    marginTop: 10,
  },
  dropdownContainer: {
    marginBottom: 15,
  },
  dropdownButton: {
    width: '100%',
    justifyContent: 'flex-start',
  },
  listItem: {
    position: "relative",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "#ffffff",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    elevation: 2,
  },
  listItemText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  listItemContent: {
    flex: 1,
  },
  listItemActions: {
    position: "absolute",
    top: 10, // Distance from the top of the card
    right: 10, // Distance from the right edge
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    marginLeft: 8, // Space between icons
  },
  
});

export default ScheduleBillScreen;
