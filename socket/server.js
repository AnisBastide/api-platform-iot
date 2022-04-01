var SerialPort = require('serialport');
var xbee_api = require('xbee-api');
var C = xbee_api.constants;
var storage = require("./storage")
const Readline = require('@serialport/parser-readline')
require('dotenv').config()


const SERIAL_PORT = process.env.SERIAL_PORT;

var xbeeAPI = new xbee_api.XBeeAPI({
  api_mode: 2
});

let serialport = new SerialPort(SERIAL_PORT, {
  baudRate: 9600,
}, function (err) {
  if (err) {
    return console.log('Error: ', err.message)
  }
});
let serialportArduino = new SerialPort('/dev/tty.usbmodem142201', {
  baudRate: 9600,
}, function (err) {
  if (err) {
    return console.log('Error: ', err.message)
  }
});
const parser = serialportArduino.pipe(new Readline());

serialport.pipe(xbeeAPI.parser);

xbeeAPI.builder.pipe(serialport); // on bind le port sur notre xbee
const BROADCAST_ADDRESS = "FFFFFFFFFFFFFFFF";
serialport.on("open", function () {
  var frame_obj = { // AT Request to be sent
    type: C.FRAME_TYPE.AT_COMMAND,
    command: "NI", // Node Identifier, champ texte
    commandParameter: [], // => sans valeur : GET => avec valeur : SET
  };

  xbeeAPI.builder.write(frame_obj);

  frame_obj = { // AT Request to be sent
    type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
    destination64: BROADCAST_ADDRESS, // broadcast
    command: "NI",
    commandParameter: [],
  }; // commande qui demande le nom à tous les objets connectés au coordinateur
  xbeeAPI.builder.write(frame_obj);

  /*frame_obj = { // AT Request to be sent
    type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
    destination64: BROADCAST_ADDRESS, // broadcast
    command: "D0",
    commandParameter: [0x05],
  }; // commande qui demande le nom à tous les objets connectés au coordinateur
  xbeeAPI.builder.write(frame_obj);*/

});

// All frames parsed by the XBee will be emitted here

//storage.listBeerTaps.then((beerTaps) => sensors.forEach((beerTap) => console.log(beerTap.data())))

xbeeAPI.parser.on("data", function (frame) {

  //on new device is joined, register it

  //on packet received, dispatch event
  //let dataReceived = String.fromCharCode.apply(null, frame.data);
  if (C.FRAME_TYPE.ZIGBEE_RECEIVE_PACKET === frame.type) {
    console.log("C.FRAME_TYPE.ZIGBEE_RECEIVE_PACKET");
    let dataReceived = String.fromCharCode.apply(null, frame.data);
    console.log(">> ZIGBEE_RECEIVE_PACKET >", dataReceived);

  }

  if (C.FRAME_TYPE.NODE_IDENTIFICATION === frame.type) {
    // let dataReceived = String.fromCharCode.apply(null, frame.nodeIdentifier);
    console.log("NODE_IDENTIFICATION");
    storage.registerBeerTap(frame.remote64)

  } else if (C.FRAME_TYPE.ZIGBEE_IO_DATA_SAMPLE_RX === frame.type) {

    console.log("ZIGBEE_IO_DATA_SAMPLE_RX")
    console.log(frame)
    if(frame.digitalSamples.DIO1 == 0){
      frame_obj = { // AT Request to be sent
        type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
        destination64: BROADCAST_ADDRESS, // broadcast
        command: "D0",
        commandParameter: [0x05],
      };
    } else {
      frame_obj = { // AT Request to be sent
        type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
        destination64: BROADCAST_ADDRESS, // broadcast
        command: "D0",
        commandParameter: [0x00],
      };
    }
    xbeeAPI.builder.write(frame_obj);

  } else if (C.FRAME_TYPE.REMOTE_COMMAND_RESPONSE === frame.type) {
    console.log("REMOTE_COMMAND_RESPONSE")
  } else {
    console.log("frame.type : " + frame.type);
    console.debug(frame);
    let dataReceived = String.fromCharCode.apply(null, frame.commandData)
    console.log("dataReceived : " + dataReceived);
  }
});
parser.on("data",async function(data){
  console.log(data)
  if(data != 0){
    await storage.registerSample('0013a20041c3475c',data);
  }
})
