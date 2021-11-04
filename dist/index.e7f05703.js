// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

(function(modules, entry, mainEntry, parcelRequireName, globalName) {
  /* eslint-disable no-undef */
  var globalObject =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof self !== 'undefined'
      ? self
      : typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
      ? global
      : {};
  /* eslint-enable no-undef */

  // Save the require from previous bundle to this closure if any
  var previousRequire =
    typeof globalObject[parcelRequireName] === 'function' &&
    globalObject[parcelRequireName];

  var cache = previousRequire.cache || {};
  // Do not use `require` to prevent Webpack from trying to bundle this call
  var nodeRequire =
    typeof module !== 'undefined' &&
    typeof module.require === 'function' &&
    module.require.bind(module);

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire =
          typeof globalObject[parcelRequireName] === 'function' &&
          globalObject[parcelRequireName];
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

        var err = new Error("Cannot find module '" + name + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = (cache[name] = new newRequire.Module(name));

      modules[name][0].call(
        module.exports,
        localRequire,
        module,
        module.exports,
        this
      );
    }

    return cache[name].exports;

    function localRequire(x) {
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x) {
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
  newRequire.register = function(id, exports) {
    modules[id] = [
      function(require, module) {
        module.exports = exports;
      },
      {},
    ];
  };

  Object.defineProperty(newRequire, 'root', {
    get: function() {
      return globalObject[parcelRequireName];
    },
  });

  globalObject[parcelRequireName] = newRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (mainEntry) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(mainEntry);

    // CommonJS
    if (typeof exports === 'object' && typeof module !== 'undefined') {
      module.exports = mainExports;

      // RequireJS
    } else if (typeof define === 'function' && define.amd) {
      define(function() {
        return mainExports;
      });

      // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }
})({"kKPlw":[function(require,module,exports) {
var HMR_HOST = null;
var HMR_PORT = null;
var HMR_SECURE = false;
var HMR_ENV_HASH = "4a236f9275d0a351";
module.bundle.HMR_BUNDLE_ID = "3a6cf3c0e7f05703";
"use strict";
function _createForOfIteratorHelper(o, allowArrayLike) {
    var it;
    if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) {
        if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
            if (it) o = it;
            var i = 0;
            var F = function F() {
            };
            return {
                s: F,
                n: function n() {
                    if (i >= o.length) return {
                        done: true
                    };
                    return {
                        done: false,
                        value: o[i++]
                    };
                },
                e: function e(_e) {
                    throw _e;
                },
                f: F
            };
        }
        throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var normalCompletion = true, didErr = false, err;
    return {
        s: function s() {
            it = o[Symbol.iterator]();
        },
        n: function n() {
            var step = it.next();
            normalCompletion = step.done;
            return step;
        },
        e: function e(_e2) {
            didErr = true;
            err = _e2;
        },
        f: function f() {
            try {
                if (!normalCompletion && it.return != null) it.return();
            } finally{
                if (didErr) throw err;
            }
        }
    };
}
function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
/* global HMR_HOST, HMR_PORT, HMR_ENV_HASH, HMR_SECURE */ /*::
import type {
  HMRAsset,
  HMRMessage,
} from '@parcel/reporter-dev-server/src/HMRServer.js';
interface ParcelRequire {
  (string): mixed;
  cache: {|[string]: ParcelModule|};
  hotData: mixed;
  Module: any;
  parent: ?ParcelRequire;
  isParcelRequire: true;
  modules: {|[string]: [Function, {|[string]: string|}]|};
  HMR_BUNDLE_ID: string;
  root: ParcelRequire;
}
interface ParcelModule {
  hot: {|
    data: mixed,
    accept(cb: (Function) => void): void,
    dispose(cb: (mixed) => void): void,
    // accept(deps: Array<string> | string, cb: (Function) => void): void,
    // decline(): void,
    _acceptCallbacks: Array<(Function) => void>,
    _disposeCallbacks: Array<(mixed) => void>,
  |};
}
declare var module: {bundle: ParcelRequire, ...};
declare var HMR_HOST: string;
declare var HMR_PORT: string;
declare var HMR_ENV_HASH: string;
declare var HMR_SECURE: boolean;
*/ var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;
function Module(moduleName) {
    OldModule.call(this, moduleName);
    this.hot = {
        data: module.bundle.hotData,
        _acceptCallbacks: [],
        _disposeCallbacks: [],
        accept: function accept(fn) {
            this._acceptCallbacks.push(fn || function() {
            });
        },
        dispose: function dispose(fn) {
            this._disposeCallbacks.push(fn);
        }
    };
    module.bundle.hotData = undefined;
}
module.bundle.Module = Module;
var checkedAssets, acceptedAssets, assetsToAccept;
function getHostname() {
    return HMR_HOST || (location.protocol.indexOf('http') === 0 ? location.hostname : 'localhost');
}
function getPort() {
    return HMR_PORT || location.port;
} // eslint-disable-next-line no-redeclare
var parent = module.bundle.parent;
if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
    var hostname = getHostname();
    var port = getPort();
    var protocol = HMR_SECURE || location.protocol == 'https:' && !/localhost|127.0.0.1|0.0.0.0/.test(hostname) ? 'wss' : 'ws';
    var ws = new WebSocket(protocol + '://' + hostname + (port ? ':' + port : '') + '/'); // $FlowFixMe
    ws.onmessage = function(event) {
        checkedAssets = {
        };
        acceptedAssets = {
        };
        assetsToAccept = [];
        var data = JSON.parse(event.data);
        if (data.type === 'update') {
            // Remove error overlay if there is one
            if (typeof document !== 'undefined') removeErrorOverlay();
            var assets = data.assets.filter(function(asset) {
                return asset.envHash === HMR_ENV_HASH;
            }); // Handle HMR Update
            var handled = assets.every(function(asset) {
                return asset.type === 'css' || asset.type === 'js' && hmrAcceptCheck(module.bundle.root, asset.id, asset.depsByBundle);
            });
            if (handled) {
                console.clear();
                assets.forEach(function(asset) {
                    hmrApply(module.bundle.root, asset);
                });
                for(var i = 0; i < assetsToAccept.length; i++){
                    var id = assetsToAccept[i][1];
                    if (!acceptedAssets[id]) hmrAcceptRun(assetsToAccept[i][0], id);
                }
            } else window.location.reload();
        }
        if (data.type === 'error') {
            // Log parcel errors to console
            var _iterator = _createForOfIteratorHelper(data.diagnostics.ansi), _step;
            try {
                for(_iterator.s(); !(_step = _iterator.n()).done;){
                    var ansiDiagnostic = _step.value;
                    var stack = ansiDiagnostic.codeframe ? ansiDiagnostic.codeframe : ansiDiagnostic.stack;
                    console.error('🚨 [parcel]: ' + ansiDiagnostic.message + '\n' + stack + '\n\n' + ansiDiagnostic.hints.join('\n'));
                }
            } catch (err) {
                _iterator.e(err);
            } finally{
                _iterator.f();
            }
            if (typeof document !== 'undefined') {
                // Render the fancy html overlay
                removeErrorOverlay();
                var overlay = createErrorOverlay(data.diagnostics.html); // $FlowFixMe
                document.body.appendChild(overlay);
            }
        }
    };
    ws.onerror = function(e) {
        console.error(e.message);
    };
    ws.onclose = function() {
        console.warn('[parcel] 🚨 Connection to the HMR server was lost');
    };
}
function removeErrorOverlay() {
    var overlay = document.getElementById(OVERLAY_ID);
    if (overlay) {
        overlay.remove();
        console.log('[parcel] ✨ Error resolved');
    }
}
function createErrorOverlay(diagnostics) {
    var overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    var errorHTML = '<div style="background: black; opacity: 0.85; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; font-family: Menlo, Consolas, monospace; z-index: 9999;">';
    var _iterator2 = _createForOfIteratorHelper(diagnostics), _step2;
    try {
        for(_iterator2.s(); !(_step2 = _iterator2.n()).done;){
            var diagnostic = _step2.value;
            var stack = diagnostic.codeframe ? diagnostic.codeframe : diagnostic.stack;
            errorHTML += "\n      <div>\n        <div style=\"font-size: 18px; font-weight: bold; margin-top: 20px;\">\n          \uD83D\uDEA8 ".concat(diagnostic.message, "\n        </div>\n        <pre>").concat(stack, "</pre>\n        <div>\n          ").concat(diagnostic.hints.map(function(hint) {
                return '<div>💡 ' + hint + '</div>';
            }).join(''), "\n        </div>\n        ").concat(diagnostic.documentation ? "<div>\uD83D\uDCDD <a style=\"color: violet\" href=\"".concat(diagnostic.documentation, "\" target=\"_blank\">Learn more</a></div>") : '', "\n      </div>\n    ");
        }
    } catch (err) {
        _iterator2.e(err);
    } finally{
        _iterator2.f();
    }
    errorHTML += '</div>';
    overlay.innerHTML = errorHTML;
    return overlay;
}
function getParents(bundle, id) /*: Array<[ParcelRequire, string]> */ {
    var modules = bundle.modules;
    if (!modules) return [];
    var parents = [];
    var k, d, dep;
    for(k in modules)for(d in modules[k][1]){
        dep = modules[k][1][d];
        if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) parents.push([
            bundle,
            k
        ]);
    }
    if (bundle.parent) parents = parents.concat(getParents(bundle.parent, id));
    return parents;
}
function updateLink(link) {
    var newLink = link.cloneNode();
    newLink.onload = function() {
        if (link.parentNode !== null) // $FlowFixMe
        link.parentNode.removeChild(link);
    };
    newLink.setAttribute('href', link.getAttribute('href').split('?')[0] + '?' + Date.now()); // $FlowFixMe
    link.parentNode.insertBefore(newLink, link.nextSibling);
}
var cssTimeout = null;
function reloadCSS() {
    if (cssTimeout) return;
    cssTimeout = setTimeout(function() {
        var links = document.querySelectorAll('link[rel="stylesheet"]');
        for(var i = 0; i < links.length; i++){
            // $FlowFixMe[incompatible-type]
            var href = links[i].getAttribute('href');
            var hostname = getHostname();
            var servedFromHMRServer = hostname === 'localhost' ? new RegExp('^(https?:\\/\\/(0.0.0.0|127.0.0.1)|localhost):' + getPort()).test(href) : href.indexOf(hostname + ':' + getPort());
            var absolute = /^https?:\/\//i.test(href) && href.indexOf(window.location.origin) !== 0 && !servedFromHMRServer;
            if (!absolute) updateLink(links[i]);
        }
        cssTimeout = null;
    }, 50);
}
function hmrApply(bundle, asset) {
    var modules = bundle.modules;
    if (!modules) return;
    if (asset.type === 'css') reloadCSS();
    else if (asset.type === 'js') {
        var deps = asset.depsByBundle[bundle.HMR_BUNDLE_ID];
        if (deps) {
            var fn = new Function('require', 'module', 'exports', asset.output);
            modules[asset.id] = [
                fn,
                deps
            ];
        } else if (bundle.parent) hmrApply(bundle.parent, asset);
    }
}
function hmrAcceptCheck(bundle, id, depsByBundle) {
    var modules = bundle.modules;
    if (!modules) return;
    if (depsByBundle && !depsByBundle[bundle.HMR_BUNDLE_ID]) {
        // If we reached the root bundle without finding where the asset should go,
        // there's nothing to do. Mark as "accepted" so we don't reload the page.
        if (!bundle.parent) return true;
        return hmrAcceptCheck(bundle.parent, id, depsByBundle);
    }
    if (checkedAssets[id]) return true;
    checkedAssets[id] = true;
    var cached = bundle.cache[id];
    assetsToAccept.push([
        bundle,
        id
    ]);
    if (cached && cached.hot && cached.hot._acceptCallbacks.length) return true;
    var parents = getParents(module.bundle.root, id); // If no parents, the asset is new. Prevent reloading the page.
    if (!parents.length) return true;
    return parents.some(function(v) {
        return hmrAcceptCheck(v[0], v[1], null);
    });
}
function hmrAcceptRun(bundle, id) {
    var cached = bundle.cache[id];
    bundle.hotData = {
    };
    if (cached && cached.hot) cached.hot.data = bundle.hotData;
    if (cached && cached.hot && cached.hot._disposeCallbacks.length) cached.hot._disposeCallbacks.forEach(function(cb) {
        cb(bundle.hotData);
    });
    delete bundle.cache[id];
    bundle(id);
    cached = bundle.cache[id];
    if (cached && cached.hot && cached.hot._acceptCallbacks.length) cached.hot._acceptCallbacks.forEach(function(cb) {
        var assetsToAlsoAccept = cb(function() {
            return getParents(module.bundle.root, id);
        });
        if (assetsToAlsoAccept && assetsToAccept.length) // $FlowFixMe[method-unbinding]
        assetsToAccept.push.apply(assetsToAccept, assetsToAlsoAccept);
    });
    acceptedAssets[id] = true;
}

},{}],"jZgE0":[function(require,module,exports) {
var _gpu = require("./gpu/gpu");
var _lines = require("./gpu/lines");
var _position = require("./gpu/position");
var _camera = require("./gpu/camera");
var _cube = require("./loader/cube");
var _cloud = require("./gpu/cloud");
var _kNearest = require("./gpu/kNearest");
var _triangulate = require("./gpu/triangulate");
var _filter = require("./gpu/filter");
var _edge = require("./gpu/edge");
var _edgeOld = require("./gpu/edgeOld");
var _color = require("./loader/color");
var _grid = require("./loader/grid");
var _sphere = require("./loader/sphere");
var _pcd = require("./loader/pcd");
document.body.onload = async ()=>{
    const display = document.getElementById('display');
    const canvas = await _gpu.Setup(display.clientWidth, display.clientHeight);
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
    let length = 50000;
    let lengthOld = length;
    let form = 'sphere';
    let cloud = _sphere.CreateSphere(length);
    let colors = _color.CreateColors(length);
    const grid = _grid.CreateGrid(10);
    display.onwheel = (ev)=>{
        const scale = 1 + ev.deltaY / 1000;
        if (ev.ctrlKey == false) increase.Scale(scale, scale, scale);
        else {
            let fov = cam.fieldOfView * scale;
            if (fov < Math.PI / 10) fov = Math.PI / 10;
            if (fov > Math.PI * 9 / 10) fov = Math.PI * 9 / 10;
            cam.fieldOfView = fov;
        }
        ev.preventDefault();
        ev.stopImmediatePropagation();
    };
    document.body.onresize = ()=>{
        _gpu.Resize(display.clientWidth, display.clientHeight);
        cam.UpdateSize();
    };
    const keys = {
    };
    let nearest = undefined;
    document.body.onkeydown = async (ev)=>{
        keys[ev.code] = true;
        switch(ev.code){
            case 'KeyH':
                makeHint('Left mouse button: rotate camera', 'Mouse wheel: change cloud size', 'Mouse wheel + Control: change field of view', 'QWER: move camera', '1: change cloud form', '1 + Control: change cloud size for sphere and cube', '2: compute k nearest points', '2 + Control: change k', '3: compute triangulation', '4: approximate normal (best with triangulation)', '4 + Control: approximate normal (best with k-nearest)', 'Space: render connections with polygons', '0: open notes (german)');
                break;
            case 'Digit1':
                if (ev.ctrlKey) {
                    const number = getUserNumber('input new cloud size');
                    if (number != undefined) {
                        lengthOld = number;
                        form = 'test';
                    } else break;
                }
                cloud.destroy();
                colors.destroy();
                switch(form){
                    case 'sphere':
                        length = lengthOld;
                        cloud = _cube.CreateCube(length);
                        form = 'cube';
                        break;
                    case 'cube':
                        {
                            const response = await fetch('../src/loader/pcd/bunny.pcd');
                            const content = await (await response.blob()).arrayBuffer();
                            const result = _pcd.CreatePCD(content);
                            if (result != undefined) [cloud, length] = result;
                            else alert('pcd error');
                            form = 'bunny';
                            break;
                        }
                    case 'bunny':
                        {
                            const response = await fetch('../src/loader/pcd/rops_cloud.pcd');
                            const content = await (await response.blob()).arrayBuffer();
                            const result = _pcd.CreatePCD(content);
                            if (result != undefined) [cloud, length] = result;
                            else alert('pcd error');
                            form = 'test';
                            break;
                        }
                    case 'test':
                        length = lengthOld;
                        cloud = _sphere.CreateSphere(length);
                        form = 'sphere';
                        break;
                }
                colors = _color.CreateColors(length);
                if (nearest != undefined) {
                    nearest.destroy();
                    nearest = undefined;
                }
                break;
            case 'Digit2':
                if (ev.ctrlKey) {
                    const number = getUserNumber('input new k for nearest points');
                    if (number != undefined) kOld = number;
                }
                if (nearest != undefined) nearest.destroy();
                k = kOld;
                nearest = await _kNearest.Compute(k, cloud, length);
                break;
            case 'Digit3':
                if (nearest != undefined) nearest.destroy();
                nearest = await _triangulate.Compute(cloud, length);
                k = _triangulate.K;
                break;
            case 'Digit4':
                if (nearest == undefined) {
                    alert('please calculate the connections first');
                    break;
                }
                if (ev.ctrlKey == false) await _edge.Compute(cloud, nearest, colors, k, length);
                else await _edgeOld.Compute(cloud, nearest, colors, k, length);
                break;
            case 'Digit5':
                if (nearest == undefined) {
                    alert('please calculate the connections first');
                    break;
                }
                await _filter.Compute(nearest, k, length);
                break;
            case 'Digit0':
                window.open('notes.html', '_blank');
        }
    };
    document.body.onkeyup = (ev)=>{
        delete keys[ev.code];
    };
    makeHint('press \'H\' for help');
    display.onmousemove = (ev)=>{
        if ((ev.buttons & 1) != 0) {
            cam.RotateX(-ev.movementY / 200);
            cam.RotateGlobalY(-ev.movementX / 200);
        }
    };
    let last;
    requestAnimationFrame((time)=>{
        last = time;
    });
    async function Draw(time) {
        const delta = time - last;
        if (delta > 25) console.log(delta);
        const dist = delta / 50;
        const move = (key, x, y, z)=>{
            if (keys[key] != undefined) cam.Translate(x * dist, y * dist, z * dist);
        };
        move('KeyW', 0, 0, -1);
        move('KeyD', 1, 0, 0);
        move('KeyS', 0, 0, 1);
        move('KeyA', -1, 0, 0);
        move('KeyF', 0, -1, 0);
        move('KeyR', 0, 1, 0);
        _gpu.StartRender(cam);
        await _lines.Render(normal, grid.length, grid.positions, grid.colors);
        if (nearest != undefined) {
            if (keys['Space'] == undefined) {
                await _cloud.Render(increase, 0.015, length, cloud, colors);
                await _kNearest.Render(increase, cloud, colors, nearest, k, length);
            } else await _triangulate.Render(increase, cloud, colors, nearest, k, length);
        } else await _cloud.Render(increase, 0.015, length, cloud, colors);
        _gpu.FinishRender();
        last = time;
        requestAnimationFrame(Draw);
    }
    requestAnimationFrame(Draw);
};
function makeHint(...text) {
    const hint = document.createElement('div');
    let combined = '';
    for(let i = 0; i < text.length; i++)combined += text[i] + '\n';
    hint.textContent = combined;
    hint.className = 'hint';
    document.body.append(hint);
    setTimeout(()=>{
        hint.remove();
    }, 5000);
}
function getUserNumber(text) {
    const str = prompt(text);
    if (str == null) return undefined;
    const x = parseInt(str);
    if (isNaN(x)) return undefined;
    return x;
}

},{"./gpu/gpu":"6hBLr","./gpu/lines":"5ndXc","./gpu/position":"ePvMQ","./gpu/camera":"kVndZ","./loader/cube":"ICVLL","./gpu/cloud":"h15Me","./gpu/kNearest":"bcTIC","./gpu/triangulate":"fTr44","./gpu/filter":"dalJV","./gpu/edge":"bspva","./gpu/edgeOld":"hA96T","./loader/color":"bFzB1","./loader/grid":"eAqZV","./loader/sphere":"IacXj","./loader/pcd":"hsZ6j"}],"6hBLr":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "adapter", ()=>adapter
);
parcelHelpers.export(exports, "device", ()=>device
);
parcelHelpers.export(exports, "clearColor", ()=>clearColor
);
parcelHelpers.export(exports, "format", ()=>format
);
parcelHelpers.export(exports, "sampler", ()=>sampler
);
parcelHelpers.export(exports, "canvas", ()=>canvas
);
parcelHelpers.export(exports, "context", ()=>context
);
parcelHelpers.export(exports, "global", ()=>global
);
parcelHelpers.export(exports, "depth", ()=>depth
);
parcelHelpers.export(exports, "Setup", ()=>Setup
);
parcelHelpers.export(exports, "Resize", ()=>Resize
);
parcelHelpers.export(exports, "cameraBuffer", ()=>cameraBuffer
);
parcelHelpers.export(exports, "renderPass", ()=>renderPass
);
parcelHelpers.export(exports, "StartRender", ()=>StartRender
);
parcelHelpers.export(exports, "FinishRender", ()=>FinishRender
);
parcelHelpers.export(exports, "CreateBuffer", ()=>CreateBuffer
);
parcelHelpers.export(exports, "CreateEmptyBuffer", ()=>CreateEmptyBuffer
);
parcelHelpers.export(exports, "ReadBuffer", ()=>ReadBuffer
);
let adapter;
let device;
const clearColor = {
    r: 0,
    g: 0.1,
    b: 0.2,
    a: 1
};
let format;
let sampler;
let canvas;
let context;
let global;
let depth;
async function Setup(width, height) {
    if (window.navigator.gpu == undefined) return undefined;
    adapter = await window.navigator.gpu.requestAdapter({
        powerPreference: 'high-performance'
    });
    device = await adapter.requestDevice();
    device.lost.then((info)=>{
        console.log(info);
    });
    canvas = document.createElement('canvas');
    context = canvas.getContext('webgpu');
    format = context.getPreferredFormat(adapter);
    global = {
        aspect: undefined
    };
    sampler = device.createSampler({
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
    depth = device.createTexture({
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
let renderPass;
let encoder;
function StartRender(camera) {
    encoder = device.createCommandEncoder();
    renderPass = encoder.beginRenderPass({
        colorAttachments: [
            {
                loadValue: clearColor,
                storeOp: 'store',
                view: context.getCurrentTexture().createView()
            }, 
        ],
        depthStencilAttachment: {
            depthLoadValue: 1,
            depthStoreOp: 'store',
            stencilLoadValue: 0,
            stencilStoreOp: 'store',
            view: depth.createView()
        }
    });
    cameraBuffer = camera.Buffer();
}
function FinishRender() {
    renderPass.endPass();
    device.queue.submit([
        encoder.finish()
    ]);
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
    const temp = CreateEmptyBuffer(size, GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST);
    // Encode commands for copying buffer to buffer.
    const copyEncoder = device.createCommandEncoder();
    copyEncoder.copyBufferToBuffer(buffer /* source buffer */ , 0 /* source offset */ , temp /* destination buffer */ , 0 /* destination offset */ , size /* size */ );
    const copyCommands = copyEncoder.finish();
    device.queue.submit([
        copyCommands
    ]);
    await temp.mapAsync(GPUMapMode.READ);
    const copyArrayBuffer = temp.getMappedRange();
    return copyArrayBuffer;
}

},{"@parcel/transformer-js/src/esmodule-helpers.js":"24djE"}],"24djE":[function(require,module,exports) {
exports.interopDefault = function(a) {
    return a && a.__esModule ? a : {
        default: a
    };
};
exports.defineInteropFlag = function(a) {
    Object.defineProperty(a, '__esModule', {
        value: true
    });
};
exports.exportAll = function(source, dest) {
    Object.keys(source).forEach(function(key) {
        if (key === 'default' || key === '__esModule' || dest.hasOwnProperty(key)) return;
        Object.defineProperty(dest, key, {
            enumerable: true,
            get: function() {
                return source[key];
            }
        });
    });
    return dest;
};
exports.export = function(dest, destName, get) {
    Object.defineProperty(dest, destName, {
        enumerable: true,
        get: get
    });
};

},{}],"5ndXc":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Render", ()=>Render
);
var _gpu = require("./gpu");
var _module = require("./module");
var _file = require("../helper/file");
let pipeline = undefined;
async function Render(position, length, positions, colors) {
    if (pipeline == undefined) {
        const src = await _file.GetServerFile('render/lines.wgsl');
        const module = _module.New(src);
        pipeline = _gpu.device.createRenderPipeline({
            vertex: {
                module: module,
                entryPoint: 'vertexMain',
                buffers: [
                    {
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: 'float32x3'
                            }, 
                        ],
                        arrayStride: 16,
                        stepMode: 'vertex'
                    },
                    {
                        attributes: [
                            {
                                shaderLocation: 1,
                                offset: 0,
                                format: 'float32x3'
                            }, 
                        ],
                        arrayStride: 16,
                        stepMode: 'vertex'
                    }, 
                ]
            },
            fragment: {
                module: module,
                entryPoint: 'fragmentMain',
                targets: [
                    {
                        format: _gpu.format
                    }, 
                ]
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
    const buffer = _gpu.CreateBuffer(array, GPUBufferUsage.UNIFORM);
    _gpu.renderPass.setPipeline(pipeline);
    const group = _gpu.device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: _gpu.cameraBuffer
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: buffer
                }
            }, 
        ]
    });
    _gpu.renderPass.setBindGroup(0, group);
    _gpu.renderPass.setVertexBuffer(0, positions);
    _gpu.renderPass.setVertexBuffer(1, colors);
    _gpu.renderPass.draw(length);
}

},{"./gpu":"6hBLr","./module":"5YgDj","../helper/file":"44LoR","@parcel/transformer-js/src/esmodule-helpers.js":"24djE"}],"5YgDj":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "New", ()=>New
);
var _gpu = require("./gpu");
function New(src) {
    const module = _gpu.device.createShaderModule({
        code: src
    });
    return module;
}

},{"./gpu":"6hBLr","@parcel/transformer-js/src/esmodule-helpers.js":"24djE"}],"44LoR":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "GetUserFile", ()=>GetUserFile
);
parcelHelpers.export(exports, "GetServerFile", ()=>GetServerFile
);
async function GetUserFile(endings) {
    return new Promise((resolve, reject)=>{
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '';
        for(let i = 0; i < endings.length; i++){
            input.accept += '.' + endings[i];
            if (i < endings.length - 1) input.accept += ',';
        }
        input.onchange = async ()=>{
            const files = input.files;
            if (files == null || files.length == 0) return;
            const file = files[0];
            const sep = file.name.split('.');
            const format = sep[sep.length - 1];
            if (endings.includes(format)) resolve(file);
            else reject('format "' + format + '" not supported');
        };
        input.click();
    });
}
async function GetServerFile(path) {
    return new Promise((resolve, reject)=>{
        const request = new XMLHttpRequest();
        request.onreadystatechange = ()=>{
            if (request.readyState == 4 && request.status == 200) resolve(request.responseText);
        };
        request.open('GET', path);
        request.send();
        setTimeout(reject, 1000, 'file timeout');
    });
}

},{"@parcel/transformer-js/src/esmodule-helpers.js":"24djE"}],"ePvMQ":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Position", ()=>Position
);
var _math = require("./math");
class Position {
    constructor(){
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

},{"./math":"lrJMd","@parcel/transformer-js/src/esmodule-helpers.js":"24djE"}],"lrJMd":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Matrix", ()=>Matrix
);
class Matrix {
    constructor(data){
        this.data = data;
    }
    static Identity() {
        return new Matrix(new Float32Array([
            /*eslint-disable*/ 1,
            0,
            0,
            0,
            0,
            1,
            0,
            0,
            0,
            0,
            1,
            0,
            0,
            0,
            0,
            1
        ]));
    }
    Save(location, offset) {
        for(let i = 0; i < 4; i++)for(let j = 0; j < 4; j++)location[offset + i * 4 + j] = this.data[i + j * 4];
    }
    static Translate(x, y, z) {
        return new Matrix(new Float32Array([
            /*eslint-disable*/ 1,
            0,
            0,
            x,
            0,
            1,
            0,
            y,
            0,
            0,
            1,
            z,
            0,
            0,
            0,
            1
        ]));
    }
    static RotateX(rad) {
        return new Matrix(new Float32Array([
            /*eslint-disable*/ 1,
            0,
            0,
            0,
            0,
            Math.cos(rad),
            -Math.sin(rad),
            0,
            0,
            Math.sin(rad),
            Math.cos(rad),
            0,
            0,
            0,
            0,
            1
        ]));
    }
    static Rotate(rad, axis) {
        const sin = Math.sin(rad);
        const cos = Math.cos(rad);
        const cosN = 1 - cos;
        //https://en.wikipedia.org/wiki/Rotation_matrix#Rotation_matrix_from_axis_and_angle
        return new Matrix(new Float32Array([
            /*eslint-disable*/ axis.x * axis.x * cosN + cos,
            axis.x * axis.y * cosN - axis.z * sin,
            axis.x * axis.z * cosN + axis.y * sin,
            0,
            axis.y * axis.x * cosN + axis.z * sin,
            axis.y * axis.y * cosN + cos,
            axis.y * axis.z * cosN - axis.x * sin,
            0,
            axis.z * axis.x * cosN - axis.y * sin,
            axis.z * axis.y * cosN + axis.x * sin,
            axis.z * axis.z * cosN + cos,
            0,
            0,
            0,
            0,
            1
        ]));
    }
    static RotateY(rad) {
        return new Matrix(new Float32Array([
            /*eslint-disable*/ Math.cos(rad),
            0,
            Math.sin(rad),
            0,
            0,
            1,
            0,
            0,
            -Math.sin(rad),
            0,
            Math.cos(rad),
            0,
            0,
            0,
            0,
            1
        ]));
    }
    static RotateZ(rad) {
        return new Matrix(new Float32Array([
            /*eslint-disable*/ Math.cos(rad),
            -Math.sin(rad),
            0,
            0,
            Math.sin(rad),
            Math.cos(rad),
            0,
            0,
            0,
            0,
            1,
            0,
            0,
            0,
            0,
            1
        ]));
    }
    static Scale(x, y, z) {
        return new Matrix(new Float32Array([
            /*eslint-disable*/ x,
            0,
            0,
            0,
            0,
            y,
            0,
            0,
            0,
            0,
            z,
            0,
            0,
            0,
            0,
            1
        ]));
    }
    Multiply(m) {
        const res = new Float32Array(16);
        for(let i = 0; i < 4; i++){
            for(let j = 0; j < 4; j++)for(let c = 0; c < 4; c++)res[i + j * 4] += this.data[c + j * 4] * m.data[i + c * 4];
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
            /*eslint-disable*/ s / aspect,
            0,
            0,
            0,
            0,
            s,
            0,
            0,
            0,
            0,
            c2,
            c1,
            0,
            0,
            -1,
            0
        ]);
        return new Matrix(m);
    }
}

},{"@parcel/transformer-js/src/esmodule-helpers.js":"24djE"}],"kVndZ":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Camera", ()=>Camera
);
var _math = require("./math");
var _gpu = require("./gpu");
class Camera {
    constructor(fieldOfView){
        this.projection = _math.Matrix.Perspective(fieldOfView, _gpu.global.aspect, 0.1, 1000);
        this.view = _math.Matrix.Identity();
        this.fov = fieldOfView;
    }
    set fieldOfView(val) {
        this.fov = val;
        this.projection = _math.Matrix.Perspective(val, _gpu.global.aspect, 0.1, 100);
    }
    get fieldOfView() {
        return this.fov;
    }
    Buffer() {
        const array = new Float32Array(32);
        this.projection.Save(array, 0);
        this.view.Save(array, 16);
        return _gpu.CreateBuffer(array, GPUBufferUsage.UNIFORM);
    }
    UpdateSize() {
        this.projection = _math.Matrix.Perspective(this.fov, _gpu.global.aspect, 1, 1000);
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

},{"./math":"lrJMd","./gpu":"6hBLr","@parcel/transformer-js/src/esmodule-helpers.js":"24djE"}],"ICVLL":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "CreateCube", ()=>CreateCube
);
var _gpu = require("../gpu/gpu");
function CreateCube(points, noise = 0.001) {
    const vertices = new Float32Array(points * 4);
    for(let i = 0; i < points; i++){
        switch(Math.floor(Math.random() * 6)){
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
    return _gpu.CreateBuffer(vertices, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
}

},{"../gpu/gpu":"6hBLr","@parcel/transformer-js/src/esmodule-helpers.js":"24djE"}],"h15Me":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Render", ()=>Render
);
var _gpu = require("./gpu");
var _module = require("./module");
var _file = require("../helper/file");
let quadBuffer = undefined;
let pipeline = undefined;
async function Render(position, radius, length, positions, colors) {
    if (pipeline == undefined || quadBuffer == undefined) {
        const src = await _file.GetServerFile('render/cloud.wgsl');
        const module = _module.New(src);
        pipeline = _gpu.device.createRenderPipeline({
            vertex: {
                module: module,
                entryPoint: 'vertexMain',
                buffers: [
                    {
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: 'float32x2'
                            }, 
                        ],
                        arrayStride: 8,
                        stepMode: 'vertex'
                    },
                    {
                        attributes: [
                            {
                                shaderLocation: 1,
                                offset: 0,
                                format: 'float32x3'
                            }, 
                        ],
                        arrayStride: 16,
                        stepMode: 'instance'
                    },
                    {
                        attributes: [
                            {
                                shaderLocation: 2,
                                offset: 0,
                                format: 'float32x3'
                            }, 
                        ],
                        arrayStride: 16,
                        stepMode: 'instance'
                    }, 
                ]
            },
            fragment: {
                module: module,
                entryPoint: 'fragmentMain',
                targets: [
                    {
                        format: _gpu.format
                    }, 
                ]
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
        quadBuffer = _gpu.CreateBuffer(new Float32Array([
            -1,
            -1,
            1,
            -1,
            -1,
            1,
            1,
            1
        ]), GPUBufferUsage.VERTEX);
    }
    const array = new Float32Array(18);
    position.Save(array, 0);
    array[16] = radius;
    array[17] = _gpu.global.aspect;
    const buffer = _gpu.CreateBuffer(array, GPUBufferUsage.UNIFORM);
    _gpu.renderPass.setPipeline(pipeline);
    const group = _gpu.device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: _gpu.cameraBuffer
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: buffer
                }
            }, 
        ]
    });
    _gpu.renderPass.setBindGroup(0, group);
    _gpu.renderPass.setVertexBuffer(0, quadBuffer);
    _gpu.renderPass.setVertexBuffer(1, positions);
    _gpu.renderPass.setVertexBuffer(2, colors);
    _gpu.renderPass.draw(4, length);
}

},{"./gpu":"6hBLr","./module":"5YgDj","../helper/file":"44LoR","@parcel/transformer-js/src/esmodule-helpers.js":"24djE"}],"bcTIC":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Compute", ()=>Compute
);
parcelHelpers.export(exports, "Render", ()=>Render
);
var _gpu = require("./gpu");
var _module = require("./module");
var _file = require("../helper/file");
let computePipeline = undefined;
let renderPipeline = undefined;
async function Compute(k, positions, length) {
    if (computePipeline == undefined) computePipeline = _gpu.device.createComputePipeline({
        compute: {
            module: _module.New(await _file.GetServerFile('compute/kNearest.wgsl')),
            entryPoint: 'main'
        }
    });
    const nearest = _gpu.CreateEmptyBuffer(length * 4 * k, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC);
    const param = new Uint32Array([
        length,
        k
    ]);
    const buffer = _gpu.CreateBuffer(param, GPUBufferUsage.STORAGE);
    const group = _gpu.device.createBindGroup({
        layout: computePipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: buffer
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: positions
                }
            },
            {
                binding: 3,
                resource: {
                    buffer: nearest
                }
            }, 
        ]
    });
    const encoder = _gpu.device.createCommandEncoder();
    const compute = encoder.beginComputePass({
    });
    compute.setPipeline(computePipeline);
    compute.setBindGroup(0, group);
    compute.dispatch(Math.ceil(length / 256));
    compute.endPass();
    _gpu.device.queue.submit([
        encoder.finish()
    ]);
    return nearest;
}
async function Render(position, positions, colors, nearest, k, length) {
    if (renderPipeline == undefined) {
        const src = await _file.GetServerFile('render/kNearest.wgsl');
        const module = _module.New(src);
        renderPipeline = _gpu.device.createRenderPipeline({
            vertex: {
                module: module,
                entryPoint: 'vertexMain',
                buffers: []
            },
            fragment: {
                module: module,
                entryPoint: 'fragmentMain',
                targets: [
                    {
                        format: _gpu.format
                    }, 
                ]
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
    const array = new Float32Array(17);
    position.Save(array, 0);
    new Uint32Array(array.buffer)[16] = k;
    const buffer = _gpu.CreateBuffer(array, GPUBufferUsage.UNIFORM);
    _gpu.renderPass.setPipeline(renderPipeline);
    const group = _gpu.device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: _gpu.cameraBuffer
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: buffer
                }
            },
            {
                binding: 2,
                resource: {
                    buffer: positions
                }
            },
            {
                binding: 3,
                resource: {
                    buffer: colors
                }
            },
            {
                binding: 4,
                resource: {
                    buffer: nearest
                }
            }, 
        ]
    });
    _gpu.renderPass.setBindGroup(0, group);
    _gpu.renderPass.draw(length * k * 2);
}

},{"./gpu":"6hBLr","./module":"5YgDj","../helper/file":"44LoR","@parcel/transformer-js/src/esmodule-helpers.js":"24djE"}],"fTr44":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "K", ()=>K
);
parcelHelpers.export(exports, "Compute", ()=>Compute
);
parcelHelpers.export(exports, "Render", ()=>Render
);
var _gpu = require("./gpu");
var _module = require("./module");
var _file = require("../helper/file");
let computePipeline = undefined;
let renderPipeline = undefined;
const K = 16;
async function Compute(positions, length) {
    if (computePipeline == undefined) computePipeline = _gpu.device.createComputePipeline({
        compute: {
            module: _module.New(await _file.GetServerFile('compute/triangulate.wgsl')),
            entryPoint: 'main'
        }
    });
    const nearest = _gpu.CreateEmptyBuffer(length * 4 * K, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC);
    const encoder = _gpu.device.createCommandEncoder();
    const param = new Uint32Array([
        length
    ]);
    const buffer = _gpu.CreateBuffer(param, GPUBufferUsage.STORAGE);
    const group = _gpu.device.createBindGroup({
        layout: computePipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: buffer
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: positions
                }
            },
            {
                binding: 2,
                resource: {
                    buffer: nearest
                }
            }, 
        ]
    });
    const compute = encoder.beginComputePass();
    compute.setPipeline(computePipeline);
    compute.setBindGroup(0, group);
    compute.dispatch(Math.ceil(length / 256));
    compute.endPass();
    _gpu.device.queue.submit([
        encoder.finish()
    ]);
    return nearest;
}
async function Render(position, positions, colors, nearest, k, length) {
    if (renderPipeline == undefined) {
        const src = await _file.GetServerFile('render/triangle.wgsl');
        const module = _module.New(src);
        renderPipeline = _gpu.device.createRenderPipeline({
            vertex: {
                module: module,
                entryPoint: 'vertexMain',
                buffers: []
            },
            fragment: {
                module: module,
                entryPoint: 'fragmentMain',
                targets: [
                    {
                        format: _gpu.format
                    }, 
                ]
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
    const array = new Float32Array(17);
    position.Save(array, 0);
    new Uint32Array(array.buffer)[16] = k;
    const buffer = _gpu.CreateBuffer(array, GPUBufferUsage.UNIFORM);
    _gpu.renderPass.setPipeline(renderPipeline);
    const group = _gpu.device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: _gpu.cameraBuffer
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: buffer
                }
            },
            {
                binding: 2,
                resource: {
                    buffer: positions
                }
            },
            {
                binding: 3,
                resource: {
                    buffer: colors
                }
            },
            {
                binding: 4,
                resource: {
                    buffer: nearest
                }
            }, 
        ]
    });
    _gpu.renderPass.setBindGroup(0, group);
    _gpu.renderPass.draw(length * k * 3);
}

},{"./gpu":"6hBLr","./module":"5YgDj","../helper/file":"44LoR","@parcel/transformer-js/src/esmodule-helpers.js":"24djE"}],"dalJV":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Compute", ()=>Compute
);
var _gpu = require("./gpu");
var _module = require("./module");
var _file = require("../helper/file");
let computePipeline = undefined;
async function Compute(nearest, k, length) {
    if (computePipeline == undefined) computePipeline = _gpu.device.createComputePipeline({
        compute: {
            module: _module.New(await _file.GetServerFile('compute/filter.wgsl')),
            entryPoint: 'main'
        }
    });
    const param = new Uint32Array([
        length,
        k
    ]);
    const buffer = _gpu.CreateBuffer(param, GPUBufferUsage.STORAGE);
    const group = _gpu.device.createBindGroup({
        layout: computePipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: buffer
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: nearest
                }
            }, 
        ]
    });
    const encoder = _gpu.device.createCommandEncoder();
    const compute = encoder.beginComputePass({
    });
    compute.setPipeline(computePipeline);
    compute.setBindGroup(0, group);
    compute.dispatch(Math.ceil(length / 256));
    compute.endPass();
    _gpu.device.queue.submit([
        encoder.finish()
    ]);
}

},{"./gpu":"6hBLr","./module":"5YgDj","../helper/file":"44LoR","@parcel/transformer-js/src/esmodule-helpers.js":"24djE"}],"bspva":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Compute", ()=>Compute
);
var _gpu = require("./gpu");
var _module = require("./module");
var _file = require("../helper/file");
let computePipeline = undefined;
async function Compute(cloud, nearest, colors, k, length) {
    if (computePipeline == undefined) computePipeline = _gpu.device.createComputePipeline({
        compute: {
            module: _module.New(await _file.GetServerFile('compute/edge.wgsl')),
            entryPoint: 'main'
        }
    });
    const param = new Uint32Array([
        length,
        k
    ]);
    const buffer = _gpu.CreateBuffer(param, GPUBufferUsage.STORAGE);
    const group = _gpu.device.createBindGroup({
        layout: computePipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: buffer
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: cloud
                }
            },
            {
                binding: 2,
                resource: {
                    buffer: nearest
                }
            },
            {
                binding: 3,
                resource: {
                    buffer: colors
                }
            }, 
        ]
    });
    const encoder = _gpu.device.createCommandEncoder();
    const compute = encoder.beginComputePass({
    });
    compute.setPipeline(computePipeline);
    compute.setBindGroup(0, group);
    compute.dispatch(Math.ceil(length / 256));
    compute.endPass();
    _gpu.device.queue.submit([
        encoder.finish()
    ]);
}

},{"./gpu":"6hBLr","./module":"5YgDj","../helper/file":"44LoR","@parcel/transformer-js/src/esmodule-helpers.js":"24djE"}],"hA96T":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Compute", ()=>Compute
);
var _gpu = require("./gpu");
var _module = require("./module");
var _file = require("../helper/file");
let computePipeline = undefined;
async function Compute(cloud, nearest, colors, k, length) {
    if (computePipeline == undefined) computePipeline = _gpu.device.createComputePipeline({
        compute: {
            module: _module.New(await _file.GetServerFile('compute/edgeOld.wgsl')),
            entryPoint: 'main'
        }
    });
    const param = new Uint32Array([
        length,
        k
    ]);
    const buffer = _gpu.CreateBuffer(param, GPUBufferUsage.STORAGE);
    const group = _gpu.device.createBindGroup({
        layout: computePipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: buffer
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: cloud
                }
            },
            {
                binding: 2,
                resource: {
                    buffer: nearest
                }
            },
            {
                binding: 3,
                resource: {
                    buffer: colors
                }
            }, 
        ]
    });
    const encoder = _gpu.device.createCommandEncoder();
    const compute = encoder.beginComputePass({
    });
    compute.setPipeline(computePipeline);
    compute.setBindGroup(0, group);
    compute.dispatch(Math.ceil(length / 256));
    compute.endPass();
    _gpu.device.queue.submit([
        encoder.finish()
    ]);
}

},{"./gpu":"6hBLr","./module":"5YgDj","../helper/file":"44LoR","@parcel/transformer-js/src/esmodule-helpers.js":"24djE"}],"bFzB1":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "CreateColors", ()=>CreateColors
);
var _gpu = require("../gpu/gpu");
function CreateColors(points) {
    const colors = new Float32Array(points * 4);
    for(let i = 0; i < points; i++){
        colors[i * 4 + 0] = 0.3 + 0.7 * Math.random();
        colors[i * 4 + 1] = 0.3 + 0.7 * Math.random();
        colors[i * 4 + 2] = 0.3 + 0.7 * Math.random();
    }
    return _gpu.CreateBuffer(colors, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
}

},{"../gpu/gpu":"6hBLr","@parcel/transformer-js/src/esmodule-helpers.js":"24djE"}],"eAqZV":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "CreateGrid", ()=>CreateGrid
);
var _gpu = require("../gpu/gpu");
function CreateGrid(amount) {
    const positions = new Float32Array((amount * 4 + 3) * 8);
    const colors = new Float32Array((amount * 4 + 3) * 8);
    const addLine = (idx, start, end, color, endColor)=>{
        if (endColor == undefined) endColor = color;
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
    for(let i = -amount; i <= amount; i++){
        if (i == 0) continue;
        let idx;
        if (i < 0) idx = i;
        else if (i == 0) continue;
        else idx = i - 1;
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
    }
    //3 main axes
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
        positions: _gpu.CreateBuffer(positions, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE),
        colors: _gpu.CreateBuffer(colors, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE)
    };
}

},{"../gpu/gpu":"6hBLr","@parcel/transformer-js/src/esmodule-helpers.js":"24djE"}],"IacXj":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "CreateSphere", ()=>CreateSphere
);
var _gpu = require("../gpu/gpu");
function CreateSphere(points) {
    const vertices = new Float32Array(points * 4);
    for(let i = 0; i < points; i++){
        const long = Math.acos(Math.random() * 2 - 1) //less points near the poles
        ;
        const lat = Math.random() * 2 * Math.PI;
        vertices[i * 4 + 0] = Math.sin(lat) * Math.sin(long);
        vertices[i * 4 + 1] = Math.cos(long);
        vertices[i * 4 + 2] = Math.cos(lat) * Math.sin(long);
    }
    return _gpu.CreateBuffer(vertices, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE);
}

},{"../gpu/gpu":"6hBLr","@parcel/transformer-js/src/esmodule-helpers.js":"24djE"}],"hsZ6j":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "CreatePCD", ()=>CreatePCD
);
//https://gitlab.com/taketwo/three-pcd-loader/-/blob/master/pcd-loader.js //edited
var _decompress = require("./decompress");
var _gpu = require("../gpu/gpu");
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
 */ const littleEndian = true;
function CreatePCD(data) {
    const header = parseHeader(data);
    if (header == null) return undefined;
    const offset = header.offset;
    let position = undefined;
    if (offset.x !== undefined && offset.y !== undefined && offset.z !== undefined) position = new Float32Array(header.points * 4);
    let color = undefined;
    let color_offset = undefined;
    if (offset.rgb !== undefined || offset.rgba !== undefined) {
        color = new Float32Array(header.points * 4);
        color_offset = offset.rgb === undefined ? offset.rgba : offset.rgb;
    }
    if (header.data === 'ascii') {
        const charArrayView = new Uint8Array(data);
        let dataString = '';
        for(let j = header.headerLen; j < data.byteLength; j++)dataString += String.fromCharCode(charArrayView[j]);
        const lines = dataString.split('\n');
        let i3 = 0;
        for(let i = 0; i < lines.length; i++, i3 += 4){
            const line = lines[i].split(' ');
            if (position !== undefined) {
                position[i3 + 0] = parseFloat(line[offset.x]);
                position[i3 + 1] = parseFloat(line[offset.y]);
                position[i3 + 2] = parseFloat(line[offset.z]);
            }
            if (color !== undefined) {
                let c = undefined;
                if (offset.rgba !== undefined) c = new Uint32Array([
                    parseInt(line[offset.rgba])
                ]);
                else if (offset.rgb !== undefined) c = new Float32Array([
                    parseFloat(line[offset.rgb])
                ]);
                const dataview = new Uint8Array(c.buffer, 0);
                color[i3 + 2] = dataview[0] / 255;
                color[i3 + 1] = dataview[1] / 255;
                color[i3 + 0] = dataview[2] / 255;
            }
        }
    } else if (header.data === 'binary') {
        let row = 0;
        const dataArrayView = new DataView(data, header.headerLen);
        for(let p = 0; p < header.points; row += header.rowSize, p++){
            if (position !== undefined) {
                position[p * 4 + 0] = dataArrayView.getFloat32(row + offset.x, littleEndian);
                position[p * 4 + 1] = dataArrayView.getFloat32(row + offset.y, littleEndian);
                position[p * 4 + 2] = dataArrayView.getFloat32(row + offset.z, littleEndian);
            }
            if (color !== undefined) {
                color[p * 4 + 2] = dataArrayView.getUint8(row + color_offset + 0) / 255;
                color[p * 4 + 1] = dataArrayView.getUint8(row + color_offset + 1) / 255;
                color[p * 4 + 0] = dataArrayView.getUint8(row + color_offset + 2) / 255;
            }
        }
    } else if (header.data === 'binary_compressed') {
        const sizes = new Uint32Array(data.slice(header.headerLen, header.headerLen + 8));
        const compressedSize = sizes[0];
        const decompressedSize = sizes[1];
        const decompressed = _decompress.LZF(new Uint8Array(data, header.headerLen + 8, compressedSize), decompressedSize);
        const dataArrayView = new DataView(decompressed.buffer);
        for(let p = 0; p < header.points; p++){
            if (position !== undefined) {
                position[p * 4 + 0] = dataArrayView.getFloat32(offset.x + p * 4, littleEndian);
                position[p * 4 + 1] = dataArrayView.getFloat32(offset.y + p * 4, littleEndian);
                position[p * 4 + 2] = dataArrayView.getFloat32(offset.z + p * 4, littleEndian);
            }
            if (color !== undefined) {
                color[p * 4 + 2] = dataArrayView.getUint8(color_offset + p * 4 + 0) / 255;
                color[p * 4 + 1] = dataArrayView.getUint8(color_offset + p * 4 + 1) / 255;
                color[p * 4 + 0] = dataArrayView.getUint8(color_offset + p * 4 + 2) / 255;
            }
        }
    }
    if (position == undefined) return undefined;
    return [
        _gpu.CreateBuffer(position, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE),
        header.points, 
    ];
}
function parseHeader(binaryData) {
    let headerText = '';
    const charArray = new Uint8Array(binaryData);
    let i = 0;
    const max = charArray.length;
    while(i < max && headerText.search(/[\r\n]DATA\s(\S*)\s/i) === -1)headerText += String.fromCharCode(charArray[i++]);
    const result1 = headerText.search(/[\r\n]DATA\s(\S*)\s/i);
    const result2 = /[\r\n]DATA\s(\S*)\s/i.exec(headerText.substr(result1 - 1));
    if (result1 == undefined || result2 == undefined) return null;
    const header = {
    };
    header.data = result2[1];
    header.headerLen = result2[0].length + result1;
    header.str = headerText.substr(0, header.headerLen);
    // Remove comments
    header.str = header.str.replace(/#.*/gi, '');
    const version = /VERSION (.*)/i.exec(header.str);
    if (version !== null) header.version = parseFloat(version[1]);
    const fields = /FIELDS (.*)/i.exec(header.str);
    if (fields !== null) header.fields = fields[1].split(' ');
    const size = /SIZE (.*)/i.exec(header.str);
    if (size !== null) header.size = size[1].split(' ').map(function(x) {
        return parseInt(x, 10);
    });
    const type = /TYPE (.*)/i.exec(header.str);
    if (type !== null) header.type = type[1].split(' ');
    const count = /COUNT (.*)/i.exec(header.str);
    if (count !== null) header.count = count[1].split(' ').map(function(x) {
        return parseInt(x, 10);
    });
    const width = /WIDTH (.*)/i.exec(header.str);
    if (width !== null) header.width = parseInt(width[1]);
    const height = /HEIGHT (.*)/i.exec(header.str);
    if (height !== null) header.height = parseInt(height[1]);
    const viewpoint = /VIEWPOINT (.*)/i.exec(header.str);
    if (viewpoint !== null) header.viewpoint = viewpoint[1];
    const points = /POINTS (.*)/i.exec(header.str);
    if (points !== null) header.points = parseInt(points[1], 10);
    if (header.points === null) header.points = header.width * header.height;
    if (header.count == undefined) {
        header.count = [];
        for(i = 0; i < header.fields.length; i++)header.count.push(1);
    }
    header.offset = {
    };
    let sizeSum = 0;
    for(let j = 0; j < header.fields.length; j++){
        if (header.data === 'ascii') header.offset[header.fields[j]] = j;
        else if (header.data === 'binary') {
            header.offset[header.fields[j]] = sizeSum;
            sizeSum += header.size[j];
        } else if (header.data === 'binary_compressed') {
            header.offset[header.fields[j]] = sizeSum;
            sizeSum += header.size[j] * header.points;
        }
    }
    // For binary only
    header.rowSize = sizeSum;
    return header;
}

},{"./decompress":"87err","../gpu/gpu":"6hBLr","@parcel/transformer-js/src/esmodule-helpers.js":"24djE"}],"87err":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
//https://gitlab.com/taketwo/three-pcd-loader/-/blob/master/decompress-lzf.js //edited
parcelHelpers.export(exports, "LZF", ()=>LZF
);
function LZF(inData, outLength) {
    const inLength = inData.length;
    const outData = new Uint8Array(outLength);
    let inPtr = 0;
    let outPtr = 0;
    do {
        let ctrl = inData[inPtr++];
        if (ctrl < 32) {
            ctrl++;
            if (outPtr + ctrl > outLength) throw new Error('Output buffer is not large enough');
            if (inPtr + ctrl > inLength) throw new Error('Invalid compressed data');
            do outData[outPtr++] = inData[inPtr++];
            while (--ctrl)
        } else {
            let len = ctrl >> 5;
            let ref = outPtr - ((ctrl & 31) << 8) - 1;
            if (inPtr >= inLength) throw new Error('Invalid compressed data');
            if (len === 7) {
                len += inData[inPtr++];
                if (inPtr >= inLength) throw new Error('Invalid compressed data');
            }
            ref -= inData[inPtr++];
            if (outPtr + len + 2 > outLength) throw new Error('Output buffer is not large enough');
            if (ref < 0) throw new Error('Invalid compressed data');
            if (ref >= outPtr) throw new Error('Invalid compressed data');
            do outData[outPtr++] = outData[ref++];
            while (--len + 2)
        }
    }while (inPtr < inLength)
    return outData;
}

},{"@parcel/transformer-js/src/esmodule-helpers.js":"24djE"}]},["kKPlw","jZgE0"], "jZgE0", "parcelRequire2e4d")

//# sourceMappingURL=index.e7f05703.js.map
