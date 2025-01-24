import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Platform,
  TextInput,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";

type OptionItem = {
  value: string;
  label: string;
};

interface DropDownProps {
  data: OptionItem[];
  onChange: (values: string[]) => void;
  placeholder: string;
  initialValues?: string[];
}

export default function DropdownMultiSelect({
  data,
  onChange,
  placeholder,
  initialValues = [],
}: DropDownProps) {
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>(initialValues);
  const [searchText, setSearchText] = useState("");

  const toggleModal = useCallback(() => setModalVisible(!isModalVisible), [isModalVisible]);

  const onSelect = useCallback(
    (item: OptionItem) => {
      let updatedValues;
      if (selectedValues.includes(item.value)) {
        updatedValues = selectedValues.filter((value) => value !== item.value);
      } else {
        updatedValues = [...selectedValues, item.value];
      }
      setSelectedValues(updatedValues);
    },
    [selectedValues]
  );

  const confirmSelection = () => {
    onChange(selectedValues);
    setModalVisible(false); // Close modal on confirm
  };

  const isSelected = (value: string) => selectedValues.includes(value);

  const filteredData = data.filter((item) =>
    item.label.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Dropdown Button */}
      <TouchableOpacity style={styles.button} onPress={toggleModal}>
        <Text style={styles.text}>
          {placeholder} {selectedValues.length > 0 && `(${selectedValues.length} selected)`}
        </Text>
        <AntDesign name="caretdown" size={16} />
      </TouchableOpacity>

      {/* Modal for Dropdown */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={toggleModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Search Bar */}
            <TextInput
              style={styles.searchInput}
              placeholder="Search Members"
              value={searchText}
              onChangeText={setSearchText}
            />
            <FlatList
              keyExtractor={(item) => item.value}
              data={filteredData}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.optionItem,
                    isSelected(item.value) && styles.selectedOptionItem,
                  ]}
                  onPress={() => onSelect(item)}
                >
                  <Text>{item.label}</Text>
                  {isSelected(item.value) && (
                    <AntDesign name="check" size={16} color="green" />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              style={styles.optionList}
              ListEmptyComponent={
                <Text style={styles.noResultsText}>No members found</Text>
              }
            />
            <TouchableOpacity style={styles.confirmButton} onPress={confirmSelection}>
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Selected Chips */}
      <View style={styles.chipContainer}>
        {selectedValues.map((value) => {
          const item = data.find((d) => d.value === value);
          if (!item) return null;
          return (
            <View key={value} style={styles.chip}>
              <Text style={styles.chipText}>{item.label}</Text>
              <TouchableOpacity
                onPress={() =>
                  setSelectedValues((prev) => prev.filter((v) => v !== value))
                }
                style={styles.closeIcon}
              >
                <AntDesign name="close" size={12} color="white" />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  button: {
    height: 50,
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  text: {
    fontSize: 15,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007BFF",
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 5,
  },
  chipText: {
    color: "white",
    marginRight: 5,
  },
  closeIcon: {
    justifyContent: "center",
    alignItems: "center",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "red",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    maxHeight: "80%",
  },
  searchInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  optionList: {
    marginBottom: 10,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
  },
  selectedOptionItem: {
    backgroundColor: "lightgreen",
  },
  separator: {
    height: 1,
    backgroundColor: "#ccc",
  },
  confirmButton: {
    backgroundColor: "#6200EE",
    borderRadius: 5,
    paddingVertical: 10,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  noResultsText: {
    textAlign: "center",
    color: "#888",
    marginTop: 10,
  },
});
