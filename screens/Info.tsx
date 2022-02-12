import * as React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { TextResult } from 'vision-camera-dynamsoft-barcode-reader';

export default function Info({ route, navigation }) {
  const barcode:TextResult = route.params.barcode;
  return (
    <SafeAreaView style={styles.container}>
      <Text>{barcode.barcodeText}</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex:1,
  },
});