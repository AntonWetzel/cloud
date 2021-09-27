
[[block]] struct Uniforms {
	aspect: f32;
};

[[group(0), binding(0)]] var<uniform> uniforms: Uniforms;
[[group(0), binding(1)]] var mySampler : sampler;
[[group(0), binding(2)]] var myTexture : texture_depth_2d;

struct VertexOutput {
  [[builtin(position)]] Position : vec4<f32>;
  [[location(0)]] fragUV : vec2<f32>;
};

[[stage(vertex)]]
fn vertexMain([[location(0)]] position: vec2<f32>) -> VertexOutput {
  var output : VertexOutput;
  output.Position = vec4<f32>(position.x / uniforms.aspect, position.y, 0.0, 1.0);
  output.fragUV = (position / 2.0 + 0.5);
  output.fragUV.y = 1.0 - output.fragUV.y;
  return output;
}

[[stage(fragment)]]
fn fragmentMain([[location(0)]] fragUV : vec2<f32>) -> [[location(0)]] vec4<f32> {
var c = 1.0 - textureSample(myTexture, mySampler, fragUV);
  return vec4<f32>(c, c, c, 1.0);
}
