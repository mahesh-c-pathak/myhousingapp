import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { Button, Card, Text, FAB, IconButton, Snackbar, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSession } from "../../../utils/ctx";
import { auth, db } from '../../../FirebaseConfig';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Link } from 'expo-router';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

// Define the Expense interface
interface Expense {
  id: string;
  name: string;
  amount: number;
  date: string; // Add date to the Expense interface
}

export default function TabOneScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]); // Specify the type of expenses state
  const [name, setName] = useState<string>(''); // name is a string
  const [amount, setAmount] = useState<string>(''); // amount is a string
  const [date, setDate] = useState<Date>(new Date()); // State for the date
  const [visible, setVisible] = useState<boolean>(false); // for Snackbar visibility
  const [modalVisible, setModalVisible] = useState<boolean>(false); // for Modal visibility
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null); // To track the expense being edited
  const [datePickerVisible, setDatePickerVisible] = useState<boolean>(false); // Date picker visibility
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const router = useRouter();

  // Function to add or edit an expense
  const saveExpense = async () => {
    if (name && amount) {
      const formattedDate = date.toISOString(); // Format date for Firestore

      if (editingExpense) {
        const expenseRef = doc(db, 'expenses', editingExpense.id);
        await updateDoc(expenseRef, {
          name,
          amount: parseFloat(amount),
          date: formattedDate,
        });
        setEditingExpense(null);
      } else {
        await addDoc(collection(db, 'expenses'), {
          name,
          amount: parseFloat(amount),
          date: formattedDate,
        });
      }
      setModalVisible(false);
      router.push('/');
    } else {
      setVisible(true);
    }
  };

  // Function to open modal for adding or editing expense
  const openModal = (expense?: Expense) => {
    if (expense) {
      setName(expense.name);
      setAmount(expense.amount.toString());
      setDate(new Date(expense.date));
      setEditingExpense(expense);
    } else {
      setName('');
      setAmount('');
      setDate(new Date());
      setEditingExpense(null);
    }
    setModalVisible(true);
  };

  // Function to close modal
  const closeModal = () => {
    setModalVisible(false);
    setName('');
    setAmount('');
    setDate(new Date());
    setEditingExpense(null);
  };

  // Function to delete an expense
  const deleteExpense = async (id: string) => {
    const expenseRef = doc(db, 'expenses', id);
    await deleteDoc(expenseRef); // Delete expense from Firestore
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Alert',
      'You are trying to delete this expense, Would you like to continue?',
[
  { text: 'Cancel', onPress: () => null },
  { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(id) },
]
);
  }

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'expenses'), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExpenses(data as Expense[]);
    });
    return unsubscribe;
  }, []);

  

  return (
    <View style={styles.container}>
      <StatusBar style='dark' />
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Card.Title 
                  title={item.name} 
                  //subtitle={`Amount: $${item.amount} \n Date: ${new Date(item.date).toLocaleDateString()}`} 
                  subtitle={
                    <View style={styles.subtitleContainer}>
                      <Text style={styles.subtitleAmount}>Amount: ${item.amount}</Text>
                      <Text style={styles.subtitleDate}>
                        Date: {new Date(item.date).toLocaleDateString()}
                      </Text>
                    </View>
                  }
                  
                  
                />
              </View>
              {/* FABs for Edit and Delete */}
              <View style={styles.fabContainer}>
                <IconButton
                  icon="pencil" // Edit icon
                  size={24}
                  onPress={() => openModal(item)} // Open modal with existing expense data
                  style={styles.iconButton}
                />
                <IconButton
                  icon="delete" // Delete icon
                  size={24}
                  onPress={() => handleDelete(item.id)} // Delete expense
                  style={styles.iconButton}
                />
              </View>
            </View>
          </Card>
        )}
      />
      <Button
        mode="contained"
        icon="plus"
        style={styles.fabModal}
        onPress={() => openModal()} // Open modal to add new expense
      >
        Add Expense
      </Button>

      {/* Snackbar for validation error */}
      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={3000}
      >
        Please fill out all fields
      </Snackbar>

      {/* Modal for adding or editing an expense */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingExpense ? 'Edit Expense' : 'Add Expense'}</Text>

            <TextInput
              label="Expense Name"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            <TextInput
              label="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={styles.input}
            />
            
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              onConfirm={(selectedDate) => {
                setDate(selectedDate);
                setDatePickerVisibility(false);
                }}
            onCancel={() => setDatePickerVisibility(false)}
            />
            <Button onPress={() => setDatePickerVisibility(true)}>
                Select Date: {date.toLocaleDateString()}
            </Button>
            <Button mode="contained" onPress={saveExpense} style={styles.button}>
              {editingExpense ? 'Save Changes' : 'Add Expense'}
            </Button>
            <Button
              mode="outlined"
              onPress={closeModal}
              style={[styles.button, styles.cancelButton]}
            >
              Cancel
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    margin: 10,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  cardHeader: {
    flexDirection: 'row', // Aligns Card.Title and Button in a row
    justifyContent: 'space-between', // Pushes title to the left and button to the right
    alignItems: 'center', // Vertically centers both items
    paddingVertical: 10, // Adds some vertical padding
  },
  cardTitleContainer: {
    flex: 1, // Takes up all available space to push the button to the right
  },
  fabContainer: {
    flexDirection: 'row', // Align the FABs horizontally
    justifyContent: 'flex-end', // Align to the right side of the card
    alignItems: 'center',
    gap: 10, // Adds space between the FABs
  },
  iconButton: {
    backgroundColor: 'transparent', // Make the background transparent
  },
  fabModal: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#6200ee',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    marginBottom: 16,
  },
  button: {
    width: '100%',
    marginBottom: 16,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderColor: '#6200ee',
    borderWidth: 1,
    color: '#6200ee',
  },
  subtitleContainer: {
    flexDirection: 'column',
    marginTop: 4,
  },
  subtitleAmount: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600', // Slightly bold for emphasis
  },
  subtitleDate: {
    fontSize: 12,
    //color: '#6200ee', // Distinct color for the date
    marginTop: 4, // Spacing between amount and date
    fontStyle: 'italic', // Optional: add a unique style for the date
  },
});
