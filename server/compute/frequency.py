import scipy.sparse.linalg.eigen as eigen
import scipy.sparse as sparse
import numpy as np
import time
from numba import types, jit
import numpy as np
from .shared import *


@jit(
	types.void(
	types.uint32[:], types.float32[:], types.float32[:], types.float32[:], types.uint32, types.uint32
	)
)
def create_matrix(sur, rows, cols, vals, k, n):
	for i in range(n):
		for j in range(k):
			off = i * k + j
			x = sur[off]
			off *= 4
			rows[off + 0] = i
			cols[off + 0] = i
			vals[off + 0] = -1
			rows[off + 1] = x
			cols[off + 1] = x
			vals[off + 1] = -1
			rows[off + 2] = x
			cols[off + 2] = i
			vals[off + 2] = 1
			rows[off + 3] = i
			cols[off + 3] = x
			vals[off + 3] = 1


def frequenzy(cloud: np.ndarray, sur: np.ndarray, n: int, k: int, c: int) -> np.ndarray:
	t = time.time()
	rows = np.empty(n * k * 4, dtype=np.float32)
	cols = np.empty(n * k * 4, dtype=np.float32)
	vals = np.empty(n * k * 4, dtype=np.float32)

	create_matrix(sur, rows, cols, vals, k, n)

	lapl = sparse.coo_matrix((vals, (rows, cols)), shape=(n, n))
	print("\tgenerated laplace matrix", time.time() - t)

	_, vectors = eigen.eigsh(lapl, c, sigma=0, which='LM')
	print("\tgenerated eigenvectors", time.time() - t)
	m = vectors @ (vectors.transpose() @ cloud.reshape(n, 4))
	print("\tfinished", time.time() - t)
	return m.reshape(n * 4)


def high_frequenzy(cloud: np.ndarray, sur: np.ndarray, n: int, k: int) -> np.ndarray:
	t = time.time()
	lapl = np.zeros((n, n), dtype=np.float32)

	for i in range(n):
		for j in range(i * k, (i + 1) * k):
			x = sur[j]
			lapl[i, i] -= 1
			lapl[x, x] -= 1
			lapl[i, x] += 1
			lapl[x, i] += 1

	lapl = sparse.lil_matrix(lapl)
	c = 50
	t1 = time.time()
	print("\tgenerated laplace matrix", t1 - t)

	_, vectors = eigen.eigsh(lapl, c, which='LM')
	print("\tgenerated eigenvectors", time.time() - t1)
	test = vectors @ vectors.transpose()
	m = test @ cloud.reshape(n, 4)
	imp = np.zeros(n, dtype=np.float32)
	for i in range(n):
		for j in range(n):
			imp[i] += test[j, i]
	min = np.Infinity
	max = -np.Infinity
	for i in range(n):
		if min > imp[i]:
			min = imp[i]
		if max < imp[i]:
			max = imp[i]
	print(min, max)
	l = max - min
	for i in range(n):
		m[i, 0] = (imp[i] - min) / l
		m[i, 1] = 0
		m[i, 2] = 0
		m[i, 3] = 0
	return m.reshape(n * 4)
