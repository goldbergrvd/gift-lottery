var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var moment = require('moment');
var port = process.env.PORT || 3000;

var Participant = require('./public/js/role/Participant');
var partiPool = require('./public/js/role/ParticipantPool');

function log (msg) {
  console.log(`[${moment().format('HH:mm:ss')}]: ${msg}`);
}

function broadcastPool() {
  io.emit('refresh parti', partiPool.getAll());
  partiPool.showRelation();
}

function emitSign(socket, parti) {
  socket.emit('sign-success', {
    id: parti.getId(),
    nickname: parti.getNickname()
  });
  broadcastPool();
}

server.listen(port, () => {
  log(`Server listening at port ${port}`);
});

app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {

  var parti;

  socket.emit('refresh parti', partiPool.getAll());

  socket.on('signup', (nickname) => {
    partiPool.addParti(nickname, (newParti) => {
      parti = newParti;
      emitSign(socket, parti);
      log(`${parti.ident()} 新加入`);
    });
  });

  socket.on('signin', (id) => {
    partiPool.revertParti(id, (revertParti) => {
      parti = revertParti;
      emitSign(socket, parti);
      log(`${parti.ident()} 登入`);
    });
  });

  socket.on('desire', (desiredId) => {
    if (parti.isDesired()) {
      return;
    }

    if (partiPool.desire(parti, desiredId)) {
      log(`${parti.getNickname()} 選 ${parti.getDesired().nickname}`);
      broadcastPool();
    }
  });

  socket.on('undesire', (undesiredId) => {
    if (!parti.isDesired()) {
      return;
    }

    if (partiPool.undesire(parti, undesiredId)) {
      log(`${parti.getNickname()} 棄 ${partiPool.get(undesiredId).getNickname()}`);
      broadcastPool();
    }
  });

  socket.on('disconnect', () => {
    if (parti) {
      partiPool.removeParti(parti);
      log(`再會了${parti.getNickname()}`);
      broadcastPool();
    }
  });

});
