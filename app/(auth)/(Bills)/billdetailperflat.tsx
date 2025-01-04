import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, SafeAreaView, StatusBar, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useNavigation, Stack } from 'expo-router';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { db } from "../../../FirebaseConfig"; // Assuming db is initialized Firestore instance
import Header from './Header';
import { Appbar, Avatar, Divider } from 'react-native-paper';
import { useSociety } from "../../../utils/SocietyContext";

interface Item {
  itemName: string;
  ownerAmount: number;
}


const BillDetailPerFlat: React.FC = () => {
  const params = useLocalSearchParams();
  const { societyName } = useSociety();

  // Directly assert as strings
  const wing = params.wing as string;
  const floorName = params.floorName as string;
  const flatNumber = params.flatNumber as string;
  const billNumber = params.billNumber as string;
  const amount = params.amount as string;
  const status = params.status as string;
  
  const [billData, setBillData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation();
  const { title, id } = useLocalSearchParams();
  const [totalDue, setTotalDue] = useState<any>("");
  const [receivedPaymentDetail, setReceivedPaymentDetail] = useState<any[]>([]);

  useEffect(() => {
    const fetchBillData = async () => {
      try {
        if (!billNumber || typeof billNumber !== 'string') {
          console.error('Invalid bill number');
          return;
        }
        const billDocRef = doc(db, 'bills', billNumber); // Get a reference to the specific document
        
        const billDoc = await getDoc(billDocRef); // Fetch document data

        if (billDoc.exists()) {
          setBillData(billDoc.data());
        } else {
          console.error('Bill not found');
        }

        const societiesDocRef = doc(db, "Societies", societyName as string);
        const societyDocSnap = await getDoc(societiesDocRef);
  
        if (!societyDocSnap.exists()) {
          console.error("Societies document does not exist");
          return;
        }
  
        const societyData = societyDocSnap.data();
        const societyWings = societyData.wings;
  
        const relevantFlatData = societyWings?.[wing as string]?.floorData?.[floorName as string]?.[flatNumber as string];
        if (!relevantFlatData) {
          console.error("No relevant FlatData data found for this flat.");
          return;
        }

        const bills = relevantFlatData.bills;
        if (!bills || typeof bills !== 'object') {
          console.error("No bills found in relevantFlatData.");
          return;
        }
        const billData = bills[billNumber];
        if (!billData || typeof billData !== 'object') {
          console.error(`Bill with number ${billNumber} not found.`);
          return;
        }
        
        setTotalDue(billData.amount)
        const receivedArray = Array.isArray(billData.received) ? billData.received : [];
        setReceivedPaymentDetail(receivedArray);
        if (!Array.isArray(receivedArray)) {
          console.warn("Received data is not an array or does not exist.");
          return;
        }
        // console.log("Received Array:", receivedArray);
        


      } catch (error) {
        console.error('Error fetching bill:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBillData();
  }, [billNumber]);

  const calculateSubTotal = (items: Item[]): number => {
    return items.reduce((total, item) => total + item.ownerAmount, 0);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5e35b1" />
      </View>
    );
  }

  if (!billData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Bill not found.</Text>
      </View>
    );
  }

  const subTotal = calculateSubTotal(billData.items);
  const _goBack = () => console.log('Went back');
  const _handleMore = () => console.log('Shown more');

  return (
    <SafeAreaView style={styles.container}>
    <Stack.Screen options={
      {headerShown:false}
    } />
    {/* Appbar Header */}
    <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={_goBack} color="#fff" />
        <Appbar.Content title={billNumber} titleStyle={styles.titleStyle} />
        <Appbar.Action icon="dots-vertical" onPress={_handleMore} color="#fff" />
      </Appbar.Header>
    <ScrollView style={styles.content}>
      {/* Header Section */}
      <Divider />
      <View style={styles.header}>
      <View style={styles.profileContainer}>
        <Avatar.Text size={44} label="XD" style={styles.avatar} />
        <View style={styles.textContainer}>
          <Text style={styles.profileText}>{wing} {flatNumber}</Text>
          <Text style={styles.profileText}>{wing} {flatNumber}</Text>
        </View>
      </View>
      
        
        <View style={styles.balanceContainer}>
          <View style={styles.balanceColumn}>
            <Text style={styles.balanceLabel}>Total Due</Text>
            <Text style={styles.balanceValue}>₹ {totalDue.toFixed(2)}</Text>
          </View>
          <View style={styles.balanceColumn}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceValue}>₹ 0.00</Text>
          </View>
          <View style={styles.balanceColumn}>
            <Text style={styles.balanceLabel}>Deposit</Text>
            <Text style={styles.balanceValue}>₹ 0.00</Text>
          </View>
          <View style={styles.balanceColumn}>
            <Text style={styles.balanceLabel}>Uncleared Balance</Text>
            <Text style={styles.balanceValue}>₹ 0.00</Text>
          </View>
        </View>
      </View>


      {/* Bill Details */}
      <View style={styles.billDetails}>
        <View style={styles.billDetailscontent}>
          <View>
            <Text style={styles.billLabel}>Bill For</Text>
            <Text style={styles.billValue}>{billData.name || 'N/A'}</Text>
            </View>
          <View>
            <Text style={styles.billDate}>Bill Date</Text>
            <Text style={styles.billDate}>{billData.startDate || 'N/A'}</Text>
          </View>
        </View>
        <View style={styles.billDetailscontent}>
          <View>
            <Text style={styles.dueDate}>Due Date</Text>
            <Text style={styles.dueDate}>{billData.dueDate || 'N/A'}</Text>
          </View>
          <Text style={[styles.status, status === 'unpaid' ? styles.unpaid : styles.paid]}>{status}</Text>
        </View>
      </View>

      {/* Items Section */}
      <View style={styles.itemsSection}>
        <Text style={styles.itemsTitle}>Items</Text>
        {billData.items.map((item: Item, index: number) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.itemName}</Text>
            <Text style={styles.itemPrice}>₹ {item.ownerAmount.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Total Section */}
      <View style={styles.totalSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Sub Total</Text>
          <Text style={styles.totalAmount}>₹ {subTotal.toFixed(2)}</Text>
        </View>
      </View>

      {/* Payment Details Section */}
      <View style={styles.paymentDetailsSection}>
        <Text style={styles.sectionTitle}>Payment Details</Text>
        {receivedPaymentDetail.length > 0 ? (
          receivedPaymentDetail.map((payment, index) => (
            <View key={index} style={styles.paymentRow}>
              <Text style={styles.paymentText}>
                Received on {payment.paymentDate || 'N/A'}
              </Text>
              <Text style={styles.paymentText}>
                 ₹{payment.receiptAmount?.toFixed(2) || '0.00'}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noPaymentText}>No payment details available.</Text>
        )}
      </View>

      <View style={styles.totalSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Total Due</Text>
          <Text style={styles.totalAmount}>₹ {totalDue.toFixed(2)}</Text>
        </View>
      </View>

      {/* Make Paid Button */}
      <TouchableOpacity style={styles.payButton}>
        <Text style={styles.payButtonText}>Make Paid</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    //paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, // Add padding for Android devices
  },
  content: {
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#5e35b1',
    paddingHorizontal: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  profileDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  profileText: {
    fontSize: 14,
    color: '#d1c4e9',
  },
  balanceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  balanceColumn: {
    alignItems: 'center',
    marginBottom: 10,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#d1c4e9',
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  billDetails: {
    backgroundColor: '#ffffff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 3,
  },
  billDetailscontent: {
    flexDirection: 'row', // Align Bill For and Bill Date horizontally
    justifyContent: 'space-between',
    padding: 1,
  },
  billLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  billValue: {
    fontSize: 14,
    color: '#000000',
    marginTop: 5,
  },
  billDate: {
    fontSize: 14,
    textAlign: 'right',
  },
  dueDate: {
    fontSize: 14,
    marginTop: 5,
  },
  status: {
    fontSize: 14,
    textAlign: 'right',
    marginTop: 5,
  },
  unpaid: {
    fontWeight: 'bold',
    color: '#e53935',
  },
  paid: {
    fontWeight: 'bold',
    color: '#43a047',
  },
  itemsSection: {
    marginHorizontal: 15,
    marginTop: 10,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    elevation: 3,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  itemName: {
    fontSize: 14,
    color: '#000000',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  totalSection: {
    marginHorizontal: 15,
    marginTop: 10,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    elevation: 3,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  totalText: {
    fontSize: 14,
    color: '#000000',
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  payButton: {
    backgroundColor: '#5e35b1',
    margin: 15,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    fontSize: 16,
    color: '#e53935',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  appbar: {
    backgroundColor: '#5e35b1', // Consistent background color
    elevation: 0, // Removes shadow
  },
  titleStyle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatar: {
    backgroundColor: '#7e57c2', // Match avatar background
    marginRight: 10,
  },
  textContainer: {
    justifyContent: 'center',
  },
  paymentDetailsSection: {
    marginHorizontal: 15,
    marginTop: 10,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000000',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  paymentText: {
    fontSize: 14,
    color: '#000000',
  },
  noPaymentText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#757575',
  },
  
});

export default BillDetailPerFlat;
