const fs = require('fs')
const remote = require('./remote')

const ADDRESS_TYPE_DATA = ['','IPV4','','DOMAIN','IPV6']
const CMD_DATA = ['','CONNECT','BIND','UDP']

class client
{
    constructor(stream)
    {
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
            this.log('user signals the end of transmission')
            stream.destroy()
        })

        stream.on('data',(buf)=>{
            this.next_stage()
            this[this.stage](buf)
        })

        this.stream = stream
        this.client_address = stream.remoteAddress
        this.id = stream.remotePort
    }
    

    tell_client_skip_auth()
    {
        let data = Buffer.from([0x05,0x00])
        this.write_data_to_stream(data)
    }

    on_connect_remote_success()
    {
        let data = Buffer.from([0x05,0x00,0x00,0x01,0x00,0x00,0x00,0x00,0x00,0x00])
        this.write_data_to_stream(data)
    }

    write_data_to_stream(buf)
    {
        this.stream.write(buf,()=>{
            console.log(performance.now(),`[${this.id}]`,`send data to [${this.client_address}][${this.stage}]`+buf.length+'byte')
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



    hello(buf)
    {
        if(buf[0] == 0x05)
        {
            this.tell_client_skip_auth()
        }
    }
    
    establish(buf)
    {
        const data = this.decode_cmd(buf)
        if(data.cmd == 'CONNECT')
        {
            this.remote = new remote(data.address,data.port,this)
        }
    }

    tunnel(buf)
    {
        this.remote.write_data_to_stream(buf)
    }

    next_stage()
    {
        let v = this.stage
        switch(v) 
        {
            case undefined:
                this.stage = 'hello'
                break
            case 'hello':
                this.stage = 'establish'
                break
            case 'establish':
                this.stage = 'tunnel'
                break
            default:
                // code block
        }
    }

    log(str)
    {
        console.log(performance.now(),`[${this.id}][${this.client_address}]`,str)
    }
}

module.exports = client