var socket = io();
var Participant = require('./role/Participant');

var selfInfo;

function gridView(parti) {
  let partiIdAttr = 'data-id="' + parti.getId() + '"';
  let desiredByIdAttr = parti.isDesiredBy() ? 'data-desired-by-id="' + parti.getDesiredBy().id + '"' : '';
  let maskEle = '';
  if (parti.isDesiredBy()) {
    if (parti.getDesiredBy().id === selfInfo.id) {
      maskEle = '<div class="mask mask-self"></div>';
    } else {
      maskEle = '<div class="mask mask-other"></div>';
    }
  }

  return `<li ${partiIdAttr} ${desiredByIdAttr}>
            <div class="photo">
              <img src="img/${parti.getImgName()}" alt="">
            </div>
            <div class="ident">${parti.ident()}</div>
            ${maskEle}
          </li>`;
}

function tuneImgHeight() {
  let $img = $('#grid-page img');
  let width = $img.width();
  $img.height(width);
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

// 一般使用者登入成功
socket.on('sign-success', function (info) {
  selfInfo = info;
  $('#sign-page').css('z-index', 1);
  $('#grid-page').css('z-index', 2);
  $(this).attr('disabled', false);
});

// 管理者登入成功
socket.on('god-you', function (info) {
  $('#sign-page').css('z-index', 1);
  $('#god-page').css('z-index', 2);
  $('#lottery-btn').on('click', function (evt) {
    socket.emit('lottery');
  });

  socket.on('lottery-result', function (data) {
    $('#lottery-parti').text(data.ident);
  });
});

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
});

$('#grid-page').on('click', 'li', function (evt) {
  let partiId = parseInt($(this).data('id'));
  let desiredById = parseInt($(this).data('desired-by-id'));

  if (selfInfo.id === partiId) {
    return;
  }

  if (selfInfo.id === desiredById) {
    socket.emit('undesire', partiId);
    return;
  }

  socket.emit('desire', partiId);

});
