var fs = require('fs');
var path = require('path');
var Participant = require('./Participant');

const RES_PATH = path.resolve('../res');
const PERSIST_PATH = path.resolve('../res/participant');
const IMG_PATH = path.resolve('../res/img');


var uniqueId;
var pool = {};

fs.stat(RES_PATH, (err) => {
  if (err !== null && err.code == 'ENOENT') { // file does not exist
    fs.mkdirSync(RES_PATH);
    fs.mkdirSync(PERSIST_PATH);
    fs.mkdirSync(IMG_PATH);
    uniqueId = 0;
  } else {
    uniqueId = fs.readdirSync(PERSIST_PATH).length;
  }
});

function addParti (nickname, imgExt, done) {
  let parti = new Participant({ id: uniqueId++, nickname: nickname, imgExt: imgExt });
  persist(parti, done);
}

function revertParti (id, done) {
  let filename = PERSIST_PATH + '/' + id + '.json';

  fs.stat(filename, (err) => {
    if (err === null) {
      fs.readFile(filename, 'utf-8', (err, json) => {
        if (err) throw err;
        let parti = Participant.fromJson(json);
        pool[parti.getId()] = parti;
        done(parti);
      });
    }
  });
}

function removeParti (parti) {
  if (pool[parti.getId()]) {
    if (parti.isDesiredBy()) {
      pool[parti.getDesiredBy().id].clearDesired();
    }
    if (parti.isDesired()) {
      pool[parti.getDesired().id].clearDesiredBy();
    }
    delete pool[parti.getId()];
  }
}

function get (id) {
  return pool[id];
}

function getAll () {
  let target = [];
  for (let key in pool) {
    target.push(pool[key]);
  }
  return target;
}

function lottery () {
  let unSelected = getAll().filter((parti) => !parti.isSelected());
  return unSelected.length === 0
         ? -1
         : unSelected[Math.floor(Math.random() * unSelected.length)].getId();
}

function desire (parti, desiredPartiId) {
  let desiredParti = pool[desiredPartiId];

  if (!desiredParti) {
    return false;
  }

  if (parti.getId() === desiredParti.getId()) {
    return false;
  }

  if (desiredParti.isDesiredBy()) {
    return false;
  }

  parti.setDesired(desiredParti);
  desiredParti.setDesiredBy(parti);

  return true;
}

function undesire (parti, undesiredPartiId) {
  let undesiredParti = pool[undesiredPartiId];

  if (!undesiredParti) {
    return false;
  }

  if (parti.getId() !== undesiredParti.getDesiredBy().id) {
    return false;
  }

  parti.clearDesired();
  undesiredParti.clearDesiredBy();

  return true;
}

function select (parti, selectedPartiId) {

}

function unselect (parti, unselectedPartiId) {

}

function clear () {
  pool = {};
}

function showRelation () {
  console.log('----------------------------------------------------------------');
  console.log('id\tname\ts\tsb\td\tdb');
  for(let key in pool) {
    let parti = pool[key];
    console.log(`#${parti.getId()}\t${parti.getNickname()}\t${parti.getSelected().nickname}\t${parti.getSelectedBy().nickname}\t${parti.getDesired().nickname}\t${parti.getDesiredBy().nickname}`);
  }
  console.log('----------------------------------------------------------------');
}

function persist (parti, done) {
  var filePath = PERSIST_PATH + '/' + parti.getId() + '.json';
  fs.writeFile(filePath, parti.toJson(), (err) => {
    if (err) throw err;
    done(parti);
  });
}

module.exports = {
  addParti,
  revertParti,
  removeParti,
  get,
  getAll,
  lottery,
  desire,
  undesire,
  select,
  unselect,
  clear,
  showRelation
};
