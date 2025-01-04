import React, { useState, useEffect } from "react";
import { ScrollView } from "react-native";
import DirectoryCard from "../../../utils/directory/DirectoryCard";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../FirebaseConfig";
import { useLocalSearchParams, useNavigation } from "expo-router";

interface Dirc {
  id: string;
  name: string;
}

const Dashboard = () => {
  const [directories, setDirectories] = useState<Dirc[]>([]);
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
        headerTitle:"Society Directory",
    })
  }, []);

  useEffect(() => {
    const fetchDirectories = async () => {
      const snapshot = await getDocs(collection(db, "Directories"));
      setDirectories(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Dirc[]);
    };

    fetchDirectories();
  }, []);

  return (
    <ScrollView>
      {directories.map((dir) => (
        <DirectoryCard key={dir.id} id={dir.id} name={dir.name} />
      ))}
    </ScrollView>
  );
};

export default Dashboard;
