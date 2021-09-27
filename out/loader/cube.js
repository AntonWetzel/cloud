import { Colored } from '../gpu/colored.js';
export async function CreateCube(r, g, b) {
    const positions = [
        [1, 1, -1],
        [1, -1, -1],
        [1, 1, 1],
        [1, -1, 1],
        [-1, 1, -1],
        [-1, -1, -1],
        [-1, 1, 1],
        [-1, -1, 1],
    ];
    const normals = [
        [0, 1, 0],
        [0, 0, 1],
        [-1, 0, 0],
        [0, -1, 0],
        [1, 0, 0],
        [0, 0, -1],
    ];
    const posBuffer = [];
    const colBuffer = [];
    const norBuffer = [];
    function AddFace(p0, p1, p2, p3, n) {
        posBuffer.push(...positions[p0], ...positions[p1], ...positions[p2], ...positions[p0], ...positions[p2], ...positions[p3]);
        for (let i = 0; i < 6; i++) {
            colBuffer.push(r, g, b);
            norBuffer.push(...normals[n]);
        }
    }
    AddFace(0, 4, 6, 2, 0);
    AddFace(3, 2, 6, 7, 1);
    AddFace(7, 6, 4, 5, 2);
    AddFace(5, 1, 3, 7, 3);
    AddFace(1, 0, 2, 3, 4);
    AddFace(5, 4, 0, 1, 5);
    return {
        node: new Colored(posBuffer, colBuffer, norBuffer),
        name: 'cube',
    };
}
