import {
  StyleSheet,
  Image,
  FlatList,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import CustomInput from '../../../components/CustomInput';
import GetUserToken from '../../../utils/GetUserToken'; // Import the function
import UploaFiles from '../../../utils/UploaFiles'; // Import the function
import {sendEmail} from '../../../utils/sendEmail'; // Import the function

export default function Ten() {
  const [fileName, setFileName] = useState<string>('');
  const [fileUri, setFileUri] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');

  const [to, setTo] = useState("mahesh.c.pathak@gmail.com");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("Test Email 2");
  const [message, setMessage] = useState("This is a test email 2.");
  const [attachments, setAttachments] = useState<string[]>([]);

   
    
  const [files, setFiles] = useState<{ name: string; uri: string; mimeType: string }[]>([]); // Updated type
  
  //const [files, setFiles] = useState<string[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);

  const [username, setUsername] = useState('mahesh.c.pathak@gmail.com');
  const [password, setPassword] = useState('@Usha2025$');
  const [userToken, setUserToken] = useState<string>('');

  const handleUserToken = async () => {
    setUserToken(''); // Clear previous message
    const result = await GetUserToken(username, password);

    if ('userToken' in result) {
      setUserToken(`${result.userToken}`); // Display token or handle it
    } else if ('error' in result) {
      setUserToken(`Error: ${result.error}`); // Display error message
    }
};

// Handle file uploads
const handleFileUpload = async () => {
  if (files.length === 0) {
    Alert.alert('Error', 'No files selected for upload.');
    return;
  }

  const uploadedAttachments: string[] = []; // Temporary array for storing uploaded file URIs

  for (const file of files) {
    const { uri, name, mimeType } = file;
    const result = await UploaFiles(uri, name, mimeType, userToken);

    if (typeof result === 'string') {
      console.log('File uploaded successfully:', result);
      uploadedAttachments.push(result); // Directly push the URL string
    } else if ('error' in result) {
      console.error('Error:', result.error);
      Alert.alert('Error', result.error);
    }
  }

  setAttachments(uploadedAttachments); // Update the attachments state with all uploaded URIs
  Alert.alert('Success', 'All files uploaded successfully.');
};



  // Open the camera to capture an image
  const captureImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera Access Denied', 'You need to allow camera access to use this feature.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      setImage(imageUri);
      setImages((prev) => [...prev, imageUri]); // Add to images list
      console.log('Image captured: ', imageUri);
    }
  };

  // Open the gallery to pick an image
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      setImage(imageUri);
      setImages((prev) => [...prev, imageUri]); // Add to images list
      console.log('Image picked: ', imageUri);
    }
  };

  

  // Pick files, including PDFs and XLS
  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.ms-excel', 'image/*'], // Allowed file types
        copyToCacheDirectory: true,
      });
  
      console.log('Document Picker Result:', result);
  
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const { uri, name, mimeType } = result.assets[0]; // Access the first file
        
        setFileName(name); // Display the file name
        setFileUri(uri);
        setFileType(mimeType || 'application/octet-stream');
        setFiles((prev) => [...prev, { name, uri, mimeType: mimeType || 'application/octet-stream'  }]); // Add  name, mimeType and URI to files array
        // setFiles((prev) => [...prev, uri]); // Add file URI to the list
        // setFiles([uri]); // Overwrite files with the new selection
      } else {
        console.log('File picking was canceled or no file selected.');
      }
    } catch (error) {
      console.error('Error picking file:', error);
    }
  };

  const handleSendEmail = async () => {
    try {
      console.log('attachments', attachments)
        const response = await sendEmail(
            to.split(',').map(email => email.trim()), // Split and trim multiple recipients
            cc.split(',').map(email => email.trim()), // Optional CC
            bcc.split(',').map(email => email.trim()), // Optional BCC
            subject,
            message,
            attachments, // Attachments (optional)
            userToken
        );

        if (response.success) {
            Alert.alert('Success', response.message);
        } else {
            Alert.alert('Error', response.message);
        }
    } catch (err) {
      const error = err as Error; // Explicitly cast 'err' to 'Error'
      Alert.alert('Error', error.message || 'An unexpected error occurred');
  }
};
  

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Storage</Text>

        <TouchableOpacity style={styles.button} onPress={handleUserToken}>
          <Text style={styles.buttonText}>Get User Token</Text>
        </TouchableOpacity>
        {userToken && <Text style={styles.message}>{userToken}</Text>}

        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>Pick an Image from Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={captureImage}>
          <Text style={styles.buttonText}>Capture Image from Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={pickFile}>
          <Text style={styles.buttonText}>Pick a File (PDF, XLS, Image)</Text>
        </TouchableOpacity>

        {image && (
          <>
            <Image source={{ uri: image }} style={styles.image} />
            <TouchableOpacity style={styles.button} onPress={() => console.log('Upload pressed')}>
              <Text style={styles.buttonText}>Upload Image</Text>
            </TouchableOpacity>
          </>
        )}

        <FlatList
          data={images}
          renderItem={({ item }) => (
            <View style={styles.imageContainer}>
              <Image source={{ uri: item }} style={styles.image} />
              <TouchableOpacity style={styles.button} onPress={() => console.log('Delete pressed')}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
        />

        <FlatList
          data={files}
          renderItem={({ item }) => (
            <View style={styles.fileContainer}>
              {/* Ensure item.name is properly rendered */}
              <Text style={styles.fileText}>{`${item.name} is attached`}</Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  setFiles((prev) => prev.filter((file) => file.uri !== item.uri)); // Delete file logic
                }}
              >
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(item) => item.uri}
        />

        <TouchableOpacity style={styles.button} onPress={handleFileUpload}>
          <Text style={styles.buttonText}>Upload File</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleSendEmail}>
          <Text style={styles.buttonText}>Send Email</Text>
        </TouchableOpacity>
        



      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  image: {
    width: 200,
    height: 200,
    marginVertical: 10,
  },
  fileText: {
    fontSize: 16,
    marginVertical: 5,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  fileContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  button: {
    padding: 10,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5C6BC0',
    shadowColor: '#5C6BC0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
    marginVertical: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  message: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
},
});
