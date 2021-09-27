import * as Texture from '../gpu/texture.js';
import { Textured } from '../gpu/textured.js';
import { GetUserFile } from '../helper/file.js';
export async function Load() {
    const file = await GetUserFile(['obj']);
    const src = await file.text();
    const img = document.createElement('img');
    img.src = URL.createObjectURL(await GetUserFile(['png']));
    const node = await Create(src, img);
    return {
        node: node,
        name: file.name.substring(0, file.name.length - 4),
    };
}
async function Create(src, img) {
    const vertices = [];
    const uvs = [];
    const normals = [];
    const indexedVertices = [];
    const indexedUvs = [];
    const indexedNormals = [];
    function index(array, index, length, indexedArray) {
        const idx = parseInt(index) - 1;
        for (let i = 0; i < length; i++) {
            indexedArray.push(array[idx * length + i]);
        }
    }
    function add(word) {
        const sub = word.split('/');
        switch (sub.length) {
            case 1:
                index(vertices, sub[0], 3, indexedVertices);
                indexedUvs.push(0, 0);
                indexedNormals.push(0, 0, 0);
                break;
            case 2:
                index(vertices, sub[0], 3, indexedVertices);
                index(uvs, sub[1], 2, indexedUvs);
                indexedNormals.push(0, 0, 0);
                break;
            case 3:
                if (sub[1].length == 0) {
                    index(vertices, sub[0], 3, indexedVertices);
                    indexedUvs.push(0, 0);
                    index(normals, sub[2], 3, indexedNormals);
                }
                else {
                    index(vertices, sub[0], 3, indexedVertices);
                    index(uvs, sub[1], 2, indexedUvs);
                    index(normals, sub[2], 3, indexedNormals);
                }
                break;
        }
    }
    const lines = src.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const words = line.split(' ');
        switch (words.shift()) {
            case '#':
                break;
            case 'v':
                if (words.length != 3) {
                    console.log('expected vertex with xyz');
                }
                vertices.push(parseFloat(words[0]));
                vertices.push(parseFloat(words[1]));
                vertices.push(parseFloat(words[2]));
                break;
            case 'vt':
                if (words.length != 2) {
                    console.log('expected coordinate with uv');
                }
                uvs.push(parseFloat(words[0]));
                uvs.push(parseFloat(words[1]));
                break;
            case 'vn':
                if (words.length != 3) {
                    console.log('expected normal with xyz');
                }
                normals.push(parseFloat(words[0]));
                normals.push(parseFloat(words[1]));
                normals.push(parseFloat(words[2]));
                break;
            case 'vp':
                console.log('space vertices not implemented');
                break;
            case 'f':
                if (words.length <= 2) {
                    console.log('expected face with atleast 3 vertices');
                }
                for (let i = 1; i < words.length - 1; i++) {
                    add(words[0]);
                    add(words[i + 0]);
                    add(words[i + 1]);
                }
                break;
            default:
                console.log('ingored line: ', line);
                break;
        }
    }
    const tex = await Texture.New(img);
    return new Textured(indexedVertices, indexedUvs, indexedNormals, tex);
}
