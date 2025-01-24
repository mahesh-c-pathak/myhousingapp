import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Dimensions, ScrollView } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../FirebaseConfig';

const CardGrid: React.FC = () => {
  const [gridData, setGridData] = useState<{ rows: number; columns: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
  // const cardWidth = Dimensions.get('window').width / columns - 10;

  const renderItem = ({ item }: { item: number }) => (
    <Card
      style={[styles.card]}
      mode="elevated"
      onPress={() => router.push(`/four?number=${item}`)}
    >
      <Card.Content>
        <Text variant="titleMedium" style={styles.cardText}>
          {item}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView horizontal contentContainerStyle={styles.scrollViewContainer}>
      <FlatList
        key={`columns-${columns}`}
        data={data}
        keyExtractor={(item) => item.toString()}
        renderItem={renderItem}
        numColumns={columns}
        contentContainerStyle={styles.container}
        scrollEnabled={false} // Disable FlatList's vertical scrolling
      />
    </ScrollView>
  );
};

export default CardGrid;

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollViewContainer: {
    flexDirection: 'row',
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
