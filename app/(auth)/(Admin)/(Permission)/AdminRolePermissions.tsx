import React, { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { Checkbox, Text, Button, TextInput  } from 'react-native-paper';
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

const AdminRolePermissions = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const roleName = params.item || ""; // Get the role name from params
  const memberType = params.selectedTab

  const [permissions, setPermissions] = useState<Permissions>({
    Bills: {
      "Can i View Bills?": false,
      "Can I Create/generate bills?": false,
      "Can I Edit the Bills?": false,
      "Can i add Water reading?": false,
      "Can I access the Bill Collection of society?": false,
      "Can i accept or reject receipt?": false,
      "Can I Make Paid the bills of society members?": false,
      "Can i view the Bill Paid Summery of the residents?": false,
      "Can i manage member wallet?": false,
      "Can I download the bills?": false,
      "Can I print bills?": false,
      "Can I manage the wallet entries of the society?": false,
      "Can I ADD the Advanced Payment of the society members?": false,
      "Can i view Bill Statistics?": false,
      "Can i delete bill?": false,
      "Can i delete member receipt?": false,
      "Can i make bill settings?": false,
      "Can i see Member Statement?": false,
    },
    Accounting: {
      "Can i View Balance Sheet?": false,
      "Can i create a new Balance Sheet?": false,
      "Can i Edit Balance Sheet?": false,
      "Can i Delete Balance Sheet?": false,
      "Can I set the opening balance of the balance sheet?": false,
      "Can i View Ledger Accounts?": false,
      "Can i create a ledger account?": false,
      "Can I Edit ledger account?": false,
      "Can i delete a ledger account?": false,
      "Can I create Vouchers of the society?": false,
      "Can I Edit vouchers?": false,
      "Can I delete Vouchers?": false,
      "Can I view the transaction details of the society?": false,
      "Can I view the financial reports of the society?": false,
      "Can I Download Financial Reports?": false,
      "Can i manage society bank details?": false,
    },
    Power: {
      "Can manage Society Billing Information?": false,
    },
    Vehicles: {
      "Can view Vehicle List?": false,
      "Can add a new Vehicle?": false,
      "Can update Vehicle details?": false,
      "Can view consolidated vehicle details?": false,
    },
    Members: {
      "Can view Member List?": false,
      "Can update Member details?": false,
      "Can remove a Member?": false,
      "Can send messages to Members?": false,
    },
    "Society Resources": {
      "Can view Society Announcements?": false,
      "Can view upcoming Events?": false,
      "Can view Documents?": false,
      "Can view Meetings?": false,
      "Can view Voting Results?": false,
    },
    Others: {
      "Can view Emergency Contacts?": false,
      "Can access Society Staff details?": false,
      "Can update Society Rules?": false,
    },
    Notices: {
      "Can view Notices?": false,
      "Can add Notices?": false,
      "Can edit Notices?": false,
    },
    Messages: {
      "Can view Messages?": false,
      "Can send Messages?": false,
    },
    Events: {
      "Can view Events?": false,
      "Can add Events?": false,
      "Can edit Events?": false,
    },
    Promotions: {
      "Can view Promotions?": false,
      "Can add Promotions?": false,
      "Can edit Promotions?": false,
    },
    Complaints: {
      "Can view Complaints?": false,
      "Can add Complaints?": false,
      "Can edit Complaints?": false,
    },
    House: {
      "Can view House?": false,
      "Can edit House?": false,
    },
    Directory: {
      "Can view Directory?": false,
      "Can edit Directory?": false,
    },
    "Phone Keeper": {
      "Can view Phone Keeper?": false,
      "Can edit Phone Keeper?": false,
    },
    "Delivery Staff": {
      "Can view Delivery Staff?": false,
      "Can edit Delivery Staff?": false,
    },
    "Meeting Minutes": {
      "Can view Meeting Minutes?": false,
      "Can edit Meeting Minutes?": false,
    },
    Suggestions: {
      "Can view Suggestions?": false,
      "Can add Suggestions?": false,
      "Can edit Suggestions?": false,
    },
    Details: {
      "Can view Details?": false,
      "Can edit Details?": false,
    },
    Proposal: {
      "Can view Proposal?": false,
      "Can add Proposal?": false,
      "Can edit Proposal?": false,
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
    const allSelected = Object.values(permissions[section]).every((val) => val);
    const updatedSection = Object.keys(permissions[section]).reduce((acc, item) => {
      acc[item] = !allSelected;
      return acc;
    }, {} as PermissionItems);

    setPermissions((prev) => ({
      ...prev,
      [section]: updatedSection,
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
          status={Object.values(items).every((val) => val) ? 'checked' : 'unchecked'}
          onPress={() => toggleSection(section)}
        />
        <Text style={styles.sectionTitle}>{section}</Text>
      </View>
      <View style={styles.itemsContainer}>
        {Object.keys(items).map((item) => (
          <View style={styles.item} key={item}>
            <Checkbox
              status={items[item] ? 'checked' : 'unchecked'}
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
    paddingLeft: 32,
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

export default AdminRolePermissions;


