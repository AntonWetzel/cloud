function e(e,t,r,n){Object.defineProperty(e,t,{get:r,set:n,enumerable:!0,configurable:!0})}var t="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:{},r={},n={},a=t.parcelRequire2e4d;let o,i;null==a&&((a=function(e){if(e in r)return r[e].exports;if(e in n){var t=n[e];delete n[e];var a={id:e,exports:{}};return r[e]=a,t.call(a.exports,a,a.exports),a.exports}var o=new Error("Cannot find module '"+e+"'");throw o.code="MODULE_NOT_FOUND",o}).register=function(e,t){n[e]=t},t.parcelRequire2e4d=a),a.register("bXuNP",(function(t,r){var n,a;e(t.exports,"register",(()=>n),(e=>n=e)),e(t.exports,"resolve",(()=>a),(e=>a=e));var o={};n=function(e){for(var t=Object.keys(e),r=0;r<t.length;r++)o[t[r]]=e[t[r]]},a=function(e){var t=o[e];if(null==t)throw new Error("Could not resolve bundle with id "+e);return t}})),a("bXuNP").register(JSON.parse('{"kyWCV":"index.ccd019c7.js","2JcDm":"lines.e69ace91.wgsl","aEiTo":"cloud.50c7d6e3.wgsl","inbDi":"kNearest.16925641.wgsl","jPa00":"kNearest.51ef13fc.wgsl","cCzGH":"triangulate.5f37e086.wgsl","7cmWl":"triangle.3f88e9be.wgsl","h5IBS":"filter.d736d268.wgsl","ktFnt":"edge.a3b29df6.wgsl","6miId":"edgeOld.36b7c09c.wgsl","4cqXm":"bunny.0be1f493.pcd","eGv1k":"rops_cloud.63cf8c5e.pcd"}'));const s={r:0,g:.1,b:.2,a:1};let l,u,c,f,d,h,p;function y(){return u.width/u.height}function g(e,t){c.configure({device:i,format:l,size:{width:e,height:t}}),u.width=e,u.height=t,f=i.createTexture({size:{width:u.width,height:u.height},format:"depth32float",usage:GPUTextureUsage.RENDER_ATTACHMENT})}function m(e,t){const r=i.createBuffer({size:e.byteLength,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC|t,mappedAtCreation:!0});return new Uint8Array(r.getMappedRange()).set(new Uint8Array(e.buffer)),r.unmap(),r}function w(e,t){return i.createBuffer({size:e,usage:t,mappedAtCreation:!1})}function b(e){return i.createShaderModule({code:e})}var v;a.register("kPq84",(function(t,r){var n;e(t.exports,"getBundleURL",(()=>n),(e=>n=e));var a={};function o(e){return(""+e).replace(/^((?:https?|file|ftp):\/\/.+)\/[^/]+$/,"$1")+"/"}n=function(e){var t=a[e];return t||(t=function(){try{throw new Error}catch(t){var e=(""+t.stack).match(/(https?|file|ftp):\/\/[^)\n]+/g);if(e)return o(e[2])}return"/"}(),a[e]=t),t}})),v=a("kPq84").getBundleURL("kyWCV")+a("bXuNP").resolve("2JcDm");const P=new URL(v);let U;async function x(e,t,r,n){if(null==U){const e=b(await(await fetch(P.href)).text());U=i.createRenderPipeline({vertex:{module:e,entryPoint:"vertexMain",buffers:[{attributes:[{shaderLocation:0,offset:0,format:"float32x3"}],arrayStride:16,stepMode:"vertex"},{attributes:[{shaderLocation:1,offset:0,format:"float32x3"}],arrayStride:16,stepMode:"vertex"}]},fragment:{module:e,entryPoint:"fragmentMain",targets:[{format:l}]},depthStencil:{format:"depth32float",depthWriteEnabled:!0,depthCompare:"less"},primitive:{topology:"line-list"}})}const a=new Float32Array(16);e.Save(a,0);const o=m(a,GPUBufferUsage.UNIFORM);h.setPipeline(U);const s=i.createBindGroup({layout:U.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:d}},{binding:1,resource:{buffer:o}}]});h.setBindGroup(0,s),h.setVertexBuffer(0,r),h.setVertexBuffer(1,n),h.draw(t)}class M{constructor(e){this.data=e}static Identity(){return new M(new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]))}Save(e,t){for(let r=0;r<4;r++)for(let n=0;n<4;n++)e[t+4*r+n]=this.data[r+4*n]}static Translate(e,t,r){return new M(new Float32Array([1,0,0,e,0,1,0,t,0,0,1,r,0,0,0,1]))}static RotateX(e){return new M(new Float32Array([1,0,0,0,0,Math.cos(e),-Math.sin(e),0,0,Math.sin(e),Math.cos(e),0,0,0,0,1]))}static Rotate(e,t){const r=Math.sin(e),n=Math.cos(e),a=1-n;return new M(new Float32Array([t.x*t.x*a+n,t.x*t.y*a-t.z*r,t.x*t.z*a+t.y*r,0,t.y*t.x*a+t.z*r,t.y*t.y*a+n,t.y*t.z*a-t.x*r,0,t.z*t.x*a-t.y*r,t.z*t.y*a+t.x*r,t.z*t.z*a+n,0,0,0,0,1]))}static RotateY(e){return new M(new Float32Array([Math.cos(e),0,Math.sin(e),0,0,1,0,0,-Math.sin(e),0,Math.cos(e),0,0,0,0,1]))}static RotateZ(e){return new M(new Float32Array([Math.cos(e),-Math.sin(e),0,0,Math.sin(e),Math.cos(e),0,0,0,0,1,0,0,0,0,1]))}static Scale(e,t,r){return new M(new Float32Array([e,0,0,0,0,t,0,0,0,0,r,0,0,0,0,1]))}Multiply(e){const t=new Float32Array(16);for(let r=0;r<4;r++)for(let n=0;n<4;n++)for(let a=0;a<4;a++)t[r+4*n]+=this.data[a+4*n]*e.data[r+4*a];return new M(t)}MultiplyVector(e){return{x:this.data[0]*e.x+this.data[1]*e.y+this.data[2]*e.z,y:this.data[4]*e.x+this.data[5]*e.y+this.data[6]*e.z,z:this.data[8]*e.x+this.data[9]*e.y+this.data[10]*e.z}}Position(){return{x:this.data[3],y:this.data[7],z:this.data[11]}}static Perspective(e,t,r,n){const a=(n+r)/(r-n),o=2*n*r/(r-n),i=1/Math.tan(e/2),s=new Float32Array([i/t,0,0,0,0,i,0,0,0,0,a,o,0,0,-1,0]);return new M(s)}}class R{constructor(){this.model=M.Identity()}Save(e,t){this.model.Save(e,t)}Translate(e,t,r){this.model=M.Translate(e,t,r).Multiply(this.model)}RotateX(e){this.model=M.RotateX(e).Multiply(this.model)}RotateXLocal(e){const t=this.model.Position();this.model=M.Translate(t.x,t.y,t.z).Multiply(M.RotateX(e)).Multiply(M.Translate(-t.x,-t.y,-t.z)).Multiply(this.model)}RotateY(e){this.model=M.RotateY(e).Multiply(this.model)}RotateYLocal(e){const t=this.model.Position();this.model=M.Translate(t.x,t.y,t.z).Multiply(M.RotateY(e)).Multiply(M.Translate(-t.x,-t.y,-t.z)).Multiply(this.model)}RotateZ(e){this.model=M.RotateZ(e).Multiply(this.model)}RotateZLocal(e){const t=this.model.Position();this.model=M.Translate(t.x,t.y,t.z).Multiply(M.RotateZ(e)).Multiply(M.Translate(-t.x,-t.y,-t.z)).Multiply(this.model)}Scale(e,t,r){this.model=M.Scale(e,t,r).Multiply(this.model)}}class B{constructor(e){this.projection=M.Perspective(e,y(),.1,1e3),this.view=M.Identity(),this.fov=e}set fieldOfView(e){this.fov=e,this.projection=M.Perspective(e,y(),.1,100)}get fieldOfView(){return this.fov}Buffer(){const e=new Float32Array(32);return this.projection.Save(e,0),this.view.Save(e,16),m(e,GPUBufferUsage.UNIFORM)}UpdateSize(){this.projection=M.Perspective(this.fov,y(),1,1e3)}Translate(e,t,r){this.view=M.Translate(-e,-t,-r).Multiply(this.view)}RotateX(e){this.view=M.RotateX(-e).Multiply(this.view)}RotateY(e){this.view=M.RotateY(-e).Multiply(this.view)}RotateGlobalY(e){const t=this.view.MultiplyVector({x:0,y:1,z:0});this.view=M.Rotate(-e,t).Multiply(this.view)}RotateZ(e){this.view=M.RotateZ(-e).Multiply(this.view)}}var A;A=a("kPq84").getBundleURL("kyWCV")+a("bXuNP").resolve("aEiTo");const G=new URL(A);let E,S;async function z(e,t,r,n,a){if(null==S||null==E){const e=b(await(await fetch(G.href)).text());S=i.createRenderPipeline({vertex:{module:e,entryPoint:"vertexMain",buffers:[{attributes:[{shaderLocation:0,offset:0,format:"float32x2"}],arrayStride:8,stepMode:"vertex"},{attributes:[{shaderLocation:1,offset:0,format:"float32x3"}],arrayStride:16,stepMode:"instance"},{attributes:[{shaderLocation:2,offset:0,format:"float32x3"}],arrayStride:16,stepMode:"instance"}]},fragment:{module:e,entryPoint:"fragmentMain",targets:[{format:l}]},depthStencil:{format:"depth32float",depthWriteEnabled:!0,depthCompare:"less"},primitive:{topology:"triangle-strip",stripIndexFormat:"uint32",cullMode:"back"}}),E=m(new Float32Array([-1,-1,1,-1,-1,1,1,1]),GPUBufferUsage.VERTEX)}const o=new Float32Array(18);e.Save(o,0),o[16]=t,o[17]=y();const s=m(o,GPUBufferUsage.UNIFORM);h.setPipeline(S);const u=i.createBindGroup({layout:S.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:d}},{binding:1,resource:{buffer:s}}]});h.setBindGroup(0,u),h.setVertexBuffer(0,E),h.setVertexBuffer(1,n),h.setVertexBuffer(2,a),h.draw(4,r)}var F;F=a("kPq84").getBundleURL("kyWCV")+a("bXuNP").resolve("inbDi");const C=new URL(F);var k;k=a("kPq84").getBundleURL("kyWCV")+a("bXuNP").resolve("jPa00");const T=new URL(k);let L,O;async function I(e,t,r,n,a,o){if(null==O){const e=b(await(await fetch(T.href)).text());O=i.createRenderPipeline({vertex:{module:e,entryPoint:"vertexMain",buffers:[]},fragment:{module:e,entryPoint:"fragmentMain",targets:[{format:l}]},depthStencil:{format:"depth32float",depthWriteEnabled:!0,depthCompare:"less"},primitive:{topology:"line-list"}})}const s=new Float32Array(17);e.Save(s,0),new Uint32Array(s.buffer)[16]=a;const u=m(s,GPUBufferUsage.UNIFORM);h.setPipeline(O);const c=i.createBindGroup({layout:O.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:d}},{binding:1,resource:{buffer:u}},{binding:2,resource:{buffer:t}},{binding:3,resource:{buffer:r}},{binding:4,resource:{buffer:n}}]});h.setBindGroup(0,c),h.draw(o*a*2)}var V;V=a("kPq84").getBundleURL("kyWCV")+a("bXuNP").resolve("cCzGH");const H=new URL(V);var N;N=a("kPq84").getBundleURL("kyWCV")+a("bXuNP").resolve("7cmWl");const _=new URL(N);let X,q;async function W(e,t,r,n,a,o){if(null==q){const e=b(await(await fetch(_.href)).text());q=i.createRenderPipeline({vertex:{module:e,entryPoint:"vertexMain",buffers:[]},fragment:{module:e,entryPoint:"fragmentMain",targets:[{format:l}]},depthStencil:{format:"depth32float",depthWriteEnabled:!0,depthCompare:"less"},primitive:{topology:"triangle-list"}})}const s=new Float32Array(17);e.Save(s,0),new Uint32Array(s.buffer)[16]=a;const u=m(s,GPUBufferUsage.UNIFORM);h.setPipeline(q);const c=i.createBindGroup({layout:q.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:d}},{binding:1,resource:{buffer:u}},{binding:2,resource:{buffer:t}},{binding:3,resource:{buffer:r}},{binding:4,resource:{buffer:n}}]});h.setBindGroup(0,c),h.draw(o*a*3)}var D;D=a("kPq84").getBundleURL("kyWCV")+a("bXuNP").resolve("h5IBS");const Y=new URL(D);let K;var j;j=a("kPq84").getBundleURL("kyWCV")+a("bXuNP").resolve("ktFnt");const Z=new URL(j);let J;var $;$=a("kPq84").getBundleURL("kyWCV")+a("bXuNP").resolve("6miId");const Q=new URL($);let ee;function te(e){const t=new Float32Array(4*e);for(let r=0;r<e;r++)t[4*r+0]=.3+.7*Math.random(),t[4*r+1]=.3+.7*Math.random(),t[4*r+2]=.3+.7*Math.random();return m(t,GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE)}function re(e){const t=new Float32Array(4*e);for(let r=0;r<e;r++){const e=Math.acos(2*Math.random()-1),n=2*Math.random()*Math.PI;t[4*r+0]=Math.sin(n)*Math.sin(e),t[4*r+1]=Math.cos(e),t[4*r+2]=Math.cos(n)*Math.sin(e)}return m(t,GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE)}function ne(e){const t=function(e){let t="";const r=new Uint8Array(e);let n=0;const a=r.length;for(;n<a&&-1===t.search(/[\r\n]DATA\s(\S*)\s/i);)t+=String.fromCharCode(r[n++]);const o=t.search(/[\r\n]DATA\s(\S*)\s/i),i=/[\r\n]DATA\s(\S*)\s/i.exec(t.substr(o-1));if(null==o||null==i)return null;const s={};s.data=i[1],s.headerLen=i[0].length+o,s.str=t.substr(0,s.headerLen),s.str=s.str.replace(/#.*/gi,"");const l=/VERSION (.*)/i.exec(s.str);null!==l&&(s.version=parseFloat(l[1]));const u=/FIELDS (.*)/i.exec(s.str);null!==u&&(s.fields=u[1].split(" "));const c=/SIZE (.*)/i.exec(s.str);null!==c&&(s.size=c[1].split(" ").map((function(e){return parseInt(e,10)})));const f=/TYPE (.*)/i.exec(s.str);null!==f&&(s.type=f[1].split(" "));const d=/COUNT (.*)/i.exec(s.str);null!==d&&(s.count=d[1].split(" ").map((function(e){return parseInt(e,10)})));const h=/WIDTH (.*)/i.exec(s.str);null!==h&&(s.width=parseInt(h[1]));const p=/HEIGHT (.*)/i.exec(s.str);null!==p&&(s.height=parseInt(p[1]));const y=/VIEWPOINT (.*)/i.exec(s.str);null!==y&&(s.viewpoint=y[1]);const g=/POINTS (.*)/i.exec(s.str);null!==g&&(s.points=parseInt(g[1],10));null===s.points&&(s.points=s.width*s.height);if(null==s.count)for(s.count=[],n=0;n<s.fields.length;n++)s.count.push(1);s.offset={};let m=0;for(let e=0;e<s.fields.length;e++)"ascii"===s.data?s.offset[s.fields[e]]=e:"binary"===s.data?(s.offset[s.fields[e]]=m,m+=s.size[e]):"binary_compressed"===s.data&&(s.offset[s.fields[e]]=m,m+=s.size[e]*s.points);return s.rowSize=m,s}(e);if(null==t)return;const r=t.offset;let n,a,o;if(void 0!==r.x&&void 0!==r.y&&void 0!==r.z&&(n=new Float32Array(4*t.points)),void 0===r.rgb&&void 0===r.rgba||(a=new Float32Array(4*t.points),o=void 0===r.rgb?r.rgba:r.rgb),"ascii"===t.data){const o=new Uint8Array(e);let i="";for(let r=t.headerLen;r<e.byteLength;r++)i+=String.fromCharCode(o[r]);const s=i.split("\n");let l=0;for(let e=0;e<s.length;e++,l+=4){const t=s[e].split(" ");if(void 0!==n&&(n[l+0]=parseFloat(t[r.x]),n[l+1]=parseFloat(t[r.y]),n[l+2]=parseFloat(t[r.z])),void 0!==a){let e;void 0!==r.rgba?e=new Uint32Array([parseInt(t[r.rgba])]):void 0!==r.rgb&&(e=new Float32Array([parseFloat(t[r.rgb])]));const n=new Uint8Array(e.buffer,0);a[l+2]=n[0]/255,a[l+1]=n[1]/255,a[l+0]=n[2]/255}}}else if("binary"===t.data){let i=0;const s=new DataView(e,t.headerLen);for(let e=0;e<t.points;i+=t.rowSize,e++)void 0!==n&&(n[4*e+0]=s.getFloat32(i+r.x,true),n[4*e+1]=s.getFloat32(i+r.y,true),n[4*e+2]=s.getFloat32(i+r.z,true)),void 0!==a&&(a[4*e+2]=s.getUint8(i+o+0)/255,a[4*e+1]=s.getUint8(i+o+1)/255,a[4*e+0]=s.getUint8(i+o+2)/255)}else if("binary_compressed"===t.data){const i=new Uint32Array(e.slice(t.headerLen,t.headerLen+8)),s=i[0],l=i[1],u=function(e,t){const r=e.length,n=new Uint8Array(t);let a=0,o=0;do{let i=e[a++];if(i<32){if(i++,o+i>t)throw new Error("Output buffer is not large enough");if(a+i>r)throw new Error("Invalid compressed data");do{n[o++]=e[a++]}while(--i)}else{let s=i>>5,l=o-((31&i)<<8)-1;if(a>=r)throw new Error("Invalid compressed data");if(7===s&&(s+=e[a++],a>=r))throw new Error("Invalid compressed data");if(l-=e[a++],o+s+2>t)throw new Error("Output buffer is not large enough");if(l<0)throw new Error("Invalid compressed data");if(l>=o)throw new Error("Invalid compressed data");do{n[o++]=n[l++]}while(2+--s)}}while(a<r);return n}(new Uint8Array(e,t.headerLen+8,s),l),c=new DataView(u.buffer);for(let e=0;e<t.points;e++)void 0!==n&&(n[4*e+0]=c.getFloat32(r.x+4*e,true),n[4*e+1]=c.getFloat32(r.y+4*e,true),n[4*e+2]=c.getFloat32(r.z+4*e,true)),void 0!==a&&(a[4*e+2]=c.getUint8(o+4*e+0)/255,a[4*e+1]=c.getUint8(o+4*e+1)/255,a[4*e+0]=c.getUint8(o+4*e+2)/255)}return null!=n?[m(n,GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE),t.points]:void 0}var ae;ae=a("kPq84").getBundleURL("kyWCV")+a("bXuNP").resolve("4cqXm");const oe=new URL(ae);var ie;ie=a("kPq84").getBundleURL("kyWCV")+a("bXuNP").resolve("eGv1k");const se=new URL(ie);function le(...e){const t=document.createElement("div");let r="";for(let t=0;t<e.length;t++)r+=e[t]+"\n";t.textContent=r,t.className="hint",document.body.append(t),setTimeout((()=>{t.remove()}),5e3)}function ue(e){const t=prompt(e);if(null==t)return;const r=parseInt(t);return isNaN(r)?void 0:r}document.body.onload=async()=>{const e=document.getElementById("display"),t=await async function(e,t){if(null!=window.navigator.gpu)return o=await window.navigator.gpu.requestAdapter({powerPreference:"high-performance"}),i=await o.requestDevice(),u=document.createElement("canvas"),c=u.getContext("webgpu"),l=c.getPreferredFormat(o),g(e,t),u}(e.clientWidth,e.clientHeight);if(null==t){e.remove();const t=document.createElement("div");t.className="error";const r=document.createElement("div");r.className="large",r.innerHTML="WebGPU not available",t.append(r);const n=document.createElement("div");return n.className="normal",n.innerHTML='Only tested with <a href="https://www.google.com/chrome">Google Chrome</a>',t.append(n),void document.body.append(t)}e.append(t);const r=new B(Math.PI/4);r.Translate(0,5,30);const n=new R;n.Scale(5,5,5);const a=new R;let y=64,v=y,P=5e4,U=P,M="sphere",A=re(P),G=te(P);const E=function(e){const t=new Float32Array(8*(4*e+3)),r=new Float32Array(8*(4*e+3)),n=(e,n,a,o,i)=>{null==i&&(i=o),t[0+(e*=8)]=n.x,t[e+1]=n.y,t[e+2]=n.z,r[e+0]=o.x,r[e+1]=o.y,r[e+2]=o.z,t[e+4]=a.x,t[e+5]=a.y,t[e+6]=a.z,r[e+4]=i.x,r[e+5]=i.y,r[e+6]=i.z};for(let t=-e;t<=e;t++){if(0==t)continue;let r;if(t<0)r=t;else{if(0==t)continue;r=t-1}n(1*e+r,{x:t,y:0,z:e},{x:t,y:0,z:-e},{x:1,y:1,z:1}),n(3*e+r,{x:e,y:0,z:t},{x:-e,y:0,z:t},{x:1,y:1,z:1})}return n(4*e+0,{x:-e,y:0,z:0},{x:e,y:0,z:0},{x:1,y:1,z:1},{x:1,y:0,z:0}),n(4*e+1,{x:0,y:-e,z:0},{x:0,y:e,z:0},{x:1,y:1,z:1},{x:0,y:1,z:0}),n(4*e+2,{x:0,y:0,z:-e},{x:0,y:0,z:e},{x:1,y:1,z:1},{x:0,y:0,z:1}),{length:2*(4*e+3),positions:m(t,GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE),colors:m(r,GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE)}}(10);e.onwheel=e=>{const t=1+e.deltaY/1e3;if(0==e.ctrlKey)n.Scale(t,t,t);else{let e=r.fieldOfView*t;e<Math.PI/10&&(e=Math.PI/10),e>9*Math.PI/10&&(e=9*Math.PI/10),r.fieldOfView=e}e.preventDefault(),e.stopImmediatePropagation()},document.body.onresize=()=>{g(e.clientWidth,e.clientHeight),r.UpdateSize()};const S={};let F;document.body.onkeydown=async e=>{switch(S[e.code]=!0,e.code){case"KeyH":le("Left mouse button: rotate camera","Mouse wheel: change cloud size","Mouse wheel + Control: change field of view","QWER: move camera","1: change cloud form","1 + Control: change cloud size for sphere and cube","2: compute k nearest points","2 + Control: change k","3: compute triangulation","4: approximate normal (best with triangulation)","4 + Control: approximate normal (best with k-nearest)","Space: render connections with polygons","0: open notes (german)");break;case"Digit1":if(e.ctrlKey){const e=ue("input new cloud size");if(null==e)break;U=e,M="test"}switch(A.destroy(),G.destroy(),M){case"sphere":P=U,A=function(e,t=.001){const r=new Float32Array(4*e);for(let n=0;n<e;n++){switch(Math.floor(6*Math.random())){case 0:r[4*n+0]=2*Math.random()-1,r[4*n+1]=2*Math.random()-1,r[4*n+2]=-1;break;case 1:r[4*n+0]=2*Math.random()-1,r[4*n+1]=2*Math.random()-1,r[4*n+2]=1;break;case 2:r[4*n+0]=2*Math.random()-1,r[4*n+1]=-1,r[4*n+2]=2*Math.random()-1;break;case 3:r[4*n+0]=2*Math.random()-1,r[4*n+1]=1,r[4*n+2]=2*Math.random()-1;break;case 4:r[4*n+0]=-1,r[4*n+1]=2*Math.random()-1,r[4*n+2]=2*Math.random()-1;break;case 5:r[4*n+0]=1,r[4*n+1]=2*Math.random()-1,r[4*n+2]=2*Math.random()-1}r[4*n+0]+=t*Math.random(),r[4*n+1]+=t*Math.random(),r[4*n+2]+=t*Math.random()}return m(r,GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE)}(P),M="cube";break;case"cube":{const e=await fetch(oe.href),t=ne(await(await e.blob()).arrayBuffer());null!=t?[A,P]=t:alert("pcd error"),M="bunny";break}case"bunny":{const e=await fetch(se.href),t=ne(await(await e.blob()).arrayBuffer());null!=t?[A,P]=t:alert("pcd error"),M="test";break}case"test":P=U,A=re(P),M="sphere"}G=te(P),null!=F&&(F.destroy(),F=void 0);break;case"Digit2":if(e.ctrlKey){const e=ue("input new k for nearest points");null!=e&&(v=e)}null!=F&&F.destroy(),y=v,F=await async function(e,t,r){null==L&&(L=i.createComputePipeline({compute:{module:b(await(await fetch(C.href)).text()),entryPoint:"main"}}));const n=w(4*r*e,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC),a=m(new Uint32Array([r,e]),GPUBufferUsage.STORAGE),o=i.createBindGroup({layout:L.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:a}},{binding:1,resource:{buffer:t}},{binding:3,resource:{buffer:n}}]}),s=i.createCommandEncoder(),l=s.beginComputePass({});return l.setPipeline(L),l.setBindGroup(0,o),l.dispatch(Math.ceil(r/256)),l.endPass(),i.queue.submit([s.finish()]),n}(y,A,P);break;case"Digit3":null!=F&&F.destroy(),F=await async function(e,t){null==X&&(X=i.createComputePipeline({compute:{module:b(await(await fetch(H.href)).text()),entryPoint:"main"}}));const r=w(4*t*16,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC),n=i.createCommandEncoder(),a=m(new Uint32Array([t]),GPUBufferUsage.STORAGE),o=i.createBindGroup({layout:X.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:a}},{binding:1,resource:{buffer:e}},{binding:2,resource:{buffer:r}}]}),s=n.beginComputePass();return s.setPipeline(X),s.setBindGroup(0,o),s.dispatch(Math.ceil(t/256)),s.endPass(),i.queue.submit([n.finish()]),r}(A,P),y=16;break;case"Digit4":if(null==F){alert("please calculate the connections first");break}0==e.ctrlKey?await async function(e,t,r,n,a){null==J&&(J=i.createComputePipeline({compute:{module:b(await(await fetch(Z.href)).text()),entryPoint:"main"}}));const o=m(new Uint32Array([a,n]),GPUBufferUsage.STORAGE),s=i.createBindGroup({layout:J.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:o}},{binding:1,resource:{buffer:e}},{binding:2,resource:{buffer:t}},{binding:3,resource:{buffer:r}}]}),l=i.createCommandEncoder(),u=l.beginComputePass({});u.setPipeline(J),u.setBindGroup(0,s),u.dispatch(Math.ceil(a/256)),u.endPass(),i.queue.submit([l.finish()])}(A,F,G,y,P):await async function(e,t,r,n,a){null==ee&&(ee=i.createComputePipeline({compute:{module:b(await(await fetch(Q.href)).text()),entryPoint:"main"}}));const o=m(new Uint32Array([a,n]),GPUBufferUsage.STORAGE),s=i.createBindGroup({layout:ee.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:o}},{binding:1,resource:{buffer:e}},{binding:2,resource:{buffer:t}},{binding:3,resource:{buffer:r}}]}),l=i.createCommandEncoder(),u=l.beginComputePass({});u.setPipeline(ee),u.setBindGroup(0,s),u.dispatch(Math.ceil(a/256)),u.endPass(),i.queue.submit([l.finish()])}(A,F,G,y,P);break;case"Digit5":if(null==F){alert("please calculate the connections first");break}await async function(e,t,r){null==K&&(K=i.createComputePipeline({compute:{module:b(await(await fetch(Y.href)).text()),entryPoint:"main"}}));const n=m(new Uint32Array([r,t]),GPUBufferUsage.STORAGE),a=i.createBindGroup({layout:K.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:n}},{binding:1,resource:{buffer:e}}]}),o=i.createCommandEncoder(),s=o.beginComputePass({});s.setPipeline(K),s.setBindGroup(0,a),s.dispatch(Math.ceil(r/256)),s.endPass(),i.queue.submit([o.finish()])}(F,y,P);break;case"Digit0":window.open("notes.html","_blank")}},document.body.onkeyup=e=>{delete S[e.code]},le("press 'H' for help"),e.onmousemove=e=>{0!=(1&e.buttons)&&(r.RotateX(-e.movementY/200),r.RotateGlobalY(-e.movementX/200))};let k=await new Promise(requestAnimationFrame);for(;;){const e=await new Promise(requestAnimationFrame),t=e-k;t>25&&console.log(t);const o=t/50,l=(e,t,n,a)=>{null!=S[e]&&r.Translate(t*o,n*o,a*o)};l("KeyW",0,0,-1),l("KeyD",1,0,0),l("KeyS",0,0,1),l("KeyA",-1,0,0),l("KeyF",0,-1,0),l("KeyR",0,1,0),T=r,p=i.createCommandEncoder(),h=p.beginRenderPass({colorAttachments:[{loadValue:s,storeOp:"store",view:c.getCurrentTexture().createView()}],depthStencilAttachment:{depthLoadValue:1,depthStoreOp:"store",stencilLoadValue:0,stencilStoreOp:"store",view:f.createView()}}),d=T.Buffer(),await x(a,E.length,E.positions,E.colors),null!=F?null==S.Space?(await z(n,.015,P,A,G),await I(n,A,G,F,y,P)):await W(n,A,G,F,y,P):await z(n,.015,P,A,G),h.endPass(),i.queue.submit([p.finish()]),k=e}var T};
//# sourceMappingURL=index.ccd019c7.js.map
