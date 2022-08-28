import bonjour from 'bonjour'
import os from 'os'

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
console.log(getIPAddress()) // 本地ip

let server_name = getIPAddress().replaceAll('.', '-')
console.log("server name: " + server_name)
//3000端口开启name = my-is-hostA的服务
const bonjourServer = bonjour()
bonjourServer.publish({ name: server_name, type: 'http', port: 3000})