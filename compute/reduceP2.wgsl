[[block]] struct Buffer {
	data: array<vec3<f32>>;
};

[[block]] struct Indices {
	data: array<u32>;
};

[[block]] struct Parameter {
	placeholder: u32;
	length: u32;
	new_length: u32;
	threshhold: f32;
};

[[group(0), binding(0)]] var<storage, read_write> parameter: Parameter;
[[group(0), binding(1)]] var<storage, read> distances: Buffer;

let MAX_DISTANCE = 340282346638528859811704183484516925440.0; //max value for f32 (i think)

[[stage(compute), workgroup_size(1)]]
fn main() {
	var count = 0u;
	for (var i = 0u; i < parameter.length; i = i + 1u) {
		if (distances.data[i].x >= parameter.threshhold) {
			count = count + 1u;
		}
	}
	parameter.new_length = count;
}
