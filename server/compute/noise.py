from scipy.sparse.construct import random
from numba import cuda, types, jit
import numpy as np
from .shared import *
from random import random


@jit(types.void(types.float32[:], types.float32, types.int32), nopython=True)
def add_noise(cloud: np.ndarray, amount: float, n: int):
	"add random noise to every point in range [-amount, amount]"
	for i in range(n):
		cloud[i * 4 + 0] += (random() * 2 - 1) * amount
		cloud[i * 4 + 1] += (random() * 2 - 1) * amount
		cloud[i * 4 + 2] += (random() * 2 - 1) * amount
