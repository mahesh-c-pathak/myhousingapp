import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';

const four = () => {
  
  const { number } = useLocalSearchParams(); // Retrieve card number from query params

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.text}>
        Card Number: {number}
      </Text>
    </View>
  );
  
}

export default four

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
      },
      text: {
        textAlign: 'center',
      },
})