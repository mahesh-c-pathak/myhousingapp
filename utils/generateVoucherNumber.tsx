import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../FirebaseConfig"; // Adjust the path to your FirebaseConfig
import { Alert } from "react-native";

export const generateVoucherNumber = async (): Promise<string> => {
    try {
        const counterRef = doc(db, "Meta", "transactionCounter");
        const counterDoc = await getDoc(counterRef);

        let count = 1;
        if (counterDoc.exists()) {
            count = counterDoc.data().count + 1;
        }

        await updateDoc(counterRef, { count });

        // Format the voucher number
        return `V/2024-25/${count}`;
    } catch (error) {
        console.error("Error generating voucher number:", error);
        Alert.alert("Error", "Failed to generate voucher number.");
        throw error;
    }
};


