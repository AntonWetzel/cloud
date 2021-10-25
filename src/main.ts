import * as GPU from './gpu/gpu.js'
import * as Lines from './gpu/lines.js'
import { Position } from './gpu/position.js'
import { Camera } from './gpu/camera.js'
import { CreateCube } from './loader/cube.js'
import * as Cloud from './gpu/cloud.js'
import * as KNearest from './gpu/kNearest.js'
import * as Triangulate from './gpu/triangulate.js'
import * as Filter from './gpu/filter.js'
import * as Edge from './gpu/edge.js'
import { CreateColors } from './loader/color.js'
import { CreateGrid } from './loader/grid.js'
import { CreateSphere } from './loader/sphere.js'
import { CreateBunny } from './loader/bunny.js'
import { CreatePCD } from './loader/pcd.js'

document.body.onload = async () => {
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
			'1. Download and install <a href="https://www.google.com/chrome/canary/">Chrome Canary</a><br>' +
			'2. Open <tt>"chrome://flags/#enable-unsafe-webgpu"</tt><br>' +
			'3. Enable <tt>"Unsafe WebGPU"</tt><br>' +
			'4. Relaunch the browser<br>' +
			'5. Reload the website'
		error.append(botLine)
		document.body.append(error)
		return
	}
	display.append(canvas)

	const cam = new Camera(Math.PI / 4)
	cam.Translate(0, 5, 30)

	const increase = new Position()
	increase.Scale(5, 5, 5)
	const normal = new Position()

	let k = 32
	const default_length = 50_000
	let length = default_length
	let form: 'cube' | 'sphere' | 'bunny' | 'test' = 'sphere'
	let cloud = CreateSphere(length)
	let colors = CreateColors(length)

	const grid = CreateGrid(10)

	display.onwheel = (ev) => {
		const scale = 1 + ev.deltaY / 1000
		if (ev.ctrlKey == false) {
			increase.Scale(scale, scale, scale)
		} else {
			let fov = cam.fieldOfView * scale
			if (fov < Math.PI / 10) {
				fov = Math.PI / 10
			}
			if (fov > (Math.PI * 9) / 10) {
				fov = (Math.PI * 9) / 10
			}
			cam.fieldOfView = fov
		}
		ev.preventDefault()
		ev.stopImmediatePropagation()
	}

	document.body.onresize = () => {
		GPU.Resize(display.clientWidth, display.clientHeight)
		cam.UpdateSize()
	}

	const keys: { [key: string]: true | undefined } = {}
	let nearest: undefined | GPUBuffer = undefined
	document.body.onkeydown = async (ev) => {
		keys[ev.key] = true
		switch (ev.key) {
			case 'h':
				makeHint(
					'Left mouse button: rotate camera',
					'Mouse wheel: change cloud size',
					'Mouse wheel + Control: change field of view',
					'QWER: move camera',
					'Y: change cloud form',
					'Y + Control: change cloud size',
					'X: compute k nearest points',
					'X + Control: change k',
					'C: compute triangulation',
					'V: approximate local "edginess" (threshhold missing)',
				)
				break
			case 'y':
				if (ev.ctrlKey) {
					const number = getUserNumber('input new cloud size')
					if (number != undefined) {
						length = number
					}
				}
				cloud.destroy()
				colors.destroy()
				switch (form) {
					case 'sphere':
						length = default_length
						cloud = CreateCube(length)
						form = 'cube'
						break
					case 'cube':
						// eslint-disable-next-line prettier/prettier
						[cloud, length] = CreateBunny()
						form = 'bunny'
						break
					case 'bunny': {
						const response = await fetch('../src/loader/pcd/rops_cloud.pcd')
						const content = await (await response.blob()).arrayBuffer()
						const result = CreatePCD(content)
						if (result != undefined) {
							// eslint-disable-next-line prettier/prettier
							[cloud, length] = result
						} else {
							alert('form error')
						}
						form = 'test'
						break
					}
					case 'test':
						length = default_length
						cloud = CreateSphere(length)
						form = 'sphere'
						break
				}
				colors = CreateColors(length)
				if (nearest != undefined) {
					nearest.destroy()
					nearest = undefined
				}
				break
			case 'x':
				if (ev.ctrlKey == false) {
					if (nearest != undefined) {
						nearest.destroy()
					}
					nearest = await KNearest.Compute(k, cloud, length)
				} else {
					const number = getUserNumber('input new k for nearest points')
					if (number != undefined) {
						if (k > 64) {
							console.log('max k is 32')
							k = 64
						}
						k = number
					}
				}
				break
			case 'c':
				if (nearest != undefined) {
					nearest.destroy()
				}
				nearest = await Triangulate.Compute(cloud, length)
				k = Triangulate.K
				break
			case 'v':
				if (nearest == undefined) {
					alert('please calculate the connections first')
					break
				}
				await Edge.Compute(cloud, nearest, colors, k, length)
				break
		}
	}

	document.body.onkeyup = (ev) => {
		delete keys[ev.key]
	}
	makeHint("press 'H' for help")

	display.onmousemove = (ev) => {
		if ((ev.buttons & 1) != 0) {
			cam.RotateX(-ev.movementY / 200)
			cam.RotateGlobalY(-ev.movementX / 200)
		}
	}

	let last: number = undefined as any
	requestAnimationFrame((time: number) => {
		last = time
	})

	async function Draw(time: number) {
		const delta = time - last
		if (delta > 25) {
			console.log(delta)
		}
		const dist = delta / 50
		const move = (key: string, x: number, y: number, z: number) => {
			if (keys[key] != undefined) {
				cam.Translate(x * dist, y * dist, z * dist)
			}
		}

		move('w', 0, 0, -1)
		move('d', 1, 0, 0)
		move('s', 0, 0, 1)
		move('a', -1, 0, 0)
		move('f', 0, -1, 0)
		move('r', 0, 1, 0)

		GPU.StartRender(cam)
		await Cloud.Render(increase, 0.015, length, cloud, colors)
		await Lines.Render(normal, grid.length, grid.positions, grid.colors)
		if (nearest != undefined) {
			await KNearest.Render(increase, cloud, colors, nearest, k, length)
		}
		GPU.FinishRender()
		last = time
		requestAnimationFrame(Draw)
	}
	requestAnimationFrame(Draw)
}

function makeHint(...text: string[]): void {
	const hint = document.createElement('div')
	let combined = ''
	for (let i = 0; i < text.length; i++) {
		combined += text[i] + '\n'
	}
	hint.textContent = combined
	hint.className = 'hint'
	document.body.append(hint)
	setTimeout(() => {
		hint.remove()
	}, 5000)
}

function getUserNumber(text: string): number | undefined {
	const str = prompt(text)
	if (str == null) {
		return undefined
	}
	const x = parseInt(str)
	if (isNaN(x)) {
		return undefined
	}
	return x
}
