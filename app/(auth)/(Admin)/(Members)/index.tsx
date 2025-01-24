import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { IconButton, FAB, Avatar } from 'react-native-paper';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';

import { db } from "@/FirebaseConfig";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

import { useSession } from "@/utils/ctx";
import { useSociety } from "@/utils/SocietyContext";

type SocietyDetails = {
  memberRole?: string[];
  myWing?: {
    [wing: string]: {
      floorData?: {
        [floor: string]: {
          [flatNumber: string]: {
            userType?: string;
            userStatus?: string;
          };
        };
      };
    };
  };
};

type SocietyObj = {
  [societyName: string]: SocietyDetails;
};

const MembersScreen: React.FC = () => {
  const { user } = useSession();
  const { societyName } = useSociety();
  
  const [selectedButton, setSelectedButton] = useState<string | null>('A');
  const router = useRouter(); // Router for navigation

  const [cards, setCards] = useState<any[]>([]);

  useEffect(() => {
    const fetchSocieties = async (givenSocietyName: string) => {
      try {
        const usersCollectionRef = collection(db, "users"); // Reference to the users collection
        const usersSnapshot = await getDocs(usersCollectionRef); // Fetch all documents in the users collection
    
        const cardList: any[] = [];
    
        // Iterate through all user documents
        usersSnapshot.forEach((userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userName = userData.name;
            const userId = userDoc.id;
    
            // Check if `mySociety` exists before iterating
            if (userData.mySociety) {
              userData.mySociety.forEach((societyObj: SocietyObj) => {
                const [societyName, societyDetails] = Object.entries(societyObj)[0];
    
                // Filter for the given societyName
                if (societyName === givenSocietyName && societyDetails.myWing) {
                  Object.entries(societyDetails.myWing).forEach(([wing, wingData]) => {
                    if (wingData.floorData) {
                      Object.entries(wingData.floorData).forEach(
                        ([floorName, flats]: [string, any]) => {
                          Object.entries(flats).forEach(
                            ([flatNumber, flatDetails]: [string, any]) => {
                              // Filter based on userStatus
                              if (flatDetails.userStatus === "Pending Approval") {
                                cardList.push({
                                  id: `${societyName}-${flatNumber}`,
                                  societyName,
                                  role: `${wing} ${flatNumber} ${flatDetails.userType || "Owner"}`,
                                  flatDetails,
                                  wing,
                                  floorName,
                                  flatNumber,
                                  userName,
                                  userId,
                                });
                              }
                            }
                          );
                        }
                      );
                    }
                  });
                }
              });
            }
          }
        });
    
        setCards(cardList); // Update cards state with all fetched data
      } catch (error) {
        console.error("Error fetching society data:", error);
      }
    };
    

      fetchSocieties(societyName);
    }, []);
  
   
  const handlePress = (button: string) => {
    setSelectedButton(button);
  };

  const renderPendingAprovalItem = ({ item }: { item: any }) => {
    const { userName, wing, floorName, flatDetails, role } = item;
    const { userType } = flatDetails;
  
    return (
      <TouchableOpacity
       style={styles.cardContainer}
       onPress={() => {
        router.push({
            pathname: "/ApproveMember",
            params: {
                itemdetail: JSON.stringify(item),
                // Add other necessary params if available
            },
        }); 
      }}
       >
        {/* Avatar */}
        <Avatar.Text
          size={40}
          label={userName?.charAt(0)?.toUpperCase() || '?'}
          style={styles.avatar}
        />
  
        {/* Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userDetails}>
            {wing} {role.split(' ')[1]} • {userType}
          </Text>
        </View>
  
        {/* Call Icon */}
        <IconButton icon="phone" iconColor="#6200ee" onPress={() => {}} />
      </TouchableOpacity>
    );
  };

  

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => {}} iconColor="white" />
        <Text style={styles.headerTitle}>Members</Text>
        <View style={styles.headerIcons}>
          <IconButton icon="magnify" onPress={() => {}} iconColor="white" />
          <IconButton icon="dots-vertical" onPress={() => {}} iconColor="white" />
        </View>
      </View>

      {/* Summary Section */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>Members: 0</Text>
        <Text style={styles.summaryText}>Population: 0</Text>
      </View>

      {/* Payment Request Section */}
      {cards.length > 0 && (
                <View>
                    <FlatList
                        data={cards}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={renderPendingAprovalItem}
                        
                        scrollEnabled={false} // Disable scrolling
                    />
                </View>
            )}

      {/* Buttons Section */}
      <View style={styles.buttonsContainer}>
        {['A', 'B', 'C'].map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.button,
              selectedButton === item && styles.buttonSelected,
            ]}
            onPress={() => handlePress(item)}
          >
            <Text
              style={[
                styles.buttonText,
                selectedButton === item && styles.buttonTextSelected,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* No Members Section */}
      <View style={styles.noMembersContainer}>
        <IconButton icon="file-document-outline" size={64} iconColor="#ccc" />
        <Text style={styles.noMembersText}>No Members.</Text>
      </View>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          router.push('/AddMember'); // Navigate to AddMember screen
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#6200ee',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
    color: '#fff',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#6200ee',
  },
  summaryText: {
    color: '#fff',
    fontSize: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  button: {
    borderWidth: 1,
    borderColor: '#6200ee',
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 5,
  },
  buttonSelected: {
    backgroundColor: '#6200ee',
  },
  buttonText: {
    fontSize: 16,
    color: '#6200ee',
    textAlign: 'center',
  },
  buttonTextSelected: {
    color: '#fff',
  },
  noMembersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  noMembersText: {
    color: '#ccc',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#6200ee',
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffcbd1',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  avatar: {
    backgroundColor: '#6200ee',
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userDetails: {
    fontSize: 14,
    color: '#666',
  },
});

export default MembersScreen;
