import React, { useState, useEffect} from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Checkbox, Button, TextInput } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from "expo-router";
import { db } from "../../../../FirebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";

// Define the permissions structure type
type PermissionItems = {
  [key: string]: boolean;
};

type Permissions = {
  [section: string]: PermissionItems;
};

const UserRolePermissions = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const roleName = params.item || ""; // Get the role name from params
  const memberType = params.selectedTab

  const [permissions, setPermissions] = useState<Permissions>({
    Accounting: {
      "Bank": false,
      "Transactions": false,
      "Balance Sheet": false,
      "Income and Expenditure": false,
      "Cash Book": false,
      "Bank Book": false,
      "Receipt Summary": false,
    },
    Bills: {
      "Pay Now": false,
      "Society Member Dues": false,
      "My Statement": false,
      "Wallet": false,
    },
    Vehicles: {
      "Vehicle Lists": false,
      "Add My Vehicle": false,
    },
    Members: {
      "Can I View Phone Number?": false,
      "Member Lists": false,
      "Update Billing Info": false,
    },
    Other: {
      "Task": false,
      "Suggestion": false,
      "Proposal": false,
      "Voting": false,
      "Society Resources": false,
      "Complaints": false,
      "Document": false,
      "Event": false,
      "Announcements": false,
      "Statistics": false,
      "Society Meeting": false,
      "Visitor Modules": false,
      "Emergency Contacts": false,
      "Building Info": false,
      "Rules": false,
      "Society Staff": false,
    },
  });

  useEffect(() => {
    const fetchPermissions = async () => {
      if (memberType && roleName) {
        try {
          const docRef = doc(db, "Roles", memberType as string);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            const rolePermissions = data[roleName as string] || {};

            setPermissions((prev) => {
              const updatedPermissions: Permissions = { ...prev };
              Object.keys(updatedPermissions).forEach((section) => {
                if (rolePermissions[section]) {
                  Object.keys(updatedPermissions[section]).forEach((item) => {
                    updatedPermissions[section][item] = rolePermissions[section].includes(item);
                  });
                }
              });
              return updatedPermissions;
            });
          }
        } catch (error) {
          console.error("Error fetching permissions: ", error);
        }
      }
    };

    fetchPermissions();
  }, [memberType, roleName]);


  const toggleSection = (section: keyof Permissions) => {
    const allSelected = Object.values(permissions[section]).every((value) => value);
    setPermissions((prev) => ({
      ...prev,
      [section]: Object.keys(prev[section]).reduce((acc, item) => {
        acc[item] = !allSelected;
        return acc;
      }, {} as PermissionItems),
    }));
  };

  const togglePermission = (section: keyof Permissions, item: string) => {
    setPermissions((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [item]: !prev[section][item],
      },
    }));
  };

  const renderSection = (section: keyof Permissions, items: PermissionItems) => (
    <View style={styles.sectionContainer} key={section}>
      <View style={styles.sectionHeader}>
        <Checkbox
          status={Object.values(items).every((value) => value) ? 'checked' : 'unchecked'}
          onPress={() => toggleSection(section)}
        />
        <Text style={styles.sectionTitle}>{section}</Text>
      </View>
      <View style={styles.itemsContainer}>
        {Object.keys(items).map((item) => (
          <View style={styles.item} key={item}>
            <Checkbox
              status={permissions[section][item] ? 'checked' : 'unchecked'}
              onPress={() => togglePermission(section, item)}
            />
            <Text style={styles.itemText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const savePermissions = async () => {
    try {
      // Extract selected permissions under respective sections
      const selectedPermissions: { [key: string]: string[] } = {};
      Object.keys(permissions).forEach((section) => {
        selectedPermissions[section] = Object.entries(permissions[section])
          .filter(([, value]) => value)
          .map(([key]) => key);
      });

      // Save to Firebase Firestore
      if (memberType && roleName) {
        const docRef = doc(db, "Roles", memberType as string);
        await setDoc(docRef, { [roleName as string]: selectedPermissions }, { merge: true });
        Alert.alert(
          "Success",
          "Permissions updated successfully",
          [
            {
              text: "OK",
              onPress: () => router.push("/(Permission)"),
            },
          ]
        );
      } else {
        console.error("Member type and role name are required.");
      }
    } catch (error) {
      console.error("Error saving permissions: ", error);
    }
  };


  return (
    <ScrollView style={styles.container}>
      {/* Role Name Section */}
      <View style={styles.content}>
        <Text style={styles.label}>Role Name</Text>
        <TextInput
          mode="outlined"
          value={roleName as string}
          editable={false} // Make the input field non-editable
          style={styles.input}
        />
      </View>

      {Object.keys(permissions).map((section) =>
        renderSection(section, permissions[section])
      )}
      <Button mode="contained" style={styles.saveButton} onPress={savePermissions}>
        Save
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  sectionContainer: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  itemsContainer: {
    paddingLeft: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemText: {
    marginLeft: 8,
    fontSize: 14,
  },
  saveButton: {
    marginTop: 16,
    padding: 8,
  },
  content: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    margin: 16,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#000",
  },
  input: {
    backgroundColor: "#fff",
  },
});

export default UserRolePermissions;


