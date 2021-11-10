[[block]] struct Camera {
	projection: mat4x4<f32>;
	view: mat4x4<f32>;
};

[[block]] struct Parameter {
	model: mat4x4<f32>;
	radius: f32;
	aspect: f32;
};


[[group(0), binding(0)]] var<uniform> camera: Camera;
[[group(0), binding(1)]] var<uniform> parameter: Parameter;

struct Transfer {
	[[builtin(position)]] position : vec4<f32>;
	[[location(0)]] offset : vec2<f32>;
	[[location(1)]] color : vec3<f32>;
};

[[stage(vertex)]]
fn vertexMain(
	[[location(0)]] offset: vec2<f32>,
	[[location(1)]] position : vec3<f32>,
	[[location(2)]] color: vec3<f32>,
) -> Transfer {
	var output : Transfer;
	output.position = camera.projection * camera.view * parameter.model * vec4<f32>(position, 1.0);
	output.position.x = output.position.x + offset.x * parameter.radius;
	output.position.y = output.position.y + offset.y * parameter.radius * parameter.aspect;
	output.offset = offset;
	output.color = color;
	return output;
}

[[stage(fragment)]]
fn fragmentMain(input : Transfer) -> [[location(0)]] vec4<f32> {
	if (length(input.offset) >= 1.0) {
		discard;
	}
	return vec4<f32>(input.color, 1.0);
}
