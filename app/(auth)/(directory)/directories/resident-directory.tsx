import React, { useState, useEffect } from "react";
import { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../../FirebaseConfig";
import { List } from "react-native-paper";
import { useLocalSearchParams, useNavigation } from "expo-router";

interface Bldg {
  id: string;
  directoryId: string;
  name: string; 
}

const ResidentDirectory = () => {
  const [buildings, setBuildings] = useState<Bldg[]>([]);
  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
        headerTitle:"Resident Directory",
    })
  }, []);

  useEffect(() => {
    const fetchBuildings = async () => {
      const q = query(collection(db, "Buildings"), where("directoryId", "==", "resident-directory"));
      const snapshot = await getDocs(q);
      setBuildings(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Bldg[]);
    };

    fetchBuildings();
  }, []);

  return (
    <ScrollView>
      {buildings.map((building) => (
        <List.Item
          key={building.id}
          title={building.name}
          onPress={() => router.push(`/buildings/${building.id}`)}
        />
      ))}
    </ScrollView>
  );
};

export default ResidentDirectory;
