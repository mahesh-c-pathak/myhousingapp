import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, Card, ActivityIndicator } from 'react-native-paper';
import { db } from '../../../FirebaseConfig';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// Define the type for user data
interface User {
  id: string;
  email: string;
  approved: boolean;
  role: string
}

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userCollection = await getDocs(collection(db, 'users'));
        const userList = userCollection.docs.map((doc) => ({
          id: doc.id,
          email: doc.data().email, // Ensure the email is correctly mapped
          approved: doc.data().approved || false, // Default to false if not available
          role: doc.data().role
        })) as User[];
        setUsers(userList);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const approveUser = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { approved: true });
      alert('User approved successfully');
      // Update the local state to reflect the approval
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, approved: true } : user
        )
      );
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Error approving user');
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Admin Dashboard</Text>
      {loading ? (
        <ActivityIndicator animating={loading} size="large" color="#6200ea" />
      ) : (
        <>
          {users.length === 0 ? (
            <Text>No users found.</Text>
          ) : (
            users.map((user) => (
              <Card key={user.id} style={styles.userCard}>
                <Card.Content>
                  <Text variant="bodyLarge" style={[styles.email, styles.text]}>
                    Email: {user.email}
                  </Text>
                  <Text style={[styles.text, styles.status]}>
                    Status: {user.approved ? 'Approved' : 'Pending'}
                  </Text>
                  <Text style={[styles.text, styles.status]}>
                    role: {user.role }
                  </Text>
                  {!user.approved && (
                    <Button mode="contained" onPress={() => approveUser(user.id)} style={styles.approveButton}>
                      Approve
                    </Button>
                  )}
                </Card.Content>
              </Card>
            ))
          )}
        </>
      )}
    </View>
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
    color: '#6200ea', // Bright color for title
  },
  userCard: {
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  email: {
    fontWeight: '500',
    marginBottom: 8,
  },
  text: {
    color: '#000', // Explicitly setting text color to black
  },
  status: {
    marginBottom: 8,
  },
  approveButton: {
    marginTop: 10,
  },
});

export default AdminDashboard;
