import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Appbar, Button, IconButton, Card } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from "expo-router";
import { SessionProvider, useSession } from "../../../utils/ctx";
import { db } from "../../../FirebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useSociety } from "../../../utils/SocietyContext";
 
const index = () => {
    const router = useRouter();
    const { user } = useSession();
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const {
      societyName: societyNameParam,
      wing: wingParam,
      floorName:floorNameParam,
      flatNumber: flatNumberParam,
      userType: userTypeParam,
    } = useLocalSearchParams();
  
    const {
      societyName,
      wing,
      floorName,
      flatNumber,
      userType,
      setSocietyName,
      setWing,
      setFloorName,
      setFlatNumber,
      setUserType,
    } = useSociety();
  
    useEffect(() => {
      if (societyNameParam) setSocietyName(societyNameParam as string);
      if (wingParam) setWing(wingParam as string);
      if (floorNameParam) setFloorName(floorNameParam as string);
      if (flatNumberParam) setFlatNumber(flatNumberParam as string);
      if (userTypeParam) setUserType(userTypeParam as string);
    }, [societyNameParam, wingParam, flatNumberParam, userTypeParam]);

    
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);
    
                if (userSnap.exists()) {
                    const userInfo = userSnap.data();
                    setUserData(userInfo);
    
                    const roles = userInfo.memberRole || [];
                    const types = userInfo.memberType || [];
                    const allPermissions: Set<string> = new Set();
    
                    for (const role of roles) {
                        const roleRef = doc(db, "Roles", role);
                        const roleSnap = await getDoc(roleRef);
    
                        if (roleSnap.exists()) {
                            const roleData = roleSnap.data();
                            for (const type of types) {
                                if (roleData[type]) {
                                    Object.values(roleData[type]).forEach((items: string[]) => {
                                        items.forEach((item) => allPermissions.add(item));
                                    });
                                }
                            }
                        }
                    }
    
                    setPermissions(Array.from(allPermissions));
                } else {
                    alert("User does not exist!");
                }
            } catch (error) {
                console.error("Error fetching user data or roles:", error);
                alert("Failed to fetch data. Please try again.");
            } finally {
                setLoading(false);
            }
        };
    
        fetchUserData();
    }, [user]);
    
      

    const quickAccess = [
        { label: 'My Bills', icon: 'file-document', route: "/(myBill)?source=Member" },
        { label: 'Member Dues', icon: 'cart' },
        { label: 'user FUnds', icon: 'book-account', route: "/(accounting)"  },
        { label: 'Complains', icon: 'note-edit' },
      ];

    const directoryItems = [
        { label: 'Members', icon: 'account-group', route: "/(Members)" },
        { label: 'Vehicles', icon: 'car', route: "/(Vehicles)?source=Member" },
        { label: 'Emergency', icon: 'phone' },
        { label: 'user Staff', icon: 'account-tie' },
        ];

    const interactionItems = [
        { label: 'Meeting', icon: 'calendar-clock', permission:"Society Meeting" },
        { label: 'Announcements', icon: 'bullhorn', permission:"Announcements" },
        { label: 'Event', icon: 'calendar', permission:"Event" },
        { label: 'Voting', icon: 'thumb-up', permission:"Voting" },
        { label: 'Society Resources', icon: 'file', permission:"Society Resources" },
        { label: 'Proposal', icon: 'book-open-outline', permission:"Proposal" },
        { label: 'Suggestions', icon: 'lightbulb', permission:"Suggestion" },
        { label: 'Tasks', icon: 'clipboard-check', permission:"Task" },
    ];

    const buildingItems = [
        { label: 'Building Info', icon: 'information-outline' },
        { label: 'Rules', icon: 'gavel' },
        { label: 'Documents', icon: 'folder' },
        { label: 'Statistics', icon: 'chart-bar' },
        { label: 'Bank', icon: 'bank' },
      ];

    const gateKeeperItems = [
        { label: 'My Visitor', icon: 'gate' },
        { label: 'My Daily Helper', icon: 'account-hard-hat' },
        { label: 'Gate Keepers', icon: 'account-tie' },
        { label: 'GatePass', icon: 'card-account-details' },
        { label: 'Settings', icon: 'history' },
    ];

    // Conditionally render "Tasks" card if permission exists
    const renderGrid = (items) => (
        <View style={styles.grid}>
            {items.map((item, index) => {
                if (item.permission && !permissions.includes(item.permission)) {
                    return null;
                }
                return (
                    <TouchableOpacity
                        key={index}
                        style={styles.gridItem}
                        onPress={() => {
                            if (item.route) {
                                const params = item.params || {};
                                router.push({ pathname: item.route, params });
                            }
                        }}
                    >
                        <IconButton icon={item.icon} size={30} />
                        <Text style={styles.gridLabel}>{item.label}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

  return (
    <View style={styles.container}>
        {/* Top Appbar */}
      <Appbar.Header >
        <Appbar.Action icon="menu" onPress={() => {}} />
        <Appbar.Content title={`${wing || "-"} ${floorName || "-"} Flat: ${flatNumber || "-"}`} />
        <IconButton icon="bell" onPress={() => {}} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Quick Access Section */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          {renderGrid(quickAccess)}
        </Card>

        {/* Directory Section */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Directory</Text>
          {renderGrid(directoryItems)}
        </Card>

        {/* Interaction Section */}
        <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Interaction</Text>
            {renderGrid(interactionItems)}
        </Card>

        {/* My Building Section */}
        <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>My Building</Text>
            {renderGrid(buildingItems)}
        </Card>

        {/* Gate Keeper Section */}
        <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Visitor</Text>
            {renderGrid(gateKeeperItems)}
        </Card>
        
      </ScrollView>
      



    </View>
  )
}


const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8f9fa',
    },
    scrollContent: {
        padding: 16,
      },
    grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '23%',
    alignItems: 'center',
    marginVertical: 8,
  },
  sectionCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  gridLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginVertical: 8,
  },

});

export default index