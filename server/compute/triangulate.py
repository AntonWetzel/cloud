from numba import cuda, types, jit
from numba.core.errors import NumbaDeprecationWarning
import numpy as np
from .shared import *

triangulate_max = 16


@cuda.jit(types.void(types.float32[:], types.uint32[:], types.uint32))
def triangulate_with_all(cloud, sur, n):
	"calculate triangulation around the point, consider all points in the cloud"
	id = cuda.grid(1)
	if id >= n: return
	p = get_point(cloud, id)
	offset = id * triangulate_max
	dist = np.Infinity
	for i in range(0, n): #find nearest point to start
		if i == id: continue
		d = dist_pow_2(p, get_point(cloud, i))
		if d < dist:
			dist = d
			near = i

	sur[offset] = near
	current = near
	direction: Point = (0.0, 0.0, 0.0)
	current_point = get_point(cloud, current)
	idx = 1
	while idx < triangulate_max:
		next = n
		best = 0.0
		for i in range(0, n):
			if i == id or i == current: continue
			n_point = get_point(cloud, i)

			#check if this point is further in the rotation
			if (dot(sub(p, n_point), direction) > 0.0): continue

			#calculate angle with known points (https://en.wikipedia.org/wiki/Law_of_sines)
			ab = normalize(sub(p, n_point))
			ac = normalize(sub(current_point, n_point))
			alpha = math.acos(dot(ab, ac))
			if alpha > best: #save best point with biggest angle
				next = i
				best = alpha

		if next == near: break #return when all points are found (full circle)
		if next == n: break #cancel if no point is valid

		n_point = get_point(cloud, next)
		direction = cross(cross(sub(current_point, p), sub(n_point, p)), sub(n_point, p))
		current_point = n_point
		sur[offset + idx] = next
		current = next
		idx += 1

	while idx < triangulate_max:
		sur[offset + idx] = id #fill remaining space with own (invalid) id
		idx += 1


@cuda.jit(types.void(types.float32[:], types.uint32[:], types.uint32[:], types.uint32, types.uint32))
def triangulate_with_nearest(cloud, sur, new_sur, n, k):
	"calculate triangulation around the point, consider only k-nearest"
	id = cuda.grid(1)
	if id >= n: return
	p = get_point(cloud, id)
	offset = id * k
	write_offset = id * triangulate_max
	near = sur[offset + k - 1]

	new_sur[write_offset] = near
	current = near
	direction: Point = (0.0, 0.0, 0.0)
	current_point = get_point(cloud, current)
	idx = 1
	while idx < triangulate_max:
		next = n
		best = 0.0
		for t in range(0, k):
			i = sur[offset + t]
			if i == current: continue
			n_point = get_point(cloud, i)

			#check if this point is further in the rotation
			if (dot(sub(p, n_point), direction) > 0.0): continue

			#calculate angle with known points (https://en.wikipedia.org/wiki/Law_of_sines)
			ab = normalize(sub(p, n_point))
			ac = normalize(sub(current_point, n_point))
			alpha = math.acos(dot(ab, ac))
			if alpha > best: #save best point with biggest angle
				next = i
				best = alpha

		#return when all points are found (full circle)
		if next == near: break

		#cancel if no point is valid
		if next == n: break

		n_point = get_point(cloud, next)
		direction = cross(cross(sub(current_point, p), sub(n_point, p)), sub(n_point, p))
		current_point = n_point
		new_sur[write_offset + idx] = next
		current = next
		idx += 1

	#fill remaining space with own (invalid) id
	while idx < triangulate_max:
		new_sur[write_offset + idx] = id
		idx += 1
