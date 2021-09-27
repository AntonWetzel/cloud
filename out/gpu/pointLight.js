import * as GPU from './gpu.js';
import { Matrix } from './matrix.js';
import { Lines } from './lines.js';
import * as Quad from './quad.js';
export class PointLight {
    static lines;
    static async Setup() {
        PointLight.lines = new Lines(new Float32Array([
            /*eslint-disable*/
            -1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0,
            0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0,
            0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
            /*eslint-enable*/
        ]), new Float32Array([
            /*eslint-disable*/
            0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0,
            0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0,
            0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0,
            /*eslint-enable*/
        ]));
        PointLight.lines.Scale(5, 5, 5);
    }
    position;
    intensity;
    constructor(intensity) {
        this.intensity = intensity;
        this.position = { x: 0, y: 0, z: 0 };
    }
    Shadow(node, idx, encoder) {
        const view = GPU.global.pointShadows.createView({
            baseArrayLayer: idx,
        });
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [],
            depthStencilAttachment: {
                depthLoadValue: 1.0,
                depthStoreOp: 'store',
                stencilLoadValue: 0,
                stencilStoreOp: 'store',
                view: view,
            },
        });
        const translate = Matrix.Translate(-this.position.x, -this.position.y, -this.position.z);
        node.RenderMap(translate, Matrix.Identity(), renderPass);
        renderPass.endPass();
        return view;
    }
    Render(node) {
        const encoder = GPU.device.createCommandEncoder();
        const view = this.Shadow(node, 0, encoder);
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [
                {
                    loadValue: GPU.clearColor,
                    storeOp: 'store',
                    view: GPU.context.getCurrentTexture().createView(),
                },
            ],
        });
        Quad.Draw(view, renderPass);
        renderPass.endPass();
        GPU.device.queue.submit([encoder.finish()]);
    }
    Show(projection, view, renderPass, spotLights, pointLights) {
        PointLight.lines.Render(projection, view, Matrix.Translate(this.position.x, this.position.y, this.position.z), renderPass, spotLights, pointLights);
    }
    Translate(x, y, z) {
        this.position.x += x;
        this.position.y += y;
        this.position.z += z;
    }
    Save(data, offset) {
        data[offset + 0] = this.position.x;
        data[offset + 1] = this.position.y;
        data[offset + 2] = this.position.z;
        data[offset + 3] = this.intensity;
    }
}
