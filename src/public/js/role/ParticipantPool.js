var fs = require('fs');
var path = require('path');
var Rx = require('rxjs/Rx');
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
  if (pool[id]) {
    pool[id].setOnline(true);
    done(pool[id]);

  } else {
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
}

function removeParti (parti) {
  if (pool[parti.getId()]) {
    parti.setOnline(false);
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

function lottery (done) {
  let unSelectedBy = getAll().filter((parti) => !parti.isSelectedBy());
  if (unSelectedBy.length === 0) {
    return false;
  }

  setTimeout(function () {
    let result = unSelectedBy[Math.floor(Math.random() * unSelectedBy.length)].getId();
    done(result);
  }, 4000);

  return true;
}

function desire (parti, desiredPartiId) {
  let desiredParti = pool[desiredPartiId];

  if (!desiredParti) {
    return false;
  }

  if (lastPartiMustDesireSelf(parti.getId(), desiredPartiId)) {
    return false;
  }

  if (!desiredParti.isSelected() && parti.getId() === desiredParti.getId()) {
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

function resetAllDesire() {
  for (let key in pool) {
    pool[key].clearDesired();
    pool[key].clearDesiredBy();
  }
}

function select (parti, selectedByPartiId, done) {
  let selectByParti = pool[selectedByPartiId];

  if (!selectByParti) {
    done(false);
  }

  if (parti.getId() === selectByParti.getId()) {
    done(false);
  }

  if (selectByParti.isSelected()) {
    done(false);
  }

  parti.setSelectedBy(selectByParti);
  selectByParti.setSelected(parti);

  persistTwo(parti, selectByParti, () => done(true));
}

function unselect (parti, unselectedPartiId) {

}

function isAllDesiredBy () {
  for (let key in pool) {
    if (!pool[key].isDesiredBy() && !pool[key].isSelectedBy()) {
      return false;
    }
  }
  return true;
}

function isAllSelected() {
  for (let key in pool) {
    if (!pool[key].isSelected()) {
      return false;
    }
  }
  return true;
}

function clear () {
  pool = {};
}

function showRelation () {
  console.log('----------------------------------------------------------------');
  console.log('id\tname\ts\tsb\td\tdb\ton');
  for(let key in pool) {
    let parti = pool[key];
    console.log(`#${parti.getId()}\t${parti.getNickname()}\t${parti.getSelected().nickname}\t${parti.getSelectedBy().nickname}\t${parti.getDesired().nickname}\t${parti.getDesiredBy().nickname}\t${parti.isOnline()}`);
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

function persistTwo(parti1, parti2, done) {
  parti1.clearDesired();
  parti1.clearDesiredBy();
  parti2.clearDesired();
  parti2.clearDesiredBy();

  Rx.Observable.create(observer => {
    persist(parti1, () => observer.next(parti1));
    persist(parti2, () => observer.next(parti2));
  })
  .take(2)
  .subscribe({
    next: parti => console.log(`${parti.getNickname()}儲存完畢！`),
    error: err => console.error('Observer got an error: ' + err),
    complete: () => done()
  });
}

function lastPartiMustDesireSelf (partiId, desiredId) {
  let undesiredLoserIds = getAll().filter(parti => !parti.isSelected() && !parti.isDesired())
                                  .map(parti => parti.getId());
  let availibleIds = getAll().filter(parti => !parti.isSelectedBy() && !parti.isDesiredBy())
                             .map(parti => parti.getId());

  if (undesiredLoserIds.length === 2) {

    let [ firstLoserId, secondLoserId ] = undesiredLoserIds;
    let [ firstId, secondId ] = availibleIds;

    let restLoserId = partiId === firstLoserId ? secondLoserId : firstLoserId;
    let restAvailableId = desiredId === firstId ? secondId : firstId;

    // console.log('undesiredLoserIds: ' + undesiredLoserIds);
    // console.log('availibleIds: ' + availibleIds);
    // console.log(restLoserId, restAvailableId);

    if (restLoserId === restAvailableId) {
      return true;
    }
  }

  return false;
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
  resetAllDesire,
  select,
  unselect,
  isAllDesiredBy,
  isAllSelected,
  clear,
  showRelation
};
