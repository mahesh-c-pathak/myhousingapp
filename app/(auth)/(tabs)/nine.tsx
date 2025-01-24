import React from 'react';
import { View, Button, StyleSheet, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const PdfGenerator = () => {
  const generatePdf = async () => {
    const htmlContent = `
      <!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f4f4f4;
    }
    .group {
      font-weight: bold;
    }
    .subgroup {
      padding-left: 20px;
    }
    .total {
      font-weight: bold;
    }
    .amount {
      text-align: right;
    }
  </style>
</head>
<body>
  <table>
    <thead>
      <tr>
        <th>Liabilities</th>
        <th class="amount">Amount</th>
        <th>Assets</th>
        <th class="amount">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="group">Capital Account</td>
        <td></td>
        <td class="group">Accounts Receivable</td>
        <td></td>
      </tr>
      <tr>
        <td class="subgroup">Reserve and surplus</td>
        <td class="amount">0.00</td>
        <td class="subgroup">Club House Income Receivables</td>
        <td class="amount">-14.00</td>
      </tr>
      <tr>
        <td></td>
        <td></td>
        <td class="subgroup">Donation Received Receivables</td>
        <td class="amount">-3.00</td>
      </tr>
      <tr>
        <td class="group">Current Liabilities</td>
        <td></td>
        <td class="subgroup">Electricity Income Collection Receivables</td>
        <td class="amount">6.00</td>
      </tr>
      <tr>
        <td class="subgroup">Members advanced</td>
        <td class="amount">0.00</td>
        <td class="group">Bank Accounts</td>
        <td></td>
      </tr>
      <tr>
        <td class="group">Reserve and Surplus</td>
        <td></td>
        <td class="subgroup">Bank</td>
        <td class="amount">23.00</td>
      </tr>
      <tr>
        <td class="subgroup">Sinking Funds</td>
        <td class="amount">0.00</td>
        <td class="group">Cash in Hand</td>
        <td></td>
      </tr>
      <tr>
        <td class="group">Income & Expenditure Account</td>
        <td></td>
        <td class="subgroup">Cash</td>
        <td class="amount">-509.00</td>
      </tr>
      <tr>
        <td class="subgroup">Surplus Amount</td>
        <td class="amount">-509.00</td>
        <td class="total">Total Amount</td>
        <td class="amount total">-497.00</td>
      </tr>
      <tr>
        <td class="total">Total Amount</td>
        <td class="amount total">-509.00</td>
        <td></td>
        <td></td>
      </tr>
    </tbody>
  </table>
</body>
</html>

    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      if (uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Error', 'Sharing is not available on this device.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to generate or share PDF: ${errorMessage}`);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Generate PDF" onPress={generatePdf} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PdfGenerator;
