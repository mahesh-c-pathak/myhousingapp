import { doc, getDoc } from "firebase/firestore";
import { db } from "../FirebaseConfig";

export interface Member {
  label: string;
  value: string;
}

export const fetchMembers = async (): Promise<Member[]> => {
  try {
    const docRef = doc(db, "Societies", "New Home Test");
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      const wingsData = data?.wings;

      if (wingsData) {
        const tempMembers: { wing: string; flat: number; label: string; value: string }[] = [];

        Object.entries(wingsData).forEach(([wing, wingData]: any) => {
          Object.entries(wingData.floorData).forEach(([floor, flats]: any) => {
            Object.entries(flats).forEach(([flatNumber, flatData]: any) => {
              tempMembers.push({
                wing,
                flat: parseInt(flatNumber, 10),
                label: `${wing} ${flatNumber}`,
                value: `${wing} ${flatNumber}`,
              });
            });
          });
        });

        const sortedMembers = tempMembers.sort((a, b) => {
          if (a.wing < b.wing) return -1;
          if (a.wing > b.wing) return 1;
          return a.flat - b.flat;
        });

        return sortedMembers.map((member) => ({
          label: member.label,
          value: member.value,
        }));
      }
    }
    console.error("Document not found or wings data missing!");
    return [];
  } catch (error) {
    console.error("Error fetching members:", error);
    throw error;
  }
};
