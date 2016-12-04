var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var fs = require('fs');
var path = require('path');
var moment = require('moment');
var formidable = require('formidable');
var Rx = require('rxjs/Rx');
var port = process.env.PORT || 3000;

var Participant = require('./public/js/role/Participant');
var partiPool = require('./public/js/role/ParticipantPool');

var isSelecting = false;

const IMG_PATH = path.resolve('../res/img');

function log (msg) {
  console.log(`[${moment().format('HH:mm:ss')}]: ${msg}`);
}

function broadcastPool () {
  io.emit('refresh-parti', partiPool.getAll());
  if (partiPool.isAllDesiredBy()) {
    io.emit('lottery-available');
  } else {
    io.emit('lottery-unavailable');
  }
  partiPool.showRelation();
}

function bindGodEvent (socket) {
  socket.on('lottery', () => {
    var lottering = partiPool.lottery(function (lotteryId) {
      var parti = partiPool.get(lotteryId);
      var winner = parti.getDesiredBy();
      log(`中獎者: ${winner.nickname}`);
      io.emit('lottery-result', {
        lotteryId,
        lotteryIdent: `#${parti.id} ${parti.nickname}`,
        winnerIdent: `#${winner.id} ${winner.nickname}`
      });
    });
    if (lottering) {
      io.emit('lottering');
      isSelecting = false;
    }
  });

  socket.on('lottery-resolve', (lotteryId) => {
    var selectedParti = partiPool.get(lotteryId);
    var winnerId = selectedParti.getDesiredBy().id;

    partiPool.select(selectedParti, winnerId, (success) => {
      if (success) {
        log(`${selectedParti.getSelectedBy().nickname} 中獎 ${selectedParti.getNickname()}`);
        io.emit('winner', winnerId);
      }
    });
  });

  socket.on('next-round', () => {
    partiPool.resetAllDesire();
    broadcastPool();

    if (partiPool.isAllSelected()) {
      io.emit('game-over');
      return;
    }

    Rx.Observable.interval(1000)
      .take(4)
      .subscribe({
        next: n => io.emit('unavailable-msg', 3 - n),
        error: e => console.error(e),
        complete: () => {
          io.emit('start-select');
          isSelecting = true;
        }
      });
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

  socket.emit('refresh-parti', partiPool.getAll());

  socket.on('signin', (id) => {
    // 管理者
    if (id === 'admin') {
      socket.emit('god-you');
      log('上帝降臨!');

      bindGodEvent(socket);
      return;
    }

    // 重複登入
    if (partiPool.get(id) && partiPool.get(id).isOnline()) {
      socket.emit('signin-duplicate');
      return;
    }

    partiPool.revertParti(id, (revertParti) => {
      parti = revertParti;
      socket.emit('sign-success', {
        info: {
          id: parti.getId(),
          nickname: parti.getNickname(),
          winner: parti.isSelected()
        },
        isSelecting
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
      partiPool.showRelation();
      log(`再會了${parti.getNickname()}`);
      // broadcastPool();
    }
  });

});
