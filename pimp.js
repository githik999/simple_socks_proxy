const fs = require('fs')

const ADDRESS_TYPE_DATA = ['','IPV4','','DOMAIN','IPV6']
const CMD_DATA = ['','CONNECT','BIND','UDP']

class pimp
{
    constructor(stream)
    {
        this.id = stream.remotePort
        this.client_stream = stream
        this.init()
    }

    init()
    {
        this.stage = 0
        this.client_stream.on('data',(buf)=>{
            this.handle_client_data(buf)
        })

        this.stream.on('error',(err)=>{
            console.log('[client-pimp stream error]'+err.message)
        })

        this.stream.on('end',(err)=>{
            console.log('client-pimp stream end',err)
        })
    }

    handle_client_data(buf)
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
                this.connect_to_girl()
            }
        }
        else if(this.stage == 2)
        {
            this.send_data_to_girl(buf)
        }
    }

    tell_client_skip_auth()
    {
        let buf = Buffer.from([0x05,0x00])
        this.send_data_to_client(buf,1)
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
        return buf.toString().trim()
    }

    connect_to_girl(host,port)
    {
        this.girl_stream = net.createConnection(port,host)
        this.girl_stream.on('connect',()=>{
            console.log('pimp-girl connection successfully established',host,port)
            this.tell_client_connect_result()
        })
    }

    tell_client_connect_result()
    {
        let data = Buffer.from([0x05,0x00,0x00,0x01,0x00,0x00,0x00,0x00,0x00,0x00])
        this.send_data_to_client(data,2)
    }

    decode_atyp(v)
    {
        console.log('ATYP:',ATYP_DATA[v])
    }

    send_data_to_client(buf,new_stage)
    {
        this.client_stream.write(buf,()=>{
            this.stage = new_stage
            console.log(`pimp send data to client at stage[${this.stage}]`,buf.toString('hex'))
        })
    }

    send_data_to_girl(buf)
    {
        this.girl_stream.write(buf,()=>{
            console.log('pimp send data to girl',buf.toString('hex'))
        })
    }
}

module.exports = pimp