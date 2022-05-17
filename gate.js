const net = require('net')
const client = require('./client')

const server = net.createServer((socket)=>{
    new client(socket)
}).listen(1080)
