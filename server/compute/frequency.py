import scipy.sparse.linalg.eigen as eigen
import scipy.sparse as sparse
import numpy as np
from numba import types, jit
import numpy as np
from .shared import *


@jit(types.void(types.uint32[:], types.float32[:], types.float32[:], types.float32[:], types.uint32, types.uint32))
def create_laplace_matrix(sur, rows, cols, vals, k, n):
	"helper to calculate laplace matrix faster"
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


def filter_frequency_domain(cloud: np.ndarray, sur: np.ndarray, n: int, k: int, c: int) -> np.ndarray:
	"filter high frequencies with a ideal low pass filter"
	rows = np.empty(n * k * 4, dtype=np.float32)
	cols = np.empty(n * k * 4, dtype=np.float32)
	vals = np.empty(n * k * 4, dtype=np.float32)

	create_laplace_matrix(sur, rows, cols, vals, k, n)

	lapl = sparse.coo_matrix((vals, (rows, cols)), shape=(n, n)) #claculate laplace matrix
	_, vectors = eigen.eigsh(lapl, c, sigma=0, which='LM') #calculate eigenvalues
	m = vectors @ (vectors.transpose() @ cloud.reshape(n, 4)) #filter in frequency domain

	return m.reshape(n * 4)
