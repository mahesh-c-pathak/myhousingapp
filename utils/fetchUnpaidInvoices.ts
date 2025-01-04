// utils/fetchUnpaidInvoices.ts
import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { db } from "../FirebaseConfig";

// Define TypeScript type for Invoice
interface Invoice {
  id: string;
  dueDate: Date | null;
  totalAmount: number;
  ref: DocumentData; // Reference to the Firestore document for updates
}

// Fetch unpaid invoices for a specific user
export const fetchUnpaidInvoices = async (userId: string): Promise<Invoice[]> => {
  const invoicesRef = collection(db, 'invoices');
  const q = query(invoicesRef, where('userId', '==', userId), where('status', '==', 'Unpaid'));

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      dueDate: data.dueDate?.toDate() ?? null, // Convert Timestamp to Date
      totalAmount: data.totalAmount ?? 0,
      ref: doc.ref,
    };
  });
};
