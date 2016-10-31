var socket = io();
var Participant = require('./role/Participant');

var selfInfo;

function gridView (parti) {
  let partiIdAttr = `data-id="${parti.getId()}"`;
  let desireIdAttr = parti.isDesired() ? `data-desired-id="${parti.getDesired().id}"` : '';
  let desiredByIdAttr = parti.isDesiredBy() ? `data-desired-by-id="${parti.getDesiredBy().id}"` : '';
  let selectedIdAttr = parti.isSelected() ? `data-selected-id="${parti.getSelected().id}"` : '';
  let selectedByIdAttr = parti.isSelectedBy() ? `data-selected-by-id="${parti.getSelectedBy().id}"` : '';
  let maskEle = '';

  if (selfInfo.winner) {
    if (!parti.isSelectedBy()) {
      maskEle = '<div class="mask mask-un-availible"></div>';
    } else {
      if (parti.isDesiredBy()) {
        if (parti.getDesiredBy().id === selfInfo.id) {
          maskEle = '<div class="mask mask-winner-desire"></div>';
        } else {
          maskEle = '<div class="mask mask-un-availible"></div>';
        }
      } else {
        maskEle = '<div class="mask mask-selected">' + parti.getSelectedBy().nickname + 'der</div>';
      }
    }
  } else {
    if (parti.isSelectedBy()) {
      maskEle = '<div class="mask mask-un-availible"></div>';
    } else if (parti.isDesiredBy()) {
      if (parti.getDesiredBy().id === selfInfo.id) {
        maskEle = '<div class="mask mask-loser-desire"></div>';
      } else {
        maskEle = '<div class="mask mask-un-availible"></div>';
      }
    }
  }

  return `<li ${partiIdAttr} ${desireIdAttr} ${desiredByIdAttr} ${selectedIdAttr} ${selectedByIdAttr}>
            <div class="photo">
              <img src="img/${parti.getImgName()}" alt="">
            </div>
            <div class="ident">${parti.ident()}</div>
            ${maskEle}
          </li>`;
}

function tuneImgHeight () {
  let $img = $('#grid-page img');
  let width = $img.width();
  $img.height(width);
}

function tuneMaskLineHeight () {
  let maskHeight = $('li .mask').height();
  $('li .mask-selected').css('line-height', maskHeight + 'px');
}

function availableSelect(isAvailable) {
  if (isAvailable) {
    $('#unavailable').css('z-index', 1);
  } else {
    $('#unavailable').css('z-index', 3);
  }
}

function lottering () {
  let $liEles = $('li[data-id]:not([data-selected-by-id])');
  let currIndex = 0;
  let prevMaskClass;

  function revertOldMask () {
    if (prevMaskClass) {
      let $prevLi = $($liEles.get(currIndex - 1));
      $prevLi.find('.mask').remove();
      $prevLi.append(`<div class="${prevMaskClass}"></div>`);
    }
  }

  let iid = setInterval(function () {
              // 還原舊的 mask
              revertOldMask();

              if (currIndex === $liEles.length) {
                currIndex = 0;
              }

              let $currLi = $($liEles.get(currIndex));

              // 記下舊的 mask
              let $mask = $currLi.find('.mask');
              prevMaskClass = $mask.attr('class');

              // 換成新的 mask
              $mask.remove();
              $currLi.append('<div class="mask mask-lottery-match"></div>');

              currIndex++;
            }, 100);

  return function () {
    clearInterval(iid);
    revertOldMask();
  };
}

$('#signup-btn').on('click', function (evt) {
  evt.preventDefault();

  if (document.querySelector('#signup-file').files.length &&
      document.querySelector('#signup-input').value) {

    $('#signup-form')[0].submit();
    $(this).attr('disabled', true);

    let iid = setInterval(() => {
      let id = $('#signup-response').contents().find('body').text();
      if (id) {
        clearInterval(iid);
        $('#signin-input').val(id);
        $('#signin-btn').trigger('click');
        $(this).attr('disabled', false);
      }
    }, 10);
  }
});

$('#signin-btn').on('click', function (evt) {
  $(this).attr('disabled', true);
  let id = $('#signin-input').val();
  if (id) {
    socket.emit('signin', id);
  }
});

socket.on('signin-duplicate', function () {
  alert('重複登入');
  $('#signin-btn').attr('disabled', false);
});

// 一般使用者登入成功
socket.on('sign-success', function (info) {
  selfInfo = info;
  $('#sign-page').css('z-index', 1);
  $('#grid-page').css('z-index', 2);
  $(this).attr('disabled', false);

  // 先關閉選取
  availableSelect(false);

  // 網格狀態改變
  socket.on('refresh parti', function (partiList) {
    $('#grid-page ul').html(
      _.chain(partiList)
       .map(parti => new Participant(parti))
       .map(parti => gridView(parti))
       .value()
       .join('')
    );

    tuneImgHeight();
    tuneMaskLineHeight();
  });

  socket.on('start-select', function () {
    availableSelect(true);
  });

  // 樂透號碼結果
  socket.on('lottery-result', function (data) {
    selfInfo.stopper();

    var $lotteryLi = $('li[data-id="' + data.lotteryId + '"]');
    $lotteryLi.find('.mask').remove();
    $lotteryLi.append('<div class="mask mask-lottery-match"></div>');
  });

  socket.on('lottering', function () {
    selfInfo.stopper = lottering();
    availableSelect(false);
  });

  // 溫拿
  socket.on('winner', function (winnerId) {
    if (selfInfo.id === winnerId) {
      selfInfo.winner = true;
    }
  });
});

// 管理者登入成功
socket.on('god-you', function (info) {
  var lottery;

  $('#sign-page').css('z-index', 1);
  $('#god-page').css('z-index', 2);

  socket.on('lottery-available', function () {
    $('#lottery-btn').attr('disabled', false);
  });
  socket.on('lottery-unavailable', function () {
    $('#lottery-btn').attr('disabled', true);
  });

  $('#lottery-btn').on('click', function (evt) {
    socket.emit('lottery');
  });

  // 樂透號碼結果
  socket.on('lottery-result', function (data) {
    lottery = data;
    $('#lottery-parti').text(data.winnerIdent + ' 選中 ' + data.lotteryIdent);
    $('#next-round-btn').attr('disabled', true);
  });

  // 確定樂透成立
  $('#lottery-resolve-btn').on('click', function (evt) {
    socket.emit('lottery-resolve', lottery.lotteryId);
    $(this).attr('disabled', true);
    $('#next-round-btn').attr('disabled', false);
  });

  // 開始下一回合
  $('#next-round-btn').on('click', function (evt) {
    socket.emit('next-round');
    $('#lottery-resolve-btn').attr('disabled', false);
  });
});

$('#grid-page').on('click', 'li', function (evt) {
  let partiId = parseInt($(this).data('id'));
  let desiredId = parseInt($(this).data('desired-id'));
  let desiredById = parseInt($(this).data('desired-by-id'));
  let selectedId = parseInt($(this).data('selected-id'));
  let selectedById = parseInt($(this).data('selected-by-id'));

  // 再點一次自己點過的就取消
  if (selfInfo.id === desiredById) {
    socket.emit('undesire', partiId);
    return;
  }

  if (selfInfo.winner) {

    // 溫拿不能侵犯魯蛇的地盤
    if (Number.isNaN(selectedById)) {
      return;
    }

  } else {

    // 魯蛇不能選自己的
    if (selfInfo.id === partiId) {
      return;
    }

    // 已經被選走了
    if (selectedById >= 0) {
      return;
    }
  }

  socket.emit('desire', partiId);
});
