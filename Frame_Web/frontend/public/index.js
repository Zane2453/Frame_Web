var url = 'http://localhost'
var port = '5000'
var gameUrl = 'http://localhost'
var gamePort = '7788'
var gamePath = '/game'

var socketIo = io.connect(url + ':' + port)
var device_id = undefined,
	key = undefined
window.recv = []
window.send = []
window.configs = {
	csm_url: undefined,
	dm_name: undefined,
	idf_list: undefined,
	odf_list: undefined,
	p_id: undefined,
	ido_id: undefined,
	odo_id: undefined,
	dev_name: undefined,
}

$(function () {
	fetch(`${url}:${port}/init`)
		.then(function (response) {
			return response.json()
		})
		.then(function (myJson) {
			const { initConfig } = myJson
			configs = { ...initConfig }
			console.log(`[middleware]`)
			console.dir(configs)
			urls = {
				csm_url: configs.csm_url,
				frame_bind: function (id) {
					return `${url}:${port}/bind/${id}`
				},
			}
			// Initialize
			socketIo.emit('START', {
				p_id: configs.p_id,
				do_id: configs.odo_id,
			})
			socketIo.on('ID', (curID) => {
				device_id = curID.id
				key = curID.key
				console.log(`[middleware] ${key}`)
				initial()
			})
		})
})

$(window).on('beforeunload', function (e) {
	//dan2.deregister();
	socketIo.emit('END')
})

var MsgHandler = function (dest, data) {
	if (dest == 'Processing') {
		//  Processing Side Function
		console.log(`receive message from DAI, push to processing: ${data}`)
		window.recv.push(data)
	} else {
		signal_type = data.split(':')[0]
		status = data.split(':')[1]
		console.log(`[middleware] [processing] recv data `, signal_type, status)
		if (signal_type == 'load') {
			push(
				'PlayAck-I',
				JSON.stringify({
					op: 'Loading',
					data: status,
				})
			)
		} else if (signal_type == 'display') {
			push(
				'PlayAck-I',
				JSON.stringify({
					op: 'DisplayFinish',
					data: 'true',
				})
			)
		}
	}
}
