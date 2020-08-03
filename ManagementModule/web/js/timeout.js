const modeMap = {
	unclassified: '不分類',
	guess: '猜猜看',
	shake: '搖搖看',
}
const stageStr = '階段'

const stageMap = {
	mode: `選擇模式${stageStr}`,
	group: `選擇群組${stageStr}`,
	member: `問題選擇${stageStr}`,
	game: `遊戲${stageStr}`,
	end: `結束${stageStr}`,
}

//main
$(function () {
	let timeoutData = {}

	$(document).on('click', '.edit-timeout', function (event) {
		const { mode, stage } = event.target.dataset
		const value = ~~$(`input[data-mode=${mode}][data-stage=${stage}]`).val()
		console.log(mode, stage, value)
		$.ajax({
			type: 'POST',
			url: location.origin + '/setExpiredTime',
			cache: false,
			contentType: 'application/json',
			data: JSON.stringify({ mode, stage, value }),
			error: function (e) {
				show_msgModal('系統錯誤', `無法修改  ${modeMap[mode]} 的 ${stageMap[stage]} 逾時秒數`)
				console.log(e)
			},
			success: function (payload) {
				show_msgModal('修改成功', `${modeMap[mode]} 的 ${stageMap[stage]} 逾時秒數已被改為 ${value} 秒`)
				getAllTimeout()
			},
		})
	})

	function getAllTimeout() {
		$.ajax({
			type: 'GET',
			url: location.origin + '/getAllExpiredTime',
			cache: false,
			contentType: 'application/json',
			error: function (e) {
				show_msgModal('系統錯誤', "無法取得逾時設定")
				console.log(e)
			},
			success: function (payload) {
				let data = JSON.parse(payload)
				Object.keys(modeMap).map(function (key) {
					const obj = data.filter((x) => x.mode === key)
					timeoutData[key] = obj
				})
				renderTimeoutAccordion()
			},
		})
	}

	function renderTimeoutAccordion() {
console.log(timeoutData);
		const timeoutAccordion = `
            <div class="accordion" id="timeout-accordion">			
            ${Object.keys(timeoutData)
				.map(
					(timeoutMode, timeoutModeIndex) =>
						`
                        <div class="card">
                            <div class="card-header" id="heading-${timeoutMode}">
                                <h2 class="mb-0">
                                    <button class="btn btn-link" type="button" data-toggle="collapse" data-target="#collapse-${timeoutMode}"
                                    aria-expanded="true" aria-controls="collapse-${timeoutMode}">
                                    ${modeMap[timeoutMode]}
                                    </button>
                                </h2>
                             </div>
                            <div id="collapse-${timeoutMode}" class="collapse ${
							timeoutModeIndex === 0 && 'show'
						}" aria-labelledby="heading-${timeoutMode}" data-parent="#timeout-accordion">
                                <div class="card-body">
                                ${renderModeInput(timeoutData[timeoutMode])}
                                </div>
                            </div>
		                </div>
                        `
				)
				.join('')}	
	        </div>
        `

		$('#timeout-accordion').replaceWith(timeoutAccordion)
	}

	function renderModeInput(stageDataList) {
		console.log(stageDataList)
		return stageDataList
			.map(
				(stageData, stageIndex) => `
                        <div class="input-group mb-3">
                            <div class="input-group-prepend">
                                <span class="input-group-text">${stageMap[stageData.stage]}</span>
                            </div>
                            <input type="number" class="form-control text-right" aria-label="Seconds" data-mode=${
								stageData.mode
							} data-stage=${stageData.stage} value=${stageData.value}>
                            <div class="input-group-append">
                                <span class="input-group-text">秒</span>
                                <button class="btn btn-primary edit-timeout" type="button" data-mode=${
									stageData.mode
								} data-stage=${stageData.stage} >修改</button>
                            </div>
                        </div>
                `
			)
			.join('')
	}

	getAllTimeout()
})
