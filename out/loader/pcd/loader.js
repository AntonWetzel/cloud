import './data/cturtle.pcd';
/**
 * @author Filipe Caixeta / http://filipecaixeta.com.br
 * @author Sergey Alexandrov
 *
 * Description: A THREE loader for PCD files.
 *
 * Based on the example THREE.PCDLoader written by Filipe Caixeta.
 *
 * Changes:
 *
 *   - added support for compressed binary files
 *   - significantly improved header parsing time
 *   - added support for RGBA color field
 *   - removed support for normals field
 *
 */
export function Parse(data) {
    const header = parseHeader(data);
    if (header == null) {
        console.log('header null');
    }
    return undefined;
    const offset = header.offset;
    let position = false;
    if (offset.x !== undefined && offset.y !== undefined && offset.z !== undefined) {
        position = new Float32Array(header.points * 3);
    }
    let color = false;
    let color_offset;
    if (offset.rgb !== undefined || offset.rgba !== undefined) {
        color = new Float32Array(header.points * 3);
        color_offset = offset.rgb === undefined ? offset.rgba : offset.rgb;
    }
    if (header.data === 'ascii') {
        const charArrayView = new Uint8Array(data);
        let dataString = '';
        for (let j = header.headerLen; j < data.byteLength; j++) {
            dataString += String.fromCharCode(charArrayView[j]);
        }
        const lines = dataString.split('\n');
        let i3 = 0;
        for (let i = 0; i < lines.length; i++, i3 += 3) {
            const line = lines[i].split(' ');
            if (position !== false) {
                position[i3 + 0] = parseFloat(line[offset.x]);
                position[i3 + 1] = parseFloat(line[offset.y]);
                position[i3 + 2] = parseFloat(line[offset.z]);
            }
            if (color !== false) {
                var c;
                if (offset.rgba !== undefined) {
                    c = new Uint32Array([parseInt(line[offset.rgba])]);
                }
                else if (offset.rgb !== undefined) {
                    c = new Float32Array([parseFloat(line[offset.rgb])]);
                }
                const dataview = new Uint8Array(c.buffer, 0);
                color[i3 + 2] = dataview[0] / 255.0;
                color[i3 + 1] = dataview[1] / 255.0;
                color[i3 + 0] = dataview[2] / 255.0;
            }
        }
    }
    else if (header.data === 'binary') {
        let row = 0;
        var dataArrayView = new DataView(data, header.headerLen);
        for (var p = 0; p < header.points; row += header.rowSize, p++) {
            if (position !== false) {
                position[p * 3 + 0] = dataArrayView.getFloat32(row + offset.x, this.littleEndian);
                position[p * 3 + 1] = dataArrayView.getFloat32(row + offset.y, this.littleEndian);
                position[p * 3 + 2] = dataArrayView.getFloat32(row + offset.z, this.littleEndian);
            }
            if (color !== false) {
                color[p * 3 + 2] = dataArrayView.getUint8(row + color_offset + 0) / 255.0;
                color[p * 3 + 1] = dataArrayView.getUint8(row + color_offset + 1) / 255.0;
                color[p * 3 + 0] = dataArrayView.getUint8(row + color_offset + 2) / 255.0;
            }
        }
    }
    else if (header.data === 'binary_compressed') {
        const sizes = new Uint32Array(data.slice(header.headerLen, header.headerLen + 8));
        const compressedSize = sizes[0];
        const decompressedSize = sizes[1];
        const decompressed = decompressLZF(new Uint8Array(data, header.headerLen + 8, compressedSize), decompressedSize);
        dataArrayView = new DataView(decompressed.buffer);
        for (p = 0; p < header.points; p++) {
            if (position !== false) {
                position[p * 3 + 0] = dataArrayView.getFloat32(offset.x + p * 4, this.littleEndian);
                position[p * 3 + 1] = dataArrayView.getFloat32(offset.y + p * 4, this.littleEndian);
                position[p * 3 + 2] = dataArrayView.getFloat32(offset.z + p * 4, this.littleEndian);
            }
            if (color !== false) {
                color[p * 3 + 2] = dataArrayView.getUint8(color_offset + p * 4 + 0) / 255.0;
                color[p * 3 + 1] = dataArrayView.getUint8(color_offset + p * 4 + 1) / 255.0;
                color[p * 3 + 0] = dataArrayView.getUint8(color_offset + p * 4 + 2) / 255.0;
            }
        }
    }
    const geometry = new THREE.BufferGeometry();
    if (position !== false) {
        geometry.addAttribute('position', new THREE.BufferAttribute(position, 3));
    }
    if (color !== false) {
        geometry.addAttribute('color', new THREE.BufferAttribute(color, 3));
    }
    const material = new THREE.PointsMaterial({
        size: 0.005,
        vertexColors: !(color === false),
    });
    if (color === false) {
        material.color.setHex(Math.random() * 0xffffff);
    }
    const mesh = new THREE.Points(geometry, material);
    mesh.header = header;
    return mesh;
}
function parseHeader(binaryData) {
    let headerText = '';
    const charArray = new Uint8Array(binaryData);
    let i = 0;
    const max = charArray.length;
    while (i < max && headerText.search(/[\r\n]DATA\s(\S*)\s/i) === -1) {
        headerText += String.fromCharCode(charArray[i++]);
    }
    const result1 = headerText.search(/[\r\n]DATA\s(\S*)\s/i);
    const result2 = /[\r\n]DATA\s(\S*)\s/i.exec(headerText.substr(result1 - 1));
    if (result1 == undefined || result2 == undefined) {
        return null;
    }
    const header = {};
    header.data = result2[1];
    header.headerLen = result2[0].length + result1;
    header.str = headerText.substr(0, header.headerLen);
    // Remove comments
    header.str = header.str.replace(/#.*/gi, '');
    const version = /VERSION (.*)/i.exec(header.str);
    if (version !== null) {
        header.version = parseFloat(version[1]);
    }
    const fields = /FIELDS (.*)/i.exec(header.str);
    if (fields !== null) {
        header.fields = fields[1].split(' ');
    }
    const size = /SIZE (.*)/i.exec(header.str);
    if (size !== null) {
        header.size = size[1].split(' ').map(function (x) {
            return parseInt(x, 10);
        });
    }
    const type = /TYPE (.*)/i.exec(header.str);
    if (type !== null) {
        header.type = type[1].split(' ');
    }
    const count = /COUNT (.*)/i.exec(header.str);
    if (count !== null) {
        header.count = count[1].split(' ').map(function (x) {
            return parseInt(x, 10);
        });
    }
    const width = /WIDTH (.*)/i.exec(header.str);
    if (width !== null) {
        header.width = parseInt(width[1]);
    }
    const height = /HEIGHT (.*)/i.exec(header.str);
    if (height !== null) {
        header.height = parseInt(height[1]);
    }
    const viewpoint = /VIEWPOINT (.*)/i.exec(header.str);
    if (viewpoint !== null) {
        header.viewpoint = viewpoint[1];
    }
    const points = /POINTS (.*)/i.exec(header.str);
    if (points !== null) {
        header.points = parseInt(points[1], 10);
    }
    if (header.points === null) {
        header.points = header.width * header.height;
    }
    if (header.count == undefined) {
        header.count = [];
        for (i = 0; i < header.fields.length; i++) {
            header.count.push(1);
        }
    }
    header.offset = {};
    let sizeSum = 0;
    for (let j = 0; j < header.fields.length; j++) {
        if (header.data === 'ascii') {
            header.offset[header.fields[j]] = j;
        }
        else if (header.data === 'binary') {
            header.offset[header.fields[j]] = sizeSum;
            sizeSum += header.size[j];
        }
        else if (header.data === 'binary_compressed') {
            header.offset[header.fields[j]] = sizeSum;
            sizeSum += header.size[j] * header.points;
        }
    }
    // For binary only
    header.rowSize = sizeSum;
    return header;
}
