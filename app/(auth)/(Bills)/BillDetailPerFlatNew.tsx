import { StyleSheet, Text, View, Alert, ActivityIndicator, TouchableWithoutFeedback, Keyboard } from 'react-native'
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useNavigation, useRouter, Stack  } from "expo-router";
import { Appbar, Avatar, Divider } from 'react-native-paper';
import { useSociety } from "@/utils/SocietyContext";
import { doc, getDoc, collection, getDocs, updateDoc, collectionGroup, setDoc, arrayUnion, query,where, deleteDoc  } from 'firebase/firestore';
import { db } from '@firebaseConfig';
import {calculatePenaltyNew} from "@/utils/calculatePenaltyNew";
import { updateLedger } from "@/utils/updateLedger";

import AppbarComponent from '@/components/AppbarComponent';
import AppbarMenuComponent from '@/components/AppbarMenuComponent';
import { updateFlatCurrentBalance } from "@/utils/updateFlatCurrentBalance"; // Adjust path as needed

interface BillData {
    billNumber: string;
    billAmount: number;
    billinvoiceDate: string;
    title: string;
    dueDate: string;
    billStatus: string;
    items: any;
    isEnablePenalty?: boolean; // Add this
    Occurance?: string; // Add this
    recurringFrequency?: string; // Add this
    penaltyType?: string; // Add this
    fixPricePenalty?: string; // Add this
    percentPenalty?: string; // Add this
    ledgerAccountPenalty?: string; // Add this
    ledgerAccountGroupPenalty?: string; // Add this
    penaltyAmount?: number;
    amountToPay?: number;
    receiptAmount?: number;
    overdueDays?: number; // Include overdueDays
    transactionId?: string;
  }

const BillDetailPerFlatNew = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const { wing, floorName, flatNumber, billNumber:billNumberparam, flatType, billStatus } = useLocalSearchParams();
    const { societyName } = useSociety();
    const customWingsSubcollectionName = `${societyName} wings`;
    const customFloorsSubcollectionName = `${societyName} floors`;
    const customFlatsSubcollectionName = `${societyName} flats`;
    const customFlatsBillsSubcollectionName = `${societyName} bills`;
    const specialBillCollectionName = `specialBills_${societyName}`;

     const unclearedBalanceSubcollectionName = `unclearedBalances_${societyName}`

    const billNumber = billNumberparam as string;

    const [billData, setBillData] = useState<any>(null);
    const currentDate = new Date().toISOString().split("T")[0];

    useEffect(() => {
        if (billStatus !== "No Bill") {
            fetchBillData();
        }
        
          }, []);
          
    const fetchBillData = async () => {
        try {
            const flatBillRef = `Societies/${societyName}/${customWingsSubcollectionName}/${wing}/${customFloorsSubcollectionName}/${floorName}/${customFlatsSubcollectionName}/${flatNumber}/${customFlatsBillsSubcollectionName}/${billNumber}`;
            const flatBillDocRef = doc(db, flatBillRef);
            // const flatBillDocSnap = await getDoc(flatBillDocRef);
            

            const mainBillRef = `Societies/${societyName}/${specialBillCollectionName}/${billNumber}`;
            const mainBillDocRef = doc(db, mainBillRef);
            // const mainBillDocSnap = await getDoc(mainBillDocRef);
            

            const [flatBillDocSnap, mainBillDocSnap] = await Promise.all([
                            getDoc(flatBillDocRef),
                            getDoc(mainBillDocRef),
                        ]);

            if (!flatBillDocSnap.exists() || !mainBillDocSnap.exists()) {
                console.warn("Either flatBillDocSnap or mainBillDocSnap does not exist.");
                return;
            }
            const flatBillDetails = flatBillDocSnap.data();
            // console.log('flatBillDetails', flatBillDetails)
            const mainBillDetails = mainBillDocSnap.data();
            // console.log('mainBillDetails', mainBillDetails)

            // console.log('mainBillDetails.items', mainBillDetails.items)
            const billAmount = flatBillDetails.amount || 0;
            const billStatus = flatBillDetails.status;
            

          // Push the aggregated bill data
            const billObject: BillData = {
                billNumber,
                billAmount: flatBillDetails.amount,
                title: flatBillDetails.name,
                billinvoiceDate: mainBillDetails.invoiceDate,
                dueDate: mainBillDetails.dueDate,
                billStatus: flatBillDetails.status,
                items: mainBillDetails.items,
                overdueDays: calculateOverdueDays(flatBillDetails.dueDate, flatBillDetails.paymentDate),
            };

            // Add penalty-related fields to the billObject
            billObject.isEnablePenalty = mainBillDetails.isEnablePenalty === "true"; // Convert string to boolean
            billObject.Occurance = mainBillDetails.Occurance ?? "";
            billObject.recurringFrequency = mainBillDetails.recurringFrequency ?? "";
            billObject.penaltyType = mainBillDetails.penaltyType ?? "";
            billObject.fixPricePenalty = mainBillDetails.fixPricePenalty ?? "";
            billObject.percentPenalty = mainBillDetails.percentPenalty ?? "";
            billObject.ledgerAccountPenalty = mainBillDetails.ledgerAccountPenalty ?? "";
            billObject.ledgerAccountGroupPenalty = mainBillDetails.ledgerAccountGroupPenalty ?? "";

          if (flatBillDetails.status !== "paid") {

             // Determine penalty parameters
            const penaltyOccurrence = mainBillDetails.Occurance === "Recurring" ? "Recurring" : "One Time";
            const penaltyRecurringFrequency = penaltyOccurrence === "Recurring" ? mainBillDetails.recurringFrequency : null;
            const penaltyValue = mainBillDetails.penaltyType === "Percentage" ? parseFloat(mainBillDetails.percentPenalty) : parseFloat(mainBillDetails.fixPricePenalty);
            // Convert dueDate string to Date object
            const dueDatedateType = new Date(mainBillDetails.dueDate);
            
            // Calculate penalty
            billObject.penaltyAmount = calculatePenaltyNew(
                dueDatedateType,
                billAmount,
                penaltyOccurrence,
                penaltyRecurringFrequency,
                mainBillDetails.penaltyType,
                penaltyValue,
            );
            billObject.amountToPay = billAmount + billObject.penaltyAmount;

          } else if (billStatus === "paid") {
            billObject.overdueDays = flatBillDetails.overdueDays || 0;
            billObject.receiptAmount = flatBillDetails.receiptAmount || 0;
            billObject.penaltyAmount = flatBillDetails.penaltyAmount || 0;
            billObject.transactionId = flatBillDetails.transactionId
          }

          // Add billObject to the array
            const billsData: BillData[] = [billObject];
          

          // Update state with the fetched bills data
          setBillData(billsData);
          // console.log('billsData', billsData)

        } catch (error) {
            console.error(error)
        }
    }

    const calculateOverdueDays = (dueDate: string, paymentDate?: string) => {
        const referenceDate = paymentDate ? new Date(paymentDate) : new Date();
        const due = new Date(dueDate);
        const diffTime = referenceDate.getTime() - due.getTime();
        return Math.max(Math.floor(diffTime / (1000 * 60 * 60 * 24)), 0);
      };

    const _goBack = () => console.log('Went back');
    const _handleMore = () => console.log('Shown more');

    const handleDeleteBill = async (billNumber: string) => {
          Alert.alert(
            "Confirmation",
            "Are you sure to delete? You can't recover this data.",
            [
              { text: "No", style: "cancel" },
              {
                text: "Yes",
                onPress: async () => {
                    console.log(`Deleting bill ${billNumber}`)

                    try {
                        
                    if (billData?.[0]?.billStatus === 'unpaid') {
                        for (const item of billData[0]?.items) {
                            const amountledger = flatType === "Closed" ? item.closedUnitAmount :
                                        flatType === "Rent" ? item.rentAmount : item.ownerAmount
                                        
                            console.log('amountledger', amountledger);
                            console.log(item.ledgerAccount);
                            console.log(item.updatedLedgerAccount);
                            console.log(item.groupFrom);
                            // Update item ledger and account receivable. Date is current date when bill is deleted
                            const ledgerUpdate = await updateLedger(societyName,"Account Receivable",item.updatedLedgerAccount, amountledger, "Subtract", currentDate);
                            console.log(` Account Receivable Ledger Update Status: ${ledgerUpdate}`);
                            const ledgerUpdate2 = await updateLedger(societyName,item.groupFrom, item.ledgerAccount, amountledger, "Subtract", currentDate);
                            console.log(` item Ledger Update Status: ${ledgerUpdate2}`);
                        }
                        

                    } else if (billData?.[0]?.billStatus === "paid") { 
                        // update item ledger
                        for (const item of billData[0]?.items) {
                            const amountledger = flatType === "Closed" ? item.closedUnitAmount :
                                        flatType === "Rent" ? item.rentAmount : item.ownerAmount     
                            // Update item ledger account. Date is current date when bill is deleted
                            const ledgerUpdate2 = await updateLedger(societyName,item.groupFrom, item.ledgerAccount, amountledger, "Subtract", currentDate);
                            console.log(` item Ledger Update Status: ${ledgerUpdate2}`);

                        }

                        // update penalty if exists
                        if (billData?.[0]?.isEnablePenalty){
                            const penaltyAmount = billData?.[0]?.penaltyAmount
                            const billpaidLedgerAccount = billData?.[0]?.ledgerAccountPenalty
                            const billpaidLedgerGroup = billData?.[0]?.ledgerAccountGroupPenalty
                            
                            const LedgerUpdate = await updateLedger(societyName,billpaidLedgerGroup,billpaidLedgerAccount, penaltyAmount, "Subtract", currentDate ); // Update Ledger
                            console.log(` Penalty Ledger Update Status: ${LedgerUpdate}`);
                        }
                        // Update Unclread balance selectedBills and selectedIds
                        const transactionId = billData?.[0]?.transactionId
                        const unclearedBalanceRef = `Societies/${societyName}/${customWingsSubcollectionName}/${wing}/${customFloorsSubcollectionName}/${floorName}/${customFlatsSubcollectionName}/${flatNumber}/${unclearedBalanceSubcollectionName}/${transactionId}`;
                        const unclearedBalanceDocRef = doc(db, unclearedBalanceRef);
                        const docSnap = await getDoc(unclearedBalanceDocRef);
                        if (docSnap.exists()) {
                            const data = docSnap.data();
                            // Bill number to delete
                            const billToDelete = billNumber;
                            
                            // Remove from selectedIds
                            const updatedSelectedIds = data.selectedIds?.filter((id: string) => id !== billToDelete) || [];
                            // Remove from selectedBills
                            const updatedSelectedBills = data.selectedBills?.filter((bill: any) => bill.id !== billToDelete) || [];
                            // Update Firestore document
                            await updateDoc(unclearedBalanceDocRef, {
                                selectedIds: updatedSelectedIds,
                                selectedBills: updatedSelectedBills,
                                type: "Bill Deleted"
                            });
                            console.log("Bill successfully deleted from uncleared balance.");
                        }
                        // Add the deleted Amount to current Balance
                        const receiptAmount = billData?.[0]?.receiptAmount
                        const currentBalanceSubcollectionName = `currentBalance_${flatNumber}`;
                        const currentbalanceCollectionRef = `Societies/${societyName}/${customWingsSubcollectionName}/${wing}/${customFloorsSubcollectionName}/${floorName}/${customFlatsSubcollectionName}/${flatNumber}/${currentBalanceSubcollectionName}`;
                        const currentbalanceCollectionDocRef = collection(db, currentbalanceCollectionRef);

                        const result = await updateFlatCurrentBalance(currentbalanceCollectionDocRef, receiptAmount, "Add", currentDate);
                        console.log("Balance update result:", result);
                        const result2 = await updateLedger(societyName,"Current Liabilities","Members Advanced", receiptAmount, "Add", currentDate ); // Update Ledger
                        console.log("Members Advanced update result:", result2);


                    }

                    // After Ledger Updates, Delete the bill from the "customFlatsBillsSubcollectionName" collection

                    const flatBillRef = `Societies/${societyName}/${customWingsSubcollectionName}/${wing}/${customFloorsSubcollectionName}/${floorName}/${customFlatsSubcollectionName}/${flatNumber}/${customFlatsBillsSubcollectionName}/${billNumber}`;
                    const flatBillDocRef = doc(db, flatBillRef);
                    await deleteDoc(flatBillDocRef);
                    console.log("Deleted Bill",billNumber, "From Flat",flatNumber  )

                    // After delete route to "Generate special bill index screen /(SpecialBills) "
                    Alert.alert("Success", "Bill  deleted successfully.");
                    router.replace(
                    {
                        pathname: "/(SpecialBills)",
                        params: {
                        wing: wing,
                        floorName: floorName,
                        flatNumber: flatNumber,
                        },
                    })

                } catch (error) {
                    console.error("Something went wrong", error)
                        
                } finally {
                    setLoading(false);
                  }

                }// onpress 
              }
            ])
            }

    const [menuVisible, setMenuVisible] = useState(false);
    
    const handleMenuOptionPress = (option: string) => {
        console.log(`${option} selected`);
        if (option === "Delete") {
            handleDeleteBill(billNumber);
        }
        setMenuVisible(false);
    };
    const closeMenu = () => {
        setMenuVisible(false);
    };


    if (loading) {
        return (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" />
          </View>
        );
      }


    return (
        <TouchableWithoutFeedback onPress={closeMenu}>
        
        <View style={styles.container}>
            {/* Top Appbar */}
            <AppbarComponent
                title= {billNumber as string} 
                source="Admin"
                onPressThreeDot={billStatus !== "No Bill" ? () => setMenuVisible(!menuVisible) : undefined}
            />

            {/* Three-dot Menu */}
            {/* Custom Menu */}
            {menuVisible && (
                <AppbarMenuComponent
                items={["View Bill Details", "Statistics", "Print Bills", "Overview PDF", "Overview Excel", "Delete"]}
                onItemPress={handleMenuOptionPress}
                closeMenu={closeMenu}
            />
            )}
    
            {/* Bill Details */}
            {billData ? (
                <>
                    <View style={styles.billDetails}>
                        <View style={styles.billDetailscontent}>
                            <View>
                                <Text style={styles.billLabel}>Bill For</Text>
                                <Text style={styles.billValue}>{billData?.[0]?.title || 'N/A'}</Text>
                            </View>
                            <View>
                                <Text style={styles.billDate}>Bill Date</Text>
                                <Text style={styles.billDate}>{billData?.[0]?.billinvoiceDate || 'N/A'}</Text>
                            </View>
                        </View>
                        <View style={styles.billDetailscontent}>
                            <View>
                                <Text style={styles.dueDate}>Due Date</Text>
                                <Text style={styles.dueDate}>{billData?.[0]?.dueDate || 'N/A'}</Text>
                            </View>
                            <View>
                                <Text style={[styles.status, billData?.[0]?.billStatus === 'unpaid' ? styles.unpaid : styles.paid]}>
                                    {billData?.[0]?.billStatus || 'N/A'}
                                </Text>
                            </View>
                        </View>
                        {billData?.[0]?.isEnablePenalty && (
                            <>
                              <View style={styles.penaltyContent}>
                              <Text style={styles.penaltyText}>
                                * Notice: A penalty of{" "}
                                {billData?.[0]?.penaltyType === "Fixed Price"
                                    ? `₹ ${billData?.[0]?.fixPricePenalty} `
                                    : `${billData?.[0]?.percentPenalty}% `}
                                 will be applied {" "}  
                                 {billData?.[0]?.Occurance === "Recurring"
                                    ? ` for every ${billData?.[0]?.recurringFrequency} day(s) `
                                    : ""
                                    }
                                  on unpaid balances after {billData?.[0]?.dueDate}. *
                            </Text>
                                
                            </View>
                            </>
                        )}
                    </View>
    
                    {/* Items Section */}
                    {billData[0]?.items && billData[0]?.items.length > 0 ? (
                        <View style={styles.itemsSection}>
                            <Text style={styles.itemsTitle}>Items</Text>
                            {billData[0].items.map((item: { itemName: string; ownerAmount: number; closedUnitAmount: number; rentAmount:number  }, index: number) => (
                                <View key={index} style={styles.itemRow}>
                                    <Text style={styles.itemName}>{item.itemName}</Text>
                                    
                                    <Text style={styles.itemPrice}>
                                        ₹ {(
                                            flatType === "Closed" ? item.closedUnitAmount :
                                            flatType === "Rent" ? item.rentAmount :
                                            item.ownerAmount
                                        ).toFixed(2)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text style={{ textAlign: 'center', marginTop: 20 }}>No items found</Text>
                    )}
                </>
            ) : (
                <Text style={{ textAlign: 'center', marginTop: 20 }}>
                    {billStatus === "No Bill" ? "No Bill" : "Loading bill details..."}
                </Text>
            )}
        </View>
        </TouchableWithoutFeedback>
    );
}    

export default BillDetailPerFlatNew

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
      },
      loaderContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      },
      header: {
        backgroundColor: "#6200ee", // Match background color from the attached image
        elevation: 4,
      },
      titleStyle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#fff",
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
      penaltyContent:{
        marginTop:12,

      },
      penaltyText: {
        fontSize: 12,
        color: '#e53935',

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
})