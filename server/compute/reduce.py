import numpy as np
from numba import types, jit
import numpy as np
from .shared import *


@jit(types.Tuple([types.int32, types.float32[:]])(types.float32[:], types.float32[:], types.int32))
def reduce(cloud, edge, n):
	c = 0
	for i in range(n):
		if edge[i * 4] >= 1:
			c += 1
	new_cloud = np.empty(c * 4, dtype=np.float32)
	c = 0
	for i in range(n):
		if edge[i * 4] >= 0.5:
			new_cloud[c * 4 + 0] = cloud[i * 4 + 0]
			new_cloud[c * 4 + 1] = cloud[i * 4 + 1]
			new_cloud[c * 4 + 2] = cloud[i * 4 + 2]
			c += 1
	return (c, new_cloud)
