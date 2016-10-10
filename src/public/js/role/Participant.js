var uniqueid = 0;

var nonParti = { id: -1, nickname: 'N/A'};

module.exports = class Participant {
  constructor({
    id = uniqueid++,
    nickname,
    selected = nonParti,
    selectedBy = nonParti,
    desired = nonParti,
    desiredBy = nonParti
  }) {

    this.id = id;
    this.nickname = nickname;

    // 成功選中
    this.selected = selected;
    this.selectedBy = selectedBy;

    // 回合中選擇
    this.desired = desired;
    this.desiredBy = desiredBy;
  }

  getId() { return this.id; }
  getNickname() { return this.nickname; }

  getSelected() { return this.selected; }
  setSelected(parti) { this.selected = { id: parti.getId(), nickname: parti.getNickname() }; }
  clearSelected() { this.selected = nonParti; }
  isSelected() { return this.selected.id !== -1; }

  getSelectedBy() { return this.selectedBy; }
  setSelectedBy(parti) { this.selectedBy = { id: parti.getId(), nickname: parti.getNickname() }; }
  clearSelectedBy() { this.selectedBy = nonParti; }
  isSelectedBy() { return this.selectedBy.id !== -1; }

  getDesired() { return this.desired; }
  setDesired(parti) { this.desired = { id: parti.getId(), nickname: parti.getNickname() }; }
  clearDesired() { this.desired = nonParti; }
  isDesired() { return this.desired.id !== -1; }

  getDesiredBy() { return this.desiredBy; }
  setDesiredBy(parti) { this.desiredBy = { id: parti.getId(), nickname: parti.getNickname() }; }
  clearDesiredBy() { this.desiredBy = nonParti; }
  isDesiredBy() { return this.desiredBy.id !== -1; }

  toString() {
    return `#${this.id} ${this.nickname} desired by ${this.desiredBy.nickname}`;
  }

}
