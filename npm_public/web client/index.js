var canvas, c, socket, w, h;

function onload() {
    socket = io();



    canvas = document.getElementById('canvas');

    window.addEventListener('keydown', keyboardHandler);
    
    c = canvas.getContext('2d');

    //test plot
    //TODO REMOVE
    var tplot = graphio.createPlot();
    tplot.axis.x.max = 100;
    tplot.axis.y.max = 100;
    graphio.addPlot(tplot);

    //expose graphio to socket
    var functs = [];
    Object.keys(graphio).forEach(key => {
        if(key!='connect' && typeof(graphio[key])=='function'){
            functs.push(key);
            socket.on(`giol.fun.${key}`, graphio[key]);
        }
    });
   
    socket.on('giol.cmdResponse',(res)=>{cmdHistory.push(res)});
    socket.on('connect', ()=>{cmdHistory.push({line:'Socket Connected!',color:'#0FF',type:'msg'}); socket.emit('giol.funs', functs);});
    socket.on('disconnect', ()=>{cmdHistory.push({line:'[Local] Warning: socket disconnected!',color:'#F00',type:'msg'});incmd = true;});

    setInterval(update,20);
}

function clear(){
    w = (canvas.width = window.innerWidth);
    h = (canvas.height = window.innerHeight);
}

var doGraphioDraw = true;
var doClear = true;
var cmdlinecursorflick=true;
var frame = 0;
function update(){
    frame++;
    if(doClear) clear();
    if(doGraphioDraw) graphio.draw();
    if(cmdpos>0){
        if(frame%30==1) cmdlinecursorflick = !cmdlinecursorflick;
        c.fillStyle = 'rgba(125, 125, 125, 0.5)';
        c.fillRect(0,cmdpos-24,w,24);
        c.fillRect(0,0,w,cmdpos);
        c.fillStyle = "#000";
        c.font = "15px Consolas";
        c.textAlign = "start";
        c.fillText((cmdlinecursorflick?'>':' ')+curcmd,5,cmdpos-5, w);  //TODO wrap if cmd too long!
        var j = cmdHistory.length-1;
        for(var i = cmdpos-25; i>=0; i-=20){
            if(cmdHistory[j]){
                c.fillStyle = cmdHistoryPos==j?'#0F0':cmdHistory[j].color;
                c.fillText((cmdHistory[j].type=='cmd'?'~':'  ')+cmdHistory[j--].line,5,i, w);
            } else {
                break;
            }
        }
    }
    if(incmd && cmdpos<200) cmdpos+=5;
    if(!incmd && cmdpos>0) cmdpos-=5;
}


var incmd = false;
var cmdpos = 0;
var curcmd = '';
var cmdHistory=[];
var cmdHistoryPos = -1;
function keyboardHandler(event) {
    if(event.code == 'Backquote') {
        incmd = !incmd;
    } else if(incmd) {
        switch(event.code){
            case 'Enter':
                if(curcmd == ''){
                    if(cmdHistory[cmdHistoryPos] && cmdHistory[cmdHistoryPos].type=='cmd'){
                        curcmd = cmdHistory[cmdHistoryPos].line;
                    } else {
                        break;
                    }
                } 
                curcmd = curcmd.toLowerCase();
                //todo check cmd
                cmdHistory.push({line:curcmd, type:'cmd', color:'#000'});
                cmdHistoryPos=cmdHistory.length-1;
                var cmd = curcmd.split(' ');
                socket.emit('giol.cmd', {
                    cmd: cmd[0],
                    args: cmd
                });

                //console.log('sent cmd: ', {cmd: cmd[0],args: cmd});
                curcmd = '';
                break;
            case 'Delete':
                curcmd = '';
                break;
            case 'Backspace':
                curcmd = curcmd.substr(0,curcmd.length-1);
                break;
            case 'ArrowUp':
                do{cmdHistoryPos--}while(cmdHistory[cmdHistoryPos] && cmdHistory[cmdHistoryPos].type != 'cmd');
                if(cmdHistory[cmdHistoryPos]) curcmd = cmdHistory[cmdHistoryPos].line;
                if(cmdHistoryPos<-1) cmdHistoryPos=-1;
                break;
            case 'ArrowDown':
                do{cmdHistoryPos++}while(cmdHistory[cmdHistoryPos] && cmdHistory[cmdHistoryPos].type != 'cmd');
                if(cmdHistory[cmdHistoryPos]) curcmd = cmdHistory[cmdHistoryPos].line;
                if(cmdHistoryPos>=cmdHistory.length) cmdHistoryPos = cmdHistory.length-1;
                break;
            default:
                if (/^[a-zA-Z0-9-_ ]$/.test(event.key)){
                    curcmd+=event.key;
                } else {
                    //console.log(`ignored key event: (${event.key})`, event);
                }
               
        }
    }
}