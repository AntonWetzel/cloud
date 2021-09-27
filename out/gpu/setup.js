import * as GPU from './gpu.js';
import * as Grid from './lines.js';
import * as Points from './points.js';
export async function Setup(data) {
    let c = await GPU.Setup(data.width, data.height, data.fov);
    if (data.grid != undefined) {
        await Grid.Setup();
    }
    if (data.points != undefined) {
        await Points.Setup();
    }
    return c;
}
