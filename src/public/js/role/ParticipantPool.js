var pool = {};

function addParti (parti) {
  pool[parti.getId()] = parti;
}

function removeParti (parti) {
  delete pool[parti.getId()];
}

function get (id) {
  return pool[id];
}

function getAll () {
  var target = [];
  for (let key in pool) {
    target.push(pool[key]);
  }
  return target;
}

// parti 選擇 desiredPartiid 的禮物
function desire (parti, desiredPartiId) {
  var desiredParti = pool[desiredPartiId];

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

function undesire(parti, undesiredPartiId) {
  var undesiredParti = pool[undesiredPartiId];

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

function clear() {
  pool = {};
}

function showRelation() {
  console.log('----------------------------------------------------------------');
  console.log('id\tname\ts\tsb\td\tdb');
  for(let key in pool) {
    let parti = pool[key];
    console.log(`#${parti.getId()}\t${parti.getNickname()}\t${parti.getSelected().nickname}\t${parti.getSelectedBy().nickname}\t${parti.getDesired().nickname}\t${parti.getDesiredBy().nickname}`);
  }
  console.log('----------------------------------------------------------------');
}

module.exports = {
  addParti: addParti,
  removeParti: removeParti,
  get: get,
  getAll: getAll,
  desire: desire,
  undesire: undesire,
  clear: clear,
  showRelation: showRelation
};
