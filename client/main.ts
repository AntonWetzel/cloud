import * as GPU from './gpu/header.js'

import * as Color from './color.js'
import * as Grid from './grid.js'
import './globalInput.js'


declare global {
	interface Window {
		CreateForm: (name: string) => void
		ShowText: (text: string) => void
		StartCompute: (name: string) => void
		radius: number
		size: number
		k: number
		noise: number
		frequencies: number
		iterations: number
		threshold: number
	}
}

const socket = new WebSocket('ws://' + location.host + '/ws')

socket.onerror = () => {
	alert('socket connection error')
}	

socket.onopen = async () => {

	const display = document.getElementById('display') as HTMLDivElement
	const canvas = await GPU.Setup(display.clientWidth, display.clientHeight)
	display.innerHTML = ''
	display.append(canvas)

	const formIdOffset = 1
	const computeIdOffset = 33
	const renderFlag = GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE
	const computeFlag = GPUBufferUsage.STORAGE

	const mode = document.getElementById('mode') as HTMLSelectElement
	const color = document.getElementById('color') as HTMLSelectElement
	const gridCheckbox = document.getElementById('grid') as HTMLInputElement

	const cam = new GPU.Camera(Math.PI / 4)
	cam.Translate(0, 5, 30)

	const increase = new GPU.Position()
	increase.Scale(5, 5, 5)
	const normal = new GPU.Position()
	const grid = Grid.Create(10)

	let k = 0
	let length = 0

	let cloud = GPU.CreateEmptyBuffer(0, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE)
	let colors = GPU.CreateEmptyBuffer(0, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE)
	let nearest : GPUBuffer = undefined
	let normals: GPUBuffer = undefined
	let curvature: GPUBuffer = undefined
	const keys: { [key: string]: true | undefined } = {}

	socket.onmessage =async (ev: MessageEvent<Blob | string>) =>{
		if (typeof ev.data == 'string') {
			alert(ev.data)
		} else {
			let data = await ev.data.arrayBuffer()
			console.log('message: ', data.byteLength)
			const info = new Int32Array(data)[0]
			data = data.slice(4)
			switch (info) {
			case 1:
				cloud.destroy()
				colors.destroy()
				if (nearest != undefined) {
					nearest.destroy()
					nearest = undefined
				}
				if (normals != undefined) {
					normals.destroy()
					normals = undefined
				}
				if (curvature != undefined) {
					curvature.destroy()
					curvature =undefined
				}
				length = new Int32Array(data)[0]
				data = data.slice(4)
				if (length * 16 != data.byteLength) {
					alert('wrong length')
					console.log(length, data.byteLength)
				}
				cloud = GPU.CreateBuffer(new Float32Array(data), renderFlag)
				colors = Color.Create(length)
				mode.value = 'points'
				color.value = 'color'
				break
			case 2:
				if (nearest != undefined) {
					nearest.destroy()
				}
				k = new Int32Array(data)[0]
				data = data.slice(4)
				nearest = GPU.CreateBuffer(new Uint32Array(data), computeFlag)
				mode.value = 'connections'
				break
			case 3:
				if (curvature != undefined) {
					curvature.destroy()
				}
				curvature = GPU.CreateBuffer(new Float32Array(data), renderFlag)
				color.value = 'curve'
				break
			case 4:
				if (normals != undefined) {
					normals.destroy()
				}
				normals = GPU.CreateBuffer(new Float32Array(data), renderFlag)
				color.value = 'normal'
				break
			}
		}
	}

	window.CreateForm =  (name: string) => {

		const data = new ArrayBuffer(8)
		let id: number
		const size = window.size
		switch (name) {
		case 'sphere': id = formIdOffset + 0; break
		case 'cube': id = formIdOffset + 1; break
		case 'torus': id = formIdOffset + 2; break
		case 'map': id = formIdOffset + 3; break
		case 'bunny': id = formIdOffset + 4; break
		case 'bunnyBig': id = formIdOffset + 5; break 
		case 'statue': id = formIdOffset + 6; break
		}
		new Int32Array(data)[0] = id
		new Int32Array(data)[1] = size
		socket.send(data)
	}

	window.ShowText = (text: string) => {
		const hint = document.createElement('div')
		hint.textContent = text
		hint.className = 'hint'
		document.body.append(hint)
		setTimeout(() => {
			hint.remove()
		}, 5000)
	}

	window.StartCompute = (name: string) => {
		let data: ArrayBuffer
		switch (name) {
		case 'kNearestIter':
		case 'kNearestList':
		case 'kNearestIterSorted':
		case 'kNearestListSorted':
			data = new ArrayBuffer(8)
			switch (name) {
			case 'kNearestIter': new Int32Array(data)[0] = computeIdOffset + 0; break
			case 'kNearestList':new Int32Array(data)[0] = computeIdOffset + 1; break
			case 'kNearestIterSorted':new Int32Array(data)[0] = computeIdOffset + 2; break
			case 'kNearestListSorted':new Int32Array(data)[0] = computeIdOffset + 3; break
			}
			new Int32Array(data)[1] = window.k
			socket.send(data)
			break
		case 'triangulateAll':
		case 'triangulateNear':
			data = new ArrayBuffer(4)
			switch (name) {
			case 'triangulateAll': new Int32Array(data)[0] = computeIdOffset + 4; break
			case 'triangulateNear':new Int32Array(data)[0] = computeIdOffset + 5; break
			}
			socket.send(data)
			break
		case 'noise':
			data = new ArrayBuffer(8)
			new Int32Array(data)[0] = computeIdOffset + 6
			new Float32Array(data)[1] = window.noise
			socket.send(data)
			break
		case 'frequenz':
			data = new ArrayBuffer(8)
			new Int32Array(data)[0] = computeIdOffset + 7
			new Int32Array(data)[1] = window.frequencies
			socket.send(data)
			break
		case 'smooth':
			data = new ArrayBuffer(8)
			new Int32Array(data)[0] = computeIdOffset + 8
			new Int32Array(data)[1] = window.iterations
			socket.send(data)
			break
		case 'normal':
			data = new ArrayBuffer(4)
			new Int32Array(data)[0] = computeIdOffset + 9
			socket.send(data)
			break
		case 'curvatureNormal':
			data = new ArrayBuffer(4)
			new Int32Array(data)[0] = computeIdOffset + 10
			socket.send(data)
			break
		case 'peek':
			data = new ArrayBuffer(4)
			new Int32Array(data)[0] = computeIdOffset + 11
			socket.send(data)
			break
		case 'threshold':
			data = new ArrayBuffer(8)
			new Int32Array(data)[0] = computeIdOffset + 12
			new Float32Array(data)[1] = window.threshold
			socket.send(data)
			break
		case 'reduce':
			data = new ArrayBuffer(4)
			new Int32Array(data)[0] = computeIdOffset + 13
			socket.send(data)
			break
		default:
			alert('wrong name: ' + name)
		}
	}

	display.onwheel = (ev) => {
		const scale = 1 + ev.deltaY / 1000
		increase.Scale(scale, scale, scale)
		ev.preventDefault()
		ev.stopImmediatePropagation()
	}

	document.body.onresize = () => {
		GPU.Resize(display.clientWidth, display.clientHeight)
		cam.UpdateSize()
	}

	document.body.onkeydown = (ev) => {
		keys[ev.code] = true
	}

	document.body.onkeyup = (ev) => {
		delete keys[ev.code]
	}

	display.onmousemove = (ev) => {
		if ((ev.buttons & 1) != 0) {
			cam.RotateX(-ev.movementY / 200)
			cam.RotateGlobalY(-ev.movementX / 200)
		}
	}

	window.CreateForm('sphere')

	let last = await new Promise(requestAnimationFrame)
	const run = true
	while (run) {
		const time = await new Promise(requestAnimationFrame)
		const delta = time - last
		if (delta < 50) {
			const dist = delta / 50
			const move = (key: string, x: number, y: number, z: number) => {
				if (keys[key] != undefined) {
					cam.Translate(x * dist, y * dist, z * dist)
				}
			}
			move('KeyW', 0, 0, -1)
			move('KeyA', -1, 0, 0)
			move('KeyS', 0, 0, 1)
			move('KeyD', 1, 0, 0)
		}

		let c = undefined as GPUBuffer
		switch (color.value) {
		case 'color':
			c = colors
			break
		case 'normal':
			if (normals == undefined) {
				c = colors
				color.value = 'color'
				alert('normals not calculated')
			} else {
				c = normals
			}
			break
		case 'curve':
			if (curvature == undefined) {
				c = colors
				color.value = 'color'
				alert('curvature not calculated')
			} else {
				c = curvature
			}
			break
		}
		const rad = window.radius
		GPU.StartRender(cam)
		if (gridCheckbox.checked) {
			GPU.Lines(normal, grid.length, grid.positions, grid.colors)
		}
		switch (mode.value) {
		case 'points':
			GPU.Cloud(increase, rad, length, cloud, c)
			break
		case 'connections':
			if (nearest == undefined) {
				mode.value = 'points'
				GPU.Cloud(increase, rad, length, cloud, c)
				alert('connections not calculated')
			} else {
				GPU.KNearest(increase, cloud, c, nearest, k, length)
			}
			break
		case 'polygons':
			if (nearest == undefined) {
				mode.value = 'points'
				GPU.Cloud(increase, rad, length, cloud, c)
				alert('connections not calculated')
			} else {
				GPU.Triangulate(increase, cloud, c, nearest, k, length)
			}
			break
		}
		GPU.FinishRender()
		if (keys['KeyP'] != undefined) {
			const a = document.createElement('a')
			a.href = canvas.toDataURL('image/png')
			const name = prompt('download name')
			if (name != null) {
				if (name.length == 0) {
					a.download = 'cloud.png'
				} else  {
					a.download = name
				}
				a.click()
			}
			delete keys['KeyP']
		}
		last = time
	}
}
