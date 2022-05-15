const net = require('net')
const client = require('./client')
const host = '127.0.0.1'
const port = 1080
let full = false

const server = net.createServer((socket)=>{
    if(!full)
    {
        new client(socket)
        //full = true
    }
    
})

server.listen(port, host,() => {
    console.log('server listening on',host,port)
})