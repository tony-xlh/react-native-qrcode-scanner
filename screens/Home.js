import * as React from 'react';
import { Switch, Alert, TouchableOpacity, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function Home({route, navigation}) {
  const [continuousEnabled, setContinuousEnabled] = React.useState(true)

  React.useEffect(() => {
    if (route.params?.results) {
      Alert.alert("","Found "+route.params?.results.length+" barcodes.");
    }
  }, [route.params?.results]);

  const onPressed = () => {
    navigation.navigate(
      {
        params: { continuous: continuousEnabled },
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
       <View style={styles.switchContainer}>
        <Text style={styles.label}>Continuous</Text>
        <Switch
          style={styles.switch}
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={continuousEnabled ? "white" : "#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
          onValueChange={(newValue) => setContinuousEnabled(newValue)}
          value={continuousEnabled}
        />
       </View>
       
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex:1,
  },
  switchContainer: {
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
  switch: {
    alignSelf: "center",
  },
  label: {
    margin: 8,
  },
});