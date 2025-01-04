import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../FirebaseConfig';

export default function HomeScreen() {
  const [rows, setRows] = useState('');
  const [columns, setColumns] = useState('');
  const router = useRouter();

  const handleNext = async () => {
    if (rows && columns) {
      // Save grid structure to Firebase
      const gridData = { rows: parseInt(rows), columns: parseInt(columns) };
      await setDoc(doc(db, "grids", "defaultGrid"), gridData);

      // Navigate to Card Grid screen
      router.push(`/two`);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.heading}>
        Card Grid Generator
      </Text>
      <TextInput
        label="Number of Rows"
        value={rows}
        onChangeText={setRows}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        label="Number of Columns"
        value={columns}
        onChangeText={setColumns}
        keyboardType="numeric"
        style={styles.input}
      />
      <Button mode="contained" onPress={handleNext} style={styles.button}>
        Next
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  heading: {
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
});
