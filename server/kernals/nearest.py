from numba import cuda, types, jit
from numba.core.errors import NumbaDeprecationWarning
import numpy as np
import warnings
from kernals.shared import *

warnings.simplefilter('ignore', category=NumbaDeprecationWarning)
Point = types.Tuple([types.float32, types.float32, types.float32])


@cuda.jit(types.void(types.float32[:], types.uint32[:], types.uint32, types.uint32))
def iter(cloud, sur, n, k):
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
def list(cloud, sur, n, k):
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


@jit(types.void(types.float32[:], types.int32, types.int32), nopython=True, inline="always")
def swap(cloud, a, b):
	t0 = cloud[a * 4 + 0]
	t1 = cloud[a * 4 + 1]
	t2 = cloud[a * 4 + 2]
	t3 = cloud[a * 4 + 3]
	cloud[a * 4 + 0] = cloud[b * 4 + 0]
	cloud[a * 4 + 1] = cloud[b * 4 + 1]
	cloud[a * 4 + 2] = cloud[b * 4 + 2]
	cloud[a * 4 + 3] = cloud[b * 4 + 3]
	cloud[b * 4 + 0] = t0
	cloud[b * 4 + 1] = t1
	cloud[b * 4 + 2] = t2
	cloud[b * 4 + 3] = t3


@jit(types.void(types.float32[:], types.int32, types.int32), nopython=True)
def quickSort(cloud, low, high):
	if low >= high:
		return

	id = (low + high) // 2
	swap(cloud, id, high)
	pivot = cloud[high * 4] # pivot
	i = (low - 1) # Index of smaller element and indicates the right position of pivot found so far
	for j in range(low, high):
		# If current element is smaller than the pivot
		if (cloud[j * 4] < pivot):
			i += 1 # increment index of smaller element
			swap(cloud, i, j)
	swap(cloud, i + 1, high)
	pi = (i + 1)

	# Separately sort elements before
	# partition and after partition
	quickSort(cloud, low, pi - 1)
	quickSort(cloud, pi + 1, high)


@cuda.jit(types.void(types.float32[:], types.uint32[:], types.uint32, types.uint32))
def iter_sorted(cloud, sur, n, k):
	id = cuda.grid(1)
	if id >= n:
		return
	offset = (id + 1) * k - 1
	p = get_point(cloud, id)
	last = 0
	for c in range(k):
		best: int
		dist = 999999.0
		mode = 0
		down = 1
		up = 1
		while True:
			if mode == 0:
				if down > id:
					i = id + up
					up += 1
					mode = 3
				else:
					i = id - down
					down += 1
					mode = 1
			elif mode == 1:
				if id + up >= n:
					i = id - down
					down += 1
					mode = 2
				else:
					i = id + up
					up += 1
					mode = 0
			elif mode == 2:
				if (down > id):
					break
				i = id - down
				down += 1
			else:
				if (id + up >= n):
					break
				i = id + up
				up += 1
			o = get_point(cloud, i)
			x_d = o[0] - p[0]
			if (x_d * x_d) > dist:
				if (mode == 0):
					mode = 3
					continue
				elif (mode == 1):
					mode = 2
					continue
				else:
					break
			d = dist_pow_2(p, o)
			if last < d and d < dist:
				best = i
				dist = d
		sur[offset - c] = best
		last = dist


@cuda.jit(types.void(types.float32[:], types.uint32[:], types.uint32, types.uint32))
def list_sorted(cloud, sur, n, k):
	id = cuda.grid(1)
	if id >= n:
		return
	offset = id * k
	p = get_point(cloud, id)
	down = 1
	up = 1
	mode = 0
	for c in range(k):
		i: int
		if mode == 0:
			if down > id:
				i = id + up
				up += 1
				mode = 3
			else:
				i = id - down
				down += 1
				mode = 1
		elif mode == 1:
			if id + up >= n:
				i = id - down
				down += 1
				mode = 2
			else:
				i = id + up
				up += 1
				mode = 0
		elif mode == 2:
			if down > id:
				break
			else:
				i = id - down
				down += 1
		else:
			if id + up <= n:
				break
			else:
				i = id + up
				up += 1
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
	while True:
		if mode == 0:
			if down > id:
				i = id + up
				up += 1
				mode = 3
			else:
				i = id - down
				down += 1
				mode = 1
		elif mode == 1:
			if id + up >= n:
				i = id - down
				down += 1
				mode = 2
			else:
				i = id + up
				up += 1
				mode = 0
		elif mode == 2:
			if down > id:
				break
			else:
				i = id - down
				down += 1
		else:
			if id + up <= n:
				break
			else:
				i = id + up
				up += 1
		o = get_point(cloud, i)
		x_d = o[0] - p[0]
		if (x_d * x_d) > dist:
			if (mode == 0):
				mode = 3
				continue
			elif (mode == 1):
				mode = 2
				continue
			else:
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
