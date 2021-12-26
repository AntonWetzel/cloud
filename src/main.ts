import * as GPU from './gpu/header.js'

import * as Loader from './loader/header.js'

declare global {
	interface Window {
		CreateForm: (name: string) => void
		ShowText: (text: string) => void
		StartCompute: (name: string) => void
	}
}

const formIdOffset = 1
const computeIdOffset = 33

type forms = 'sphere' | 'cube' | 'map' | 'bunny' | 'statue'
async function main(socket: WebSocket) {

	const queue: (forms | 'nearestIter')[] = []
	const extraQueue: number[] = []

	socket.onmessage = async (ev: MessageEvent<string | Blob>) => {
		if (typeof ev.data  == 'string') {
			console.log('got: ' + ev.data)
		} else {
			const data = await ev.data.arrayBuffer()
			if (data.byteLength == 0) {
				alert('socket data transfer error')
			}
			switch (queue.shift()) {
			case 'sphere':
			case 'cube':
			case 'map':
			case 'bunny':
			case 'statue':
				length = extraQueue.shift()
				cloud.destroy()
				colors.destroy()
				colors = Loader.Color(length)
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
				cloud = GPU.CreateBuffer(new Float32Array(data), GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE)
				mode.value = 'points'
				color.value = 'color'
				break
			case 'nearestIter':
				const nData = new Uint32Array(data)
				if (nearest != undefined) {
					nearest.destroy()
				}
				nearest = GPU.CreateBuffer(nData, GPUBufferUsage.STORAGE)
				k = extraQueue.shift()
				mode.value = 'connections'
			}			
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
	const grid = Loader.Grid(10)

	let k = 0
	let length = 0
	
	let cloud = GPU.CreateEmptyBuffer(0, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE)
	let colors = GPU.CreateEmptyBuffer(0, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE)
	let nearest : GPUBuffer = undefined
	let normals: GPUBuffer = undefined
	let curvature: GPUBuffer = undefined
	
	window.CreateForm =  (name: forms) => {
		const sizeDiv = document.getElementById('size') as HTMLInputElement

		const data = new ArrayBuffer(8)
		let id: number
		let size = parseInt(sizeDiv.value)
		switch (name) {
		case 'sphere': id = formIdOffset + 0; break
		case 'cube': id = formIdOffset + 1; break
		case 'map': id = formIdOffset + 2; break
		case 'bunny': id = formIdOffset + 3; size = 397; break //todo better
		case 'statue': id = formIdOffset + 4; size = 32087; break
		}
		new Int32Array(data)[0] = id
		new Int32Array(data)[1] = size
		socket.send(data)
		queue.push(name)
		extraQueue.push(size)
		/*
		case 'cube':
			cloud = Loader.Cube(length)
			valid = true
			break
		case 'map':
			[cloud, length] = Loader.Map(length)
			valid = true
			break
		case 'bunny':
		case 'statue':
			let url = ''
			switch (name) {
			case 'bunny':
				url = 'https://raw.githubusercontent.com/PointCloudLibrary/pcl/master/test/bunny.pcd'
				break
			case 'statue':
				url = 'https://raw.githubusercontent.com/PointCloudLibrary/pcl/master/test/rops_cloud.pcd'
				break 
			}
			const response = await fetch(url)
			const content = await (await response.blob()).arrayBuffer()
			const result = Loader.PCD(content)
			if (result != undefined) {
				[cloud, length] = result
				valid = true
			} else {
				alert('pcd error')
			}
			break		
		case 'upload':
			const input = document.createElement('input')
			input.type = 'file'
			input.accept = '.pcd'
			input.multiple = false
			input.onchange = async () => {
				if (input.files.length == 0) {
					alert('please select file')
					return
				}
				const file = input.files[0]
				const result = Loader.PCD(await file.arrayBuffer())
				if (result != undefined) {
					[cloud, length] = result
					valid = true
				} else {
					alert('pcd error')
				}
			}
			input.click()
		}
		*/
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

	window.StartCompute = async (name: string) => {
		switch (name) {
		case 'kNearestIter':
			const test = document.getElementById('k') as HTMLInputElement
			const t_k = parseInt(test.value)
			const data = new ArrayBuffer(8)
			new Int32Array(data)[0] = computeIdOffset + 0
			new Int32Array(data)[1] = t_k
			socket.send(data)
			queue.push('nearestIter')
			extraQueue.push(t_k)
			break
			//case 'kNearestIter':
		case 'kNearestList':
		case 'kNearestListSorted':
		case 'kNearestIterSorted':
			if (nearest != undefined) {
				nearest.destroy()
			}
			const kDiv = document.getElementById('k') as HTMLInputElement
			k = parseInt(kDiv.value)
			nearest = GPU.CreateEmptyBuffer(length * k * 4, GPUBufferUsage.STORAGE)
			switch (name) {
			case 'kNearestList':
			//case 'kNearestIter':
				GPU.Compute(name, length, [[k], []], [cloud,nearest])
				break
			case 'kNearestListSorted':
			case 'kNearestIterSorted':
				await GPU.Sort(cloud, length)
				GPU.Compute(name, length, [[k], []], [cloud, nearest])
				break
			}
			mode.value = 'connections'
			break
		case 'triangulateAll':
			k = GPU.TriangulateK
			if (nearest != undefined) {
				nearest.destroy()
			}
			nearest = GPU.CreateEmptyBuffer(length * k * 4, GPUBufferUsage.STORAGE)
			GPU.Compute('triangulateAll', length, [[], []], [cloud, nearest])
			mode.value = 'connections'
			break
		case 'triangulateNear':
			if (nearest == undefined) {
				alert('please calculate nearest first')
			} else {
				const copy = GPU.CreateEmptyBuffer(length * GPU.TriangulateK * 4, GPUBufferUsage.STORAGE)
				GPU.Compute('triangulateNearest', length, [[k], []], [cloud, nearest, copy])
				nearest.destroy()
				nearest = copy
				k = GPU.TriangulateK
				mode.value = 'connections'
				break
			}
			break
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
