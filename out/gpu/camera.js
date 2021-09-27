import { Matrix } from './math.js';
import * as GPU from './gpu.js';
export class Camera {
    projection;
    view;
    fov;
    constructor(fieldOfView) {
        this.projection = Matrix.Perspective(fieldOfView, GPU.global.aspect, 1, 1000);
        this.view = Matrix.Identity();
        this.fov = fieldOfView;
    }
    set fieldOfView(val) {
        this.fov = val;
        this.projection = Matrix.Perspective(val, GPU.global.aspect, 1, 1000);
    }
    get fieldOfView() {
        return this.fov;
    }
    Render(node, lights) {
        const encoder = GPU.device.createCommandEncoder();
        const lightData = new Float32Array(4 + (lights.length + (lights.length == 0 ? 1 : 0)) * 4);
        new Int32Array(lightData.buffer)[0] = lights.length;
        for (let i = 0; i < lights.length; i++) {
            const light = lights[i];
            light.Save(lightData, 4 + i * 4);
        }
        const lightBuffer = GPU.CreateBuffer(lightData, GPUBufferUsage.STORAGE);
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [
                {
                    loadValue: GPU.clearColor,
                    storeOp: 'store',
                    view: GPU.context.getCurrentTexture().createView(),
                },
            ],
            depthStencilAttachment: {
                depthLoadValue: 1.0,
                depthStoreOp: 'store',
                stencilLoadValue: 0,
                stencilStoreOp: 'store',
                view: GPU.depth.createView(),
            },
        });
        node.Render(this.projection, this.view, Matrix.Identity(), renderPass, lightBuffer);
        for (let i = 0; i < lights.length; i++) {
            lights[i].Show(this.projection, this.view, renderPass, lightBuffer);
        }
        renderPass.endPass();
        GPU.device.queue.submit([encoder.finish()]);
    }
    UpdateSize() {
        this.projection = Matrix.Perspective(this.fov, GPU.global.aspect, 1, 1000);
    }
    Translate(x, y, z) {
        this.view = Matrix.Translate(-x, -y, -z).Multiply(this.view);
    }
    RotateX(rad) {
        this.view = Matrix.RotateX(-rad).Multiply(this.view);
    }
    RotateY(rad) {
        this.view = Matrix.RotateY(-rad).Multiply(this.view);
    }
    RotateGlobalY(rad) {
        const axis = this.view.MultiplyVector({ x: 0, y: 1, z: 0 });
        this.view = Matrix.Rotate(-rad, axis).Multiply(this.view);
    }
    RotateZ(rad) {
        this.view = Matrix.RotateZ(-rad).Multiply(this.view);
    }
}
