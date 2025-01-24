import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Button, View } from 'react-native';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DIRECTORY_URI_KEY = 'directoryUri';

export default function App() {
  const generateExcel = async () => {
    try {
      const data = [
        { Name: 'John Doe', Age: 30, City: 'New York' },
        { Name: 'Jane Smith', Age: 25, City: 'Los Angeles' },
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const base64 = XLSX.write(wb, { type: 'base64' });
      const tempFilename = `${FileSystem.documentDirectory}MyExcel.xlsx`;

      await FileSystem.writeAsStringAsync(tempFilename, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      let savedDirectoryUri = await AsyncStorage.getItem(DIRECTORY_URI_KEY);

      if (!savedDirectoryUri) {
        const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) {
          console.log('Permission not granted.');
          return;
        }

        savedDirectoryUri = permissions.directoryUri;
        await AsyncStorage.setItem(DIRECTORY_URI_KEY, savedDirectoryUri);
      }

      const filename = 'MyExcel.xlsx';
      const uri = await StorageAccessFramework.createFileAsync(
        savedDirectoryUri,
        filename,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('File saved to:', uri);
      // Remove the temporary file from the documentDirectory after saving
      await FileSystem.deleteAsync(tempFilename, { idempotent: true });
      console.log('Temporary file removed from documentDirectory');
      
    } catch (error) {
      console.error('Error while saving the Excel file:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Generate Excel" onPress={generateExcel} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
