import * as React from 'react';
import { SafeAreaView, StyleSheet, Text, BackHandler } from 'react-native';

export default function Info({ route, navigation }) {
  const barcode = route.params.barcode;
  React.useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);


  return (
    <SafeAreaView style={styles.container}>
      <Text>{"Barcode Format: "+barcode.barcodeFormat}</Text>
      <Text>{"Barcode Text: "+barcode.barcodeText}</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex:1,
  },
});