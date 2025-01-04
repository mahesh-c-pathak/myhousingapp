import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { Appbar, Button, Menu, Provider } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from "expo-router";
import { db } from "../../../../FirebaseConfig";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { useSociety } from "../../../../utils/SocietyContext";

const AddVehicleDetails = () => {
  const { source, vehicleNumber: existingVehicleNumber } = useLocalSearchParams(); // Retrieve the source and vehicleNumber
  const localParams = useLocalSearchParams();
  const societyContext = useSociety();

  // Determine which context to use based on source
  const societyName = source === "Admin" ? localParams.societyName : societyContext.societyName;
  const wing = source === "Admin" ? localParams.wing : societyContext.wing;
  const flatNumber = source === "Admin" ? localParams.flatNumber : societyContext.flatNumber;
  const floorName = source === "Admin" ? localParams.floorName : societyContext.floorName;

  const [type, setType] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [parkingAllotment, setParkingAllotment] = useState('');
  const [note, setNote] = useState('');
  const [image, setImage] = useState(null);
  const router = useRouter();

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Fetch existing vehicle data
  useEffect(() => {
    const fetchVehicleData = async () => {
      if (existingVehicleNumber) {
        try {
          const societyRef = doc(db, "Societies", societyName);
          const docSnap = await getDoc(societyRef);

          if (docSnap.exists()) {
            const vehicleData = docSnap.data()?.wings?.[wing]?.floorData?.[floorName]?.[flatNumber]?.Vehicles?.[existingVehicleNumber];
            if (vehicleData) {
              setType(vehicleData.type);
              setParkingAllotment(vehicleData.parkingAllotment || '');
              setNote(vehicleData.note || '');
              setImage(vehicleData.image || null);
              setVehicleNumber(existingVehicleNumber); // Prefill vehicle number
            }
          }
        } catch (error) {
          console.error("Error fetching vehicle data:", error);
          alert("Failed to fetch vehicle data.");
        }
      }
    };

    fetchVehicleData();
  }, [existingVehicleNumber, societyName, wing, floorName, flatNumber]);

  const handleSave = async () => {
    if (!vehicleNumber || !type) {
      alert("Please fill in the required fields");
      return;
    }

    const vehicleData = {
      type,
      parkingAllotment: source === "Admin" ? parkingAllotment : "",
      note: source === "Admin" ? note : "",
      image: image || null,
    };

    try {
      const societyRef = doc(db, "Societies", societyName);
      await updateDoc(societyRef, {
        [`wings.${wing}.floorData.${floorName}.${flatNumber}.Vehicles.${vehicleNumber}`]: vehicleData,
      });

      Alert.alert(
        "Success",
        existingVehicleNumber ? "Vehicle updated successfully!" : "Vehicle added successfully!",
        [{ text: "OK", onPress: () => router.replace("/(Vehicles)") }]
      );
    } catch (error) {
      console.error("Error saving vehicle data:", error);
      alert("Failed to save vehicle data. Please try again.");
    }
  };

  return (
    <Provider>
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.goBack()} />
          <Appbar.Content title={existingVehicleNumber ? "Update Vehicle Details" : "Add Vehicle Details"} />
        </Appbar.Header>

        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Text style={styles.label}>Flat Number : {wing} {flatNumber}</Text>

          <Text style={styles.label}>Type</Text>
          <Menu
            visible={menuVisible}
            onDismiss={closeMenu}
            anchor={
              <TouchableOpacity
                style={styles.dropdown}
                onPress={openMenu}
              >
                <Text style={{ color: type ? '#000' : '#aaa' }}>{type || 'Select'}</Text>
              </TouchableOpacity>
            }
          >
            <Menu.Item onPress={() => { setType('Car'); closeMenu(); }} title="Car" />
            <Menu.Item onPress={() => { setType('Bike'); closeMenu(); }} title="Bike" />
          </Menu>

          <Text style={styles.label}>Vehicle Number (Ex. GJ27RJ1234)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter vehicle number"
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
            editable={!existingVehicleNumber} // Disable editing for existing vehicle
          />

          {source === "Admin" && (
            <>
              <Text style={styles.label}>Parking Allotment (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter parking allotment"
                value={parkingAllotment}
                onChangeText={setParkingAllotment}
              />

              <Text style={styles.label}>Note (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter note"
                value={note}
                onChangeText={setNote}
              />
            </>
          )}

          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            <Text style={styles.imagePickerText}>Choose Image</Text>
          </TouchableOpacity>

          {image && (
            <Image source={{ uri: image }} style={styles.imagePreview} />
          )}

          <Button
            mode="contained"
            style={styles.saveButton}
            onPress={handleSave}
          >
            Save
          </Button>
        </ScrollView>
      </View>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  imagePicker: {
    backgroundColor: '#6200ee',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePickerText: {
    color: '#fff',
    fontSize: 16,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 10,
  },
});

export default AddVehicleDetails;
