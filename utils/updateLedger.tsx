
import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../FirebaseConfig"; // Adjust the path to your FirebaseConfig
import { Alert } from "react-native";

export const updateLedger = async (
    ledgerAccount: string, 
    amount: number,
    option: "Add" | "Subtract" // Accept only "Add" or "Subtract"
    ): Promise<string> => {
    try {
        const ledgerGroupsCollection = collection(db, "ledgerGroupsNew");
        const ledgerGroupsSnapshot = await getDocs(ledgerGroupsCollection);
        const updateLedgerPromises: Promise<void>[] = [];
        ledgerGroupsSnapshot.forEach((docSnap) => {
            const ledgerGroup = docSnap.data(); // Get the document's data
            const docRef = docSnap.ref; // Reference to the specific document

            // Check if the ledgerGroup contains the key matching ledgerAccount
            Object.keys(ledgerGroup).forEach((key) => {
            if (key === ledgerAccount) {
                const currentBalance = ledgerGroup[key].balance;
                let newBalance = currentBalance;
                // Calculate new balance based on the option
                if (option === "Add") {
                    newBalance = currentBalance + amount;
                } else if (option === "Subtract") {
                    newBalance = currentBalance - amount;
                }
                ledgerGroup[key].balance = newBalance;

                console.log("Matched Ledger Account:", key, "Data:", ledgerGroup[key].balance);

                // Add update promise to the array for ledgerAccount
                updateLedgerPromises.push(
                updateDoc(docRef, {
                    [key + ".balance"]: newBalance, // Update nested field in Firestore
                })
                );
                
            }
    
            });

        });
        // Wait for all updates to complete
        await Promise.all(updateLedgerPromises);

        return "Success";
        
    } catch (error) {
        console.error("Error update Ledger:", error);
        Alert.alert("Error", "Failed to update voucher Ledger.");
        throw error;
    }
};



