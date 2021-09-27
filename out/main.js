import * as GPU from './gpu/gpu.js';
import { Lines } from './gpu/lines.js';
import { CreateSphere } from './loader/sphere.js';
import { Camera } from './gpu/camera.js';
import { Empty } from './gpu/empty.js';
import { CreateCube } from './loader/cube.js';
import { Light } from './gpu/light.js';
document.body.onload = async () => {
    const display = document.getElementById('display');
    const canvas = await GPU.Setup(display.clientWidth, display.clientHeight, 0.1);
    display.append(canvas);
    const scene = new Empty();
    const cam = new Camera(Math.PI / 4);
    cam.Translate(0, 5, 30);
    const sphere = (await CreateSphere(40, 40, 1, 1, 1)).node;
    sphere.Translate(0, 0, 5);
    scene.children.push(sphere);
    const wall = (await CreateCube(1, 1, 1)).node;
    wall.Scale(20, 20, 1);
    wall.Translate(0, 0, -30);
    scene.children.push(wall);
    const cube = (await CreateCube(1, 1, 1)).node;
    cube.Translate(0, 2, -5);
    scene.children.push(cube);
    const light = new Light(50);
    //light.Rotate(-Math.PI / 10)
    light.Translate(3, 0, 10);
    const light2 = new Light(50);
    //light2.Rotate(Math.PI / 10)
    //light2.Translate(-3, 0, 10)
    const grid = Lines.Grid(10);
    scene.children.push(grid);
    display.onwheel = (ev) => {
        let fov = cam.fieldOfView * (1 + ev.deltaY / 1000);
        if (fov < Math.PI / 10) {
            fov = Math.PI / 10;
        }
        if (fov > (Math.PI * 9) / 10) {
            fov = (Math.PI * 9) / 10;
        }
        cam.fieldOfView = fov;
    };
    document.body.onresize = () => {
        GPU.Resize(display.clientWidth, display.clientHeight);
        cam.UpdateSize();
    };
    let mode = 0;
    let lights = 1;
    const key = {};
    document.body.onkeydown = (ev) => {
        key[ev.code] = true;
        switch (ev.code) {
            case 'KeyL':
                mode = (mode + 1) % 3;
                break;
            case 'KeyX':
                lights = (lights + 1) % 4;
                break;
            case 'KeyH':
                makeHint('Left mouse button + move: rotate camera\n' +
                    'Middle mouse button + move: rotate first light\n' +
                    'Mouse wheel: change field of view (zoom)\n' +
                    'Key QWER: move camera\n' +
                    'Key L: switch between camera and light maps\n' +
                    'Key X: switch visible cameras');
                break;
        }
    };
    document.body.onkeyup = (ev) => {
        key[ev.code] = undefined;
    };
    makeHint("press 'Key H' for help");
    display.onmousemove = (ev) => {
        if ((ev.buttons & 1) != 0) {
            cam.RotateX(-ev.movementY / 200);
            cam.RotateGlobalY(-ev.movementX / 200);
        }
        else if ((ev.buttons & 4) != 0) {
            light.RotateX(ev.movementY / 200);
            light.RotateGlobalY(ev.movementX / 200);
        }
    };
    cube.RotateXLocal(Math.PI / 4);
    function Draw() {
        //cube.Rotate(0.01)
        //sphere.Rotate(-0.01)
        sphere.RotateY(0.01);
        cube.RotateYLocal(0.1);
        //cube.RotateLocal(0.01)
        if (key['KeyW'] != undefined) {
            cam.Translate(0, 0, -0.1);
        }
        if (key['KeyD'] != undefined) {
            cam.Translate(0.1, 0, 0);
        }
        if (key['KeyS'] != undefined) {
            cam.Translate(0, 0, 0.1);
        }
        if (key['KeyA'] != undefined) {
            cam.Translate(-0.1, 0, 0);
        }
        const l = [];
        switch (mode) {
            case 0:
                if (lights % 2 != 0) {
                    l.push(light);
                }
                if ((lights >> 1) % 2 != 0) {
                    l.push(light2);
                }
                cam.Render(scene, l);
                break;
            case 1:
                light.Render(scene);
                break;
            case 2:
                light2.Render(scene);
                break;
        }
        requestAnimationFrame(Draw);
    }
    requestAnimationFrame(Draw);
};
function makeHint(text) {
    const hint = document.createElement('div');
    hint.textContent = text;
    hint.className = 'hint';
    setTimeout(() => {
        hint.remove();
    }, 5000);
    document.body.append(hint);
}
