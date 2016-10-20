var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var fs = require('fs');
var path = require('path');
var moment = require('moment');
var formidable = require('formidable');
var port = process.env.PORT || 3000;

var Participant = require('./public/js/role/Participant');
var partiPool = require('./public/js/role/ParticipantPool');

const IMG_PATH = path.resolve('../res/img');

function log (msg) {
  console.log(`[${moment().format('HH:mm:ss')}]: ${msg}`);
}

function broadcastPool () {
  io.emit('refresh parti', partiPool.getAll());
  if (partiPool.isAllDesiredBy()) {
    io.emit('lottery-available');
  } else {
    io.emit('lottery-unavailable');
  }
  partiPool.showRelation();
}

function bindGodEvent (socket) {
  socket.on('lottery', () => {
    var lotteryId = partiPool.lottery();
    if (lotteryId > -1) {
      var parti = partiPool.get(lotteryId);
      var winner = parti.getDesiredBy();
      log(`中獎者: ${winner.nickname}`);
      socket.emit('lottery-result', {
        lotteryId,
        winnerIdent: `#${winner.id} ${winner.nickname}`
      });
    }
  });

  socket.on('lottery-resolve', (lotteryId) => {
    var selectedParti = partiPool.get(lotteryId);
    var winnerId = selectedParti.getDesiredBy().id;
    if (partiPool.select(selectedParti, winnerId)) {
      log(`${selectedParti.getSelectedBy().nickname} 中獎 ${selectedParti.getNickname()}`);
      partiPool.resetAllDesire();
      io.emit('winner', winnerId);
      broadcastPool();
    }
  });

  socket.on('lottery-reject', () => {

  });
}

process.on('uncaughtException', function (err) {
  console.error('got uncaught exception:', err.message);
});

server.listen(port, () => {
  log(`Server listening at port ${port}`);
});

app.use(express.static(__dirname + '/public'));
app.use('/img', express.static(IMG_PATH));

// 註冊
//   1. 序列化參與者資料至 res/participant
//   2. 圖片存至 res/img
app.post('/signup', (req, res, next) => {
  var form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    if (err) throw err;

    var oldPath = files.file.path,
        fileExt = files.file.name.split('.').pop(),
        index = oldPath.lastIndexOf('/') + 1,
        fileName = oldPath.substr(index);

    partiPool.addParti(fields.nickname, fileExt, (parti) => {
      var newPath = path.join(IMG_PATH, parti.getId() + '.' + fileExt);

      fs.readFile(oldPath, (err, data) => {
        fs.writeFile(newPath, data, (err) => {
          fs.unlink(oldPath, (err) => {
            if (err) {
              res.status(500);
              res.end();
            } else {
              log(`${parti.ident()} 新加入`);
              res.status(200);
              res.send('' + parti.getId());
            }
          });
        });
      });

    });
  });
});

io.on('connection', (socket) => {

  var parti;

  socket.emit('refresh parti', partiPool.getAll());

  socket.on('signin', (id) => {
    if (id === 'adnim') {
      socket.emit('god-you');
      log('上帝降臨!');

      bindGodEvent(socket);
      return;
    }

    partiPool.revertParti(id, (revertParti) => {
      parti = revertParti;
      socket.emit('sign-success', {
        id: parti.getId(),
        nickname: parti.getNickname()
      });
      broadcastPool();
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
