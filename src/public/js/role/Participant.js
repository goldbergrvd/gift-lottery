const NON_PARTI = { id: -1, nickname: 'N/A'};

module.exports = class Participant {
  constructor({
    id,
    nickname,
    imgExt,
    selected = NON_PARTI,
    selectedBy = NON_PARTI,
    desired = NON_PARTI,
    desiredBy = NON_PARTI
  }) {

    this.id = id;
    this.nickname = nickname;
    this.imgExt = imgExt;

    // 成功選中
    this.selected = selected;
    this.selectedBy = selectedBy;

    // 回合中選擇
    this.desired = desired;
    this.desiredBy = desiredBy;

    this.online = true;
  }

  getId() { return this.id; }
  getNickname() { return this.nickname; }
  getImgName() { return this.id + '.' + this.imgExt; }

  getSelected() { return this.selected; }
  setSelected(parti) { this.selected = { id: parti.getId(), nickname: parti.getNickname() }; }
  clearSelected() { this.selected = NON_PARTI; }
  isSelected() { return this.selected.id !== -1; }

  getSelectedBy() { return this.selectedBy; }
  setSelectedBy(parti) { this.selectedBy = { id: parti.getId(), nickname: parti.getNickname() }; }
  clearSelectedBy() { this.selectedBy = NON_PARTI; }
  isSelectedBy() { return this.selectedBy.id !== -1; }

  getDesired() { return this.desired; }
  setDesired(parti) { this.desired = { id: parti.getId(), nickname: parti.getNickname() }; }
  clearDesired() { this.desired = NON_PARTI; }
  isDesired() { return this.desired.id !== -1; }

  getDesiredBy() { return this.desiredBy; }
  setDesiredBy(parti) { this.desiredBy = { id: parti.getId(), nickname: parti.getNickname() }; }
  clearDesiredBy() { this.desiredBy = NON_PARTI; }
  isDesiredBy() { return this.desiredBy.id !== -1; }

  isOnline() { return this.online; }
  setOnline(val) { this.online = val; }

  toString() {
    var condition = this.isSelectedBy() ?
                    'selected by ' + this.selectedBy.nickname :
                    'desired by ' + this.desiredBy.nickname;
    return `#${this.id} ${this.nickname} ${condition}`;
  }

  ident() {
    return `#${this.id} ${this.nickname}`;
  }

  toJson() {
    return JSON.stringify(this, null, 2);
  }

  static fromJson(json) {
    return new Participant(JSON.parse(json));
  }

}
