import * as GPU from './gpu/header.js';
import * as Loader from './loader/header.js';
import * as Time from './time.js';
document.body.onload = async () => {
    const mode = document.getElementById('mode');
    const color = document.getElementById('color');
    const gridCheckbox = document.getElementById('grid');
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
    await Time.MeasureTimes();
    return;
    display.append(canvas);
    const cam = new GPU.Camera(Math.PI / 4);
    cam.Translate(0, 5, 30);
    const increase = new GPU.Position();
    increase.Scale(5, 5, 5);
    const normal = new GPU.Position();
    const grid = Loader.Grid(10);
    let k = 64;
    let length = 50_000;
    let cloud = Loader.Sphere(length);
    let colors = Loader.Color(length);
    let nearest = undefined;
    let normals = undefined;
    let curvature = undefined;
    let valid = true;
    window.CreateForm = async (name) => {
        const size = document.getElementById('size');
        length = parseInt(size.value);
        cloud.destroy();
        colors.destroy();
        valid = false;
        switch (name) {
            case 'sphere':
                cloud = Loader.Sphere(length);
                valid = true;
                break;
            case 'cube':
                cloud = Loader.Cube(length);
                valid = true;
                break;
            case 'map':
                [cloud, length] = Loader.Map(length);
                valid = true;
                break;
            case 'bunny': {
                const response = await fetch('https://raw.githubusercontent.com/PointCloudLibrary/pcl/master/test/bunny.pcd');
                const content = await (await response.blob()).arrayBuffer();
                const result = Loader.PCD(content);
                if (result != undefined) {
                    [cloud, length] = result;
                    valid = true;
                }
                else {
                    alert('pcd error');
                }
                break;
            }
            case 'statue':
                const response = await fetch('https://raw.githubusercontent.com/PointCloudLibrary/pcl/master/test/rops_cloud.pcd');
                const content = await (await response.blob()).arrayBuffer();
                const result = Loader.PCD(content);
                if (result != undefined) {
                    [cloud, length] = result;
                    valid = true;
                }
                else {
                    alert('pcd error');
                }
                break;
            case 'upload':
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.pcd';
                input.multiple = false;
                input.onchange = async () => {
                    if (input.files.length == 0) {
                        alert('please select file');
                        return;
                    }
                    const file = input.files[0];
                    const result = Loader.PCD(await file.arrayBuffer());
                    if (result != undefined) {
                        [cloud, length] = result;
                        valid = true;
                    }
                    else {
                        alert('pcd error');
                    }
                };
                input.click();
        }
        colors = Loader.Color(length);
        if (nearest != undefined) {
            nearest.destroy();
            nearest = undefined;
        }
        if (normals != undefined) {
            normals.destroy();
            normals = undefined;
        }
        if (curvature != undefined) {
            curvature.destroy();
            curvature = undefined;
        }
        mode.value = 'points';
        color.value = 'color';
    };
    window.ShowText = (text) => {
        const hint = document.createElement('div');
        hint.textContent = text;
        hint.className = 'hint';
        document.body.append(hint);
        setTimeout(() => {
            hint.remove();
        }, 5000);
    };
    window.Compute = async (name) => {
        switch (name) {
            case 'kNearestList':
            case 'kNearestIter':
            case 'kNearestListSorted':
            case 'kNearestIterSorted':
                if (nearest != undefined) {
                    nearest.destroy();
                }
                const kDiv = document.getElementById('k');
                k = parseInt(kDiv.value);
                nearest = GPU.CreateEmptyBuffer(length * k * 4, GPUBufferUsage.STORAGE);
                switch (name) {
                    case 'kNearestList':
                    case 'kNearestIter':
                        GPU.Compute(name, length, [[k], []], [cloud, nearest]);
                        break;
                    case 'kNearestListSorted':
                    case 'kNearestIterSorted':
                        const newCloud = GPU.CreateEmptyBuffer(length * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
                        const newColor = GPU.CreateEmptyBuffer(length * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
                        GPU.Compute('sort', length, [[], []], [cloud, colors, newCloud, newColor]);
                        cloud.destroy();
                        colors.destroy();
                        cloud = newCloud;
                        colors = newColor;
                        GPU.Compute(name, length, [[k], []], [cloud, nearest]);
                        break;
                }
                mode.value = 'connections';
                break;
            case 'triangulateAll':
                k = GPU.TriangulateK;
                if (nearest != undefined) {
                    nearest.destroy();
                }
                nearest = GPU.CreateEmptyBuffer(length * k * 4, GPUBufferUsage.STORAGE);
                GPU.Compute('triangulateAll', length, [[], []], [cloud, nearest]);
                mode.value = 'connections';
                break;
            case 'triangulateNear':
                if (nearest == undefined) {
                    alert('please calculate nearest first');
                }
                else {
                    const copy = GPU.CreateEmptyBuffer(length * GPU.TriangulateK * 4, GPUBufferUsage.STORAGE);
                    GPU.Compute('triangulateNearest', length, [[k], []], [cloud, nearest, copy]);
                    nearest.destroy();
                    nearest = copy;
                    k = GPU.TriangulateK;
                    mode.value = 'connections';
                    break;
                }
                break;
            case 'cleanDang':
            case 'cleanLong':
                if (nearest == undefined) {
                    alert('please calculate the connections first');
                    break;
                }
                const newNearest = GPU.CreateEmptyBuffer(length * k * 4, GPUBufferUsage.STORAGE);
                switch (name) {
                    case 'cleanDang':
                        GPU.Compute('cleanDang', length, [[k], []], [nearest, newNearest]);
                        break;
                    case 'cleanLong':
                        GPU.Compute('cleanLong', length, [[k], []], [cloud, nearest, newNearest]);
                        break;
                }
                nearest.destroy();
                nearest = newNearest;
                mode.value = 'connections';
                break;
            case 'normalPlane':
            case 'normalTriang':
                if (nearest == undefined) {
                    alert('please calculate the connections first');
                    break;
                }
                if (normals == undefined) {
                    normals = GPU.CreateEmptyBuffer(length * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
                }
                switch (name) {
                    case 'normalPlane':
                        GPU.Compute('normalLinear', length, [[k], []], [cloud, nearest, normals]);
                        break;
                    case 'normalTriang':
                        GPU.Compute('normalTriang', length, [[k], []], [cloud, nearest, normals]);
                        break;
                }
                color.value = 'normal';
                break;
            case 'curvaturePoints':
            case 'curvatureNormal':
                if (normals == undefined) {
                    alert('please calculate the normals first');
                    break;
                }
                if (curvature == undefined) {
                    curvature = GPU.CreateEmptyBuffer(length * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC);
                }
                switch (name) {
                    case 'curvatureNormal':
                        GPU.Compute('curvatureNormal', length, [[k], []], [cloud, nearest, normals, curvature]);
                        break;
                    case 'curvaturePoints':
                        GPU.Compute('curvaturePoints', length, [[k], []], [cloud, nearest, normals, curvature]);
                        break;
                }
                color.value = 'curve';
                break;
            case 'filterCurve':
            case 'filterAnomaly':
                if (curvature == undefined) {
                    alert('please calculate curvature first');
                    break;
                }
                const tDiv = document.getElementById('threshhold');
                const t = parseFloat(tDiv.value);
                const newCloud = GPU.CreateEmptyBuffer(length * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
                const newColor = GPU.CreateEmptyBuffer(length * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
                let com;
                switch (name) {
                    case 'filterCurve':
                        com = 'reduceLow';
                        break;
                    case 'filterAnomaly':
                        com = 'reduceAnomaly';
                        break;
                }
                const result = GPU.Compute(com, length, [[0], [t]], [cloud, colors, curvature, newCloud, newColor], true);
                length = new Uint32Array(await GPU.ReadBuffer(result, 3 * 4))[1];
                console.log('length:', length);
                result.destroy();
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
                color.value = 'color';
                mode.value = 'points';
                break;
            case 'noise':
                if (curvature == undefined) {
                    alert('please calculate the curvature first');
                    break;
                }
                const copy = GPU.CreateEmptyBuffer(length * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
                GPU.Compute('noise', length, [[k], [1.0]], [cloud, normals, curvature, copy]);
                cloud.destroy();
                cloud = copy;
                break;
            default:
                alert('wrong name: ' + name);
        }
    };
    display.onwheel = (ev) => {
        const scale = 1 + ev.deltaY / 1000;
        increase.Scale(scale, scale, scale);
        ev.preventDefault();
        ev.stopImmediatePropagation();
    };
    document.body.onresize = () => {
        GPU.Resize(display.clientWidth, display.clientHeight);
        cam.UpdateSize();
    };
    const keys = {};
    document.body.onkeydown = (ev) => {
        keys[ev.code] = true;
    };
    document.body.onkeyup = (ev) => {
        delete keys[ev.code];
    };
    display.onmousemove = (ev) => {
        if ((ev.buttons & 1) != 0) {
            cam.RotateX(-ev.movementY / 200);
            cam.RotateGlobalY(-ev.movementX / 200);
        }
    };
    let last = await new Promise(requestAnimationFrame);
    const run = true;
    const radDiv = document.getElementById('radius');
    while (run) {
        const time = await new Promise(requestAnimationFrame);
        const delta = time - last;
        if (delta < 50) {
            const dist = delta / 50;
            const move = (key, x, y, z) => {
                if (keys[key] != undefined) {
                    cam.Translate(x * dist, y * dist, z * dist);
                }
            };
            move('KeyW', 0, 0, -1);
            move('KeyA', -1, 0, 0);
            move('KeyS', 0, 0, 1);
            move('KeyD', 1, 0, 0);
        }
        let c = undefined;
        switch (color.value) {
            case 'color':
                c = colors;
                break;
            case 'normal':
                if (normals == undefined) {
                    c = colors;
                    color.value = 'color';
                    alert('normals not calculated');
                }
                else {
                    c = normals;
                }
                break;
            case 'curve':
                if (curvature == undefined) {
                    c = colors;
                    color.value = 'color';
                    alert('curvature not calculated');
                }
                else {
                    c = curvature;
                }
                break;
        }
        const rad = parseFloat(radDiv.value);
        GPU.StartRender(cam);
        if (gridCheckbox.checked) {
            GPU.Lines(normal, grid.length, grid.positions, grid.colors);
        }
        if (valid) {
            switch (mode.value) {
                case 'points':
                    GPU.Cloud(increase, rad, length, cloud, c);
                    break;
                case 'connections':
                    if (nearest == undefined) {
                        mode.value = 'points';
                        GPU.Cloud(increase, rad, length, cloud, c);
                        alert('connections not calculated');
                    }
                    else {
                        GPU.KNearest(increase, cloud, c, nearest, k, length);
                    }
                    break;
                case 'polygons':
                    if (nearest == undefined) {
                        mode.value = 'points';
                        GPU.Cloud(increase, rad, length, cloud, c);
                        alert('connections not calculated');
                    }
                    else {
                        GPU.Triangulate(increase, cloud, c, nearest, k, length);
                    }
                    break;
            }
        }
        GPU.FinishRender();
        last = time;
        if (keys['KeyP'] != undefined) {
            const name = prompt('Please enter file name', 'cloud');
            if (name != null && name.length > 0) {
                const link = document.createElement('a');
                link.download = name + '.png';
                link.href = canvas.toDataURL();
                link.click();
            }
            delete keys['KeyP'];
        }
    }
};
