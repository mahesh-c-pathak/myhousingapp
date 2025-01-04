import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, View, ScrollView } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator, IconButton } from 'react-native-paper';
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../FirebaseConfig';
import { calculatePenalty } from "../../../utils/calculatePenalty";
import { getMonthIndex } from "../../../utils/getMonthIndex";

const AdminDashboard: React.FC = () => {
  const [month, setMonth] = useState<string>('November 2024');
  const [charges, setCharges] = useState<{ label: string; amount: string }[]>([
    { label: 'Maintenance Charges', amount: '' },
    { label: 'Lift Maintenance Charges', amount: '' },
    { label: 'Sinking Fund', amount: '' },
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const penaltyCharges: Record<string, { dueAmount: number; penaltyCharge: number }> = {}; // Store penalties

  // Helper function to calculate total amount including penalties
  const calculateTotalAmount = () => {
    return charges.reduce((total, charge) => {
      const amount = parseFloat(charge.amount) || 0;
      return total + amount;
    }, 0);
  };

  // Helper function to calculate dueDate
  const getDueDate = (month: string): string => {
    const [monthName, year] = month.split(' ');
    
    // Ensure the year is a number
    const parsedYear = parseInt(year, 10);
    
    if (isNaN(parsedYear)) {
      throw new Error('Invalid year format');
    };
    
    // Get the month index (0 for January, 11 for December)
    const monthIndex = getMonthIndex(monthName);
      
    // Calculate the last day of the month dynamically
    const lastDay = new Date(parsedYear, monthIndex+1, 0).getDate(); 
  
    // Construct the due date using the last day
    const dueDate =  new Date(parsedYear, monthIndex, lastDay);
  
    // Return the date in ISO string format
    return dueDate.toISOString();
  };

  // Function to handle new charge addition
  const addNewCharge = () => {
    setCharges([...charges, { label: '', amount: '' }]);
  };

  // Function to update charges dynamically
  const updateCharge = (index: number, key: 'label' | 'amount', value: string) => {
    const updatedCharges = charges.map((charge, idx) => {
      if (idx === index) {
        return { ...charge, [key]: value };
      }
      return charge;
    });
    setCharges(updatedCharges);
  };

  // Function to remove a charge
  const removeCharge = (index: number) => {
    const updatedCharges = charges.filter((_, idx) => idx !== index);
    setCharges(updatedCharges);
  };

  // Function to calculate penalties based on maintenance request data and store them
  const applyPenaltyCharges = async () => {
    try {
      // Query all maintenance requests to get payment details
      const maintenanceSnapshot = await getDocs(collection(db, 'maintenance_requests'));

      let penaltiesApplied = false;

      maintenanceSnapshot.forEach(async (docSnap) => {
        const data = docSnap.data();
        const payments = data?.payments ?? {}; // Ensure payments is an object
        const mydate = data?.dueDate
        const udate = new Date(mydate);
        
        // Loop through payments and apply penalty for unpaid residents
        Object.keys(payments).forEach((userId) => {
          const payment = payments[userId];
          if (payment.status === 'pending') {
            const unpaidAmount = payment.dueAmount || 0;
            const mypenalty = calculatePenalty(udate, unpaidAmount);
            
             // Store penalty charges in the new object
          penaltyCharges[userId] = {
            dueAmount: unpaidAmount,
            penaltyCharge: mypenalty,
          };

            // Add penalty to the user's payment data
            payments[userId].penaltyCharge = mypenalty; // Store penalty charge per user
          }
        });

        // Now update the Firestore document with the updated payments and set penaltiesApplied flag
        await updateDoc(doc(db, 'maintenance_requests', docSnap.id), {
          payments,
        });

        
      });

      // Show success alert if penalties were applied
      if (penaltiesApplied) {
        Alert.alert('Success', 'Penalty charges have been applied to users.');
      }
    } catch (error) {
      console.error('Error applying penalty charges:', error);
    }
  };

  // Call applyPenaltyCharges when the component is mounted or when month changes
  /*
  useEffect(() => {
    applyPenaltyCharges();
  }, [month]); // Re-run the penalty calculation when month changes
  */

  const createPaymentRequest = async () => {
    const totalAmount = calculateTotalAmount();

    if (totalAmount <= 0 || charges.some(charge => !charge.label || !charge.amount)) {
      Alert.alert('Error', 'Please enter valid labels and amounts for all charges.');
      return;
    }

    setLoading(true);
    try {
      // Get all users (residents)
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const paymentRequests: Record<string, { status: string; paidAt: null | string; dueAmount: any; penaltyCharge?: number }> = {};

      // Initialize payment status for each resident
      usersSnapshot.forEach((userDoc) => {
        const userId = userDoc.id;
        paymentRequests[userId] = { status: 'pending', paidAt: null, dueAmount: totalAmount };
      });

      // Create a new maintenance request document with detailed charges
      await addDoc(collection(db, 'maintenance_requests'), {
        month,
        charges: charges.map(({ label, amount }) => ({
          label,
          amount: parseFloat(amount),
        })),
        totalAmount,
        status: 'pending',
        dueDate: getDueDate(month),
        payments: paymentRequests,
        // penaltiesApplied: false, // Initially, penalties are not applied
      });
      applyPenaltyCharges();

      Alert.alert('Success', 'Monthly payment request created successfully.');
    } catch (error) {
      console.error('Error creating payment request:', error);
      Alert.alert('Error', 'Failed to create payment request.');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create Monthly Payment Request</Text>
      <TextInput
        label="Month (e.g., November 2024)"
        mode="outlined"
        value={month}
        onChangeText={setMonth}
        style={styles.input}
        theme={{ colors: { primary: '#6200ea' } }}
      />

      {/* Dynamic Charges Input */}
      {charges.map((charge, index) => (
        <View key={index} style={styles.chargeContainer}>
          <TextInput
            label="Charge Label"
            mode="outlined"
            value={charge.label}
            onChangeText={(text) => updateCharge(index, 'label', text)}
            style={[styles.input, styles.chargeInput]}
            placeholder="Enter charge name"
            theme={{ colors: { primary: '#6200ea' } }}
          />
          <TextInput
            label="Amount"
            mode="outlined"
            keyboardType="numeric"
            value={charge.amount}
            onChangeText={(text) => updateCharge(index, 'amount', text)}
            style={[styles.input, styles.chargeInput]}
            placeholder="Enter amount"
            theme={{ colors: { primary: '#6200ea' } }}
          />
          <IconButton
            icon="delete"
            iconColor="#d32f2f"
            size={24}
            onPress={() => removeCharge(index)}
          />
        </View>
      ))}

      <Button mode="outlined" onPress={addNewCharge} style={styles.addButton}>
        Add New Charge
      </Button>

      <Button
        mode="contained"
        onPress={createPaymentRequest}
        disabled={loading}
        style={styles.button}
      >
        {loading ? 'Creating...' : 'Create Payment Request'}
      </Button>
      {loading && <ActivityIndicator animating={true} size="large" style={styles.loader} />}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FAFAFA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#6200ea',
  },
  input: {
    marginBottom: 15,
    fontSize: 16,
    paddingHorizontal: 12,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
  },
  chargeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  chargeInput: {
    flex: 1,
    marginRight: 10,
  },
  penaltyText: {
    fontSize: 16,
    color: '#d32f2f',
    marginVertical: 10,
    fontWeight: 'bold',
  },
  addButton: {
    marginVertical: 10,
  },
  button: {
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 5,
  },
  loader: {
    marginTop: 20,
  },
});

export default AdminDashboard;
