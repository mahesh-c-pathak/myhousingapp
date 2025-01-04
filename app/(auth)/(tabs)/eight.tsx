import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, Card, Title, Paragraph } from 'react-native-paper';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../FirebaseConfig';
import { useSession } from '../../../utils/ctx';

// Define the structure of the payment history
interface PaymentHistoryItem {
  id: string;
  month: string;
  amount: number;
  status: string;
  paidAt: string | null;
}

const ResidentPaymentHistory: React.FC = () => {
  const { user } = useSession();
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      const paymentHistoryRef = collection(db, 'maintenance_requests');
      
      // Listen for real-time changes
      const unsubscribe = onSnapshot(paymentHistoryRef, (snapshot) => {
        const historyData: PaymentHistoryItem[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          const userPayment = data.payments[user.uid];

          if (userPayment) {
            historyData.push({
              id: doc.id,
              month: data.month,
              amount: data.amount,
              status: userPayment.status,
              paidAt: userPayment.paidAt,
            });
          }
          
        });

        setPaymentHistory(historyData);
        setLoading(false);
      });

      // Cleanup the listener when the component unmounts
      return () => unsubscribe();
    };

    fetchPaymentHistory();
  }, []); // Re-run the effect whenever the user changes (e.g., on login)

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Payment History</Text>
      {loading ? (
        <ActivityIndicator animating={true} size="large" />
      ) : (
        <FlatList
          data={paymentHistory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.cardTitle}>{item.month}</Title>
                <Paragraph style={styles.cardParagraph}>Amount: ${item.amount}</Paragraph>
                <Paragraph style={styles.cardParagraph}>Status: {item.status}</Paragraph>
                <Paragraph style={styles.cardParagraph}>
                  Paid At: {item.paidAt ? new Date(item.paidAt).toLocaleDateString() : 'N/A'}
                </Paragraph>
              </Card.Content>
            </Card>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No payment history available</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f6f6f6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#6200ea', // Bright color for title
  },
  card: {
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'white',
    elevation: 3, // Slight shadow to lift the card
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000', // Dark text for contrast
  },
  cardParagraph: {
    fontSize: 16,
    marginVertical: 4,
    color: '#333333', // Dark text color for readability
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 20,
  },
});

export default ResidentPaymentHistory;
