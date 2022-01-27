from numba import cuda, types
import numpy as np
from .shared import *


@cuda.jit(types.void(types.float32[:], types.uint32[:], types.float32[:], types.uint32, types.uint32))
def edge(cloud, sur, edge, n, k):
	id = cuda.grid(1)
	if id >= n:
		return
	p = get_point(cloud, id)
	avg = (0.0, 0.0, 0.0)
	dist = 0
	offset = id * k
	for i in range(k):
		other = sur[offset + i]
		other = get_point(cloud, other)
		avg = add(avg, other)
		dist += length(sub(p, other))
	norm = 1 / k
	avg = (avg[0] * norm, avg[1] * norm, avg[2] * norm)
	dist *= norm

	edge[id * 4 + 0] = length(sub(p, avg)) / dist
	edge[id * 4 + 1] = 0
	edge[id * 4 + 2] = 0
	edge[id * 4 + 3] = 0


@cuda.jit(types.void(types.float32[:], types.float32[:], types.float32, types.uint32))
def threshhold(curve, new_curve, threshhold, n):
	id = cuda.grid(1)
	if id >= n:
		return
	new_curve[id * 4 + 0] = 1 if (curve[id * 4] >= threshhold) else 0
	new_curve[id * 4 + 1] = 0
	new_curve[id * 4 + 2] = 0
	new_curve[id * 4 + 3] = 0


@cuda.jit(
	types.void(
	types.float32[:], types.uint32[:], types.float32[:], types.float32[:], types.uint32, types.uint32
	)
)
def edge_with_normal(cloud, sur, normal, edge, n, k):
	id = cuda.grid(1)
	if id >= n:
		return
	offset = id * k
	p = get_point(cloud, id)
	nor = get_point(normal, id)
	off = 0.0
	for i in range(k):
		other = sur[offset + i]
		if other == id:
			break
		off += abs(dot(normalize(sub(p, get_point(cloud, other))), nor))
	off /= i
	edge[id * 4 + 0] = off
	edge[id * 4 + 1] = 0
	edge[id * 4 + 2] = 0
	edge[id * 4 + 3] = 0


@cuda.jit(types.void(types.float32[:], types.int32[:], types.float32[:], types.uint32, types.uint32))
def peek(curve, sur, new_curve, n, k):
	id = cuda.grid(1)
	if id >= n:
		return
	mode = False
	threshhold = curve[id * 4]
	offset = id * k
	new_curve[id * 4 + 1] = 0
	new_curve[id * 4 + 2] = 0
	new_curve[id * 4 + 3] = 0
	for i in range(k):
		other = sur[offset + i]
		if other == id:
			break
		new_mode = curve[other * 4] >= threshhold
		if mode and new_mode:
			new_curve[id * 4 + 0] = 0
			return
		mode = new_mode
	new_curve[id * 4 + 0] = threshhold
