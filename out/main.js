import * as GPU from './gpu/header.js';
import * as Loader from './loader/header.js';
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
            'Only tested with <a href="https://www.google.com/chrome">Google Chrome</a>';
        error.append(botLine);
        document.body.append(error);
        return;
    }
    display.append(canvas);
    const cam = new GPU.Camera(Math.PI / 4);
    cam.Translate(0, 5, 30);
    const increase = new GPU.Position();
    increase.Scale(5, 5, 5);
    const normal = new GPU.Position();
    let k = 64;
    let kOld = k;
    let length = 50_000;
    let lengthOld = length;
    let form = 'sphere';
    let cloud = Loader.Sphere(length);
    let colors = Loader.Color(length);
    const grid = Loader.Grid(10);
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
    const keys = {};
    let nearest = undefined;
    document.body.onkeydown = async (ev) => {
        keys[ev.code] = true;
        switch (ev.code) {
            case 'KeyH':
                makeHint('Left mouse button: rotate camera', 'Mouse wheel: change cloud size', 'Mouse wheel + Control: change field of view', 'QWER: move camera', '1: change cloud form', '1 + Control: change cloud size for sphere and cube', '2: compute k nearest points', '2 + Control: change k', '3: compute triangulation', '3 + Control: compute triangulation with k nearest', '4: filter connections without a counterpart', '4 + Control: filter connections with extrem length differences', '5: approximate normal (best with triangulation)', '5 + Control: approximate normal (best with k-nearest)', 'Space: render connections with polygons');
                break;
            case 'Digit1':
                if (ev.ctrlKey) {
                    const number = getUserNumber('input new cloud size');
                    if (number != undefined) {
                        lengthOld = number;
                        form = 'test';
                    }
                    else {
                        break;
                    }
                }
                cloud.destroy();
                colors.destroy();
                switch (form) {
                    case 'sphere':
                        length = lengthOld;
                        cloud = Loader.Cube(length);
                        form = 'cube';
                        break;
                    case 'cube': {
                        [cloud, length] = Loader.Map(length);
                        form = 'map';
                        break;
                    }
                    case 'map': {
                        const response = await fetch('https://raw.githubusercontent.com/PointCloudLibrary/pcl/master/test/bunny.pcd');
                        const content = await (await response.blob()).arrayBuffer();
                        const result = Loader.PCD(content);
                        if (result != undefined) {
                            [cloud, length] = result;
                        }
                        else {
                            alert('pcd error');
                        }
                        form = 'bunny';
                        break;
                    }
                    case 'bunny': {
                        const response = await fetch('https://raw.githubusercontent.com/PointCloudLibrary/pcl/master/test/rops_cloud.pcd');
                        const content = await (await response.blob()).arrayBuffer();
                        const result = Loader.PCD(content);
                        if (result != undefined) {
                            [cloud, length] = result;
                        }
                        else {
                            alert('pcd error');
                        }
                        form = 'test';
                        break;
                    }
                    case 'test':
                        length = lengthOld;
                        cloud = Loader.Sphere(length);
                        form = 'sphere';
                        break;
                }
                colors = Loader.Color(length);
                if (nearest != undefined) {
                    nearest.destroy();
                    nearest = undefined;
                }
                break;
            case 'Digit2':
                if (ev.ctrlKey) {
                    const number = getUserNumber('input new k for nearest points');
                    if (number != undefined) {
                        kOld = number;
                    }
                }
                if (nearest != undefined) {
                    nearest.destroy();
                }
                k = kOld;
                nearest = GPU.CreateEmptyBuffer(length * k * 4, GPUBufferUsage.STORAGE);
                if (ev.shiftKey == false) {
                    GPU.Compute('kNearest', length, [k], [cloud, nearest]);
                }
                else {
                    GPU.Compute('kNearestIter', length, [k], [cloud, nearest]);
                }
                break;
            case 'Digit3':
                if (nearest != undefined) {
                    if (ev.ctrlKey) {
                        const copy = GPU.CreateEmptyBuffer(length * GPU.TriangulateK * 4, GPUBufferUsage.STORAGE);
                        GPU.Compute('triangleNearest', length, [k], [cloud, nearest, copy]);
                        nearest = copy;
                        k = GPU.TriangulateK;
                        break;
                    }
                    else {
                        nearest.destroy();
                    }
                }
                k = GPU.TriangulateK;
                nearest = GPU.CreateEmptyBuffer(length * k * 4, GPUBufferUsage.STORAGE);
                GPU.Compute('triangulate', length, [], [cloud, nearest]);
                break;
            case 'Digit4':
                if (nearest == undefined) {
                    alert('please calculate the connections first');
                    break;
                }
                if (ev.ctrlKey == false) {
                    GPU.Compute('filterDang', length, [k], [nearest]);
                }
                else {
                    GPU.Compute('filterDist', length, [k], [cloud, nearest]);
                }
                break;
            case 'Digit5':
                if (nearest == undefined) {
                    alert('please calculate the connections first');
                    break;
                }
                if (ev.ctrlKey == false) {
                    GPU.Compute('normalTriang', length, [k], [cloud, nearest, colors]);
                }
                else {
                    GPU.Compute('normalLinear', length, [k], [cloud, nearest, colors]);
                }
                break;
            case 'Digit6': {
                if (nearest == undefined) {
                    alert('please calculate the connections first');
                    break;
                }
                if (ev.ctrlKey == false) {
                    GPU.Compute('curvatureDist', length, [k], [cloud, nearest, colors]);
                }
                else {
                    GPU.Compute('curvatureAngle', length, [k], [cloud, nearest, colors]);
                }
                break;
            }
            case 'Digit7': {
                const copy = GPU.CreateEmptyBuffer(length * 4 * 4, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
                GPU.Compute('sort', length, [], [cloud, copy, colors]);
                cloud = copy;
                if (nearest != undefined) {
                    nearest.destroy();
                    nearest = undefined;
                }
                break;
            }
            default:
                return;
        }
        ev.preventDefault();
        ev.stopImmediatePropagation();
    };
    document.body.onkeyup = (ev) => {
        delete keys[ev.code];
    };
    makeHint('press \'H\' for help');
    display.onmousemove = (ev) => {
        if ((ev.buttons & 1) != 0) {
            cam.RotateX(-ev.movementY / 200);
            cam.RotateGlobalY(-ev.movementX / 200);
        }
    };
    let last = await new Promise(requestAnimationFrame);
    const run = true;
    while (run) {
        const time = await new Promise(requestAnimationFrame);
        const delta = time - last;
        if (delta > 25) {
            console.log(delta);
        }
        else {
            const dist = delta / 50;
            const move = (key, x, y, z) => {
                if (keys[key] != undefined) {
                    cam.Translate(x * dist, y * dist, z * dist);
                }
            };
            move('KeyW', 0, 0, -1);
            move('KeyD', 1, 0, 0);
            move('KeyS', 0, 0, 1);
            move('KeyA', -1, 0, 0);
            move('KeyF', 0, -1, 0);
            move('KeyR', 0, 1, 0);
        }
        GPU.StartRender(cam);
        GPU.Lines(normal, grid.length, grid.positions, grid.colors);
        if (nearest != undefined) {
            if (keys['Space'] != undefined) {
                GPU.Triangulate(increase, cloud, colors, nearest, k, length);
            }
            else {
                GPU.Cloud(increase, 0.015, length, cloud, colors);
                GPU.KNearest(increase, cloud, colors, nearest, k, length);
            }
        }
        else {
            GPU.Cloud(increase, 0.015, length, cloud, colors);
        }
        GPU.FinishRender();
        last = time;
    }
};
function makeHint(...text) {
    const hint = document.createElement('div');
    let combined = '';
    for (let i = 0; i < text.length; i++) {
        combined += text[i] + '\n';
    }
    hint.textContent = combined;
    hint.className = 'hint';
    document.body.append(hint);
    setTimeout(() => {
        hint.remove();
    }, 5000);
}
function getUserNumber(text) {
    const str = prompt(text);
    if (str == null) {
        return undefined;
    }
    const x = parseInt(str);
    if (isNaN(x)) {
        return undefined;
    }
    return x;
}
