import { doc, collection, getDocs } from "firebase/firestore";
import { db } from "../FirebaseConfig";

export interface Member {
  label: string;
  value: string;
  floor: string;
}

export const fetchMembersUpdated = async (societyName: string): Promise<Member[]> => {
  try {
    // Reference to the society document
    const societyDocRef = doc(db, "Societies", societyName);
    const wingsCollectionRef = collection(societyDocRef, "wings");

    // Fetch all wings
    const wingsSnapshot = await getDocs(wingsCollectionRef);

    if (!wingsSnapshot.empty) {
      const tempMembers: {
        wing: string;
        flat: number;
        floor: number;
        label: string;
        value: string;
      }[] = [];

      for (const wingDoc of wingsSnapshot.docs) {
        const wingName = wingDoc.id;
        const floorsCollectionRef = collection(wingDoc.ref, "floors");

        // Fetch all floors in the wing
        const floorsSnapshot = await getDocs(floorsCollectionRef);

        for (const floorDoc of floorsSnapshot.docs) {
          const floorData = floorDoc.data();
          const floorNumber = floorData.floorNumber;

          const flatsCollectionRef = collection(floorDoc.ref, "flats");

          // Fetch all flats on the floor
          const flatsSnapshot = await getDocs(flatsCollectionRef);

          for (const flatDoc of flatsSnapshot.docs) {
            const flatNumber = parseInt(flatDoc.id, 10);

            tempMembers.push({
              wing: wingName,
              flat: flatNumber,
              floor: floorNumber,
              label: `${wingName} ${flatNumber}`,
              value: `${wingName} ${flatNumber}`,
            });
          }
        }
      }

      // Sort and format the member list
      const sortedMembers = tempMembers.sort((a, b) => {
        if (a.wing < b.wing) return -1;
        if (a.wing > b.wing) return 1;
        if (a.floor < b.floor) return -1;
        if (a.floor > b.floor) return 1;
        return a.flat - b.flat;
      });

      return sortedMembers.map((member) => ({
        label: member.label,
        value: member.value,
        floor: member.floor.toString(), // Convert floor to string,
      }));
    }

    console.error("No wings found in the specified society!");
    return [];
  } catch (error) {
    console.error("Error fetching members:", error);
    throw error;
  }
};
