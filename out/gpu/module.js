import * as GPU from './gpu.js';
export function New(src) {
    const module = GPU.device.createShaderModule({
        code: src,
    });
    return module;
}
