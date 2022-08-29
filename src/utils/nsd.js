// import bonjour from 'bonjour'
// import os from 'os'
const bonjour = require('bonjour')
const os = require('os')

function getIPAddress(){
    var interfaces = os.networkInterfaces();
    for(var devName in interfaces){
        var iface = interfaces[devName];
        for(var i=0;i<iface.length;i++){
            var alias = iface[i];
            if(alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal){
                return alias.address;
            }
        }
    }
}

let server_name = `vision-${getIPAddress().replaceAll('.', '-')}`
console.log("server name: " + server_name)

const bonjourServer = bonjour()
bonjourServer.publish({ name: server_name, type: 'http', port: 3000})