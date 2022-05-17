const net = require('net')

class remote 
{
    constructor(host,port,client)
    {
        this.client = client
        this.host = host
        this.port = port
        this.init_stream()
    }

    init_stream()
    {
        this.log('start connecting....')
        let stream = net.createConnection(this.port,this.host)
        
        stream.on('error',(err)=>{
            this.log('remote stream error,'+err.message)
        })

        stream.on('close',(hadError)=>{
            this.log('stream fully closed.hadError:'+hadError)
        })

        stream.on('end',(err)=>{
            if(err) throw err
            this.log('the other end of the socket signals the end of transmission')
        })

        stream.on('connect',()=>{
            this.log('connect success')
            this.client.on_connect_remote_success()
        })

        stream.on('data',(buf)=>{
            this.handle_data(buf)
        })

        this.stream = stream
    }

    handle_data(buf)
    {
        this.client.write_data_to_stream(buf)
    }

    write_data_to_stream(buf)
    {
        this.stream.write(buf,()=>{
            console.log(performance.now(),`send data to ${this.host}:${this.port}`,buf.length,'byte')
        })
    }

    on_client_close()
    {
        this.stream.destroy()
    }

    log(str)
    {
        console.log(performance.now(),`[${this.client.id}][${this.host}:${this.port}]`,str)
    }
}

module.exports = remote