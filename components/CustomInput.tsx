import React from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';

type CustomInputProps = {
  label?: string;
  value: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  error?: string;
};

const CustomInput: React.FC<CustomInputProps> = ({
  label,
  value,
  placeholder,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.errorInput]}
        value={value}
        placeholder={placeholder}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  label: {
    marginBottom: 5,
    fontSize: 14,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    // width: '100%', // Ensure it takes the full width of its parent
  },
  errorInput: {
    borderColor: 'red',
  },
  errorText: {
    marginTop: 5,
    fontSize: 12,
    color: 'red',
  },
});

export default CustomInput;
