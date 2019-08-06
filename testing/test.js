const gl = require('../npm_public/index');


gl.addCmd('test', (command,res)=>{
    res.msg('Yay, a test!');
});

gl.init();