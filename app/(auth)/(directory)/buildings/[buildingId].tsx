import React, { useState, useEffect } from "react";
import { SectionList, StyleSheet, View, Text } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { collection, query, where, getDocs } from "firebase/firestore";

import { db } from "../../../../FirebaseConfig";
import ResidentCard from "../../../../utils/directory/ResidentCard";

// Define the Resident interface
interface Res {
  id: string;
  name: string;
  buildingId: string;
  contact: string;
  floor: string;
  photoUrl: string;
}

const BuildingDetails = () => {
  const { buildingId } = useLocalSearchParams();
  const [sections, setSections] = useState<{ title: string; data: Res[] }[]>([]);
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
        headerTitle:'Residents of '+buildingId,
    })
  }, []);

  useEffect(() => {
    const fetchResidents = async () => {
      const q = query(collection(db, "Residents"), where("buildingId", "==", buildingId));
      const snapshot = await getDocs(q);

      const residents = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Res[];
      type GroupedResidents = { [floor: string]: Res[] };

      // Group residents by floor
      const grouped = residents.reduce((acc: GroupedResidents, resident) => {
        const floor = resident.floor || "Unknown Floor";
        if (!acc[floor]) {
          acc[floor] = [];
        }
        acc[floor].push(resident);
        return acc;
      }, {});

      // Convert grouped data into SectionList format
      const formattedSections = Object.keys(grouped).map((floor) => ({
        title: floor,
        data: grouped[floor],
      }));

      setSections(formattedSections);
    };

    fetchResidents();
  }, [buildingId]);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ResidentCard name={item.name} contact={item.contact} photoUrl={item.photoUrl} />
      )}
      renderSectionHeader={({ section: { title } }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>{title}</Text>
        </View>
      )}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  sectionHeader: {
    backgroundColor: "#f4f4f4",
    padding: 8,
    borderRadius: 5,
    marginBottom: 5,
  },
  sectionHeaderText: {
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default BuildingDetails;
