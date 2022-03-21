from numba import cuda, types
import numpy as np
from .shared import *


@cuda.jit(types.void(types.float32[:], types.uint32[:], types.float32[:], types.uint32, types.uint32))
def filter_spatial_domain(cloud, sur, new_cloud, n, k):
	"execute one iteration with a box-filter, switch cloud and new_cloud for multiple iterations"
	id = cuda.grid(1)
	if id >= n: return
	offset = id * k
	x = 0
	y = 0
	z = 0
	for c in range(k):
		other = sur[offset + c]
		other = get_point(cloud, other)
		x += other[0]
		y += other[1]
		z += other[2]
	new_cloud[id * 4 + 0] = x / k
	new_cloud[id * 4 + 1] = y / k
	new_cloud[id * 4 + 2] = z / k
	new_cloud[id * 4 + 3] = 0
