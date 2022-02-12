import * as React from 'react';
import { Text, Dimensions, SafeAreaView, TouchableOpacity, StyleSheet, View, Platform, Button, GestureResponderEvent } from 'react-native';
import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera';
import { DBRConfig, decode, TextResult } from 'vision-camera-dynamsoft-barcode-reader';
import * as REA from 'react-native-reanimated';
import { Polygon, Text as SVGText, Svg } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';

export default function BarcodeScanner() {
  const [hasPermission, setHasPermission] = React.useState(false);
  const [barcodeResults, setBarcodeResults] = React.useState([] as TextResult[]);
  const [buttonText, setButtonText] = React.useState(" Pause ");
  const [isActive, setIsActive] = React.useState(true);
  const [frameWidth, setFrameWidth] = React.useState(720);
  const [frameHeight, setFrameHeight] = React.useState(1280);
  const devices = useCameraDevices();
  const device = devices.back;
  const navigation = useNavigation();

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet'
    const config:DBRConfig = {};
    //config.template="{\"ImageParameter\":{\"BarcodeFormatIds\":[\"BF_QR_CODE\"],\"Description\":\"\",\"Name\":\"Settings\"},\"Version\":\"3.0\"}";
    
    const results:TextResult[] = decode(frame,config)
    
    console.log("height: "+frame.height);
    console.log("width: "+frame.width);
    
    REA.runOnJS(setBarcodeResults)(results);
    REA.runOnJS(setFrameWidth)(frame.width);
    REA.runOnJS(setFrameHeight)(frame.height);
  }, [])

  const onPress = () => {
    if (buttonText==" Pause "){
      setButtonText(" Resume ");
      setIsActive(false);
    }else{
      setButtonText(" Pause ");
      setIsActive(true);
    }
  };

  const barcodePressed = (tr:TextResult) => {
    console.log("barcode pressed");
  };

  function getPointsData(lr:TextResult){
    var pointsData = lr.x1 + "," + lr.y1 + " ";
    pointsData = pointsData+lr.x2 + "," + lr.y2 +" ";
    pointsData = pointsData+lr.x3 + "," + lr.y3 +" ";
    pointsData = pointsData+lr.x4 + "," + lr.y4;
    return pointsData;
  }

  function getViewBox(){
    let viewBox = null;
    if (frameWidth>frameHeight && Dimensions.get('window').width>Dimensions.get('window').height){
      viewBox = "0 0 "+frameWidth+" "+frameHeight;
    }else {
      console.log("Has rotation");
      viewBox = "0 0 "+frameHeight+" "+frameWidth;
    }    
    console.log("viewBox"+viewBox);
    return viewBox;
  }

  React.useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized');
    })();
  }, []);


  return (
      <SafeAreaView style={styles.container}>
        {device != null &&
        hasPermission && (
        <>
            <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isActive}
            frameProcessor={frameProcessor}
            frameProcessorFps={5}
            />
        </>)}
        <Svg style={[StyleSheet.absoluteFill]} viewBox={getViewBox()}>

          {barcodeResults.map((barcode, idx) => (
            <Polygon key={"poly-"+idx}
            points={getPointsData(barcode)}
            fill="lime"
            stroke="green"
            opacity="0.5"
            strokeWidth="1"
            onPressOut={() => {
              console.log('pressed');
              navigation.navigate("Info", {"barcode":barcode});
            }}
            />
          ))}
           {barcodeResults.map((barcode, idx) => (
            <SVGText key={"text-"+idx}
              fill="white"
              stroke="purple"
              fontSize="20"
              fontWeight="bold"
              x={barcode.x1}
              y={barcode.y1}
            >
              {barcode.barcodeText}
            </SVGText>
          ))}
        </Svg>
        <View style={styles.button}>
          <TouchableOpacity onPress={onPress}>
            <Text style={{fontSize: 16, color: "black"}}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
       
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barcodeText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  button: {
    position: 'absolute',
    justifyContent: 'center',
    bottom: "10%",
    borderColor:"black", 
    borderWidth:2, 
    borderRadius:5,
    backgroundColor: "rgba(255,255,255,0.2)"
  },
});
