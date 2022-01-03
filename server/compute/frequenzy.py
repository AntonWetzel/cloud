import scipy.sparse.linalg.eigen as eigen
import scipy.sparse as sparse
import numpy as np
import time
import math


def frequenzy(cloud: np.ndarray, sur: np.ndarray, n: int, k: int) -> np.ndarray:
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

	_, vectors = eigen.eigsh(lapl, c, sigma=0, which='LM')
	print("\tgenerated eigenvectors", time.time() - t1)
	m = vectors @ vectors.transpose() @ cloud.reshape(n, 4)
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
	m = vectors @ vectors.transpose() @ cloud.reshape(n, 4)
	for i in range(n):
		m[i, 0] = math.sqrt(m[i, 0] * m[i, 0] + m[i, 1] * m[i, 1] + m[i, 2] * m[i, 2]) * 10
		m[i, 1] = 0
		m[i, 2] = 0
		m[i, 3] = 0
	return m.reshape(n * 4)
