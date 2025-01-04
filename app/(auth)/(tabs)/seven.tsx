import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Text, Card, Title, Paragraph, Divider, Button } from 'react-native-paper';
import { collection, onSnapshot } from 'firebase/firestore';  // Ensure onSnapshot is correctly imported
import { db } from '../../../FirebaseConfig';

// Define the interface for payment status
interface Payment {
  status: 'pending' | 'paid';
  paidAt: string | null;
}

// Define the type for the report data
interface Report {
  id: string;
  month: string;
  amount: number;
  totalResidents: number;
  paidResidents: number;
  pendingResidents: number;
}

const AdminMonthlyReport: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch and listen for real-time updates using onSnapshot
  const fetchMonthlyReports = () => {
    setLoading(true);
    setError(null);

    try {
      // Ensure that the onSnapshot is being called on the collection
      const unsubscribe = onSnapshot(collection(db, 'maintenance_requests'), (snapshot) => {
        const reportData: Report[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          const payments = data?.payments ?? {}; // Ensure payments is an object

          if (typeof payments !== 'object') return; // Skip invalid entries

          const paymentsArray = Object.values(payments) as Payment[];

          const totalResidents = Object.keys(payments).length;
          const paidResidents = paymentsArray.filter((p: Payment) => p.status === 'paid').length;
          const pendingResidents = totalResidents - paidResidents;

          reportData.push({
            id: doc.id,
            month: data.month ?? 'Unknown Month',
            amount: data.amount ?? 0,
            totalResidents,
            paidResidents,
            pendingResidents,
          });
        });

        setReports(reportData);
        setLoading(false); // Stop loading once data is received
      });

      // Cleanup function to unsubscribe from real-time updates
      return unsubscribe;
    } catch (err) {
      console.error('Error fetching monthly reports:', err);
      setError('Failed to load reports. Please check your connection and try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = fetchMonthlyReports();

    // Cleanup the listener when the component is unmounted
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []); // Empty dependency array ensures this is only run once when the component mounts

  const renderItem = ({ item }: { item: Report }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.cardTitle}>{item.month}</Title>
        <Paragraph style={styles.cardParagraph}>Amount: ${item.amount.toFixed(2)}</Paragraph>
        <Paragraph style={styles.cardParagraph}>Total Residents: {item.totalResidents}</Paragraph>
        <Paragraph style={styles.cardParagraph}>Paid: {item.paidResidents}</Paragraph>
        <Paragraph style={styles.cardParagraph}>Pending: {item.pendingResidents}</Paragraph>
      </Card.Content>
      <Divider />
      <Card.Actions>
        <Button
          mode="contained"
          onPress={() => Alert.alert('Details', `Viewing details for ${item.month}`)}
        >
          View Details
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monthly Maintenance Reports</Text>
      {loading ? (
        <ActivityIndicator animating={true} size="large" style={styles.loader} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={fetchMonthlyReports}>
            Retry
          </Button>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.emptyText}>No reports available</Text>}
          contentContainerStyle={reports.length === 0 ? styles.emptyList : undefined}
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
    color: '#6200ea',
  },
  loader: {
    marginTop: 20,
  },
  card: {
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'white',
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  cardParagraph: {
    fontSize: 16,
    marginVertical: 4,
    color: '#333',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#d32f2f',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 20,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});

export default AdminMonthlyReport;
