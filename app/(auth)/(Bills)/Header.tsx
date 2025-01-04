import { View, Text, StyleSheet, StatusBar, Platform, SafeAreaView } from 'react-native';
import React from 'react';
import { Appbar, Avatar } from 'react-native-paper';

const Header = ({ wing, flatNumber, billNumber }: { wing: string; flatNumber: string; billNumber: string }) => {
  const _goBack = () => console.log('Went back');
  const _handleMore = () => console.log('Shown more');

  return (
    <View style={styles.container}>
      {/* Appbar Header */}
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={_goBack} color="#fff" />
        <Appbar.Content title={billNumber} titleStyle={styles.titleStyle} />
        <Appbar.Action icon="dots-vertical" onPress={_handleMore} color="#fff" />
      </Appbar.Header>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5e35b1',
    // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, // Add padding for Android devices
  },
  appbar: {
    backgroundColor: '#5e35b1', // Consistent background color
    elevation: 0, // Removes shadow
  },
  titleStyle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginTop: 60, // Space below the Appbar
  },
  avatar: {
    backgroundColor: '#7e57c2', // Match avatar background
    marginRight: 10,
  },
  textContainer: {
    justifyContent: 'center',
  },
  profileText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Header;
