import * as GPU from './gpu.js';
import { Matrix } from './matrix.js';
import { Lines } from './lines.js';
import * as Quad from './quad.js';
export class SpotLight {
    static lines;
    static async Setup() {
        SpotLight.lines = new Lines(new Float32Array([
            /*eslint-disable*/
            0, 0, 0, 1, 1, -1,
            0, 0, 0, 1, -1, -1,
            0, 0, 0, -1, -1, -1,
            0, 0, 0, -1, 1, -1,
            /*eslint-enable*/
        ]), new Float32Array([
            /*eslint-disable*/
            1, 1, 0, 0, 0, 0,
            1, 1, 0, 0, 0, 0,
            1, 1, 0, 0, 0, 0,
            1, 1, 0, 0, 0, 0,
            /*eslint-enable*/
        ]));
        SpotLight.lines.Scale(10, 10, 10);
    }
    projection;
    view;
    viewInv;
    intensity;
    constructor(intensity) {
        this.projection = Matrix.Perspective(Math.PI / 2, 1, 1, 1000);
        this.view = Matrix.Identity();
        this.viewInv = Matrix.Identity();
        this.intensity = intensity;
    }
    Shadow(node, idx, encoder) {
        const view = GPU.global.shadows.createView({
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
        node.RenderShadow(this.projection, this.view, Matrix.Identity(), renderPass);
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
        SpotLight.lines.Render(projection, view, this.viewInv, renderPass, spotLights, pointLights);
    }
    Translate(x, y, z) {
        this.view = Matrix.Translate(-x, -y, -z).Multiply(this.view);
        this.viewInv = this.viewInv.Multiply(Matrix.Translate(x, y, z));
    }
    Rotate(rad) {
        this.view = Matrix.RotateY(-rad).Multiply(this.view);
        this.viewInv = this.viewInv.Multiply(Matrix.RotateY(rad));
    }
    Position() {
        return this.viewInv.Position();
    }
    Save(data, offset) {
        this.projection.Save(data, offset + 0);
        this.view.Save(data, offset + 16);
        data.set(this.viewInv.Position(), offset + 32);
        data[offset + 32 + 3] = this.intensity;
    }
}
