import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

const PaymentDatePicker = ({
  initialDate,
  onDateChange,
}: {
  initialDate?: Date;
  onDateChange: (date: Date) => void;
}) => {
  const [selectedDate, setSelectedDate] = useState(initialDate ?? new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (date) {
      setSelectedDate(date);
      onDateChange(date);
    }
    setShowDatePicker(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        style={styles.dateInputContainer}
      >
        <TextInput
          style={styles.dateInput}
          value={formatDate(selectedDate)}
          editable={false}
        />
        <Text style={styles.calendarIcon}>📅</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};

export default PaymentDatePicker;

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  dateInputContainer: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  dateInput: { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 4, padding: 10, fontSize: 16 },
  calendarIcon: { fontSize: 20, marginLeft: 8 },
});
