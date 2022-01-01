import math
from random import random, randint
from typing import Tuple
import numpy as np
from opensimplex import OpenSimplex
import requests


def sphere(size: int) -> np.ndarray:
	points = np.empty((size, 4), dtype=np.float32)
	for i in range(size):
		long = math.acos(random() * 2 - 1) # less points near the poles
		lat = random() * 2 * math.pi

		points[i, 0] = math.sin(lat) * math.sin(long)
		points[i, 1] = math.cos(long)
		points[i, 2] = math.cos(lat) * math.sin(long)
		points[i, 3] = 0
	return points


def cube(size: int) -> np.ndarray:
	points = np.empty((size, 4), dtype=np.float32)
	for i in range(size):
		face = randint(0, 5)
		if face == 0:
			points[i, 0] = random() * 2 - 1
			points[i, 1] = random() * 2 - 1
			points[i, 2] = -1
		elif face == 1:
			points[i, 0] = random() * 2 - 1
			points[i, 1] = random() * 2 - 1
			points[i, 2] = 1
		elif face == 2:
			points[i, 0] = random() * 2 - 1
			points[i, 1] = -1
			points[i, 2] = random() * 2 - 1
		elif face == 3:
			points[i, 0] = random() * 2 - 1
			points[i, 1] = 1
			points[i, 2] = random() * 2 - 1
		elif face == 4:
			points[i, 0] = -1
			points[i, 1] = random() * 2 - 1
			points[i, 2] = random() * 2 - 1
		elif face == 5:
			points[i, 0] = 1
			points[i, 1] = random() * 2 - 1
			points[i, 2] = random() * 2 - 1
		points[i, 3] = 0

	return points


def map(size: int) -> np.ndarray:
	count = math.ceil(math.sqrt(size))
	points = np.empty((size, 4), dtype=np.float32)
	noise = OpenSimplex()
	c = 0
	for i in range(count):
		for j in range(count):
			points[c, 0] = i / count - 0.5
			points[c, 1] = noise.noise2d(i * 0.01, j * 0.01) / count * 25
			if (random() <= 0.03):
				points[c, 1] += (0.5 + random()) / count * 5
			points[c, 2] = j / count - 0.5
			points[c, 3] = 0
			c += 1
			if c >= size:
				break
		if c >= size:
			break
	return points


def extern(url: str, data_per_point) -> Tuple[np.ndarray, int]:
	r = requests.get(url)
	words = r.text.split()
	i = 0

	while i < len(words):
		if (words[i].lower() == "points"):
			size = int(words[i + 1])
			points = np.empty((size, 4), dtype=np.float32)
			i += 2
		elif words[i].lower() == "ascii":
			i += 1
			break
		else:
			i += 1
	avg = [0, 0, 0]
	for c in range(size):
		for j in range(3):
			points[c, j] = float(words[i + j])
			avg[j] += points[c, j]
		points[c, 3] = 0
		i += data_per_point
	for j in range(3):
		avg[j] /= size
	for c in range(size):
		for j in range(3):
			points[c, j] -= avg[j]
	return (points, size)
