import React, { useEffect, useState } from 'react';
import { StyleSheet, Alert, View, FlatList } from 'react-native';
import { Text, Button, ActivityIndicator, Card } from 'react-native-paper';
import { collection, doc, updateDoc, onSnapshot, QuerySnapshot, getDocs } from 'firebase/firestore';
import { useSession } from "../../../utils/ctx";
import { db } from '../../../FirebaseConfig';

interface Charge {
  label: string;
  amount: number;
}

interface Payment {
  id: string;
  month: string;
  totalAmount: number;
  charges: Charge[];
  DueDate: any;
  penaltyCharge: number;  // Added penalty charge field
  totalAmountToPay: number; // Calculated field for total amount to pay
}

const ResidentDashboard: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useSession();

  useEffect(() => {
    const fetchPaymentRequests = () => {
      // Listen for real-time updates from the 'maintenance_requests' collection
      const unsubscribe = onSnapshot(
        collection(db, 'maintenance_requests'),
        (snapshot: QuerySnapshot) => {
          const userPayments: Payment[] = [];

          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const userPayment = data?.payments?.[user.uid];

            // Check if the user's payment status is pending
            if (userPayment && userPayment.status === 'pending') {
              const charges = data?.charges ?? []; // Provide a default empty array
              const totalAmount = data?.totalAmount ?? 0; // Provide a default value 0
              const DueDate = data?.dueDate ?? 0; // Provide a default value 0
              const penaltyCharge = userPayment.penaltyCharge ?? 0; // Retrieve penalty charge
              const totalAmountToPay = totalAmount + penaltyCharge; // Total amount to pay

              userPayments.push({
                id: docSnap.id,
                month: data?.month ?? 'Unknown Month', // Provide a default value
                totalAmount: totalAmount,
                charges: charges,
                DueDate: new Date(DueDate).toLocaleDateString(),
                penaltyCharge: penaltyCharge,  // Add penalty charge
                totalAmountToPay: totalAmountToPay, // Add total amount to pay
              });
            }
          });

          setPayments(userPayments);
        },
        (error) => {
          console.error('Error fetching real-time updates:', error);
          Alert.alert('Error', 'Failed to load payment requests in real-time');
        }
      );

      // Cleanup listener on component unmount
      return () => unsubscribe();
    };

    fetchPaymentRequests();
  }, []);

  const handlePayment = async (paymentId: string, totalAmountToPay: number) => {
    setLoading(true);
    try {
      const paymentDoc = doc(db, 'maintenance_requests', paymentId);
      const snapshot = await getDocs(collection(db, 'maintenance_requests'));
      const requestData = snapshot.docs.find((doc) => doc.id === paymentId)?.data();

      if (requestData) {
        const userPayment = requestData.payments?.[user.uid];
        const totalAmount = requestData.totalAmount; // Total amount for the request

        if (userPayment?.status === 'pending') {
          // Mark payment as paid and store payment details (status, paidAt, amount)
          await updateDoc(paymentDoc, {
            [`payments.${user.uid}.status`]: 'paid',
            [`payments.${user.uid}.paidAt`]: new Date().toISOString(),
            [`payments.${user.uid}.dueAmount`]: 0, // Store the amount the user paid
            [`payments.${user.uid}.penaltyCharge`]: 0, // Reset penalty charge after payment
          });

          Alert.alert('Success', 'Payment successful!');
        } else {
          Alert.alert('Notice', 'Payment already processed!');
        }
      }
    } catch (error) {
      console.error('Payment Error:', error);
      Alert.alert('Error', 'Failed to process payment');
    }
    setLoading(false);
  };

  const renderCharges = (charges: Charge[]) => (
    <>
      {charges.map((charge, index) => (
        <Text key={index} style={styles.chargeText}>
          {charge.label}: ${charge?.amount?.toFixed(2) ?? '0.00'}
        </Text>
      ))}
    </>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pending Payments</Text>

      {loading ? (
        <ActivityIndicator animating={true} size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardTitle}>{item.month}</Text>
                <Text style={styles.cardSubtitle}>
                  Total Dues: ${item?.totalAmount?.toFixed(2) ?? '0.00'}
                </Text>
                <Text style={styles.cardSubtitle}>Charges Breakdown:</Text>
                {renderCharges(item.charges)}
                <Text style={styles.cardSubtitle}>
                  Due Date: {item?.DueDate}
                </Text>
                <Text style={styles.cardSubtitle}>
                  Penalty Charge: ${item?.penaltyCharge?.toFixed(2) ?? '0.00'}
                </Text>
                <Text style={styles.cardSubtitle}>
                  Total Amount to Pay: ${item?.totalAmountToPay?.toFixed(2) ?? '0.00'}
                </Text>
              </Card.Content>
              <Card.Actions>
                <Button
                  mode="contained"
                  onPress={() => handlePayment(item.id, item.totalAmountToPay)}
                  disabled={loading}
                >
                  Pay Now
                </Button>
              </Card.Actions>
            </Card>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No pending payments.</Text>
          }
        />
      )}
    </View>
  );
};

export default ResidentDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f6f6f6',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#6200ea',
  },
  loader: {
    marginTop: 20,
  },
  card: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: 'white',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#000',
    marginVertical: 4,
  },
  chargeText: {
    fontSize: 14,
    color: '#000',
    paddingLeft: 10,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: 'gray',
    marginTop: 20,
  },
});
