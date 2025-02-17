import { View, Text } from 'react-native'
import React from 'react'
import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../FirebaseConfig"; // Adjust the path to your FirebaseConfig
import { Alert } from "react-native";

interface Item {
    updatedLedgerAccount: string;
    ownerAmount?: number;
    rentAmount?: number;
    closedUnitAmount?: number;
    ledgerAccount: string;
    groupFrom: string;
    invoiceDate: string;
  }
 
// Function to get `updatedLedgerAccount` and amount based on residentType
export const getBillItemsLedger = async (
  societyName: string,
    billNumber: string, // Bill document ID
    residentType: "owner" | "Renter" | "Closed" // Resident type
  ): Promise<{ updatedLedgerAccount: string; ledgerAccount: string; amount: number; groupFrom: string; invoiceDate: string; }[]> => {
    try {
      const specialBillCollectionName = `specialBills_${societyName}`;
      const billDocRef = doc(db,"Societies", societyName, specialBillCollectionName, billNumber); // Reference to the bill document
      const billSnapshot = await getDoc(billDocRef);
  
      if (!billSnapshot.exists()) {
        throw new Error("Bill not found");
      }
  
      const billData = billSnapshot.data();
      const items: Item[] = billData?.items || [];
      const invoiceDate =   billData?.invoiceDate
  
      // Extract relevant data based on residentType
      const results = items.map((item) => {
        let amount = 0;
        if (residentType === "owner") {
          amount = item.ownerAmount || 0;
        } else if (residentType === "Renter") {
          amount = item.rentAmount || 0;
        } else if (residentType === "Closed") {
          amount = item.closedUnitAmount || 0;
        }
  
        return {
          updatedLedgerAccount: item.updatedLedgerAccount,
          ledgerAccount: item.ledgerAccount, // Include ledgerAccount here
          groupFrom: item.groupFrom,
          amount,
          invoiceDate,
        };
      });
  
      return results;
    } catch (error) {
      console.error("Error fetching bill details:", error);
      throw error;
    }
  };
  

