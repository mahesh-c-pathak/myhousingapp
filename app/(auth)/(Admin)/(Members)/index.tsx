import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { IconButton, FAB } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';


const MembersScreen: React.FC = () => {
  

  const [selectedButton, setSelectedButton] = useState<string | null>('A');
  const router = useRouter(); // Router for navigation

  const handlePress = (button: string) => {
    setSelectedButton(button);
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => {}} />
        <Text style={styles.headerTitle}>Members</Text>
        <View style={styles.headerIcons}>
          <IconButton icon="magnify" onPress={() => {}} />
          <IconButton icon="dots-vertical" onPress={() => {}} />
        </View>
      </View>

      {/* Summary Section */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>Members: 0</Text>
        <Text style={styles.summaryText}>Population: 0</Text>
      </View>

      {/* Buttons Section */}
      <View style={styles.buttonsContainer}>
        {['A', 'B', 'C'].map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.button,
              selectedButton === item && styles.buttonSelected,
            ]}
            onPress={() => handlePress(item)}
          >
            <Text
              style={[
                styles.buttonText,
                selectedButton === item && styles.buttonTextSelected,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* No Members Section */}
      <View style={styles.noMembersContainer}>
        <IconButton icon="file-document-outline" size={64} color="#ccc" />
        <Text style={styles.noMembersText}>No Members.</Text>
      </View>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          router.push('/AddMember'); // Navigate to AddMember screen
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#6200ee',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#6200ee',
  },
  summaryText: {
    color: '#fff',
    fontSize: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  button: {
    borderWidth: 1,
    borderColor: '#6200ee',
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 5,
  },
  buttonSelected: {
    backgroundColor: '#6200ee',
  },
  buttonText: {
    fontSize: 16,
    color: '#6200ee',
    textAlign: 'center',
  },
  buttonTextSelected: {
    color: '#fff',
  },
  noMembersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  noMembersText: {
    color: '#ccc',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#6200ee',
  },
});

export default MembersScreen;
