from numba import cuda, types
import numpy as np
from .shared import *


@cuda.jit(types.void(types.float32[:], types.uint32[:], types.uint32, types.uint32))
def nearest_iter(cloud, sur, n, k):
	id = cuda.grid(1)
	if id >= n:
		return
	offset = (id + 1) * k - 1
	p = get_point(cloud, id)
	last = 0.0
	for c in range(k):
		current: int
		dist = np.Infinity
		for i in range(n):
			o = get_point(cloud, i)
			d = dist_pow_2(p, o)
			if d < dist and last < d:
				current = i
				dist = d
		sur[offset - c] = current
		last = dist


@cuda.jit(types.void(types.float32[:], types.uint32[:], types.uint32, types.uint32))
def nearest_list(cloud, sur, n, k):
	id = cuda.grid(1)
	if id >= n:
		return
	offset = id * k
	p = get_point(cloud, id)
	i = 0
	for c in range(k):
		if (i == id):
			i += 1
		o = get_point(cloud, i)
		d = dist_pow_2(p, o)
		idx = 0
		for _ in range(c):
			if dist_pow_2(p, get_point(cloud, sur[offset + idx])) < d:
				break
			idx += 1
		for x in range(c, idx, -1):
			sur[offset + x] = sur[offset + x - 1]
		sur[offset + idx] = i
		i += 1
	dist = dist_pow_2(p, get_point(cloud, sur[offset]))
	while i < n:
		if (i == id):
			i += 1
			continue
		d = dist_pow_2(p, get_point(cloud, i))
		if d < dist:
			idx = 0
			while idx + 1 < k:
				next = sur[offset + idx + 1]
				if dist_pow_2(p, get_point(cloud, next)) < d:
					break
				sur[offset + idx] = next
				idx += 1
			sur[offset + idx] = i
			dist = dist_pow_2(p, get_point(cloud, sur[offset]))
		i += 1


@cuda.jit(types.void(types.float32[:], types.uint32[:], types.uint32, types.uint32))
def nearest_iter_sorted(cloud, sur, n, k):
	id = cuda.grid(1)
	if id >= n:
		return
	offset = (id + 1) * k - 1
	p = get_point(cloud, id)
	last = 0
	for c in range(k):
		best: int
		dist = np.Infinity
		for i in range(id - 1, -1, -1):
			o = get_point(cloud, i)
			x_d = o[0] - p[0]
			if (x_d * x_d) > dist:
				break
			d = dist_pow_2(p, o)
			if last < d and d < dist:
				best = i
				dist = d
		for i in range(id + 1, n):
			o = get_point(cloud, i)
			x_d = o[0] - p[0]
			if (x_d * x_d) > dist:
				break
			d = dist_pow_2(p, o)
			if last < d and d < dist:
				best = i
				dist = d
		sur[offset - c] = best
		last = dist


@cuda.jit(types.void(types.float32[:], types.uint32[:], types.uint32, types.uint32))
def nearest_list_sorted(cloud, sur, n, k):
	id = cuda.grid(1)
	if id >= n:
		return
	offset = id * k
	p = get_point(cloud, id)

	if id < n / 2:
		dir = 1
		low = id - 1
		high = id + k + 1
	else:
		dir = -1
		low = id - 1 - k
		high = id + 1
	for c in range(k):
		i = id + (1 + c) * dir
		o = get_point(cloud, i)
		d = dist_pow_2(p, o)
		idx = 0
		for _ in range(c):
			if dist_pow_2(p, get_point(cloud, sur[offset + idx])) < d:
				break
			idx += 1
		for x in range(c, idx, -1):
			sur[offset + x] = sur[offset + x - 1]
		sur[offset + idx] = i
	dist = dist_pow_2(p, get_point(cloud, sur[offset]))

	for i in range(low, -1, -1):
		o = get_point(cloud, i)
		x_d = o[0] - p[0]
		if (x_d * x_d) > dist:
			break
		d = dist_pow_2(p, o)
		if d < dist:
			idx = 0
			while idx + 1 < k:
				next = sur[offset + idx + 1]
				if dist_pow_2(p, get_point(cloud, next)) < d:
					break
				sur[offset + idx] = next
				idx += 1
			sur[offset + idx] = i
			dist = dist_pow_2(p, get_point(cloud, sur[offset]))
	for i in range(high, n):
		o = get_point(cloud, i)
		x_d = o[0] - p[0]
		if (x_d * x_d) > dist:
			break
		d = dist_pow_2(p, o)
		if d < dist:
			idx = 0
			while idx + 1 < k:
				next = sur[offset + idx + 1]
				if dist_pow_2(p, get_point(cloud, next)) < d:
					break
				sur[offset + idx] = next
				idx += 1
			sur[offset + idx] = i
			dist = dist_pow_2(p, get_point(cloud, sur[offset]))
