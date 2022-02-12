import { useNavigation } from '@react-navigation/native';
import * as React from 'react';
import { Button, SafeAreaView, StyleSheet, View } from 'react-native';

export default function Home() {
  const navigation = useNavigation();
  const onPressed = () => {
    navigation.navigate("BarcodeScanner");
  }
  return (
    <SafeAreaView style={styles.container}>
      <Button
       onPress={onPressed}
       title="Scan Barcodes" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex:1,
  },
});