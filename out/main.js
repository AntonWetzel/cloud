import * as GPU from './gpu/gpu.js';
import * as Lines from './gpu/lines.js';
import { Position } from './gpu/position.js';
import { CreateSphere } from './loader/sphere.js';
import { Camera } from './gpu/camera.js';
import { CreateCube } from './loader/cube.js';
import * as Cloud from './gpu/cloud.js';
import * as KNearest from './gpu/kNearest.js';
import { CreateColors } from './loader/color.js';
import { CreateGrid } from './loader/grid.js';
document.body.onload = async () => {
    const display = document.getElementById('display');
    const canvas = await GPU.Setup(display.clientWidth, display.clientHeight);
    if (canvas == undefined) {
        display.remove();
        const error = document.createElement('div');
        error.className = 'error';
        const topLine = document.createElement('div');
        topLine.className = 'large';
        topLine.innerHTML = 'WebGPU not available';
        error.append(topLine);
        const botLine = document.createElement('div');
        botLine.className = 'normal';
        botLine.innerHTML =
            'Use Chrome Canary and enable WebGPU at chrome://flags/#enable-unsafe-webgpu';
        error.append(botLine);
        document.body.append(error);
        return;
    }
    display.append(canvas);
    const cam = new Camera(Math.PI / 4);
    cam.Translate(0, 5, 30);
    const increase = new Position();
    increase.Scale(5, 5, 5);
    const normal = new Position();
    let length = 100_000;
    let form = 'sphere';
    let cloud = CreateSphere(length);
    let colors = CreateColors(length);
    const grid = CreateGrid(10);
    display.onwheel = (ev) => {
        const scale = 1 + ev.deltaY / 1000;
        if (ev.ctrlKey == false) {
            increase.Scale(scale, scale, scale);
        }
        else {
            let fov = cam.fieldOfView * scale;
            if (fov < Math.PI / 10) {
                fov = Math.PI / 10;
            }
            if (fov > (Math.PI * 9) / 10) {
                fov = (Math.PI * 9) / 10;
            }
            cam.fieldOfView = fov;
        }
        ev.preventDefault();
        ev.stopImmediatePropagation();
    };
    document.body.onresize = () => {
        GPU.Resize(display.clientWidth, display.clientHeight);
        cam.UpdateSize();
    };
    let lights = 0;
    let k = 10;
    const key = {};
    let nearest = undefined;
    document.body.onkeydown = async (ev) => {
        key[ev.key] = true;
        switch (ev.key) {
            case 'l':
                lights = (lights + 1) % 4;
                break;
            case 'h':
                makeHint('Left mouse button: rotate camera', 'Mouse wheel: change cloud size', 'Mouse wheel + Control: change field of view', 'QWER: move camera', 'Y: change cloud form', 'Y + Control: change cloud size', 'X: compute k nearest points', 'X + Control: change k');
                break;
            case 'y':
                if (ev.ctrlKey) {
                    const number = getUserNumber('input new cloud size');
                    if (number != undefined) {
                        length = number;
                    }
                    form = form == 'sphere' ? 'cube' : 'sphere';
                }
                cloud.destroy();
                colors.destroy();
                if (form == 'sphere') {
                    cloud = CreateCube(length);
                    form = 'cube';
                }
                else {
                    cloud = CreateSphere(length);
                    form = 'sphere';
                }
                colors = CreateColors(length);
                if (nearest != undefined) {
                    nearest.buffer.destroy();
                    nearest = undefined;
                }
                break;
            case 'x':
                if (ev.ctrlKey == false) {
                    if (nearest != undefined) {
                        nearest.buffer.destroy();
                    }
                    nearest = await KNearest.Compute(k, cloud, length);
                }
                else {
                    const number = getUserNumber('input new k for nearest points');
                    if (number != undefined) {
                        if (k > 32) {
                            console.log('max k is 32');
                            k = 32;
                        }
                        k = number;
                    }
                }
                break;
        }
    };
    document.body.onkeyup = (ev) => {
        delete key[ev.key];
    };
    makeHint("press 'H' for help");
    display.onmousemove = (ev) => {
        if ((ev.buttons & 1) != 0) {
            cam.RotateX(-ev.movementY / 200);
            cam.RotateGlobalY(-ev.movementX / 200);
        }
    };
    let last = undefined;
    requestAnimationFrame((time) => {
        last = time;
    });
    async function Draw(time) {
        const delta = time - last;
        const dist = delta / 50;
        if (key['w'] != undefined) {
            cam.Translate(0, 0, -dist);
        }
        if (key['d'] != undefined) {
            cam.Translate(dist, 0, 0);
        }
        if (key['s'] != undefined) {
            cam.Translate(0, 0, dist);
        }
        if (key['a'] != undefined) {
            cam.Translate(-dist, 0, 0);
        }
        if (key['f'] != undefined) {
            cam.Translate(0, -dist, 0);
        }
        if (key['r'] != undefined) {
            cam.Translate(0, dist, 0);
        }
        GPU.StartRender(cam);
        await Cloud.Render(increase, 0.02, length, cloud, colors);
        await Lines.Render(normal, grid.length, grid.positions, grid.colors);
        if (nearest != undefined) {
            await KNearest.Render(increase, cloud, colors, nearest.buffer, nearest.k, length);
        }
        GPU.FinishRender();
        last = time;
        requestAnimationFrame(Draw);
    }
    requestAnimationFrame(Draw);
};
function makeHint(...text) {
    const hint = document.createElement('div');
    let combined = '';
    for (let i = 0; i < text.length; i++) {
        combined += text[i] + '\n';
    }
    hint.textContent = combined;
    hint.className = 'hint';
    setTimeout(() => {
        hint.remove();
    }, 5000);
    document.body.append(hint);
}
function getUserNumber(text) {
    const str = prompt(text);
    if (str == null) {
        return undefined;
    }
    const number = parseInt(str);
    if (isNaN(number)) {
        return undefined;
    }
    return number;
}
