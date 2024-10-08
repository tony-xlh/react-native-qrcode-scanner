import * as React from 'react';
import { Text, Clipboard, Linking, Dimensions, SafeAreaView, TouchableOpacity, StyleSheet, View, Alert, Switch, BackHandler } from 'react-native';
import { Camera, CameraDevice, getCameraFormat, runAsync, runAtTargetFps, useCameraDevice, useCameraDevices, useCameraFormat, useFrameProcessor } from 'react-native-vision-camera';
import { DBRConfig, decode, TextResult } from 'vision-camera-dynamsoft-barcode-reader';

import { Polygon, Text as SVGText, Svg, Rect } from 'react-native-svg';
import ActionSheet from '@alessiocancian/react-native-actionsheet';
import { useSharedValue, Worklets } from 'react-native-worklets-core';

let pressedResult:TextResult|undefined;

export default function BarcodeScanner({ route, navigation }) {
  const mounted = useSharedValue(false);
  const regionEnabledShared = useSharedValue(false);
  const continuous = route.params.continuous;
  const [hasPermission, setHasPermission] = React.useState(false);
  const [barcodeResults, setBarcodeResults] = React.useState([] as TextResult[]);
  const [buttonText, setButtonText] = React.useState("Pause");
  const [isActive, setIsActive] = React.useState(true);
  const [frameWidth, setFrameWidth] = React.useState(1280);
  const [frameHeight, setFrameHeight] = React.useState(720);
  const [regionEnabled, setRegionEnabled] = React.useState(false);
  const [torchEnabled, setTorchEnabled] = React.useState(false);
  
  const backCam = useCameraDevice('back');

  let scanned = false;
  const actionSheetRef = React.useRef<null|ActionSheet>(null);
  const cameraFormat = useCameraFormat(backCam, [
    { videoResolution: { width: 1280, height: 720 } },
    { fps: 60 }
  ])

  React.useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
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
    mounted.value = true;
    return () => {
      backHandler.remove();
      mounted.value = false;
    }
  }, []);


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
    return viewBox;
  }

  const getFrameSize = () => {
    let width, height;
    if (frameWidth>frameHeight && Dimensions.get('window').width>Dimensions.get('window').height){
      width = frameWidth;
      height = frameHeight;
    }else {
      console.log("Has rotation");
      width = frameHeight;
      height = frameWidth;
    }
    return [width, height];
  }

  const updateFrameSize = (width:number, height:number) => {
    setFrameWidth(width);
    setFrameHeight(height);
  }

  const updateFrameSizeJS = Worklets.createRunOnJS(updateFrameSize);
  const onBarcodeScanned = (results:Record<string,TextResult>) =>{
    console.log("onBarcodeScanned");
    let converted = [];
    for (let index = 0; index < Object.keys(results).length; index++) {
      const result = results[Object.keys(results)[index]];
      converted.push(result);
    }
    setBarcodeResults(converted);
    if (converted.length>0) {
      onBarCodeDetected(converted);
    }
  }
  const onBarcodeScannedJS = Worklets.createRunOnJS(onBarcodeScanned);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet'
    runAtTargetFps(5, () => {
      'worklet'
      if (mounted.value) {
        console.log("height: "+frame.height);
        console.log("width: "+frame.width);
        updateFrameSizeJS(frame.width, frame.height);
        const config:DBRConfig = {};
        config.license = "DLS2eyJoYW5kc2hha2VDb2RlIjoiMjAwMDAxLTE2NDk4Mjk3OTI2MzUiLCJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSIsInNlc3Npb25QYXNzd29yZCI6IndTcGR6Vm05WDJrcEQ5YUoifQ==";
        //config.template="{\"ImageParameter\":{\"BarcodeFormatIds\":[\"BF_QR_CODE\"],\"Description\":\"\",\"Name\":\"Settings\"},\"Version\":\"3.0\"}";
        config.rotateImage = false;
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
          let left = 10;
          let right = 90;
          let top = 20;
          let bottom = 65;
          if (config.rotateImage == false) {
            console.log("rotation disabled");
            left = 20;
            right = 65;
            top = 10;
            bottom = 90;
          }
          settings["ImageParameter"]["RegionDefinitionNameArray"] = ["Settings"];
          settings["RegionDefinition"] = {
                                          "Left": left,
                                          "Right": right,
                                          "Top": top,
                                          "Bottom": bottom,
                                          "MeasuredByPercentage": 1,
                                          "Name": "Settings",
                                        };
          config.template = JSON.stringify(settings);
        }
        const results = decode(frame,config)
        if (results) {
          onBarcodeScannedJS(results);
        }
      }
    })
  }, [])
  
  return (
      <SafeAreaView style={styles.container}>
        {backCam &&
        hasPermission && (
        <>
            <Camera
            device={backCam}
            style={StyleSheet.absoluteFill}
            isActive={isActive}
            torch={torchEnabled ? "on" : "off"}
            format={cameraFormat}
            pixelFormat="yuv"
            resizeMode='contain'
            frameProcessor={frameProcessor}
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
        <Svg style={StyleSheet.absoluteFill} 
          preserveAspectRatio="xMidYMid slice"
          viewBox={getViewBox()}>
          {regionEnabled &&
          <Rect 
            x={0.1*getFrameSize()[0]}
            y={0.2*getFrameSize()[1]}
            width={0.8*getFrameSize()[0]}
            height={0.45*getFrameSize()[1]}
            strokeWidth="2"
            stroke="red"
            fillOpacity={0.0}
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
              if (actionSheetRef.current) {
                actionSheetRef.current.show();
              }
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
            </View>
            <View style={styles.switchContainer}>
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
