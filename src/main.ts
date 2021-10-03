import * as GPU from './gpu/gpu.js'
import * as Lines from './gpu/lines.js'
import { Position } from './gpu/position.js'
import { Matrix } from './gpu/math.js'
import { CreateSphere } from './loader/sphere.js'
import { Camera } from './gpu/camera.js'
import { CreateCube } from './loader/cube.js'
import * as Cloud from './gpu/cloud.js'
import * as KNearest from './gpu/kNearest.js'
import { CreateColors } from './loader/color.js'
import { CreateGrid } from './loader/grid.js'

document.body.onload = async () => {
	const display = document.getElementById('display') as HTMLDivElement
	const canvas = await GPU.Setup(display.clientWidth, display.clientHeight)
	display.append(canvas)

	const cam = new Camera(Math.PI / 4)
	cam.Translate(0, 5, 30)

	const increase = new Position()
	increase.Scale(5, 5, 5)
	const normal = new Position()

	const length = 100_000
	const cloud = CreateCube(length)
	const colors = CreateColors(length)
	//const cloud = (await CreateSphere(100_000, 0.02)).node

	const grid = CreateGrid(10)
	//scene.children.push(grid)

	display.onwheel = (ev) => {
		let fov = cam.fieldOfView * (1 + ev.deltaY / 1000)
		if (fov < Math.PI / 10) {
			fov = Math.PI / 10
		}
		if (fov > (Math.PI * 9) / 10) {
			fov = (Math.PI * 9) / 10
		}
		cam.fieldOfView = fov
	}

	document.body.onresize = () => {
		GPU.Resize(display.clientWidth, display.clientHeight)
		cam.UpdateSize()
	}
	let lights = 0

	const key: { [key: string]: true | undefined } = {}
	let nearest: undefined | { buffer: GPUBuffer; k: number } = undefined
	document.body.onkeydown = async (ev) => {
		key[ev.code] = true
		switch (ev.code) {
			case 'KeyL':
				lights = (lights + 1) % 4
				break
			case 'KeyH':
				makeHint(
					'Left mouse button + move: rotate camera\n' +
						'Middle mouse button + move: rotate first light\n' +
						'Mouse wheel: change field of view (zoom)\n' +
						'Key QWER: move camera\n' +
						'Key L: switch active lights',
				)
				break
			case 'KeyX':
				nearest = await KNearest.Compute(10, cloud, length)
				break
			case 'KeyC':
				//cloud.importance(1000)
				break
			case 'KeyV':
				//cloud.smooth(0.2)
				break
		}
	}

	document.body.onkeyup = (ev) => {
		key[ev.code] = undefined
	}

	makeHint("press 'Key H' for help")

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
		const dist = delta / 50
		if (key['KeyW'] != undefined) {
			cam.Translate(0, 0, -dist)
		}
		if (key['KeyD'] != undefined) {
			cam.Translate(dist, 0, 0)
		}
		if (key['KeyS'] != undefined) {
			cam.Translate(0, 0, dist)
		}
		if (key['KeyA'] != undefined) {
			cam.Translate(-dist, 0, 0)
		}
		if (key['KeyF'] != undefined) {
			cam.Translate(0, -dist, 0)
		}
		if (key['KeyR'] != undefined) {
			cam.Translate(0, dist, 0)
		}
		GPU.StartRender(cam)
		await Cloud.Render(increase, 0.02, length, cloud, colors)
		await Lines.Render(normal, grid.length, grid.positions, grid.colors)
		if (nearest != undefined) {
			await KNearest.Render(increase, cloud, colors, nearest.buffer, nearest.k, length)
		}
		GPU.FinishRender()
		last = time
		requestAnimationFrame(Draw)
	}
	requestAnimationFrame(Draw)
}

function makeHint(text: string): void {
	const hint = document.createElement('div')
	hint.textContent = text
	hint.className = 'hint'
	setTimeout(() => {
		hint.remove()
	}, 5000)
	document.body.append(hint)
}
