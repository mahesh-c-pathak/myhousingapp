// wingService.ts
import { db } from '../../FirebaseConfig';  // Import the db configuration
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { generateFloorWiseNumbers } from '../../utils/SetupWIngs/generateFloorWiseNumbers'; // Import the floor generation function

export const handleNext = async (
  Wing: string,
  name: string,
  totalFloors: string,
  unitsPerFloor: string,
  selectedFormat: number | null,
  numberFormats: Array<{ label: string, type: string }>,
  router: any
) => {
  if (totalFloors && unitsPerFloor && selectedFormat !== null) {
    try {
      const sanitizedWing = Wing.trim(); // Trim any trailing spaces
      const docRef = doc(db, 'Societies', name);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        alert('Society does not exist!');
        return;
      }

      // Generate floor-wise numbers using the provided arguments
      const floorWiseNumbers = generateFloorWiseNumbers(
        totalFloors,
        unitsPerFloor,
        selectedFormat,
        numberFormats
      );
      
      if (!floorWiseNumbers) return;

      // Prepare wing data
      const wingData = {
        totalFloors: parseInt(totalFloors),
        unitsPerFloor: parseInt(unitsPerFloor),
        format: numberFormats[selectedFormat].type,
      };

      // Create a new document in the "wings" collection for the given wing
      const wingDocRef = doc(db, 'Societies', name, 'wings', sanitizedWing);
      await setDoc(wingDocRef, wingData);

      // Add the floor documents and flats within each floor
      const floorsCollection = collection(wingDocRef, 'floors');
      for (let floorNumber = 1; floorNumber <= parseInt(totalFloors); floorNumber++) {
        const floorDocRef = doc(floorsCollection, `floor_${floorNumber}`);
        await setDoc(floorDocRef, {
          floorNumber: floorNumber,
        });

        // Create flats under each floor
        const flatsCollection = collection(floorDocRef, 'flats');
        for (let unitIndex = 1; unitIndex <= parseInt(unitsPerFloor); unitIndex++) {
          const flatNumber = `${floorNumber}${String.fromCharCode(65 + unitIndex - 1)}`; // Example: "1A", "1B"
          const flatDocRef = doc(flatsCollection, flatNumber);
          await setDoc(flatDocRef, {
            resident: 'owner',  // Default value
            flatType: 'owner',  // Default value
          });

          // Optionally, add bills subcollection for each flat
          const billsCollection = collection(flatDocRef, 'bills');
          await addDoc(billsCollection, {
            status: 'unpaid',   // Default bill status
            amount: 0,          // Default amount due
          });
        }
      }

      alert(`Data for Wing ${Wing} saved successfully!`);

      router.push({
        pathname: '/WingSetupScreen',
        params: { Wing, name },
      });
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to save data. Please try again.');
    }
  } else {
    alert('Please fill all fields and select a format!');
  }
};
