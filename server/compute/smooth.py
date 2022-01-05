from numba import cuda, types
import numpy as np
from .shared import *


@cuda.jit(types.void(types.float32[:], types.uint32[:], types.float32[:], types.uint32, types.uint32))
def smooth(cloud, sur, new_cloud, n, k):
	id = cuda.grid(1)
	if id >= n:
		return
	offset = id * k
	p = get_point(cloud, id)
	x = p[0]
	y = p[1]
	z = p[2]
	for c in range(k):
		other = sur[offset + c]
		other = get_point(cloud, other)
		x += other[0]
		y += other[1]
		z += other[2]
	k += 1
	new_cloud[id * 4 + 0] = x / k
	new_cloud[id * 4 + 1] = y / k
	new_cloud[id * 4 + 2] = z / k
	new_cloud[id * 4 + 3] = 0
