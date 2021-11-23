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
    let nearest = undefined;
    let normals = undefined;
    let curvature = undefined;
    let infoIdx = 0;
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
    document.body.onkeydown = async (ev) => {
        keys[ev.code] = true;
        switch (ev.code) {
            case 'KeyH':
                makeHint('Left mouse button: rotate camera', 'Mouse wheel: change cloud size', 'Mouse wheel + Control: change field of view', 'QWER: move camera', '1: change cloud form', '1 + Control: change cloud size for sphere and cube', '2: compute k nearest points', '2 + Control: change k', '3: compute triangulation', '3 + Control: compute triangulation with k nearest', '4: filter connections without a counterpart', '4 + Control: filter connections with extrem length differences', '5: approximate normal (best with triangulation)', '5 + Control: approximate normal (best with k-nearest)', '6: calculate local curvature with distance to plane', '6 + Control: calculate local curvature with difference in normals', '7: filter points with low local curvature', 'Space: render connections with polygons');
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
                infoIdx = 0;
                cloud.destroy();
                colors.destroy();
                if (normals != undefined) {
                    normals.destroy();
                    normals = undefined;
                }
                if (curvature != undefined) {
                    curvature.destroy();
                    curvature = undefined;
                }
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
                infoIdx = 1;
                if (ev.ctrlKey) {
                    const number = getUserNumber('input new k for nearest points');
                    if (number != undefined) {
                        kOld = number;
                    }
                    else {
                        break;
                    }
                }
                if (nearest != undefined) {
                    nearest.destroy();
                }
                k = kOld;
                nearest = GPU.CreateEmptyBuffer(length * k * 4, GPUBufferUsage.STORAGE);
                if (ev.shiftKey == false) {
                    GPU.Compute('kNearestList', length, [k], [cloud, nearest]);
                }
                else {
                    GPU.Compute('kNearestIter', length, [k], [cloud, nearest]);
                }
                break;
            case 'Digit3':
                infoIdx = 1;
                if (nearest != undefined) {
                    if (ev.ctrlKey) {
                        const copy = GPU.CreateEmptyBuffer(length * GPU.TriangulateK * 4, GPUBufferUsage.STORAGE);
                        GPU.Compute('triangulateNearest', length, [k], [cloud, nearest, copy]);
                        nearest.destroy();
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
                GPU.Compute('triangulateAll', length, [], [cloud, nearest]);
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
                infoIdx = 2;
                if (normals == undefined) {
                    normals = GPU.CreateEmptyBuffer(length * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
                }
                if (ev.ctrlKey == false) {
                    GPU.Compute('normalTriang', length, [k], [cloud, nearest, normals]);
                }
                else {
                    GPU.Compute('normalLinear', length, [k], [cloud, nearest, normals]);
                }
                break;
            case 'Digit6': {
                if (normals == undefined) {
                    alert('please calculate the normals first');
                    break;
                }
                infoIdx = 3;
                if (curvature == undefined) {
                    curvature = GPU.CreateEmptyBuffer(length * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC);
                }
                if (ev.ctrlKey == false) {
                    GPU.Compute('curvatureDist', length, [k], [cloud, nearest, normals, curvature]);
                }
                else {
                    GPU.Compute('curvatureAngle', length, [k], [cloud, nearest, normals, curvature]);
                }
                break;
            }
            case 'Digit7': {
                if (display == undefined) {
                    alert('please calculate curvature first');
                    break;
                }
                infoIdx = 0;
                const newCloud = GPU.CreateEmptyBuffer(length * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
                const newColor = GPU.CreateEmptyBuffer(length * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
                GPU.Compute('reduceP1', length, [], [cloud, colors, curvature, newCloud, newColor]);
                const x = GPU.Compute('reduceP2', 1, [length, 0], [curvature], true);
                length = new Uint32Array(await GPU.ReadBuffer(x, 3 * 4))[2];
                console.log('length:', length);
                x.destroy();
                cloud.destroy();
                colors.destroy();
                nearest.destroy();
                normals.destroy();
                curvature.destroy();
                cloud = newCloud;
                colors = newColor;
                nearest = undefined;
                normals = undefined;
                curvature = undefined;
                break;
            }
            case 'Space': {
                let valid = false;
                while (valid == false) {
                    infoIdx = (infoIdx + 1) % 4;
                    switch (infoIdx) {
                        case 0:
                            valid = true;
                            break;
                        case 1:
                            valid = nearest != undefined;
                            break;
                        case 2:
                            valid = normals != undefined;
                            break;
                        case 3:
                            valid = curvature != undefined;
                            break;
                    }
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
        const render = (info) => {
            if (keys['ShiftLeft'] == undefined) {
                GPU.Cloud(increase, 0.015, length, cloud, colors);
                GPU.KNearest(increase, cloud, info, nearest, k, length);
            }
            else {
                GPU.Triangulate(increase, cloud, info, nearest, k, length);
            }
        };
        GPU.StartRender(cam);
        GPU.Lines(normal, grid.length, grid.positions, grid.colors);
        switch (infoIdx) {
            case 0:
                GPU.Cloud(increase, 0.015, length, cloud, colors);
                break;
            case 1:
                render(colors);
                break;
            case 2:
                render(normals);
                break;
            case 3:
                render(curvature);
                break;
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
