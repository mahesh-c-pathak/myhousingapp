import { Alert } from "react-native";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../FirebaseConfig";
import { useRouter } from "expo-router";

interface RefundEntry {
  voucherNumber: string;
  amount: number;
}

export const handleDeleteRefund = async (
  societyName: string,
  wing: string,
  floorName: string,
  flatNumber: string,
  voucherNumber: string
) => {
  const router = useRouter();

  // Confirmation Alert
  Alert.alert(
    "Confirm Delete",
    "Are you sure you want to delete this refund entry?",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          try {
            const docRef = doc(db, "Societies", societyName);
            const societyDocSnap = await getDoc(docRef);

            if (societyDocSnap.exists()) {
              const societyData = societyDocSnap.data();
              const societyWings = societyData.wings;

              const relevantWing =
                societyWings?.[wing]?.floorData?.[floorName]?.[flatNumber];

              if (relevantWing) {
                const refundEntries: RefundEntry[] = relevantWing.Refund || [];
                const refundToDelete = refundEntries.find(
                  (entry) => entry.voucherNumber === voucherNumber
                );

                if (refundToDelete) {
                  relevantWing.currentBalance += refundToDelete.amount;

                  const updatedRefundEntries = refundEntries.filter(
                    (entry) => entry.voucherNumber !== voucherNumber
                  );

                  const updatedFlatData = {
                    ...relevantWing,
                    Refund: updatedRefundEntries,
                  };

                  const updatedSocietyData = {
                    ...societyData,
                    wings: {
                      ...societyData.wings,
                      [wing]: {
                        ...societyData.wings[wing],
                        floorData: {
                          ...societyData.wings[wing].floorData,
                          [floorName]: {
                            ...societyData.wings[wing].floorData[floorName],
                            [flatNumber]: updatedFlatData,
                          },
                        },
                      },
                    },
                  };

                  await setDoc(docRef, updatedSocietyData);

                  Alert.alert(
                    "Refund",
                    "Refund entry deleted successfully",
                    [
                      {
                        text: "OK",
                        onPress: () => {
                          router.replace({
                            pathname: "/Wallet",
                            params: {
                              source: "Admin",
                              societyName,
                              wing,
                              floorName,
                              flatNumber,
                            },
                          });
                        },
                      },
                    ],
                    { cancelable: false }
                  );
                } else {
                  Alert.alert("Error", "Refund entry not found.");
                }
              } else {
                Alert.alert("Error", "Flat data not found.");
              }
            } else {
              Alert.alert("Error", "Society document not found.");
            }
          } catch (error) {
            console.error("Error deleting refund entry:", error);
            Alert.alert("Error", "Failed to delete refund entry. Please try again.");
          }
        },
      },
    ],
    { cancelable: true }
  );
};
