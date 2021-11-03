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
import * as EdgeOld from './gpu/edgeOld.js'
import { CreateColors } from './loader/color.js'
import { CreateGrid } from './loader/grid.js'
import { CreateSphere } from './loader/sphere.js'
import { CreatePCD } from './loader/pcd.js'
//import './test.js'

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
			'Only tested with <a href="https://www.google.com/chrome">Google Chrome</a>'
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

	let k = 64
	let kOld = k
	let length = 50_000
	let lengthOld = length
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
		keys[ev.code] = true
		switch (ev.code) {
			case 'KeyH':
				makeHint(
					'Left mouse button: rotate camera',
					'Mouse wheel: change cloud size',
					'Mouse wheel + Control: change field of view',
					'QWER: move camera',
					'1: change cloud form',
					'1 + Control: change cloud size for sphere and cube',
					'2: compute k nearest points',
					'2 + Control: change k',
					'3: compute triangulation',
					'4: approximate normal (best with triangulation)',
					'4 + Control: approximate normal (best with k-nearest)',
					'Space: render connections with polygons',
					'0: open notes (german)',
				)
				break
			case 'Digit1':
				if (ev.ctrlKey) {
					const number = getUserNumber('input new cloud size')
					if (number != undefined) {
						lengthOld = number
						form = 'test'
					} else {
						break
					}
				}
				cloud.destroy()
				colors.destroy()
				switch (form) {
					case 'sphere':
						length = lengthOld
						cloud = CreateCube(length)
						form = 'cube'
						break
					case 'cube': {
						const response = await fetch('../src/loader/pcd/bunny.pcd')
						const content = await (await response.blob()).arrayBuffer()
						const result = CreatePCD(content)
						if (result != undefined) {
							// eslint-disable-next-line prettier/prettier
							[cloud, length] = result
						} else {
							alert('pcd error')
						}
						form = 'bunny'
						break
					}
					case 'bunny': {
						const response = await fetch('../src/loader/pcd/rops_cloud.pcd')
						const content = await (await response.blob()).arrayBuffer()
						const result = CreatePCD(content)
						if (result != undefined) {
							// eslint-disable-next-line prettier/prettier
							[cloud, length] = result
						} else {
							alert('pcd error')
						}
						form = 'test'
						break
					}
					case 'test':
						length = lengthOld
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
			case 'Digit2':
				if (ev.ctrlKey) {
					const number = getUserNumber('input new k for nearest points')
					if (number != undefined) {
						kOld = number
					}
				}
				if (nearest != undefined) {
					nearest.destroy()
				}
				k = kOld
				nearest = await KNearest.Compute(k, cloud, length)
				break
			case 'Digit3':
				if (nearest != undefined) {
					nearest.destroy()
				}
				nearest = await Triangulate.Compute(cloud, length)
				k = Triangulate.K
				break
			case 'Digit4':
				if (nearest == undefined) {
					alert('please calculate the connections first')
					break
				}
				if (ev.ctrlKey == false) {
					await Edge.Compute(cloud, nearest, colors, k, length)
				} else {
					await EdgeOld.Compute(cloud, nearest, colors, k, length)
				}
				break
			case 'Digit5':
				if (nearest == undefined) {
					alert('please calculate the connections first')
					break
				}
				await Filter.Compute(nearest, k, length)
				break
			case 'Digit0': {
				window.open('notes.html', '_blank')
			}
		}
	}

	document.body.onkeyup = (ev) => {
		delete keys[ev.code]
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

		move('KeyW', 0, 0, -1)
		move('KeyD', 1, 0, 0)
		move('KeyS', 0, 0, 1)
		move('KeyA', -1, 0, 0)
		move('KeyF', 0, -1, 0)
		move('KeyR', 0, 1, 0)

		GPU.StartRender(cam)
		await Lines.Render(normal, grid.length, grid.positions, grid.colors)
		if (nearest != undefined) {
			if (keys['Space'] == undefined) {
				await Cloud.Render(increase, 0.015, length, cloud, colors)
				await KNearest.Render(increase, cloud, colors, nearest, k, length)
			} else {
				await Triangulate.Render(increase, cloud, colors, nearest, k, length)
			}
		} else {
			await Cloud.Render(increase, 0.015, length, cloud, colors)
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
