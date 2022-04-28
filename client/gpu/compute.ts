import { ConvertURI, CreateBuffer, device, NewModule } from './gpu.js'

import cleanDangURI          from 'compute/cleanDang.wgsl'
import cleanLongURI          from 'compute/cleanLong.wgsl'
import kNearestListURI       from 'compute/kNearestList.wgsl'
import kNearestIterURI       from 'compute/kNearestIter.wgsl'
import kNearestIterSortedURI from 'compute/kNearestIterSorted.wgsl'
import kNearestListSortedURI from 'compute/kNearestListSorted.wgsl'
import normalLinearURI       from 'compute/normalLinear.wgsl'
import normalTriangURI       from 'compute/normalTriang.wgsl'
import curvaturePointsURI    from 'compute/curvaturePoints.wgsl'
import curvatureNormalURI    from 'compute/curvatureNormal.wgsl'
import triangulateAllURI     from 'compute/triangulateAll.wgsl'
import triangulateNearestURI from 'compute/triangulateNearest.wgsl'
import reduceLowURI          from 'compute/reduceLow.wgsl'
import reduceAnomalyURI      from 'compute/reduceAnomaly.wgsl'
import sortURI               from 'compute/sort.wgsl'
import noiseURI              from 'compute/noise.wgsl'
import rippleURI             from 'compute/ripple.wgsl'
import peekURI               from 'compute/peek.wgsl'
import thresholdURI         from 'compute/threshold.wgsl'

let pipelines = {
	cleanDang:          undefined as GPUComputePipeline,
	cleanLong:          undefined as GPUComputePipeline,
	kNearestList:       undefined as GPUComputePipeline,
	kNearestIter:       undefined as GPUComputePipeline,
	kNearestIterSorted: undefined as GPUComputePipeline,
	kNearestListSorted: undefined as GPUComputePipeline,
	normalLinear:       undefined as GPUComputePipeline,
	normalTriang:       undefined as GPUComputePipeline,
	curvaturePoints:    undefined as GPUComputePipeline,
	curvatureNormal:    undefined as GPUComputePipeline,
	triangulateAll:     undefined as GPUComputePipeline,
	triangulateNearest: undefined as GPUComputePipeline,
	reduceLow:          undefined as GPUComputePipeline,
	reduceAnomaly:      undefined as GPUComputePipeline,
	sort:               undefined as GPUComputePipeline,
	noise:              undefined as GPUComputePipeline,
	ripple:             undefined as GPUComputePipeline,
	peek:               undefined as GPUComputePipeline,
	threshold:          undefined as GPUComputePipeline,
}

export function Setup() {
	const helper = (uri: string): GPUComputePipeline => {
		return device.createComputePipeline({
			compute: {
				module:     NewModule(ConvertURI(uri)),
				entryPoint: 'main',
			},
		})
	}

	pipelines = {
		cleanDang:          helper(cleanDangURI),
		cleanLong:          helper(cleanLongURI),
		kNearestList:       helper(kNearestListURI),
		kNearestIter:       helper(kNearestIterURI),
		kNearestIterSorted: helper(kNearestIterSortedURI),
		kNearestListSorted: helper(kNearestListSortedURI),
		normalLinear:       helper(normalLinearURI),
		normalTriang:       helper(normalTriangURI),
		curvaturePoints:    helper(curvaturePointsURI),
		curvatureNormal:    helper(curvatureNormalURI),
		triangulateAll:     helper(triangulateAllURI),
		triangulateNearest: helper(triangulateNearestURI),
		reduceLow:          helper(reduceLowURI),
		reduceAnomaly:      helper(reduceAnomalyURI),
		sort:               helper(sortURI),
		noise:              helper(noiseURI),
		ripple:             helper(rippleURI),
		peek:               helper(peekURI),
		threshold:          helper(thresholdURI),
	}
}

export function Compute(
	name: keyof typeof pipelines,
	length: number,
	parameter: [number[], number[]],
	buffers: GPUBuffer[],
	result = false,
): GPUBuffer | undefined {
	const paramU32 = new Uint32Array(1 + parameter[0].length + parameter[1].length)
	const paramF32 = new Float32Array(paramU32.buffer)
	paramU32[0] = length
	for (let i = 0; i < parameter[0].length; i++) {
		paramU32[i+1] = parameter[0][i]
	}
	for (let i = 0; i < parameter[1].length; i++) {
		paramF32[parameter[0].length + i + 1] = parameter[1][i]
	}
	const buffer = CreateBuffer(paramU32, GPUBufferUsage.STORAGE)
	const x: GPUBindGroupEntry[] = []
	x.push({
		binding:  0,
		resource: { buffer: buffer },
	})
	for (let i = 0; i < buffers.length; i++) {
		x.push({
			binding:  i+1,
			resource: {buffer: buffers[i]}
		})
	}
	const pipeline = pipelines[name]
	const group = device.createBindGroup({
		layout:  pipeline.getBindGroupLayout(0),
		entries: x,
	})
	const encoder = device.createCommandEncoder()
	const compute = encoder.beginComputePass({})
	compute.setPipeline(pipeline)
	compute.setBindGroup(0, group)
	compute.dispatch(Math.ceil(length / 256))
	compute.end()

	const commands = encoder.finish()
	device.queue.submit([commands])
	if (result) {
		return buffer
	} else {
		buffer.destroy()
		return undefined
	}
}
