from typing import Tuple
from numpy.core.fromnumeric import shape
from scipy.sparse.construct import random
import scipy.sparse.linalg.eigen as eigen
import scipy.sparse as sparse
from numba import cuda, types, jit
from numba.core.errors import NumbaDeprecationWarning
import numpy as np
from .shared import *
import time
from random import random


@jit(types.void(types.float32[:], types.float32, types.int32), nopython=True)
def noise(cloud: np.ndarray, amount: float, n: int):
	for i in range(n):
		cloud[i * 4 + 0] += (random() * 2 - 1) * amount
		cloud[i * 4 + 1] += (random() * 2 - 1) * amount
		cloud[i * 4 + 2] += (random() * 2 - 1) * amount
