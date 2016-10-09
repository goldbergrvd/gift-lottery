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

server.listen(port, () => {
  log(`Server listening at port ${port}`);
});

app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {

  var parti;

  socket.emit('refresh parti', partiPool.getAll());

  socket.on('signup', (data) => {
    parti = new Participant({ nickname: data });
    partiPool.addParti(parti);
    log(`新成員: ${parti}`);

    socket.emit('signup-success', {
      id: parti.getId(),
      nickname: parti.getNickname()
    });
    broadcastPool();
  });

  socket.on('desire', (desiredId) => {
    if (parti.isDesired()) {
      return;
    }

    if (partiPool.desire(parti, desiredId)) {
      log(`${parti.getNickname()} 選 ${parti.getDesired().nickname}`);
      broadcastPool();
    } else {
      log(`#${parti.getId()} = #${desiredId} 不能選自己`);
    }
  });

  socket.on('undesire', (undesiredId) => {
    if (!parti.isDesired()) {
      return;
    }

    if (partiPool.undesire(parti, undesiredId)) {
      log(`${parti.getNickname()} 棄 ${partiPool.get(undesiredId).getNickname()}`);
      broadcastPool();
    } else {
      log(`#${parti.getId()} = #${undesiredId} 不能選自己`);
    }
  });

  socket.on('disconnect', () => {
    if (parti) {
      partiPool.removeParti(parti);
      log(`再會了${parti.getNickname()}`);
    }
    io.emit('refresh parti', partiPool.getAll());
  });

});
