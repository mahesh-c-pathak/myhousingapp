import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Dimensions } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../FirebaseConfig';

const CardGrid: React.FC = () => {
  const [gridData, setGridData] = useState<{ rows: number; columns: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // For navigation

  useEffect(() => {
    const fetchGridData = async () => {
      const docRef = doc(db, "grids", "defaultGrid");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setGridData(docSnap.data() as { rows: number; columns: number });
      } else {
        console.error("No grid data found!");
      }
      setLoading(false);
    };

    fetchGridData();
  }, []);

  const generateNumbers = (rows: number, columns: number) => {
    const numbers = [];
    for (let row = 1; row <= rows; row++) {
      for (let col = 1; col <= columns; col++) {
        numbers.push(row * 100 + col);
      }
    }
    return numbers;
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator animating={true} />
      </View>
    );
  }

  if (!gridData) {
    return (
      <View style={styles.loaderContainer}>
        <Text>No grid data found!</Text>
      </View>
    );
  }

  const { rows, columns } = gridData;
  const data = generateNumbers(rows, columns);
  const cardWidth = Dimensions.get('window').width / columns - 10;

  const renderItem = ({ item }: { item: number }) => (
    <Card
      style={[styles.card, { width: cardWidth }]}
      mode="elevated"
      onPress={() => router.push(`/four?number=${item}`)} // Navigate to detail screen
    >
      <Card.Content>
        <Text variant="titleMedium" style={styles.cardText}>
          {item}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <FlatList
      key={`columns-${columns}`} // Force re-render when numColumns changes
      data={data}
      keyExtractor={(item) => item.toString()}
      renderItem={renderItem}
      numColumns={columns}
      contentContainerStyle={styles.container}
    />
  );
};

export default CardGrid;

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  card: {
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    textAlign: 'center',
  },
});
