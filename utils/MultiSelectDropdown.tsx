import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";

type Member = {
  id: string;
  name: string;
};

interface MultiSelectDropdownProps {
  members: Member[];
  onConfirm: (selectedMembers: Member[]) => void;
}

export default function MultiSelectDropdown({
  members,
  onConfirm,
}: MultiSelectDropdownProps) {
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleMemberSelection = (member: Member) => {
    const isSelected = selectedMembers.some((m) => m.id === member.id);
    if (isSelected) {
      setSelectedMembers((prev) =>
        prev.filter((m) => m.id !== member.id)
      );
    } else {
      setSelectedMembers((prev) => [...prev, member]);
    }
  };

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Dropdown Header */}
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setIsModalVisible(true)}
      >
        <Text style={styles.dropdownText}>
          {selectedMembers.length
            ? `${selectedMembers.length} selected`
            : "Select Members"}
        </Text>
        <AntDesign name="caretdown" size={16} />
      </TouchableOpacity>

      {/* Selected Members */}
      {selectedMembers.length > 0 && (
        <View style={styles.selectedContainer}>
          {selectedMembers.map((member) => (
            <View key={member.id} style={styles.selectedItem}>
              <Text style={styles.selectedText}>{member.name}</Text>
              <TouchableOpacity
                onPress={() => toggleMemberSelection(member)}
              >
                <AntDesign name="close" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Modal for Selection */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Search Input */}
            <TextInput
              style={styles.searchInput}
              placeholder="Search Members"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {/* Member List */}
            <FlatList
              data={filteredMembers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.memberItem,
                    selectedMembers.some((m) => m.id === item.id) &&
                      styles.memberSelected,
                  ]}
                  onPress={() => toggleMemberSelection(item)}
                >
                  <Text style={styles.memberText}>{item.name}</Text>
                  {selectedMembers.some((m) => m.id === item.id) && (
                    <AntDesign name="check" size={16} color="green" />
                  )}
                </TouchableOpacity>
              )}
            />
            {/* Confirm Button */}
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => {
                onConfirm(selectedMembers);
                setIsModalVisible(false);
              }}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  dropdownText: {
    fontSize: 16,
    color: "#333",
  },
  selectedContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  selectedItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eaeaea",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    margin: 4,
  },
  selectedText: {
    marginRight: 8,
    color: "#333",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 16,
    maxHeight: "80%",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  memberItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  memberSelected: {
    backgroundColor: "#d4f8d4",
  },
  memberText: {
    fontSize: 16,
    color: "#333",
  },
  confirmButton: {
    backgroundColor: "#6200ee",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
