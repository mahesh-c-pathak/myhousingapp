import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  TouchableWithoutFeedback
} from "react-native";
import PaymentDatePicker from "../../../utils/paymentDate";
import { getCurrentFinancialYear, calculateFinancialYears } from "../../../utils/financialYearHelpers";
import AppbarComponent from '../../../components/AppbarComponent';
import { Stack, useRouter } from 'expo-router';
import AppbarMenuComponent from '../../../components/AppbarMenuComponent';
interface FinancialYear {
  label: string;
  start: string;
  end: string;
}

const IncomeAndExpenditureScreen = () => {
  const router = useRouter();
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
  const { width } = useWindowDimensions();

  const [fromDate, setFromDate] = useState(new Date(Date.now()));
  const [toDate, setToDate] = useState(new Date(Date.now()));

  const [menuVisible, setMenuVisible] = useState(false);
  
      const handleMenuOptionPress = (option: string) => {
        console.log(`${option} selected`);
        setMenuVisible(false);
      };

  const handleFilterPress = () => {
    console.log('Filter pressed');
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const handleThreeDotPress = () => {
    console.log('Three dot menu pressed');
  };

  useEffect(() => {
    // Set initial state for current financial year
    const { startDate, endDate } = getCurrentFinancialYear();
    setFromDate(new Date(startDate));
    setToDate(new Date(endDate));

    // Calculate previous 4 financial years
    const today = new Date();
    const currentYear = today.getMonth() < 3 ? today.getFullYear() - 1 : today.getFullYear();
    const years = calculateFinancialYears(currentYear, 4); // Get previous 4 financial years
    setFinancialYears(years);
  }, []);

  const handleYearSelect = (start: string, end: string) => {
    setFromDate(new Date(start)); // Set the start date for the date picker
    setToDate(new Date(end)); // Set the end date for the date picker
  };

  const buttonWidth = (width - 50) / 4; // Calculate width for 4 buttons with padding

  return (
    <TouchableWithoutFeedback onPress={closeMenu}>
    <View style={styles.container}>
      
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <AppbarComponent
        title="Sample Title "
        source="Admin"
        onPressFilter={handleFilterPress}
        onPressThreeDot={() => setMenuVisible(!menuVisible)} // Toggle menu visibility
      />

      {/* Three-dot Menu */}
      {/* Custom Menu */}
      {menuVisible && (
        <AppbarMenuComponent
        items={["Edit Ledger", "Delete Ledger", "Download PDF", "Download Excel"]}
        onItemPress={handleMenuOptionPress}
        closeMenu={closeMenu}
      />
      )}
      

      {/* Financial Year Buttons */}
      <View style={styles.fyContainer}>
        {financialYears.map((year) => (
          <TouchableOpacity
            key={year.label}
            style={[styles.fyButton, { width: buttonWidth }]}
            onPress={() => handleYearSelect(year.start, year.end)}
          >
            <Text style={styles.fyText}>{year.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date Inputs */}
      <View style={styles.dateInputsContainer}>
        <View style={styles.section}>
          <PaymentDatePicker initialDate={fromDate} onDateChange={setFromDate} />
        </View>
        <View style={styles.section}>
          <PaymentDatePicker initialDate={toDate} onDateChange={setToDate} />
        </View>

        <TouchableOpacity style={styles.goButton}>
          <Text style={styles.goButtonText}>Go</Text>
        </TouchableOpacity>
      </View>

      {/* Bank and Cash Balances */}
      <View style={styles.balancesContainer}>
        <View style={[styles.balanceCard, styles.bankCard]}>
          <Text style={styles.balanceTitle}>Bank</Text>
          <Text style={styles.balanceText}>
            Opening Bal:<Text style={styles.balanceTextAmt}> ₹ 0.00</Text>
          </Text>
          <Text style={styles.balanceText}>
            Closing Bal:<Text style={styles.balanceTextAmt}>₹ 0.00</Text>
          </Text>
        </View>
        <View style={[styles.balanceCard, styles.cashCard]}>
          <Text style={styles.balanceTitle}>Cash</Text>
          <Text style={styles.balanceText}>
            Opening Bal:<Text style={styles.balanceTextAmt}> ₹ 0.00</Text>
          </Text>
          <Text style={styles.balanceText}>
            Closing Bal:<Text style={styles.balanceTextAmt}>₹ 0.00</Text>
          </Text>
        </View>
      </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

// Styles...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF",},
  header: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  fyContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  fyButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    paddingVertical: 10,
    marginBottom: 5,
    alignItems: "center",
    marginHorizontal: 5,
    elevation: 2,
  },
  fyText: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  dateInputsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  goButton: {
    backgroundColor: "#28a745",
    justifyContent: "center", // Center text vertically
    alignItems: "center", // Center text horizontally
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  goButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  balancesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  balanceCard: {
    flex: 1,
    padding: 8,
    borderRadius: 5,
    marginHorizontal: 5,
    elevation: 2,
  },
  bankCard: {
    backgroundColor: "#d6eaff",
  },
  cashCard: {
    backgroundColor: "#d1f7d6",
  },
  balanceTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  balanceText: {
    fontSize: 12,
    marginBottom: 5,
  },
  balanceTextAmt: {
    fontSize: 14,
    fontWeight: "bold",
  },
  section: { flex: 1, margin: 5 },
});

export default IncomeAndExpenditureScreen;
