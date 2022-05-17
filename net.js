const net = require('net')
const pimp = require('./pimp')

const server = net.createServer((socket)=>{
    new pimp(socket)
}).listen(1080)
