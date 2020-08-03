/* ---------------------------- processing (p5.js) --------------------------- */
// note: use p5.js in react components will decouple from the original life cycle function control
// use setup, draw etc... instead
import Sketch from 'react-p5'
/* ---------------------------------- React --------------------------------- */
import React from 'react'
/* --------------------------- loading config.json -------------------------- */
import config from './data/config.json'
/* --------------------------- loading QR code -------------------------- */
// import qrCode from './data/qrcode.png'
import QRCode from 'qrcode'

class App extends React.Component {
	/* -------------------------- For weather paintings ------------------------- */
	weather_db_path = config.weather_db_path
	weather_images = []
	weather_names = []
	weather_num = []
	weather_start = []
	weather_end = []
	name_weather = 0
	weather_load_finish = false
	forward_weather = 0
	weather_img_displaying = null
	pre_weather_img_displaying = null
	/* ------------------------- For portrait paintings ------------------------- */
	portrait_images = []
	async_portrait_images = []
	async_portrait_boolean_flag = []
	answerPath = []
	portrait_end_index = undefined
	async_portrait_cnt = undefined
	portrait_load_finish = false
	forward = 0
	/* ----------------------------------- sec ---------------------------------- */
	timer_e = 0
	time_e = 0.1
	timer_q = 0
	time_q = 0.8
	timer_b = 0
	time_b = 0.65
	/* ------------------------------- For display ------------------------------ */
	caselabel = 'I'
	img_displaying = undefined
	pre_img_displaying = null
	/* -------------------------- Guess game main page -------------------------- */
	FontPlay = undefined
	margin_B = undefined
	color_play = 1
	/* --------------------------------- API --------------------------------- */
	baseUrl = `${window.url}:${window.port}/`
	/* --------------------------------- Timeout --------------------------------- */
	timeoutData = undefined
	prevMode = ''
	prevStage = ''
	timer = 0
	/* --------------------------------- QRcode --------------------------------- */
	/* ------------------------------ QR code image ----------------------------- */
	QRimg = { width: 0, height: 0 }
	/* -------------------------- QRcode region height -------------------------- */
	QRheight = 0
	QRmargin = 0
	/* ---------------------------- this.percentage string --------------------------- */
	percentage = '0'
	truly_End_flag = 0
	/* -------------------------- Load single portrait -------------------------- */
	loadSinglePortrait = async (p5, answerPath) => {
		this.portrait_load_finish = false
		/* ------------------------------ remove cache ------------------------------ */
		this.portrait_images = []
		await this.loadSinglePortraitImages(p5, answerPath)
		console.log(`[frontend] load picture done`)
		this.sendHandler('load:finish')
		this.portrait_load_finish = true
	}
	/* --------------------- Load single portrait paintings --------------------- */
	loadSinglePortraitImages = (p5, answerPath) => {
		return new Promise((resolve) => {
			this.async_portrait_boolean_flag = []
			this.async_portrait_cnt = -1
			answerPath.forEach((answerPathItem, answerPathIndex) => {
				answerPathItem = p5.loadImage(config.portrait_images_path + answerPathItem)
				this.portrait_images[answerPathIndex] = answerPathItem
				this.async_portrait_boolean_flag[answerPathIndex] = false
			})
			let timer = p5.millis()
			while (this.async_portrait_cnt !== this.portrait_end_index) {
				answerPath.forEach((answerPathItem, answerPathIndex) => {
					if (
						this.portrait_images[answerPathIndex].width > 0 &&
						this.async_portrait_boolean_flag[answerPathIndex] === false
					) {
						console.log(`[frontend] load `, answerPathItem, 'done')
						this.async_portrait_cnt = this.async_portrait_cnt + 1
						/* ---------------- add loading percentage modified 2019/9/7 ---------------- */
						this.percentage = p5.str(p5.round((100 * this.async_portrait_cnt) / this.answerPath.length))
						console.log(`[frontend] ${`percentage: ${this.percentage}`}`)
						this.sendHandler('load:' + this.percentage)

						this.async_portrait_boolean_flag[answerPathIndex] = true
						let img = this.portrait_images[answerPathIndex]
						img.resize(p5.int(p5.width * 0.8), p5.int(p5.height * 0.8))
						/* ---------------------------- modified 2019/9/7 --------------------------- */
						if (answerPathIndex === this.portrait_end_index) {
							this.percentage = p5.str(
								p5.round((100 * (this.async_portrait_cnt + 1)) / this.answerPath.length)
							)
							this.sendHandler('load:' + this.percentage)
							console.log(`[frontend] portrait loading done`)
							resolve()
						}
					}
				})
				if (p5.millis() - timer > 20000) {
					break
				}
			}
		})
	}
	/* ---------------------------------- Text size calculator --------------------------------- */
	textSizeCalculator = (showText, width) => {
		return ((100 / showText.length) * width) / 100
	}
	/* ---------------------------------- Text Handler --------------------------------- */
	timerTextHandler = (mode, stage, p5) => {
		if (this.timeoutData === undefined) {
			return false
		}
		if (this.prevMode === mode && this.prevStage === stage) {
			this.timer = this.timer > 0 ? this.timer - 1 : 0
		} else {
			this.timer = this.timeoutData[mode][stage]
			this.prevMode = mode
			this.prevStage = stage
		}
		const showText = this.timer > 0 ? `選擇時間剩 ${this.timer} 秒` : ''
		p5.textSize(this.textSizeCalculator(showText, p5.width))
		p5.text(showText, p5.width / 2, this.textSizeCalculator(showText, p5.width))
	}
	/* ---------------------------------- Setup --------------------------------- */
	setup = async (p5, canvasParentRef) => {
		await this.loadConfigsTimer()
		p5.frameRate(1)
		// p5.createCanvas(540, 960, p5.P2D).parent(canvasParentRef);
		p5.createCanvas(window.innerWidth, window.innerHeight, p5.P2D).parent(canvasParentRef)
		p5.noCursor()
		/* ----------------------- guess game main page setup ----------------------- */
		this.FontPlay = p5.textFont('SansSerif', 60)
		/* ------------------------- Load weather paintings ------------------------- */
		console.log(`[frontend] loading weather`)
		await this.loadWeatherImageThread(p5)
		/* ------------------------- Load portrait paintings ------------------------ */
		console.log(`[frontend] loading portrait`)
		this.portrait_load_finish = true
		/* ------------------------------- Set QR code ------------------------------ */
		this.QRheight = Math.min(p5.height, p5.width) / 5
		this.QRmargin = this.QRheight * 0.15
		this.loadQR(p5)
		this.margin_B = Math.min(p5.height, p5.width) / 8
	}
	/* ---------------------------------- Draw ---------------------------------- */
	draw = async (p5) => {
		console.log(`[frontend] ${this.caselabel}`)
		/* -------- Client part: receive data from server, store in data_all -------- */
		if (this.weather_load_finish && this.portrait_load_finish) {
			if (window.recv.length !== 0) {
				let data_split = p5.splitTokens(window.recv[window.recv.length - 1], ',;')
				console.log(`[frontend] Message from DAI : `, window.recv[window.recv.length - 1])
				console.log(`[frontend] data_split : `, data_split)

				/* -------------------------- update weather images ------------------------- */
				if (p5.match(data_split[0], 'w') !== null) {
					this.name_weather = p5.int(window.recv[1])
					this.pre_weather_img_displaying = null
					console.log(`[frontend] this.name_weather = `, this.name_weather)
				} else if (p5.match(data_split[0], 's') !== null) {
					/* ------------------ switch to game mode selection status ------------------ */
					this.caselabel = 'S'
					console.log(`[frontend] recvdata S`)
				} else if (p5.match(data_split[0], 'g') !== null) {
					/* -------------------- switch to group selection status -------------------- */
					this.caselabel = 'G'
					console.log(`[frontend] recvdata G`)
				} else if (p5.match(data_split[0], 'm') !== null) {
					/* -------------------- switch to member selection status ------------------- */
					this.caselabel = 'M'
					console.log(`[frontend] recvdata M`)
				} else if (p5.match(data_split[0], 'p') !== null) {
					/* -------------------------- switch to game status ------------------------- */
					console.log(`[frontend] get portrait path`)

					this.answerPath = (() => {
						let temp = [...data_split]
						temp.shift()
						return temp
					})()
					/* ---------------------------- set portrait_end ---------------------------- */
					this.portrait_end_index = this.answerPath.length - 1
					this.forward = -1
					/* ----------------------- go to state "L" for loading ---------------------- */
					this.caselabel = 'L'
				} else if (p5.match(data_split[0], 'f') !== null) {
					/* -------------------------- will update portrait -------------------------- */
					this.forward = this.forward + 1
					this.clearRecvHandler()
					console.log(`[frontend] recvdata forward+1 :`, this.forward)
				} else if (p5.match(data_split[0], 'e') !== null) {
					/* --------------------- will switch to end game status --------------------- */
					this.caselabel = 'E'
					console.log(`[frontend] recvdata E`)
				} else if (p5.match(data_split[0], 'q') !== null) {
					/* ---------------------- switch to leaved game status ---------------------- */
					/* ------------------ exit guess game, return weather mode ------------------ */
					this.loadQR(p5)
					this.caselabel = 'Q'
					this.pre_img_displaying = null
					console.log(`[frontend] recvdata Q`)
				}
			}
		}
		/* ------------------------------- Displaying ------------------------------- */
		// p5.background(0);

		switch (this.caselabel) {
			/* -------------------------------- frame init -------------------------------- */
			// ************** case I: Frame initialization ****************************
			case 'I':
				p5.background(0)
				p5.noStroke()
				p5.fill(p5.map((p5.frameCount % 70) + 1, 1, 69, 180, 10))
				p5.ellipse(
					p5.width / 2,
					p5.height / 2,
					((p5.frameCount % 70) + 1) * 10,
					((p5.frameCount % 70) + 1) * 10
				)
				p5.textAlign(p5.CENTER, p5.CENTER)
				p5.textFont('Monaco')
				p5.fill(255)
				p5.textSize(this.textSizeCalculator('Loading data ... ', p5.width))
				p5.text('Loading data ... ', p5.width / 2, p5.height / 2)
				if (this.weather_load_finish && this.portrait_load_finish) {
					this.caselabel = 'W'
				}
				this.clearRecvHandler()
				break
			// ************** case W: Display Weather *****************************
			case 'W':
				try {
					let resizeWidth
					let resizeHeight
					if (this.forward_weather > this.weather_num[this.name_weather] - 1) {
						this.forward_weather = 0
					}
					let prepareImage = this.pre_weather_img_displaying
						? this.pre_weather_img_displaying
						: this.weather_images[this.weather_start[this.name_weather] + this.forward_weather]
					if (prepareImage.width >= prepareImage.height) {
						resizeWidth = p5.width
						resizeHeight = prepareImage.height * (p5.width / prepareImage.width)
						if (resizeHeight >= p5.height) {
							resizeWidth = resizeWidth * (p5.height / resizeHeight)
							resizeHeight = p5.height
						}
					} else {
						resizeHeight = p5.height
						resizeWidth = prepareImage.width * (p5.height / prepareImage.height)
						if (resizeWidth >= p5.width) {
							resizeHeight = resizeHeight * (p5.width / resizeWidth)
							resizeWidth = p5.width
						}
					}
					prepareImage.resize(resizeWidth, resizeHeight)
					p5.background(0)
					p5.image(prepareImage, (p5.width - resizeWidth) / 2, (p5.height - resizeHeight) / 2)
					p5.image(
						this.QRimg,
						p5.width - (p5.width - resizeWidth) / 2 - this.QRheight,
						p5.height - (p5.height - resizeHeight) / 2 - this.QRheight,
						this.QRheight,
						this.QRheight
					)
				} catch (exception) {
					console.log(`[frontend] case W failed`, exception)
				}
				this.clearRecvHandler()
				break
			// ************** case B: Mode(Start) Page ****************************
			case 'S':
				p5.frameRate(60)
				p5.background(0, 0, 0)
				p5.fill(246, 224, 183)
				p5.rect(
					this.margin_B,
					this.margin_B,
					p5.width - 2 * this.margin_B,
					p5.height - 2 * this.margin_B,
					30,
					30,
					30,
					30
				)
				if (this.timer_b < this.time_b) {
					this.color_play = 0
				} else if (this.timer_b >= this.time_b && this.timer_b < 2 * this.time_b) {
					this.color_play = 1
				} else {
					this.timer_b = 0
				}
				this.timer_b += 1 / p5._frameRate

				if (this.color_play === 0) {
					p5.fill(96, 192, 220)
					this.color_play = 1
				} else {
					p5.fill(46, 154, 186)
					this.color_play = 0
				}
				p5.noStroke()
				p5.rect(
					p5.width / 3 - p5.width / 6,
					p5.height / 2 - p5.width / 16,
					(p5.width * 4) / 6,
					p5.width / 8,
					30,
					30,
					30,
					30
				)
				p5.fill(255, 255, 255)
				p5.textAlign(p5.CENTER, p5.CENTER)
				p5.textFont(this.FontPlay)
				p5.textSize(this.textSizeCalculator('Choose a Mode', p5.width))
				p5.text('Choose a Mode', p5.width / 2, p5.height / 2)
				this.clearRecvHandler()
				break

			// ************** case G: Group Page ****************************
			case 'G':
				p5.background(0, 0, 0)
				p5.fill(246, 224, 183)
				p5.rect(
					this.margin_B,
					this.margin_B,
					p5.width - 2 * this.margin_B,
					p5.height - 2 * this.margin_B,
					30,
					30,
					30,
					30
				)

				if (this.timer_b < this.time_b) {
					this.color_play = 0
				} else if (this.timer_b >= this.time_b && this.timer_b < 2 * this.time_b) {
					this.color_play = 1
				} else {
					this.timer_b = 0
				}
				this.timer_b += 1 / p5._frameRate

				if (this.color_play === 0) {
					p5.fill(90, 98, 104)
					this.color_play = 1
				} else {
					p5.fill(63, 71, 76)
					this.color_play = 0
				}
				p5.noStroke()
				p5.rect(
					p5.width / 3 - p5.width / 6,
					p5.height / 2 - p5.width / 16,
					(p5.width * 4) / 6,
					p5.width / 8,
					30,
					30,
					30,
					30
				)
				p5.fill(255, 255, 255)
				p5.textAlign(p5.CENTER, p5.CENTER)
				p5.textFont(this.FontPlay)
				p5.textSize(this.textSizeCalculator('Choose a Group', p5.width))
				p5.text('Choose a Group', p5.width / 2, p5.height / 2)
				this.clearRecvHandler()
				break

			// ************** case M: Member Page ****************************
			case 'M':
				p5.background(0, 0, 0)
				p5.fill(246, 224, 183)
				p5.rect(
					this.margin_B,
					this.margin_B,
					p5.width - 2 * this.margin_B,
					p5.height - 2 * this.margin_B,
					30,
					30,
					30,
					30
				)

				if (this.timer_b < this.time_b) {
					this.color_play = 0
				} else if (this.timer_b >= this.time_b && this.timer_b < 2 * this.time_b) {
					this.color_play = 1
				} else {
					this.timer_b = 0
				}
				this.timer_b += 1 / p5._frameRate

				if (this.color_play === 0) {
					p5.fill(220, 53, 69)
					this.color_play = 1
				} else {
					p5.fill(247, 96, 109)
					this.color_play = 0
				}
				p5.noStroke()
				p5.rect(
					p5.width / 3 - p5.width / 6,
					p5.height / 2 - p5.width / 16,
					(p5.width * 4) / 6,
					p5.width / 8,
					30,
					30,
					30,
					30
				)
				p5.fill(255, 255, 255)
				p5.textAlign(p5.CENTER, p5.CENTER)
				p5.textFont(this.FontPlay)
				p5.textSize(this.textSizeCalculator('Choose a Member', p5.width))
				p5.text('Choose a Member', p5.width / 2, p5.height / 2)
				this.clearRecvHandler()
				break

			// ************** case L: Loading portrait ****************************
			case 'L':
				if (this.forward === -1) {
					this.portrait_load_finish = false
					this.percentage = '0'
					await this.loadPortraitImageThread(p5)
					this.forward = 0
				}

				p5.background(0)
				p5.noStroke()
				p5.fill(p5.map((p5.frameCount % 70) + 1, 1, 69, 180, 10))
				p5.ellipse(
					p5.width / 2,
					p5.height / 2,
					((p5.frameCount % 70) + 1) * 10,
					((p5.frameCount % 70) + 1) * 10
				)
				p5.textAlign(p5.CENTER, p5.CENTER)
				p5.textFont(this.FontPlay)
				p5.fill(255)
				p5.textSize(this.textSizeCalculator('Loading data ... ' + this.percentage + '%', p5.width))
				p5.text('Loading data ... ' + this.percentage + '%', p5.width / 2, p5.height / 2)
				if (this.portrait_load_finish) this.caselabel = 'P'
				this.clearRecvHandler()
				break

			// ************** case P: Display portrait ****************************
			case 'P':
				try {
					let resizeWidth
					if (this.portrait_load_finish) {
						p5.background(0)
						if (this.forward > this.portrait_end_index) {
							if (this.pre_img_displaying !== null) {
								resizeWidth =
									(this.pre_img_displaying.width * p5.height) / this.pre_img_displaying.height
								this.pre_img_displaying.resize(resizeWidth, p5.height)
								p5.image(this.pre_img_displaying, (p5.width - resizeWidth) / 2, 0)
							}
							this.clearRecvHandler()
							break
						}

						if (this.portrait_images.length > 0) {
							this.truly_End_flag = 0

							this.img_displaying = this.portrait_images[this.forward]
							if (this.img_displaying !== null) {
								resizeWidth = (this.img_displaying.width * p5.height) / this.img_displaying.height
								this.img_displaying.resize(resizeWidth, p5.height)
								p5.image(this.img_displaying, (p5.width - resizeWidth) / 2, 0)
								this.pre_img_displaying = this.img_displaying
							} else {
								if (this.pre_img_displaying !== null) {
									resizeWidth =
										(this.pre_img_displaying.width * p5.height) / this.pre_img_displaying.height
									this.pre_img_displaying.resize(resizeWidth, p5.height)
									p5.image(this.pre_img_displaying, (p5.width - resizeWidth) / 2, 0)
								}
								this.forward += 1
							}
						}
					}
				} catch (exception) {
					console.log(`[frontend] ${exception}`)
					console.log(`[frontend] case P failed`)
					this.clearRecvHandler()
				}
				break

			// ************** case E: End portrait ****************************
			case 'E':
				if (this.forward < this.portrait_end_index) {
					if (this.timer_e >= this.time_e) {
						this.forward += 1
						this.timer_e = 0
					} else {
						this.timer_e += 1 / p5._frameRate
					}
				} else {
					this.caselabel = 'P'
					this.timer_e = 0
				}
				try {
					let resizeWidth
					if (this.portrait_images.length > 0 && this.forward <= this.portrait_end_index) {
						this.img_displaying = this.portrait_images[this.forward]
						if (this.img_displaying !== null) {
							resizeWidth = (this.img_displaying.width * p5.height) / this.img_displaying.height
							this.img_displaying.resize(resizeWidth, p5.height)
							p5.image(this.img_displaying, (p5.width - resizeWidth) / 2, 0)
							this.pre_img_displaying = this.img_displaying
						} else if (this.pre_img_displaying !== null) {
							resizeWidth = (this.pre_img_displaying.width * p5.height) / this.pre_img_displaying.height
							this.pre_img_displaying.resize(resizeWidth, p5.height)
							p5.image(this.pre_img_displaying, (p5.width - resizeWidth) / 2, 0)
						}
					}
					if (this.forward >= this.portrait_end_index && this.truly_End_flag === 0) {
						this.truly_End_flag = 1
					}
					if (this.truly_End_flag === 1) {
						this.truly_End_flag = 2
						this.forward += 1
						this.sendHandler('display:finish')
						this.clearRecvHandler()
						console.log(`[frontend] display finish`)
						console.log(`[frontend] E2 `, this.forward, this.portrait_end_index)
					}
				} catch (exception) {
					console.log(`[frontend] case E failed: `, exception)
					this.clearRecvHandler()
				}
				break

			// ************** case Q: Quit Page **************************
			case 'Q':
				// release cache
				this.portrait_images = []

				// reset background
				p5.background(0)

				// show leave game message
				p5.textAlign(p5.CENTER, p5.CENTER)
				p5.textFont(this.FontPlay)
				p5.fill(180)
				p5.textSize(this.textSizeCalculator('See you !', p5.width))
				p5.text('See you !', p5.width / 2, p5.height / 2)
				// p5.tint portrait
				p5.tint(255, p5.map(this.timer_q, 0, this.time_q, 255, 0))
				p5.noTint()
				this.timer_q += 1 / p5._frameRate
				if (this.timer_q >= this.time_q) {
					this.timer_q = 0
					this.caselabel = 'W'
				}
				this.clearRecvHandler()
				break

			default:
				break
		}
	}
	/* ------------------------------ Load configs timer ------------------------------ */
	loadConfigsTimer = () => {
		return new Promise((resolve) => {
			var configsInterval = setInterval(() => {
				if (window.configs.timer) {
					this.timeoutData = window.configs.timer
					clearInterval(configsInterval)
					resolve()
				}
			}, 300)
		})
	}
	/* ------------------------------ load QR code ------------------------------ */
	loadQR = (p5) => {
		var QRInterval = setInterval(() => {
			if (window.configs.p_id !== undefined && window.configs.odo_id !== undefined) {
				QRCode.toDataURL(`${window.configs.client_url}`).then((url) => {
					try {
						this.QRimg = p5.loadImage(url)
					} catch (exception) {
						console.log(`[frontend] ${`QR code error: ${exception}`}`)
					}
				})
				clearInterval(QRInterval)
			}
		}, 300)
	}
	/* ------------------- Thread for loading portrait images ------------------- */
	loadPortraitImageThread = async (p5) => {
		await this.loadSinglePortrait(p5, this.answerPath)
	}
	/* ------------------ Thread for loading all weather images ----------------- */
	loadWeatherImageThread = (p5) => {
		return new Promise((resolve) => {
			let weather_names = this.weather_db_path
			// console.log(`[frontend] there are ${this.weather_names.length} weather paintings`)
			weather_names.forEach((x) => console.log('[frontend] ' + x))
			Promise.all(weather_names.map((weather_name) => import(`${weather_name}.jpg`))).then((importResults) => {
				/* ---------------------------- loadWeatherImages --------------------------- */
				/* ---------- Load all weather paintings, save all in images buffer --------- */
				importResults.forEach((x, i) => {
					this.weather_num[i - 1] = 1
					this.weather_start[i - 1] = i - 1
					this.weather_end[i - 1] = i - 1
					x = p5.loadImage(x.default)
					this.weather_images[i] = x
				})
				this.weather_load_finish = true
				console.log(`[frontend] number of total weather images: `, this.weather_images.length)
				resolve()
			})
		})
	}

	/* ----------------- web socket client send message handler ----------------- */
	sendHandler = (message) => {
		window.MsgHandler('DAI', message)
	}
	/* ----------------- web socket client clear recv message handler ----------------- */
	clearRecvHandler = () => {
		window.recv = []
	}

	/* ------------------------- react component render ------------------------- */
	render() {
		return (
			<div className="App">
				<Sketch
					setup={this.setup}
					draw={this.draw}
					style={{
						height: '100vh',
						width: '100vw',
						display: 'flex',
						justifyContent: 'center',
						backgroundColor: 'black',
					}}
				/>
			</div>
		)
	}
}
export default App
