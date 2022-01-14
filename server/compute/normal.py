from numba import cuda, types
import numpy as np
from .shared import *


@cuda.jit(types.void(types.float32[:], types.uint32[:], types.float32[:], types.uint32, types.uint32))
def normal(cloud, sur, normal, n, k):
	id = cuda.grid(1)
	if id >= n:
		return
	offset = id * k
	p = get_point(cloud, id)
	last = get_point(cloud, sur[offset])
	n = (0.0, 0.0, 0.0)
	for i in range(1, k):
		other = sur[offset + i]
		if other == id:
			break
		current = get_point(cloud, other)
		n = add(n, cross(sub(last, p), sub(current, p)))
		last = current
	n = normalize(n)
	normal[id * 4 + 0] = n[0]
	normal[id * 4 + 1] = n[1]
	normal[id * 4 + 2] = n[2]
	normal[id * 4 + 3] = 0
