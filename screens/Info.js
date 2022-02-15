import * as React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function Info({ route, navigation }) {
  const barcode = route.params.barcode;
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