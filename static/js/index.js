$(document).ready(function() {
    var socket = io.connect();
    socket.on('frame', function(data) {
        console.log(data);
    });
});