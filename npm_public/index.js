const events = require('events').EventEmitter;


var registeredCmds = {};
exports.addCmd = (cmd, fun)=>{
    if(typeof(cmd) != 'string' && cmd.length<1) throw 'command name required';
    if(typeof(fun) != 'function') throw 'function requred';
    if(!registeredCmds[cmd]) registeredCmds[cmd] = [];
    registeredCmds[cmd].push(fun);
}
exports.init = (port=80, path = '') =>{
    const gio = require('graphio');
    const app = require('express')();
    const srv = require('http').Server(app);
    const sio = require('socket.io').listen(srv);

    var ret = {};

    gio.init(app,sio);
    app.get(`/${path}`, (req,res)=>{
        res.sendFile(__dirname + '/web client/index.html')
    });
    app.get('/graphio-lazy/js', (req,res)=>{
        res.sendFile(__dirname + '/web client/index.js')
    });

    
    var usableFunctions = false;
    

    sio.on('connection',(soc)=>{

        soc.on('giol.funs',(funs)=>{
            console.log('got funs:',funs);
            usableFunctions = funs;
            //TODO add functions;
        });

        soc.on('giol.cmd',(command)=>{
            var res = {
                msg: (res)=>{
                    if(!res.line) {
                        if(typeof(res) == 'string'){
                            res = {line:res};
                        } else {
                            throw 'Please give a string (or object containing a line {line:\'something\'})'
                        }
                    }
                    if(!res.type) res.type = 'msg';
                    if(!res.color) res.color = '#D44A1C';
                    sio.emit('giol.cmdResponse',res);
                },
                error: (res)=>{
                    if(!res.line) {
                        if(typeof(res) == 'string'){
                            res = {line:res};
                        } else {
                            throw 'Please give a string (or object containing a line {line:\'something\'})'
                        }
                    }
                    if(!res.type) res.type = 'msg';
                    if(!res.color) res.color = '#B00900';
                    sio.emit('giol.cmdResponse',res);
                }
            };
            if(registeredCmds[command.cmd]){
                registeredCmds[command.cmd].forEach(fun => fun(command,res));
            } else {
                res.error('Unknown Command!');
            }
        });
    
    })

    srv.listen(port);
    return ret;
}