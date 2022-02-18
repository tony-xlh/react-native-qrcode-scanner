import * as React from 'react';
import { Text, Linking, Dimensions, SafeAreaView, TouchableOpacity, StyleSheet, View, Platform, Alert, Switch, BackHandler } from 'react-native';
import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera';
import { DBRConfig, decode, TextResult } from 'vision-camera-dynamsoft-barcode-reader';
import * as REA from 'react-native-reanimated';

import { Polygon, Text as SVGText, Svg, Rect } from 'react-native-svg';
import ActionSheet from '@alessiocancian/react-native-actionsheet';
import Clipboard from '@react-native-clipboard/clipboard';
import {getRotation, Surface} from 'react-native-rotation-info'

let pressedResult:TextResult|undefined;

export default function BarcodeScanner({ route, navigation }) {
  const mounted = REA.useSharedValue(true);
  const rotated = REA.useSharedValue(false);
  const regionEnabledShared = REA.useSharedValue(false);
  const rotation = REA.useSharedValue(0);
  const continuous = route.params.continuous;
  const [hasPermission, setHasPermission] = React.useState(false);
  const [barcodeResults, setBarcodeResults] = React.useState([] as TextResult[]);
  const [buttonText, setButtonText] = React.useState("Pause");
  const [isActive, setIsActive] = React.useState(true);
  const [frameWidth, setFrameWidth] = React.useState(1280);
  const [frameHeight, setFrameHeight] = React.useState(720);
  const [regionEnabled, setRegionEnabled] = React.useState(false);
  const [torchEnabled, setTorchEnabled] = React.useState(false);
  const devices = useCameraDevices();
  const device = devices.back;let actionSheetRef = React.useRef(null);
  let scanned = false;

  React.useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized');
    })();

    const backAction = () => {
      setIsActive(false);
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  React.useEffect(()=>{
    mounted.value = true; // to avoid the error: Can’t perform a React state update on an unmounted component.
    return () => { mounted.value = false };
  });

  const onBarCodeDetected = (results:TextResult[]) => {
    if (continuous == false && scanned== false){
      console.log("Barcodes detected. Navigating");
      setIsActive(false);
      scanned = true;
      navigation.navigate(
        {
          params: { results: results },
          name: 'Home'
        });
    }
  };

  const toggleCameraStatus = () => {
    if (buttonText=="Pause"){
      setButtonText("Resume");
      setIsActive(false);
    }else{
      setButtonText("Pause");
      setIsActive(true);
    }
  };

  const getPointsData = (lr:TextResult) => {
    var pointsData = lr.x1 + "," + lr.y1 + " ";
    pointsData = pointsData+lr.x2 + "," + lr.y2 +" ";
    pointsData = pointsData+lr.x3 + "," + lr.y3 +" ";
    pointsData = pointsData+lr.x4 + "," + lr.y4;
    return pointsData;
  }

  const getViewBox = () => {
    const frameSize = getFrameSize();
    const viewBox = "0 0 "+frameSize[0]+" "+frameSize[1];
    console.log("viewBox"+viewBox);
    updateRotated();
    return viewBox;
  }

  const getFrameSize = ():number[] => {
    let width:number, height:number;
    if (HasRotation()){
      width = frameHeight;
      height = frameWidth;
    }else {
      width = frameWidth;
      height = frameHeight;
    }
    return [width, height];
  }

  const HasRotation = () => {
    let value = false
    if (Platform.OS === 'android') {
      if (!(frameWidth>frameHeight && Dimensions.get('window').width>Dimensions.get('window').height)){
        value = true;
      }
    }
    return value;
  }

  const updateRotated = () => {
    rotated.value = HasRotation();
  }

  const updateFrameSize = (width:number, height:number) => {
    if (mounted.value) {
      setFrameWidth(width);
      setFrameHeight(height);
    }
  }

  const onBarcodeScanned = (results:TextResult[]) =>{
    if (mounted.value) {
      setBarcodeResults(results);
      if (results.length>0) {
        onBarCodeDetected(results);
      }
    }
  }

  const updateRotation = () => {
    if (Platform.OS === "android") {
      getRotation().then(function(r) {
          rotation.value = r;
        }
      );
    }
  }
  

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet'
    console.log("height: "+frame.height);
    console.log("width: "+frame.width);
    REA.runOnJS(updateFrameSize)(frame.width, frame.height);
    const config:DBRConfig = {};
    //config.template="{\"ImageParameter\":{\"BarcodeFormatIds\":[\"BF_QR_CODE\"],\"Description\":\"\",\"Name\":\"Settings\"},\"Version\":\"3.0\"}";

    if (regionEnabledShared.value){
      let settings;
      if (config.template){
        settings = JSON.parse(config.template);
      }else{
        const template = 
        `{
          "ImageParameter": {
            "Name": "Settings"
          },
          "Version": "3.0"
        }`;
        settings = JSON.parse(template);
      }
      settings["ImageParameter"]["RegionDefinitionNameArray"] = ["Settings"];
      console.log("rotated: "+rotated.value);
      if (rotated.value){
        
        settings["RegionDefinition"] = {
                                        "Left": 20,
                                        "Right": 65,
                                        "Top": 10,
                                        "Bottom": 90,
                                        "MeasuredByPercentage": 1,
                                        "Name": "Settings",
                                      };
      }else{
        settings["RegionDefinition"] = {
                                        "Left": 10,
                                        "Right": 90,
                                        "Top": 20,
                                        "Bottom": 65,
                                        "MeasuredByPercentage": 1,
                                        "Name": "Settings",
                                      };
        if (Platform.OS == "android") {
            REA.runOnJS(updateRotation)();
            if (rotation.value == Surface.ROTATION_270){
              settings["RegionDefinition"]["Top"] = 35; // 100 - 65
              settings["RegionDefinition"]["Bottom"] = 80; // 100 - 20
              console.log(settings["RegionDefinition"]);
            }
        }
      }
      
      config.template = JSON.stringify(settings);
    }

    const results:TextResult[] = decode(frame,config)
    REA.runOnJS(onBarcodeScanned)(results);
  }, [])

  return (
      <SafeAreaView style={styles.container}>
        {device != null &&
        hasPermission && (
        <>
            <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isActive}
            torch={torchEnabled ? "on" : "off"}
            frameProcessor={frameProcessor}
            frameProcessorFps={5}
            />
        </>)}
        <ActionSheet
          ref={actionSheetRef}
          title={'Select your action'}
          options={['View details', 'Open the link', 'Copy the text', 'Cancel']}
          cancelButtonIndex={3}
          onPress={async (index) => {
            if (pressedResult){
              if (index == 0){
                navigation.navigate("Info", {"barcode":pressedResult});
              } else if (index == 1) {
                const url = pressedResult.barcodeText;
                const supported = await Linking.canOpenURL(url);
                if (supported) {
                  await Linking.openURL(url);
                } else {
                  Alert.alert(`Don't know how to open this URL: ${url}`);
                }
              } else if (index == 2) {
                Clipboard.setString(pressedResult.barcodeText);
              }
            }
          }}
        />
        <Svg style={StyleSheet.absoluteFill} viewBox={getViewBox()}>
          {regionEnabled &&
          <Rect 
            x={0.1*getFrameSize()[0]}
            y={0.2*getFrameSize()[1]}
            width={0.8*getFrameSize()[0]}
            height={0.45*getFrameSize()[1]}
            strokeWidth="2"
            stroke="red"
          />}
          {barcodeResults.map((barcode, idx) => (
            <Polygon key={"poly-"+idx}
            points={getPointsData(barcode)}
            fill="lime"
            stroke="green"
            opacity="0.5"
            strokeWidth="1"
            onPress={() => {
              setButtonText("Resume");
              setIsActive(false);
              pressedResult = barcode;
              actionSheetRef.current.show();
            }}
            />
          ))}
           {barcodeResults.map((barcode, idx) => (
            <SVGText key={"text-"+idx}
              fill="white"
              stroke="purple"
              fontSize={getFrameSize()[0]/400*20}
              fontWeight="bold"
              x={barcode.x1}
              y={barcode.y1}
            >
              {barcode.barcodeText}
            </SVGText>
          ))}
        </Svg>
        <View style={styles.control}>
          <View style={{flex:0.8}}>
            <View style={styles.switchContainer}>
              <Text style={{alignSelf: "center", color: "black"}}>Scan Region</Text>
              <Switch
                style={{alignSelf: "center"}}
                trackColor={{ false: "#767577", true: "black" }}
                thumbColor={regionEnabled ? "white" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={(newValue) => {
                  regionEnabledShared.value = newValue;
                  setRegionEnabled(newValue);
                }}
                value={regionEnabled}
              />
              <Text style={{alignSelf: "center", color: "black"}}>Torch</Text>
              <Switch
                style={{alignSelf: "center"}}
                trackColor={{ false: "#767577", true: "black" }}
                thumbColor={torchEnabled ? "white" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={(newValue) => {
                  setTorchEnabled(newValue);
                }}
                value={torchEnabled}
              />
            </View>
            

          </View>
          <TouchableOpacity onPress={toggleCameraStatus} style={styles.toggleCameraStatusButton}>
            <Text style={{fontSize: 15, color: "black", alignSelf: "center"}}>{buttonText}</Text>
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
  toggleCameraStatusButton: {
    flex: 0.2,
    justifyContent: 'center',
    borderColor:"black", 
    borderWidth:2, 
    borderRadius:5,
    padding: 8,
    margin: 5,
  },
  control:{
    flexDirection:"row",
    position: 'absolute',
    bottom: 0,
    height: "15%",
    width:"100%",
    alignSelf:"flex-start",
    borderColor: "white",
    borderWidth: 0.1,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: 'center',
  },
  switchContainer: {
    alignItems: 'flex-start',
    flexDirection: "row",
  },
});
