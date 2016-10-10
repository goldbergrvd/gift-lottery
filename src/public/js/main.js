var socket = io();
var Participant = require('./role/Participant');

var selfInfo;

$('#signup-btn').on('click', function (evt) {
  evt.preventDefault();

  if (document.querySelector('#signup-file').files.length &&
      document.querySelector('#signup-input').value) {

    $('#signup-form')[0].submit();
    var iid = setInterval(function () {
      var id = $('#signup-response').contents().find('body').text();
      if (id) {
        clearInterval(iid);
        $('#signin-input').val(id);
        $('#signin-btn').trigger('click');
      }
    }, 10);
  }
});

$('#signin-btn').on('click', function (evt) {
  var id = $('#signin-input').val();
  if (id) {
    socket.emit('signin', id);
  }
});

socket.on('sign-success', (info) => {
  selfInfo = info;
  $('#sign-page').css('z-index', 1);
  $('#grid-page').css('z-index', 2);
});

socket.on('refresh parti', (partiList) => {
  $('#grid-page').html(
    _.chain(partiList)
     .map((parti) => new Participant(parti))
     .map((parti) => {
       var partiId = 'data-id="' + parti.getId() + '"';
       var desiredById = parti.isDesiredBy() ? 'data-desired-by-id="' + parti.getDesiredBy().id + '"' : '';
       return '<span ' + partiId + ' ' + desiredById   + '>' + parti.toString() + '</span>'
     })
     .value()
     .join('<br/>')
  );
});

$('#grid-page').on('click', 'span', function (evt) {
  var partiId = parseInt($(this).data('id'));
  var desiredById = parseInt($(this).data('desired-by-id'));

  if (selfInfo.id === partiId) {
    return;
  }

  if (selfInfo.id === desiredById) {
    socket.emit('undesire', partiId);
    return;
  }

  socket.emit('desire', partiId)

});
