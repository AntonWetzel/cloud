// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"gpu/gpu.ts":[function(require,module,exports) {

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CreateBuffer = CreateBuffer;
exports.CreateEmptyBuffer = CreateEmptyBuffer;
exports.FinishRender = FinishRender;
exports.ReadBuffer = ReadBuffer;
exports.Resize = Resize;
exports.Setup = Setup;
exports.StartRender = StartRender;
exports.sampler = exports.renderPass = exports.global = exports.format = exports.device = exports.depth = exports.context = exports.clearColor = exports.canvas = exports.cameraBuffer = exports.adapter = void 0;
let adapter;
exports.adapter = adapter;
let device;
exports.device = device;
const clearColor = {
  r: 0.0,
  g: 0.1,
  b: 0.2,
  a: 1.0
};
exports.clearColor = clearColor;
let format;
exports.format = format;
let sampler;
exports.sampler = sampler;
let canvas;
exports.canvas = canvas;
let context;
exports.context = context;
let global;
exports.global = global;
let depth;
exports.depth = depth;

async function Setup(width, height) {
  if (window.navigator.gpu == undefined) {
    return undefined;
  }

  exports.adapter = adapter = await window.navigator.gpu.requestAdapter({
    powerPreference: 'high-performance'
  });
  exports.device = device = await adapter.requestDevice();
  device.lost.then(info => {
    console.log(info);
  });
  exports.canvas = canvas = document.createElement('canvas');
  exports.context = context = canvas.getContext('webgpu');
  exports.format = format = context.getPreferredFormat(adapter);
  exports.global = global = {
    aspect: undefined
  };
  exports.sampler = sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear'
  });
  Resize(width, height);
  return canvas;
}

function Resize(width, height) {
  context.configure({
    device: device,
    format: format,
    size: {
      width: width,
      height: height
    }
  });
  canvas.width = width;
  canvas.height = height;
  exports.depth = depth = device.createTexture({
    size: {
      width: canvas.width,
      height: canvas.height
    },
    format: 'depth32float',
    usage: GPUTextureUsage.RENDER_ATTACHMENT
  });
  global.aspect = canvas.width / canvas.height;
}

let cameraBuffer;
exports.cameraBuffer = cameraBuffer;
let renderPass;
exports.renderPass = renderPass;
let encoder;

function StartRender(camera) {
  encoder = device.createCommandEncoder();
  exports.renderPass = renderPass = encoder.beginRenderPass({
    colorAttachments: [{
      loadValue: clearColor,
      storeOp: 'store',
      view: context.getCurrentTexture().createView()
    }],
    depthStencilAttachment: {
      depthLoadValue: 1.0,
      depthStoreOp: 'store',
      stencilLoadValue: 0,
      stencilStoreOp: 'store',
      view: depth.createView()
    }
  });
  exports.cameraBuffer = cameraBuffer = camera.Buffer();
}

function FinishRender() {
  renderPass.endPass();
  device.queue.submit([encoder.finish()]);
}

function CreateBuffer(data, usage) {
  const buffer = device.createBuffer({
    size: data.byteLength,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | usage,
    mappedAtCreation: true
  });
  new Uint8Array(buffer.getMappedRange()).set(new Uint8Array(data.buffer));
  buffer.unmap();
  return buffer;
}

function CreateEmptyBuffer(length, usage) {
  const buffer = device.createBuffer({
    size: length,
    usage: usage,
    mappedAtCreation: false
  });
  return buffer;
}

async function ReadBuffer(buffer, size) {
  const temp = CreateEmptyBuffer(size, GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST); // Encode commands for copying buffer to buffer.

  const copyEncoder = device.createCommandEncoder();
  copyEncoder.copyBufferToBuffer(buffer
  /* source buffer */
  , 0
  /* source offset */
  , temp
  /* destination buffer */
  , 0
  /* destination offset */
  , size
  /* size */
  );
  const copyCommands = copyEncoder.finish();
  device.queue.submit([copyCommands]);
  await temp.mapAsync(GPUMapMode.READ);
  const copyArrayBuffer = temp.getMappedRange();
  return copyArrayBuffer;
}
},{}],"gpu/module.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.New = New;

var GPU = _interopRequireWildcard(require("./gpu"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function New(src) {
  const module = GPU.device.createShaderModule({
    code: src
  });
  return module;
}
},{"./gpu":"gpu/gpu.ts"}],"helper/file.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GetServerFile = GetServerFile;
exports.GetUserFile = GetUserFile;

async function GetUserFile(endings) {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '';

    for (let i = 0; i < endings.length; i++) {
      input.accept += '.' + endings[i];

      if (i < endings.length - 1) {
        input.accept += ',';
      }
    }

    input.onchange = async () => {
      const files = input.files;

      if (files == null || files.length == 0) {
        return;
      }

      const file = files[0];
      const sep = file.name.split('.');
      const format = sep[sep.length - 1];

      if (endings.includes(format)) {
        resolve(file);
      } else {
        reject('format "' + format + '" not supported');
      }
    };

    input.click();
  });
}

async function GetServerFile(path) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.onreadystatechange = () => {
      if (request.readyState == 4 && request.status == 200) {
        resolve(request.responseText);
      }
    };

    request.open('GET', path);
    request.send();
    setTimeout(reject, 1000, 'file timeout');
  });
}
},{}],"gpu/lines.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Render = Render;

var GPU = _interopRequireWildcard(require("./gpu"));

var Module = _interopRequireWildcard(require("./module"));

var _file = require("../helper/file");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

let pipeline = undefined;

async function Render(position, length, positions, colors) {
  if (pipeline == undefined) {
    const src = await (0, _file.GetServerFile)('render/lines.wgsl');
    const module = Module.New(src);
    pipeline = GPU.device.createRenderPipeline({
      vertex: {
        module: module,
        entryPoint: 'vertexMain',
        buffers: [{
          attributes: [{
            shaderLocation: 0,
            offset: 0 * 4,
            format: 'float32x3'
          }],
          arrayStride: 4 * 4,
          stepMode: 'vertex'
        }, {
          attributes: [{
            shaderLocation: 1,
            offset: 0 * 4,
            format: 'float32x3'
          }],
          arrayStride: 4 * 4,
          stepMode: 'vertex'
        }]
      },
      fragment: {
        module: module,
        entryPoint: 'fragmentMain',
        targets: [{
          format: GPU.format
        }]
      },
      depthStencil: {
        format: 'depth32float',
        depthWriteEnabled: true,
        depthCompare: 'less'
      },
      primitive: {
        topology: 'line-list'
      }
    });
  }

  const array = new Float32Array(16);
  position.Save(array, 0);
  const buffer = GPU.CreateBuffer(array, GPUBufferUsage.UNIFORM);
  GPU.renderPass.setPipeline(pipeline);
  const group = GPU.device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{
      binding: 0,
      resource: {
        buffer: GPU.cameraBuffer
      }
    }, {
      binding: 1,
      resource: {
        buffer: buffer
      }
    }]
  });
  GPU.renderPass.setBindGroup(0, group);
  GPU.renderPass.setVertexBuffer(0, positions);
  GPU.renderPass.setVertexBuffer(1, colors);
  GPU.renderPass.draw(length);
}
},{"./gpu":"gpu/gpu.ts","./module":"gpu/module.ts","../helper/file":"helper/file.ts"}],"gpu/math.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Matrix = void 0;

class Matrix {
  data;

  constructor(data) {
    this.data = data;
  }

  static Identity() {
    return new Matrix(new Float32Array([
    /*eslint-disable*/
    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1
    /*eslint-enable*/
    ]));
  }

  Save(location, offset) {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        location[offset + i * 4 + j] = this.data[i + j * 4];
      }
    }
  }

  static Translate(x, y, z) {
    return new Matrix(new Float32Array([
    /*eslint-disable*/
    1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1
    /*eslint-enable*/
    ]));
  }

  static RotateX(rad) {
    return new Matrix(new Float32Array([
    /*eslint-disable*/
    1, 0, 0, 0, 0, Math.cos(rad), -Math.sin(rad), 0, 0, Math.sin(rad), Math.cos(rad), 0, 0, 0, 0, 1
    /*eslint-enable*/
    ]));
  }

  static Rotate(rad, axis) {
    const sin = Math.sin(rad);
    const cos = Math.cos(rad);
    const cosN = 1 - cos; //https://en.wikipedia.org/wiki/Rotation_matrix#Rotation_matrix_from_axis_and_angle

    return new Matrix(new Float32Array([
    /*eslint-disable*/
    axis.x * axis.x * cosN + cos, axis.x * axis.y * cosN - axis.z * sin, axis.x * axis.z * cosN + axis.y * sin, 0, axis.y * axis.x * cosN + axis.z * sin, axis.y * axis.y * cosN + cos, axis.y * axis.z * cosN - axis.x * sin, 0, axis.z * axis.x * cosN - axis.y * sin, axis.z * axis.y * cosN + axis.x * sin, axis.z * axis.z * cosN + cos, 0, 0, 0, 0, 1
    /*eslint-enable*/
    ]));
  }

  static RotateY(rad) {
    return new Matrix(new Float32Array([
    /*eslint-disable*/
    Math.cos(rad), 0, Math.sin(rad), 0, 0, 1, 0, 0, -Math.sin(rad), 0, Math.cos(rad), 0, 0, 0, 0, 1
    /*eslint-enable*/
    ]));
  }

  static RotateZ(rad) {
    return new Matrix(new Float32Array([
    /*eslint-disable*/
    Math.cos(rad), -Math.sin(rad), 0, 0, Math.sin(rad), Math.cos(rad), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1
    /*eslint-enable*/
    ]));
  }

  static Scale(x, y, z) {
    return new Matrix(new Float32Array([
    /*eslint-disable*/
    x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1
    /*eslint-enable*/
    ]));
  }

  Multiply(m) {
    const res = new Float32Array(16);

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        for (let c = 0; c < 4; c++) {
          res[i + j * 4] += this.data[c + j * 4] * m.data[i + c * 4];
        }
      }
    }

    return new Matrix(res);
  }

  MultiplyVector(v) {
    return {
      x: this.data[0] * v.x + this.data[1] * v.y + this.data[2] * v.z,
      y: this.data[4] * v.x + this.data[5] * v.y + this.data[6] * v.z,
      z: this.data[8] * v.x + this.data[9] * v.y + this.data[10] * v.z
    };
  }

  Position() {
    return {
      x: this.data[3],
      y: this.data[7],
      z: this.data[11]
    };
  }

  static Perspective(fovy, aspect, near, far) {
    const c2 = (far + near) / (near - far);
    const c1 = 2 * far * near / (near - far);
    const s = 1 / Math.tan(fovy / 2);
    const m = new Float32Array([
    /*eslint-disable*/
    s / aspect, 0, 0, 0, 0, s, 0, 0, 0, 0, c2, c1, 0, 0, -1, 0
    /*eslint-enable*/
    ]);
    return new Matrix(m);
  }

}

exports.Matrix = Matrix;
},{}],"gpu/position.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Position = void 0;

var _math = require("./math");

class Position {
  model;

  constructor() {
    this.model = _math.Matrix.Identity();
  }

  Save(location, offset) {
    this.model.Save(location, offset);
  }

  Translate(x, y, z) {
    this.model = _math.Matrix.Translate(x, y, z).Multiply(this.model);
  }

  RotateX(rad) {
    this.model = _math.Matrix.RotateX(rad).Multiply(this.model);
  }

  RotateXLocal(rad) {
    const p = this.model.Position();
    this.model = _math.Matrix.Translate(p.x, p.y, p.z).Multiply(_math.Matrix.RotateX(rad)).Multiply(_math.Matrix.Translate(-p.x, -p.y, -p.z)).Multiply(this.model);
  }

  RotateY(rad) {
    this.model = _math.Matrix.RotateY(rad).Multiply(this.model);
  }

  RotateYLocal(rad) {
    const p = this.model.Position();
    this.model = _math.Matrix.Translate(p.x, p.y, p.z).Multiply(_math.Matrix.RotateY(rad)).Multiply(_math.Matrix.Translate(-p.x, -p.y, -p.z)).Multiply(this.model);
  }

  RotateZ(rad) {
    this.model = _math.Matrix.RotateZ(rad).Multiply(this.model);
  }

  RotateZLocal(rad) {
    const p = this.model.Position();
    this.model = _math.Matrix.Translate(p.x, p.y, p.z).Multiply(_math.Matrix.RotateZ(rad)).Multiply(_math.Matrix.Translate(-p.x, -p.y, -p.z)).Multiply(this.model);
  }

  Scale(x, y, z) {
    this.model = _math.Matrix.Scale(x, y, z).Multiply(this.model);
  }

}

exports.Position = Position;
},{"./math":"gpu/math.ts"}],"gpu/camera.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Camera = void 0;

var _math = require("./math");

var GPU = _interopRequireWildcard(require("./gpu"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

class Camera {
  projection;
  view;
  fov;

  constructor(fieldOfView) {
    this.projection = _math.Matrix.Perspective(fieldOfView, GPU.global.aspect, 0.1, 1000);
    this.view = _math.Matrix.Identity();
    this.fov = fieldOfView;
  }

  set fieldOfView(val) {
    this.fov = val;
    this.projection = _math.Matrix.Perspective(val, GPU.global.aspect, 0.1, 100);
  }

  get fieldOfView() {
    return this.fov;
  }

  Buffer() {
    const array = new Float32Array(16 * 2);
    this.projection.Save(array, 0);
    this.view.Save(array, 16);
    return GPU.CreateBuffer(array, GPUBufferUsage.UNIFORM);
  }

  UpdateSize() {
    this.projection = _math.Matrix.Perspective(this.fov, GPU.global.aspect, 1, 1000);
  }

  Translate(x, y, z) {
    this.view = _math.Matrix.Translate(-x, -y, -z).Multiply(this.view);
  }

  RotateX(rad) {
    this.view = _math.Matrix.RotateX(-rad).Multiply(this.view);
  }

  RotateY(rad) {
    this.view = _math.Matrix.RotateY(-rad).Multiply(this.view);
  }

  RotateGlobalY(rad) {
    const axis = this.view.MultiplyVector({
      x: 0,
      y: 1,
      z: 0
    });
    this.view = _math.Matrix.Rotate(-rad, axis).Multiply(this.view);
  }

  RotateZ(rad) {
    this.view = _math.Matrix.RotateZ(-rad).Multiply(this.view);
  }

}

exports.Camera = Camera;
},{"./math":"gpu/math.ts","./gpu":"gpu/gpu.ts"}],"loader/cube.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CreateCube = CreateCube;

var GPU = _interopRequireWildcard(require("../gpu/gpu"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function CreateCube(points, noise = 0.001) {
  const vertices = new Float32Array(points * 4);

  for (let i = 0; i < points; i++) {
    switch (Math.floor(Math.random() * 6)) {
      case 0:
        vertices[i * 4 + 0] = Math.random() * 2 - 1;
        vertices[i * 4 + 1] = Math.random() * 2 - 1;
        vertices[i * 4 + 2] = -1;
        break;

      case 1:
        vertices[i * 4 + 0] = Math.random() * 2 - 1;
        vertices[i * 4 + 1] = Math.random() * 2 - 1;
        vertices[i * 4 + 2] = 1;
        break;

      case 2:
        vertices[i * 4 + 0] = Math.random() * 2 - 1;
        vertices[i * 4 + 1] = -1;
        vertices[i * 4 + 2] = Math.random() * 2 - 1;
        break;

      case 3:
        vertices[i * 4 + 0] = Math.random() * 2 - 1;
        vertices[i * 4 + 1] = 1;
        vertices[i * 4 + 2] = Math.random() * 2 - 1;
        break;

      case 4:
        vertices[i * 4 + 0] = -1;
        vertices[i * 4 + 1] = Math.random() * 2 - 1;
        vertices[i * 4 + 2] = Math.random() * 2 - 1;
        break;

      case 5:
        vertices[i * 4 + 0] = 1;
        vertices[i * 4 + 1] = Math.random() * 2 - 1;
        vertices[i * 4 + 2] = Math.random() * 2 - 1;
        break;
    }

    vertices[i * 4 + 0] += noise * Math.random();
    vertices[i * 4 + 1] += noise * Math.random();
    vertices[i * 4 + 2] += noise * Math.random();
  }

  return GPU.CreateBuffer(vertices, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
}
},{"../gpu/gpu":"gpu/gpu.ts"}],"gpu/cloud.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Render = Render;

var GPU = _interopRequireWildcard(require("./gpu"));

var Module = _interopRequireWildcard(require("./module"));

var _file = require("../helper/file");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

let quadBuffer = undefined;
let pipeline = undefined;

async function Render(position, radius, length, positions, colors) {
  if (pipeline == undefined || quadBuffer == undefined) {
    const src = await (0, _file.GetServerFile)('render/cloud.wgsl');
    const module = Module.New(src);
    pipeline = GPU.device.createRenderPipeline({
      vertex: {
        module: module,
        entryPoint: 'vertexMain',
        buffers: [{
          attributes: [{
            shaderLocation: 0,
            offset: 0 * 4,
            format: 'float32x2'
          }],
          arrayStride: 2 * 4,
          stepMode: 'vertex'
        }, {
          attributes: [{
            shaderLocation: 1,
            offset: 0 * 4,
            format: 'float32x3'
          }],
          arrayStride: 4 * 4,
          stepMode: 'instance'
        }, {
          attributes: [{
            shaderLocation: 2,
            offset: 0 * 4,
            format: 'float32x3'
          }],
          arrayStride: 4 * 4,
          stepMode: 'instance'
        }]
      },
      fragment: {
        module: module,
        entryPoint: 'fragmentMain',
        targets: [{
          format: GPU.format
        }]
      },
      depthStencil: {
        format: 'depth32float',
        depthWriteEnabled: true,
        depthCompare: 'less'
      },
      primitive: {
        topology: 'triangle-strip',
        stripIndexFormat: 'uint32',
        cullMode: 'back'
      }
    });
    quadBuffer = GPU.CreateBuffer(new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]), GPUBufferUsage.VERTEX);
  }

  const array = new Float32Array(16 + 2);
  position.Save(array, 0);
  array[16] = radius;
  array[17] = GPU.global.aspect;
  const buffer = GPU.CreateBuffer(array, GPUBufferUsage.UNIFORM);
  GPU.renderPass.setPipeline(pipeline);
  const group = GPU.device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{
      binding: 0,
      resource: {
        buffer: GPU.cameraBuffer
      }
    }, {
      binding: 1,
      resource: {
        buffer: buffer
      }
    }]
  });
  GPU.renderPass.setBindGroup(0, group);
  GPU.renderPass.setVertexBuffer(0, quadBuffer);
  GPU.renderPass.setVertexBuffer(1, positions);
  GPU.renderPass.setVertexBuffer(2, colors);
  GPU.renderPass.draw(4, length);
}
},{"./gpu":"gpu/gpu.ts","./module":"gpu/module.ts","../helper/file":"helper/file.ts"}],"gpu/kNearest.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Compute = Compute;
exports.Render = Render;

var GPU = _interopRequireWildcard(require("./gpu"));

var Module = _interopRequireWildcard(require("./module"));

var _file = require("../helper/file");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

let computePipeline = undefined;
let renderPipeline = undefined;

async function Compute(k, positions, length) {
  if (computePipeline == undefined) {
    computePipeline = GPU.device.createComputePipeline({
      compute: {
        module: Module.New(await (0, _file.GetServerFile)('compute/kNearest.wgsl')),
        entryPoint: 'main'
      }
    });
  }

  const nearest = GPU.CreateEmptyBuffer(length * 4 * k, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC);
  const param = new Uint32Array([length, k]);
  const buffer = GPU.CreateBuffer(param, GPUBufferUsage.STORAGE);
  const group = GPU.device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [{
      binding: 0,
      resource: {
        buffer: buffer
      }
    }, {
      binding: 1,
      resource: {
        buffer: positions
      }
    }, {
      binding: 3,
      resource: {
        buffer: nearest
      }
    }]
  });
  const encoder = GPU.device.createCommandEncoder();
  const compute = encoder.beginComputePass({});
  compute.setPipeline(computePipeline);
  compute.setBindGroup(0, group);
  compute.dispatch(Math.ceil(length / 256));
  compute.endPass();
  GPU.device.queue.submit([encoder.finish()]);
  return nearest;
}

async function Render(position, positions, colors, nearest, k, length) {
  if (renderPipeline == undefined) {
    const src = await (0, _file.GetServerFile)('render/kNearest.wgsl');
    const module = Module.New(src);
    renderPipeline = GPU.device.createRenderPipeline({
      vertex: {
        module: module,
        entryPoint: 'vertexMain',
        buffers: []
      },
      fragment: {
        module: module,
        entryPoint: 'fragmentMain',
        targets: [{
          format: GPU.format
        }]
      },
      depthStencil: {
        format: 'depth32float',
        depthWriteEnabled: true,
        depthCompare: 'less'
      },
      primitive: {
        topology: 'line-list'
      }
    });
  }

  const array = new Float32Array(16 + 1);
  position.Save(array, 0);
  new Uint32Array(array.buffer)[16] = k;
  const buffer = GPU.CreateBuffer(array, GPUBufferUsage.UNIFORM);
  GPU.renderPass.setPipeline(renderPipeline);
  const group = GPU.device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [{
      binding: 0,
      resource: {
        buffer: GPU.cameraBuffer
      }
    }, {
      binding: 1,
      resource: {
        buffer: buffer
      }
    }, {
      binding: 2,
      resource: {
        buffer: positions
      }
    }, {
      binding: 3,
      resource: {
        buffer: colors
      }
    }, {
      binding: 4,
      resource: {
        buffer: nearest
      }
    }]
  });
  GPU.renderPass.setBindGroup(0, group);
  GPU.renderPass.draw(length * k * 2);
}
},{"./gpu":"gpu/gpu.ts","./module":"gpu/module.ts","../helper/file":"helper/file.ts"}],"gpu/triangulate.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Compute = Compute;
exports.K = void 0;
exports.Render = Render;

var GPU = _interopRequireWildcard(require("./gpu"));

var Module = _interopRequireWildcard(require("./module"));

var _file = require("../helper/file");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

let computePipeline = undefined;
let renderPipeline = undefined;
const K = 16;
exports.K = K;

async function Compute(positions, length) {
  if (computePipeline == undefined) {
    computePipeline = GPU.device.createComputePipeline({
      compute: {
        module: Module.New(await (0, _file.GetServerFile)('compute/triangulate.wgsl')),
        entryPoint: 'main'
      }
    });
  }

  const nearest = GPU.CreateEmptyBuffer(length * 4 * K, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC);
  const encoder = GPU.device.createCommandEncoder();
  const param = new Uint32Array([length]);
  const buffer = GPU.CreateBuffer(param, GPUBufferUsage.STORAGE);
  const group = GPU.device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [{
      binding: 0,
      resource: {
        buffer: buffer
      }
    }, {
      binding: 1,
      resource: {
        buffer: positions
      }
    }, {
      binding: 2,
      resource: {
        buffer: nearest
      }
    }]
  });
  const compute = encoder.beginComputePass();
  compute.setPipeline(computePipeline);
  compute.setBindGroup(0, group);
  compute.dispatch(Math.ceil(length / 256));
  compute.endPass();
  GPU.device.queue.submit([encoder.finish()]);
  return nearest;
}

async function Render(position, positions, colors, nearest, k, length) {
  if (renderPipeline == undefined) {
    const src = await (0, _file.GetServerFile)('render/triangle.wgsl');
    const module = Module.New(src);
    renderPipeline = GPU.device.createRenderPipeline({
      vertex: {
        module: module,
        entryPoint: 'vertexMain',
        buffers: []
      },
      fragment: {
        module: module,
        entryPoint: 'fragmentMain',
        targets: [{
          format: GPU.format
        }]
      },
      depthStencil: {
        format: 'depth32float',
        depthWriteEnabled: true,
        depthCompare: 'less'
      },
      primitive: {
        topology: 'triangle-list'
      }
    });
  }

  const array = new Float32Array(16 + 1);
  position.Save(array, 0);
  new Uint32Array(array.buffer)[16] = k;
  const buffer = GPU.CreateBuffer(array, GPUBufferUsage.UNIFORM);
  GPU.renderPass.setPipeline(renderPipeline);
  const group = GPU.device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [{
      binding: 0,
      resource: {
        buffer: GPU.cameraBuffer
      }
    }, {
      binding: 1,
      resource: {
        buffer: buffer
      }
    }, {
      binding: 2,
      resource: {
        buffer: positions
      }
    }, {
      binding: 3,
      resource: {
        buffer: colors
      }
    }, {
      binding: 4,
      resource: {
        buffer: nearest
      }
    }]
  });
  GPU.renderPass.setBindGroup(0, group);
  GPU.renderPass.draw(length * k * 3);
}
},{"./gpu":"gpu/gpu.ts","./module":"gpu/module.ts","../helper/file":"helper/file.ts"}],"gpu/filter.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Compute = Compute;

var GPU = _interopRequireWildcard(require("./gpu"));

var Module = _interopRequireWildcard(require("./module"));

var _file = require("../helper/file");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

let computePipeline = undefined;

async function Compute(nearest, k, length) {
  if (computePipeline == undefined) {
    computePipeline = GPU.device.createComputePipeline({
      compute: {
        module: Module.New(await (0, _file.GetServerFile)('compute/filter.wgsl')),
        entryPoint: 'main'
      }
    });
  }

  const param = new Uint32Array([length, k]);
  const buffer = GPU.CreateBuffer(param, GPUBufferUsage.STORAGE);
  const group = GPU.device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [{
      binding: 0,
      resource: {
        buffer: buffer
      }
    }, {
      binding: 1,
      resource: {
        buffer: nearest
      }
    }]
  });
  const encoder = GPU.device.createCommandEncoder();
  const compute = encoder.beginComputePass({});
  compute.setPipeline(computePipeline);
  compute.setBindGroup(0, group);
  compute.dispatch(Math.ceil(length / 256));
  compute.endPass();
  GPU.device.queue.submit([encoder.finish()]);
}
},{"./gpu":"gpu/gpu.ts","./module":"gpu/module.ts","../helper/file":"helper/file.ts"}],"gpu/edge.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Compute = Compute;

var GPU = _interopRequireWildcard(require("./gpu"));

var Module = _interopRequireWildcard(require("./module"));

var _file = require("../helper/file");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

let computePipeline = undefined;

async function Compute(cloud, nearest, colors, k, length) {
  if (computePipeline == undefined) {
    computePipeline = GPU.device.createComputePipeline({
      compute: {
        module: Module.New(await (0, _file.GetServerFile)('compute/edge.wgsl')),
        entryPoint: 'main'
      }
    });
  }

  const param = new Uint32Array([length, k]);
  const buffer = GPU.CreateBuffer(param, GPUBufferUsage.STORAGE);
  const group = GPU.device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [{
      binding: 0,
      resource: {
        buffer: buffer
      }
    }, {
      binding: 1,
      resource: {
        buffer: cloud
      }
    }, {
      binding: 2,
      resource: {
        buffer: nearest
      }
    }, {
      binding: 3,
      resource: {
        buffer: colors
      }
    }]
  });
  const encoder = GPU.device.createCommandEncoder();
  const compute = encoder.beginComputePass({});
  compute.setPipeline(computePipeline);
  compute.setBindGroup(0, group);
  compute.dispatch(Math.ceil(length / 256));
  compute.endPass();
  GPU.device.queue.submit([encoder.finish()]);
}
},{"./gpu":"gpu/gpu.ts","./module":"gpu/module.ts","../helper/file":"helper/file.ts"}],"gpu/edgeOld.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Compute = Compute;

var GPU = _interopRequireWildcard(require("./gpu"));

var Module = _interopRequireWildcard(require("./module"));

var _file = require("../helper/file");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

let computePipeline = undefined;

async function Compute(cloud, nearest, colors, k, length) {
  if (computePipeline == undefined) {
    computePipeline = GPU.device.createComputePipeline({
      compute: {
        module: Module.New(await (0, _file.GetServerFile)('compute/edgeOld.wgsl')),
        entryPoint: 'main'
      }
    });
  }

  const param = new Uint32Array([length, k]);
  const buffer = GPU.CreateBuffer(param, GPUBufferUsage.STORAGE);
  const group = GPU.device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [{
      binding: 0,
      resource: {
        buffer: buffer
      }
    }, {
      binding: 1,
      resource: {
        buffer: cloud
      }
    }, {
      binding: 2,
      resource: {
        buffer: nearest
      }
    }, {
      binding: 3,
      resource: {
        buffer: colors
      }
    }]
  });
  const encoder = GPU.device.createCommandEncoder();
  const compute = encoder.beginComputePass({});
  compute.setPipeline(computePipeline);
  compute.setBindGroup(0, group);
  compute.dispatch(Math.ceil(length / 256));
  compute.endPass();
  GPU.device.queue.submit([encoder.finish()]);
}
},{"./gpu":"gpu/gpu.ts","./module":"gpu/module.ts","../helper/file":"helper/file.ts"}],"loader/color.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CreateColors = CreateColors;

var GPU = _interopRequireWildcard(require("../gpu/gpu"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function CreateColors(points) {
  const colors = new Float32Array(points * 4);

  for (let i = 0; i < points; i++) {
    colors[i * 4 + 0] = 0.3 + 0.7 * Math.random();
    colors[i * 4 + 1] = 0.3 + 0.7 * Math.random();
    colors[i * 4 + 2] = 0.3 + 0.7 * Math.random();
  }

  return GPU.CreateBuffer(colors, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
}
},{"../gpu/gpu":"gpu/gpu.ts"}],"loader/grid.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CreateGrid = CreateGrid;

var GPU = _interopRequireWildcard(require("../gpu/gpu"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function CreateGrid(amount) {
  const positions = new Float32Array((amount * 4 + 3) * 8);
  const colors = new Float32Array((amount * 4 + 3) * 8);

  const addLine = (idx, start, end, color, endColor = undefined) => {
    if (endColor == undefined) {
      endColor = color;
    }

    idx *= 8;
    positions[idx + 0] = start.x;
    positions[idx + 1] = start.y;
    positions[idx + 2] = start.z;
    colors[idx + 0] = color.x;
    colors[idx + 1] = color.y;
    colors[idx + 2] = color.z;
    positions[idx + 4] = end.x;
    positions[idx + 5] = end.y;
    positions[idx + 6] = end.z;
    colors[idx + 4] = endColor.x;
    colors[idx + 5] = endColor.y;
    colors[idx + 6] = endColor.z;
  };

  for (let i = -amount; i <= amount; i++) {
    if (i == 0) {
      continue;
    }

    let idx;

    if (i < 0) {
      idx = i;
    } else if (i == 0) {
      continue;
    } else {
      idx = i - 1;
    }

    addLine(amount * 1 + idx, {
      x: i,
      y: 0,
      z: amount
    }, {
      x: i,
      y: 0,
      z: -amount
    }, {
      x: 1,
      y: 1,
      z: 1
    });
    addLine(amount * 3 + idx, {
      x: amount,
      y: 0,
      z: i
    }, {
      x: -amount,
      y: 0,
      z: i
    }, {
      x: 1,
      y: 1,
      z: 1
    });
  } //3 main axes


  addLine(amount * 4 + 0, {
    x: -amount,
    y: 0,
    z: 0
  }, {
    x: amount,
    y: 0,
    z: 0
  }, {
    x: 1,
    y: 1,
    z: 1
  }, {
    x: 1,
    y: 0,
    z: 0
  });
  addLine(amount * 4 + 1, {
    x: 0,
    y: -amount,
    z: 0
  }, {
    x: 0,
    y: amount,
    z: 0
  }, {
    x: 1,
    y: 1,
    z: 1
  }, {
    x: 0,
    y: 1,
    z: 0
  });
  addLine(amount * 4 + 2, {
    x: 0,
    y: 0,
    z: -amount
  }, {
    x: 0,
    y: 0,
    z: amount
  }, {
    x: 1,
    y: 1,
    z: 1
  }, {
    x: 0,
    y: 0,
    z: 1
  });
  return {
    length: (amount * 4 + 3) * 2,
    positions: GPU.CreateBuffer(positions, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE),
    colors: GPU.CreateBuffer(colors, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE)
  };
}
},{"../gpu/gpu":"gpu/gpu.ts"}],"loader/sphere.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CreateSphere = CreateSphere;

var GPU = _interopRequireWildcard(require("../gpu/gpu"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function CreateSphere(points) {
  const vertices = new Float32Array(points * 4);

  for (let i = 0; i < points; i++) {
    const long = Math.acos(Math.random() * 2 - 1); //less points near the poles

    const lat = Math.random() * 2 * Math.PI;
    vertices[i * 4 + 0] = Math.sin(lat) * Math.sin(long);
    vertices[i * 4 + 1] = Math.cos(long);
    vertices[i * 4 + 2] = Math.cos(lat) * Math.sin(long);
  }

  return GPU.CreateBuffer(vertices, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
}
},{"../gpu/gpu":"gpu/gpu.ts"}],"loader/decompress.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LZF = LZF;

//https://gitlab.com/taketwo/three-pcd-loader/-/blob/master/decompress-lzf.js //edited
function LZF(inData, outLength) {
  const inLength = inData.length;
  const outData = new Uint8Array(outLength);
  let inPtr = 0;
  let outPtr = 0;

  do {
    let ctrl = inData[inPtr++];

    if (ctrl < 1 << 5) {
      ctrl++;
      if (outPtr + ctrl > outLength) throw new Error('Output buffer is not large enough');
      if (inPtr + ctrl > inLength) throw new Error('Invalid compressed data');

      do {
        outData[outPtr++] = inData[inPtr++];
      } while (--ctrl);
    } else {
      let len = ctrl >> 5;
      let ref = outPtr - ((ctrl & 0x1f) << 8) - 1;
      if (inPtr >= inLength) throw new Error('Invalid compressed data');

      if (len === 7) {
        len += inData[inPtr++];
        if (inPtr >= inLength) throw new Error('Invalid compressed data');
      }

      ref -= inData[inPtr++];
      if (outPtr + len + 2 > outLength) throw new Error('Output buffer is not large enough');
      if (ref < 0) throw new Error('Invalid compressed data');
      if (ref >= outPtr) throw new Error('Invalid compressed data');

      do {
        outData[outPtr++] = outData[ref++];
      } while (--len + 2);
    }
  } while (inPtr < inLength);

  return outData;
}
},{}],"loader/pcd.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CreatePCD = CreatePCD;

var Decompress = _interopRequireWildcard(require("./decompress"));

var GPU = _interopRequireWildcard(require("../gpu/gpu"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

//https://gitlab.com/taketwo/three-pcd-loader/-/blob/master/pcd-loader.js //edited

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
const littleEndian = true;

function CreatePCD(data) {
  const header = parseHeader(data);

  if (header == null) {
    return undefined;
  }

  const offset = header.offset;
  let position = undefined;

  if (offset.x !== undefined && offset.y !== undefined && offset.z !== undefined) {
    position = new Float32Array(header.points * 4);
  }

  let color = undefined;
  let color_offset = undefined;

  if (offset.rgb !== undefined || offset.rgba !== undefined) {
    color = new Float32Array(header.points * 4);
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

    for (let i = 0; i < lines.length; i++, i3 += 4) {
      const line = lines[i].split(' ');

      if (position !== undefined) {
        position[i3 + 0] = parseFloat(line[offset.x]);
        position[i3 + 1] = parseFloat(line[offset.y]);
        position[i3 + 2] = parseFloat(line[offset.z]);
      }

      if (color !== undefined) {
        let c = undefined;

        if (offset.rgba !== undefined) {
          c = new Uint32Array([parseInt(line[offset.rgba])]);
        } else if (offset.rgb !== undefined) {
          c = new Float32Array([parseFloat(line[offset.rgb])]);
        }

        const dataview = new Uint8Array(c.buffer, 0);
        color[i3 + 2] = dataview[0] / 255.0;
        color[i3 + 1] = dataview[1] / 255.0;
        color[i3 + 0] = dataview[2] / 255.0;
      }
    }
  } else if (header.data === 'binary') {
    let row = 0;
    const dataArrayView = new DataView(data, header.headerLen);

    for (let p = 0; p < header.points; row += header.rowSize, p++) {
      if (position !== undefined) {
        position[p * 4 + 0] = dataArrayView.getFloat32(row + offset.x, littleEndian);
        position[p * 4 + 1] = dataArrayView.getFloat32(row + offset.y, littleEndian);
        position[p * 4 + 2] = dataArrayView.getFloat32(row + offset.z, littleEndian);
      }

      if (color !== undefined) {
        color[p * 4 + 2] = dataArrayView.getUint8(row + color_offset + 0) / 255.0;
        color[p * 4 + 1] = dataArrayView.getUint8(row + color_offset + 1) / 255.0;
        color[p * 4 + 0] = dataArrayView.getUint8(row + color_offset + 2) / 255.0;
      }
    }
  } else if (header.data === 'binary_compressed') {
    const sizes = new Uint32Array(data.slice(header.headerLen, header.headerLen + 8));
    const compressedSize = sizes[0];
    const decompressedSize = sizes[1];
    const decompressed = Decompress.LZF(new Uint8Array(data, header.headerLen + 8, compressedSize), decompressedSize);
    const dataArrayView = new DataView(decompressed.buffer);

    for (let p = 0; p < header.points; p++) {
      if (position !== undefined) {
        position[p * 4 + 0] = dataArrayView.getFloat32(offset.x + p * 4, littleEndian);
        position[p * 4 + 1] = dataArrayView.getFloat32(offset.y + p * 4, littleEndian);
        position[p * 4 + 2] = dataArrayView.getFloat32(offset.z + p * 4, littleEndian);
      }

      if (color !== undefined) {
        color[p * 4 + 2] = dataArrayView.getUint8(color_offset + p * 4 + 0) / 255.0;
        color[p * 4 + 1] = dataArrayView.getUint8(color_offset + p * 4 + 1) / 255.0;
        color[p * 4 + 0] = dataArrayView.getUint8(color_offset + p * 4 + 2) / 255.0;
      }
    }
  }

  if (position == undefined) {
    return undefined;
  }

  return [GPU.CreateBuffer(position, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE), header.points];
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
  header.str = headerText.substr(0, header.headerLen); // Remove comments

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
    } else if (header.data === 'binary') {
      header.offset[header.fields[j]] = sizeSum;
      sizeSum += header.size[j];
    } else if (header.data === 'binary_compressed') {
      header.offset[header.fields[j]] = sizeSum;
      sizeSum += header.size[j] * header.points;
    }
  } // For binary only


  header.rowSize = sizeSum;
  return header;
}
},{"./decompress":"loader/decompress.ts","../gpu/gpu":"gpu/gpu.ts"}],"main.ts":[function(require,module,exports) {
"use strict";

var GPU = _interopRequireWildcard(require("./gpu/gpu"));

var Lines = _interopRequireWildcard(require("./gpu/lines"));

var _position = require("./gpu/position");

var _camera = require("./gpu/camera");

var _cube = require("./loader/cube");

var Cloud = _interopRequireWildcard(require("./gpu/cloud"));

var KNearest = _interopRequireWildcard(require("./gpu/kNearest"));

var Triangulate = _interopRequireWildcard(require("./gpu/triangulate"));

var Filter = _interopRequireWildcard(require("./gpu/filter"));

var Edge = _interopRequireWildcard(require("./gpu/edge"));

var EdgeOld = _interopRequireWildcard(require("./gpu/edgeOld"));

var _color = require("./loader/color");

var _grid = require("./loader/grid");

var _sphere = require("./loader/sphere");

var _pcd = require("./loader/pcd");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

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
    botLine.innerHTML = 'Only tested with <a href="https://www.google.com/chrome">Google Chrome</a>';
    error.append(botLine);
    document.body.append(error);
    return;
  }

  display.append(canvas);
  const cam = new _camera.Camera(Math.PI / 4);
  cam.Translate(0, 5, 30);
  const increase = new _position.Position();
  increase.Scale(5, 5, 5);
  const normal = new _position.Position();
  let k = 64;
  let kOld = k;
  let length = 50_000;
  let lengthOld = length;
  let form = 'sphere';
  let cloud = (0, _sphere.CreateSphere)(length);
  let colors = (0, _color.CreateColors)(length);
  const grid = (0, _grid.CreateGrid)(10);

  display.onwheel = ev => {
    const scale = 1 + ev.deltaY / 1000;

    if (ev.ctrlKey == false) {
      increase.Scale(scale, scale, scale);
    } else {
      let fov = cam.fieldOfView * scale;

      if (fov < Math.PI / 10) {
        fov = Math.PI / 10;
      }

      if (fov > Math.PI * 9 / 10) {
        fov = Math.PI * 9 / 10;
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
  let nearest = undefined;

  document.body.onkeydown = async ev => {
    keys[ev.code] = true;

    switch (ev.code) {
      case 'KeyH':
        makeHint('Left mouse button: rotate camera', 'Mouse wheel: change cloud size', 'Mouse wheel + Control: change field of view', 'QWER: move camera', '1: change cloud form', '1 + Control: change cloud size for sphere and cube', '2: compute k nearest points', '2 + Control: change k', '3: compute triangulation', '4: approximate normal (best with triangulation)', '4 + Control: approximate normal (best with k-nearest)', 'Space: render connections with polygons', '0: open notes (german)');
        break;

      case 'Digit1':
        if (ev.ctrlKey) {
          const number = getUserNumber('input new cloud size');

          if (number != undefined) {
            lengthOld = number;
            form = 'test';
          } else {
            break;
          }
        }

        cloud.destroy();
        colors.destroy();

        switch (form) {
          case 'sphere':
            length = lengthOld;
            cloud = (0, _cube.CreateCube)(length);
            form = 'cube';
            break;

          case 'cube':
            {
              const response = await fetch('../src/loader/pcd/bunny.pcd');
              const content = await (await response.blob()).arrayBuffer();
              const result = (0, _pcd.CreatePCD)(content);

              if (result != undefined) {
                [cloud, length] = result;
              } else {
                alert('pcd error');
              }

              form = 'bunny';
              break;
            }

          case 'bunny':
            {
              const response = await fetch('../src/loader/pcd/rops_cloud.pcd');
              const content = await (await response.blob()).arrayBuffer();
              const result = (0, _pcd.CreatePCD)(content);

              if (result != undefined) {
                [cloud, length] = result;
              } else {
                alert('pcd error');
              }

              form = 'test';
              break;
            }

          case 'test':
            length = lengthOld;
            cloud = (0, _sphere.CreateSphere)(length);
            form = 'sphere';
            break;
        }

        colors = (0, _color.CreateColors)(length);

        if (nearest != undefined) {
          nearest.destroy();
          nearest = undefined;
        }

        break;

      case 'Digit2':
        if (ev.ctrlKey) {
          const number = getUserNumber('input new k for nearest points');

          if (number != undefined) {
            kOld = number;
          }
        }

        if (nearest != undefined) {
          nearest.destroy();
        }

        k = kOld;
        nearest = await KNearest.Compute(k, cloud, length);
        break;

      case 'Digit3':
        if (nearest != undefined) {
          nearest.destroy();
        }

        nearest = await Triangulate.Compute(cloud, length);
        k = Triangulate.K;
        break;

      case 'Digit4':
        if (nearest == undefined) {
          alert('please calculate the connections first');
          break;
        }

        if (ev.ctrlKey == false) {
          await Edge.Compute(cloud, nearest, colors, k, length);
        } else {
          await EdgeOld.Compute(cloud, nearest, colors, k, length);
        }

        break;

      case 'Digit5':
        if (nearest == undefined) {
          alert('please calculate the connections first');
          break;
        }

        await Filter.Compute(nearest, k, length);
        break;

      case 'Digit0':
        window.open('notes.html', '_blank');
    }
  };

  document.body.onkeyup = ev => {
    delete keys[ev.code];
  };

  makeHint('press \'H\' for help');

  display.onmousemove = ev => {
    if ((ev.buttons & 1) != 0) {
      cam.RotateX(-ev.movementY / 200);
      cam.RotateGlobalY(-ev.movementX / 200);
    }
  };

  let last;
  requestAnimationFrame(time => {
    last = time;
  });

  async function Draw(time) {
    const delta = time - last;

    if (delta > 25) {
      console.log(delta);
    }

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
    GPU.StartRender(cam);
    await Lines.Render(normal, grid.length, grid.positions, grid.colors);

    if (nearest != undefined) {
      if (keys['Space'] == undefined) {
        await Cloud.Render(increase, 0.015, length, cloud, colors);
        await KNearest.Render(increase, cloud, colors, nearest, k, length);
      } else {
        await Triangulate.Render(increase, cloud, colors, nearest, k, length);
      }
    } else {
      await Cloud.Render(increase, 0.015, length, cloud, colors);
    }

    GPU.FinishRender();
    last = time;
    requestAnimationFrame(Draw);
  }

  requestAnimationFrame(Draw);
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
},{"./gpu/gpu":"gpu/gpu.ts","./gpu/lines":"gpu/lines.ts","./gpu/position":"gpu/position.ts","./gpu/camera":"gpu/camera.ts","./loader/cube":"loader/cube.ts","./gpu/cloud":"gpu/cloud.ts","./gpu/kNearest":"gpu/kNearest.ts","./gpu/triangulate":"gpu/triangulate.ts","./gpu/filter":"gpu/filter.ts","./gpu/edge":"gpu/edge.ts","./gpu/edgeOld":"gpu/edgeOld.ts","./loader/color":"loader/color.ts","./loader/grid":"loader/grid.ts","./loader/sphere":"loader/sphere.ts","./loader/pcd":"loader/pcd.ts"}],"../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "62060" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../node_modules/parcel-bundler/src/builtins/hmr-runtime.js","main.ts"], null)
//# sourceMappingURL=/main.c39d6dcf.js.map