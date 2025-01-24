import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native'
import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Button, Card, IconButton, Divider, List } from "react-native-paper";

import { db } from "@/FirebaseConfig";
import { doc, getDoc, collection, getDocs, updateDoc } from "firebase/firestore";

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

const ApproveMember = () => {
    const router = useRouter(); // Router for navigation

    const { itemdetail } = useLocalSearchParams();
    const parsedItemDetail = JSON.parse(itemdetail as string)
    
    const handleUserApproval = async (
        userId: string,
        societyName: string,
        wing: string,
        floor: string,
        flatNumber: string,
        approvalStatus: string
      ) => {
        try {
          const userDocRef = doc(db, "users", userId);
          const userDocSnapshot = await getDoc(userDocRef);
    
          if (userDocSnapshot.exists()) {
            const userData = userDocSnapshot.data();
    
            if (userData?.mySociety) {
              const updatedSocietyData = userData.mySociety.map((societyObj: SocietyObj) => {
                const [currentSocietyName, societyDetails] = Object.entries(societyObj)[0];
    
                if (
                  currentSocietyName === societyName &&
                  societyDetails?.myWing &&
                  societyDetails.myWing[wing]?.floorData &&
                  societyDetails.myWing[wing].floorData[floor]?.[flatNumber]
                ) {
                  const updatedWingData = {
                    ...societyDetails.myWing,
                    [wing]: {
                      ...societyDetails.myWing[wing],
                      floorData: {
                        ...societyDetails.myWing[wing].floorData,
                        [floor]: {
                          ...societyDetails.myWing[wing].floorData[floor],
                          [flatNumber]: {
                            ...societyDetails.myWing[wing].floorData[floor][flatNumber],
                            userStatus: approvalStatus,
                          },
                        },
                      },
                    },
                  };
    
                  return {
                    [currentSocietyName]: {
                      ...societyDetails,
                      myWing: updatedWingData,
                    },
                  };
                }
    
                return societyObj;
              });
    
              await updateDoc(userDocRef, { mySociety: updatedSocietyData });
              return true;
            } else {
              console.error("No society data found for this user.");
              return false;
            }
          } else {
            console.error("User document does not exist.");
            return false;
          }
        } catch (error) {
          console.error("Error updating user status:", error);
          return false;
        }
      };
    
      const handleActivate = () => {
        Alert.alert(
          "Confirmation",
          "Are you sure you want to make the person active?",
          [
            {
              text: "No",
              style: "cancel",
            },
            {
              text: "Yes",
              onPress: async () => {
                const isSuccess = await handleUserApproval(
                  parsedItemDetail.userId,
                  parsedItemDetail.societyName,
                  parsedItemDetail.wing,
                  parsedItemDetail.floorName,
                  parsedItemDetail.flatNumber,
                  "Approved"
                );
    
                if (isSuccess) {
                  Alert.alert("Success", "Member activated successfully", [
                    {
                      text: "OK",
                      onPress: () => router.push("/(Members)"),
                    },
                  ]);
                }
              },
            },
          ]
        );
      };
    
      const handleDecline = () => {
        Alert.alert(
          "Confirmation",
          "Are you sure you want to decline approval to the person?",
          [
            {
              text: "No",
              style: "cancel",
            },
            {
              text: "Yes",
              onPress: async () => {
                const isSuccess = await handleUserApproval(
                  parsedItemDetail.userId,
                  parsedItemDetail.societyName,
                  parsedItemDetail.wing,
                  parsedItemDetail.floorName,
                  parsedItemDetail.flatNumber,
                  "Denied Approval"
                );
    
                if (isSuccess) {
                  Alert.alert("Success", "Member request rejected successfully", [
                    {
                      text: "OK",
                      onPress: () => router.push("/(Members)"),
                    },
                  ]);
                }
              },
            },
          ]
        );
      };


  return (
    <ScrollView style={styles.container}>
    {/* Header */}
    <View style={styles.header}>
      <IconButton icon="arrow-left" size={24} onPress={() => {} } iconColor="white" />
      <Text style={styles.headerTitle}>{parsedItemDetail.flatNumber}</Text>
      <IconButton icon="dots-vertical" size={24} onPress={() => {}} iconColor="white" />
    </View>

    {/* Profile */}
    <View style={styles.profileContainer}>
    <TouchableOpacity
          style={[styles.profileImageContainer, { backgroundColor: "#fff" }]} 
        >
          <IconButton icon="account" size={80} />
        </TouchableOpacity>
    </View>

    {/* Buttons */}
    
      <View style={styles.buttonsContainer}>
      <TouchableOpacity
            style={[styles.touchableButton, { backgroundColor: "green" }]}
            onPress={() => {handleActivate();}}
        >
            <Text style={styles.buttonText}>Activate</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={[styles.touchableButton, { backgroundColor: "red" }]}
            onPress={() => {handleDecline();}}
        >
            <Text style={styles.buttonText}>Decline</Text>
        </TouchableOpacity>
      </View>
   
    <Divider />
    {/* Name */}

    <View style={{ flex: 1 }}>

    <View style={styles.nameContainer}>
        <Text style={styles.name}>{parsedItemDetail.userName}</Text>
    </View>
    </View>

    {/* Phone */}

    <Divider />
    
    <View style={styles.optionsContainer}>
        <View style={styles.row}> 
            <IconButton icon="phone" iconColor="#6200ee" onPress={() => {}} />
            <View > 
            <Text style={styles.info}>9730667309</Text>
            <Text style={styles.label}>Mobile</Text>
            </View>
        </View>
    </View>
    
      

    {/* Details Section */}
    <View style={styles.detailsContainer}>
      <View style={styles.row}>
        <List.Icon icon="account-group" />
        <View style={styles.countContainer}>
        <Text>0 </Text>
        <Text> Adult Count</Text>
        </View>
      </View>
      <View style={styles.row}>
        <List.Icon icon="baby" />
        <View style={styles.countContainer}>
        <Text>0 </Text>
        <Text> Child Count</Text>
        </View>
      </View>
    </View>

    <Divider />

    {/* Options Section */}
    <View style={styles.optionsContainer}>
      <List.Item
        title="Owner"
        left={(props) => <List.Icon {...props} icon="account" />}
        onPress={() => {}}
      />
      <Divider />
      <List.Item
        title="View Bill History"
        left={(props) => <List.Icon {...props} icon="file-document" />}
        onPress={() => {}}
      />
      <Divider />
      <List.Item
        title="Manage Member History"
        left={(props) => <List.Icon {...props} icon="history" />}
        onPress={() => {}}
      />
    </View>
  </ScrollView>
);
};

const styles = StyleSheet.create({
container: {
  flex: 1,
  backgroundColor: "#f5f5f5",
},
header: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  padding: 16,
  backgroundColor: "#6200ee",
},
headerTitle: {
  color: "#fff",
  fontSize: 20,
  fontWeight: "bold",
},
profileContainer: {
  alignItems: "center",
  paddingVertical: 5,
  backgroundColor: "#6200ee",
},

buttonsContainer: {
  flexDirection: "row",
  alignItems:'center',
  justifyContent: "center", // Center horizontally,
  width: "100%",
  marginBottom: 10,
  padding:16,
},

name: {
  fontSize: 18,
  fontWeight: "bold",
  // color: "#fff",
},
info: {
  fontSize: 16,
  //color: "#fff",
},
label: {
  fontSize: 14,
  //color: "#fff",
},
detailsContainer: {
  padding: 16,
  flexDirection: "row",
  justifyContent: "space-between",
},
row: {
  flexDirection: "row",
  alignItems: "center",
},
optionsContainer: {
  marginTop: 10,
},
countContainer: {
    marginHorizontal: 10,
  },
nameContainer: {
    justifyContent: "center",  // Center vertically
    alignItems: "center",     // Center horizontally
    height: 50,               // Set a fixed height
    paddingVertical: 8,
    width: "100%",            // Ensure it takes full width of the screen
    backgroundColor: "#f5f5f5", // Optional for debugging
  },
profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  touchableButton: {
    flex: 1,
    paddingVertical: 16,
    marginHorizontal: 10,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  
});

export default ApproveMember