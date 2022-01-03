import * as GPU from './gpu/header.js'

import * as Color from './color.js'
import * as Grid from './grid.js'

declare global {
	interface Window {
		CreateForm: (name: string) => void
		ShowText: (text: string) => void
		StartCompute: (name: string) => void
	}
}

const formIdOffset = 1
const computeIdOffset = 33
const renderFlag = GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE
const computeFlag = GPUBufferUsage.STORAGE


async function main(socket: WebSocket) {

	socket.onmessage = async (ev: MessageEvent<Blob>) => {
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
		}
	}

	const mode = document.getElementById('mode') as HTMLSelectElement
	const color = document.getElementById('color') as HTMLSelectElement
	const gridCheckbox = document.getElementById('grid') as HTMLInputElement

	const display = document.getElementById('display') as HTMLDivElement
	const canvas = await GPU.Setup(display.clientWidth, display.clientHeight)
	if (canvas == undefined) {
		display.remove()
		const error = document.createElement('div')
		error.className = 'error'
		const topLine = document.createElement('div')
		topLine.className = 'large'
		topLine.innerHTML = 'WebGPU not available'
		error.append(topLine)
		const botLine = document.createElement('div')
		botLine.className = 'normal'
		botLine.innerHTML =
			'Only tested with <a href="https://www.google.com/chrome">Google Chrome</a>'
		error.append(botLine)
		document.body.append(error)
		return
	}

	display.append(canvas)

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

	window.CreateForm =  (name: string) => {
		const sizeDiv = document.getElementById('size') as HTMLInputElement

		const data = new ArrayBuffer(8)
		let id: number
		const size = parseInt(sizeDiv.value)
		switch (name) {
		case 'sphere': id = formIdOffset + 0; break
		case 'cube': id = formIdOffset + 1; break
		case 'map': id = formIdOffset + 2; break
		case 'bunny': id = formIdOffset + 3; break
		case 'bunnyBig': id = formIdOffset + 4; break 
		case 'statue': id = formIdOffset + 5; break
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
	let data: ArrayBuffer
	window.StartCompute = (name: string) => {
		switch (name) {
		case 'kNearestIter':
		case 'kNearestList':
		case 'kNearestIterSorted':
		case 'kNearestListSorted':
			const test = document.getElementById('k') as HTMLInputElement
			const t_k = parseInt(test.value)
			data = new ArrayBuffer(8)
			switch (name) {
			case 'kNearestIter': new Int32Array(data)[0] = computeIdOffset + 0; break
			case 'kNearestList':new Int32Array(data)[0] = computeIdOffset + 1; break
			case 'kNearestIterSorted':new Int32Array(data)[0] = computeIdOffset + 2; break
			case 'kNearestListSorted':new Int32Array(data)[0] = computeIdOffset + 3; break
			}
			new Int32Array(data)[1] = t_k
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
			new Float32Array(data)[1] = parseFloat((document.getElementById('noise') as HTMLInputElement).value)
			socket.send(data)
			break
		case 'frequenz':
			data = new ArrayBuffer(4)
			new Int32Array(data)[0] = computeIdOffset + 7
			socket.send(data)
			break
		case 'highFrequenz':
			data = new ArrayBuffer(4)
			new Int32Array(data)[0] = computeIdOffset + 8
			socket.send(data)
			break
		/*
		case 'cleanDang':
		case 'cleanLong':
			if (nearest == undefined) {
				alert('please calculate the connections first')
				break
			}
			const newNearest = GPU.CreateEmptyBuffer(length * k * 4, GPUBufferUsage.STORAGE)
			switch (name) {
			case 'cleanDang':
				GPU.Compute('cleanDang', length, [[k], []], [nearest, newNearest])
				break
			case 'cleanLong':
				GPU.Compute('cleanLong', length, [[k], []], [cloud, nearest, newNearest])
				break
			}
			nearest.destroy()
			nearest = newNearest
			mode.value = 'connections'
			break
		case 'normalPlane':
		case 'normalTriang':
			if (nearest == undefined) {
				alert('please calculate the connections first')
				break
			}
			if (normals == undefined) {
				normals = GPU.CreateEmptyBuffer(length * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE)
			}
			switch (name) {
			case 'normalPlane':
				GPU.Compute('normalLinear', length, [[k], []], [cloud, nearest, normals])
				break
			case 'normalTriang':
				GPU.Compute('normalTriang', length, [[k], []], [cloud, nearest, normals])
				break
			}
			color.value = 'normal'
			break
		case 'curvaturePoints':
		case 'curvatureNormal':
			if (normals == undefined) {
				alert('please calculate the normals first')
				break
			}
			if (curvature == undefined) {
				curvature = GPU.CreateEmptyBuffer(length * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC)
			}
			switch (name) {
			case 'curvatureNormal':
				GPU.Compute('curvatureNormal', length, [[k], []], [cloud, nearest, normals, curvature])
				break
			case 'curvaturePoints':
				GPU.Compute('curvaturePoints', length, [[k], []], [cloud, nearest, normals, curvature])
				break
			}
			color.value = 'curve'
			break
		case 'filterCurve':
		case 'filterAnomaly':
			if (curvature == undefined) {
				alert('please calculate curvature first')
				break
			}
			const tDiv = document.getElementById('threshhold') as HTMLInputElement
			const t = parseFloat(tDiv.value)
			const newCloud = GPU.CreateEmptyBuffer(length * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE)
			const newColor = GPU.CreateEmptyBuffer(length * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE)
			let com: 'reduceLow' | 'reduceAnomaly'
			switch (name) {
			case 'filterCurve':
				com = 'reduceLow'
				break
			case 'filterAnomaly':
				com = 'reduceAnomaly'
				break
			}
			const result = GPU.Compute(com, length, [[0], [t]], [cloud, colors, curvature, newCloud, newColor], true)
			length = new Uint32Array(await GPU.ReadBuffer(result, 3*4))[1]
			console.log('length:', length)
			result.destroy()
			cloud.destroy()
			colors.destroy()
			nearest.destroy()
			normals.destroy()
			curvature.destroy()
			cloud = newCloud
			colors = newColor
			nearest = undefined
			normals = undefined
			curvature= undefined
			color.value = 'color'
			mode.value = 'points'
			break
		case 'noise':
			if (nearest == undefined) {
				alert('please calculate nearest first')
				break
			}
			const copy = GPU.CreateEmptyBuffer(length * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE)
			GPU.Compute('noise', length, [[k], []], [cloud, nearest, copy])
			cloud.destroy()
			cloud = copy
			break
		case 'ripple':
			if (curvature == undefined) {
				alert('please calculate the curvature first')
				break
			}
			const derivative =  GPU.CreateEmptyBuffer(length * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE)
			GPU.Compute('ripple', length, [[k], [5]], [nearest, curvature, derivative])
			curvature.destroy()
			curvature = derivative
			break
		case 'peek':
			if (curvature == undefined) {
				alert('please calculate the curvature first')
				break
			}
			const newCurve =  GPU.CreateEmptyBuffer(length * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE)
			GPU.Compute('peek', length, [[k], []], [nearest, curvature, newCurve])
			curvature.destroy()
			curvature = newCurve
			break
		case 'threshhold':
			if (curvature == undefined) {
				alert('please calculate the curvature first')
				break
			}
			const threshhold = GPU.CreateEmptyBuffer(length * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE)
			GPU.Compute('threshhold', length, [[k], [0.2]], [curvature, threshhold])
			curvature.destroy()
			curvature = threshhold
			break
		*/
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

	const keys: { [key: string]: true | undefined } = {}
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
	const radDiv = document.getElementById('radius') as HTMLInputElement
	while(run) {
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
		const rad = parseFloat( radDiv.value)
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
		last = time
		if (keys['KeyP'] != undefined) {
			const name = prompt('Please enter file name', 'cloud')
			if (name != null && name.length > 0) {
				const link = document.createElement('a')
				link.download =  name + '.png'
				link.href = canvas.toDataURL()
				link.click()
			}
			delete keys['KeyP']
		}
	}
}


document.body.onload = () => {

	const socket = new WebSocket('ws://' + location.host + '/ws')
	socket.onopen = async () => {
		await main(socket)
	}
	socket.onerror = () => {
		alert('socket connection error')
	}
}
