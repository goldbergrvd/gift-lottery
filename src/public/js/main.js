var socket = io();
var Participant = require('./role/Participant');

var selfInfo;

$('#signup-btn').on('click', function (evt) {
  var nickname = $('#nickname').val();
  if (nickname) {
    socket.emit('signup', nickname);
  }
});

socket.on('signup-success', (info) => {
  selfInfo = info;
});

socket.on('refresh parti', (partiList) => {
  $('#show').html(
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

$('#show').on('click', 'span', function (evt) {
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
