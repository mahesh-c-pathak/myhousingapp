import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../FirebaseConfig';

    // Get Opening Balances for bank and Cash - function to fetch balance on or before a specific date
    export const fetchLatestBalanceBeforeDate = async (groupId: string, accountId: string, date: string) => {
            const balancesCollection = collection(db, "ledgerGroupsFinal", groupId, "accounts", accountId, "balances");
            const q = query(balancesCollection, where("date", "<=", date), orderBy("date", "desc"), limit(1));
            const snapshot = await getDocs(q);
        
            if (!snapshot.empty) {
              const data = snapshot.docs[0].data();
              return data.cumulativeBalance ?? 0; // Use cumulativeBalance or default to 0
            }
            return 0; // Default to 0 if no balance is found
          };

    // function to fetch balance for a specific date

    export const fetchBalanceForDate = async (groupId: string, accountId: string, date: string): Promise<number> => {
            try {
              const balancesCollection = collection(db, "ledgerGroupsFinal", groupId, "accounts", accountId, "balances");
              const q = query(balancesCollection, where("date", "==", date));
              const snapshot = await getDocs(q);
          
              if (!snapshot.empty) {
                const data = snapshot.docs[0].data();
                return data.cumulativeBalance ?? 0; // Use cumulativeBalance or default to 0
              }
          
              return 0; // Default to 0 if no balance is found
            } catch (error) {
              console.error("Error fetching balance for date:", error);
              throw new Error("Failed to fetch balance for the specified date");
            }
          };