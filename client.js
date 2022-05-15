const fs = require("fs")

class client
{
    constructor(stream)
    {
        this.stream = stream
        this.stage = 0
        this.name = '['+this.stream.remotePort+']'
        console.log(this.name,'start working')
        this.init()
    }

    init()
    {
        this.stream.on('data',(buf)=>{
            console.log(this.name,'at stage',this.stage,'receive data',buf,buf.toString())
            if(this.stage == 0)
            {
                this.tell_client_skip_auth()
            }
            else if(this.stage == 1)
            {
                this.on_first_request(buf)
            }
            else if(this.stage == 2)
            {
                //console.log(buf.toString('binary'))
                fs.writeFile('t.buf',buf,()=>{
                    
                })
            }
            
        })
    }

    tell_client_skip_auth()
    {
        this.stream.write(Buffer.from([0x05,0x00]),()=>{
            ++this.stage
        })
    }

    on_first_request(buf)
    {
        let cmd = buf[1]
        if(cmd == 0x01)
        {
            this.on_connect_request(buf)
        }
    }

    on_connect_request(buf)
    {
        console.log('receive connect_request')
        this.decode_atyp(buf[3])
        let address = buf.subarray(4,buf.length-2)
        //console.log(address.toString('hex'))
        let port = buf.readUInt16BE(8)
        console.log('port',port)
        let reply = Buffer.from([0x05,0x00,0x00,0x01,0x00,0x00,0x00,0x00,0x00,0x00])
        this.stream.write(reply,()=>{
            ++this.stage
        })
    }

    decode_atyp(v)
    {
        let atyp
        if(v == 0x01)
        {
            atyp = 'IPv4 address'
        }
        else if(v == 0x03)
        {
            atyp = 'domain name'
        }
        else if(v == 0x04)
        {
            atyp = 'IPv6 address'
        }
        console.log('atyp:',atyp)
    }
}

module.exports = client