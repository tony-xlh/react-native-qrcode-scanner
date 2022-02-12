import * as React from 'react';
import {StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BarcodeScanner from './screens/BarcodeScanner';
import Home from './screens/Home';
import Info from './screens/Info';

const Root = createNativeStackNavigator()

export default function App() {

  return (
    <NavigationContainer>
      <Root.Navigator>
        <Root.Group>
          <Root.Screen name="Home" component={Home} />
          <Root.Screen name="Info" component={Info} />
        </Root.Group>
        <Root.Group screenOptions={{ headerShown: false }}>
          <Root.Screen name="BarcodeScanner" component={BarcodeScanner} />
        </Root.Group>
      </Root.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

