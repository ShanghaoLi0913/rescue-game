var PORT = process.env.PORT || 3000;
const cors = require('cors')
const express = require('express'); //引入express框架
const app = express();  //创建网站服务器
const server = app.listen(PORT, () => { //监听端口
    console.log('My socket server is running at 127.0.0.1:3000')
  });
function listen() {
    const host = server.address().address;
    const port = server.address().port;
    console.log('Example app listening at http://' + host + ':' + port);
}
app.use(cors());
app.use(express.static('./public'));
var io = require('socket.io')(server); //创建服务器io对象


var scores = []; //对象数组 存放client的id与对应成绩
var users = [];
var N;
var ifKidnap = false;
var kipnappedId;
//接收数据（收到client的连接）
io.sockets.on('connection',
    function (socket) { //收到client的socket,
        console.log("We have a new client: " + socket.id);
        users.push(socket.id);
        N = users.length;
        console.log('number of users:', N);
        if (N >= 4 && ! ifKidnap){ //达到4个玩家时，有一人被绑架
            kipnappedId = Math.floor(Math.random()*3); //随机生成0～3的整数
            console.log('❗️the chosen one:', kipnappedId, users[kipnappedId]);
            ifKidnap = true;
            console.log(ifKidnap);
            //发给被选中的那个玩家
            socket.broadcast.to(users[kipnappedId]).emit('kidnap', ifKidnap);
        }

        socket.on('update', function (selectPotion) {
            console.log(selectPotion);
            socket.broadcast.to(users[kipnappedId]).emit('saving', selectPotion);
        })

        // 当关闭连接后触发disconnect事件
        socket.on('disconnect', function () {
            users.remove(socket.id);
            console.log(socket.id, 'disconnected');
            if(users.length == 0) {
                ifKidnap = false;
            }
        })
    }
);



Array.prototype.indexOf = function(val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == val) return i;
    }
    return -1;
};

Array.prototype.remove = function(val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};