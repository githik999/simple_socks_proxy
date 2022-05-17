const fs = require('fs')
const remote = require('./remote')

const ADDRESS_TYPE_DATA = ['','IPV4','','DOMAIN','IPV6']
const CMD_DATA = ['','CONNECT','BIND','UDP']

class client
{
    constructor(stream)
    {
        this.stage = 0
        this.init_stream(stream)
    }

    init_stream(stream)
    {
        stream.on('error',(err)=>{
            this.log('[client stream error]'+err.message)
        })

        stream.on('close',(hadError)=>{
            this.log('stream fully closed.hadError:'+hadError)
            if(this.remote)
            {
                this.remote.on_client_close()
            }
        })

        stream.on('end',(err)=>{
            if(err) throw err
            this.log('the other end of the socket signals the end of transmission')
            stream.destroy()
        })

        stream.on('data',(buf)=>{
            this.handle_data(buf)
        })

        this.stream = stream
        this.id = stream.remotePort
    }
    
    handle_data(buf)
    {
        if(this.stage == 0)
        {
            this.tell_client_skip_auth()
        }
        else if(this.stage == 1)
        {
            const data = this.decode_cmd(buf)
            if(data.cmd == 'CONNECT')
            {
                this.remote = new remote(data.address,data.port,this)
            }
        }
        else if(this.stage == 2)
        {
            this.remote.write_data_to_stream(buf)
        }
    }

    tell_client_skip_auth()
    {
        this.stage = 1
        let data = Buffer.from([0x05,0x00])
        this.write_data_to_stream(data)
    }

    on_connect_remote_success()
    {
        this.stage = 2
        let data = Buffer.from([0x05,0x00,0x00,0x01,0x00,0x00,0x00,0x00,0x00,0x00])
        this.write_data_to_stream(data)
    }

    write_data_to_stream(buf)
    {
        this.stream.write(buf,()=>{
            this.log(`send data to client at stage[${this.stage}]`+buf.length+'byte')
        })
    }

    decode_address(buf,address_type)
    {
        if(address_type == 'IPV4')
        {
            let tmp = []
            for (const k of buf.values()) 
            {
                tmp.push(k)
            }
            return tmp.join('.')
        }
        if(address_type == "DOMAIN")
        {
            return buf.subarray(1).toString()
        }
        
    }

    decode_cmd(buf)
    {
        let cmd = CMD_DATA[buf.readUInt8(1)]
        let address_type = ADDRESS_TYPE_DATA[buf.readUInt8(3)]
        let address_data = buf.subarray(4,buf.length-2)
        let address = this.decode_address(address_data,address_type)
        let port = buf.readUInt16BE(buf.length-2)
        return {cmd,address,port}
    }

    log(str)
    {
        console.log(performance.now(),`[${this.id}][local]`,str)
    }
}

module.exports = client