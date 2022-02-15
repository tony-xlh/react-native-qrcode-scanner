import * as React from 'react';
import { Alert, TouchableOpacity, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import CheckBox from '@react-native-community/checkbox';

export default function Home({route, navigation}) {
  const [toggleCheckBox, setToggleCheckBox] = React.useState(true)

  React.useEffect(() => {
    if (route.params?.results) {
      Alert.alert("","Found "+route.params?.results.length+" barcodes.");
    }
  }, [route.params?.results]);

  const onPressed = () => {
    navigation.navigate(
      {
        params: { continuous: toggleCheckBox },
        name: 'BarcodeScanner'
      });
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={onPressed}
      >
        <Text style={styles.buttonText}>Scan Barcodes</Text>
      </TouchableOpacity>
       <View style={styles.checkboxContainer}>
        <CheckBox
          style={styles.checkbox}
          disabled={false}
          value={toggleCheckBox}
          onValueChange={(newValue) => setToggleCheckBox(newValue)}
        />
        <Text style={styles.label}>Continuous</Text>
       </View>
       
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex:1,
  },
  checkboxContainer: {
    alignItems: 'flex-start',
    flexDirection: "row",
  },
  button: {
    alignItems: "center",
    backgroundColor: "rgb(33, 150, 243)",
    margin: 8,
    padding: 10,
  },
  buttonText:{
    color: "#FFFFFF",
  },
  checkbox: {
    alignSelf: "center",
  },
  label: {
    margin: 8,
  },
});