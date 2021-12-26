import math
from random import random, randint
import numpy as np
from opensimplex import OpenSimplex
import requests


def sphere(size: int) -> np.ndarray:
    points = np.empty(size * 4, dtype=np.float32)
    for i in range(size):
        long = math.acos(random() * 2 - 1)  # less points near the poles
        lat = random() * 2 * math.pi

        points[i * 4 + 0] = math.sin(lat) * math.sin(long)
        points[i * 4 + 1] = math.cos(long)
        points[i * 4 + 2] = math.cos(lat) * math.sin(long)
        points[i * 4 + 3] = 0
    return points


def cube(size: int) -> np.ndarray:
    points = np.empty(size * 4, dtype=np.float32)
    for i in range(size):
        face = randint(0, 5)
        if face == 0:
            points[i * 4 + 0] = random() * 2 - 1
            points[i * 4 + 1] = random() * 2 - 1
            points[i * 4 + 2] = -1
        elif face == 1:
            points[i * 4 + 0] = random() * 2 - 1
            points[i * 4 + 1] = random() * 2 - 1
            points[i * 4 + 2] = 1
        elif face == 2:
            points[i * 4 + 0] = random() * 2 - 1
            points[i * 4 + 1] = -1
            points[i * 4 + 2] = random() * 2 - 1
        elif face == 3:
            points[i * 4 + 0] = random() * 2 - 1
            points[i * 4 + 1] = 1
            points[i * 4 + 2] = random() * 2 - 1
        elif face == 4:
            points[i * 4 + 0] = -1
            points[i * 4 + 1] = random() * 2 - 1
            points[i * 4 + 2] = random() * 2 - 1
        elif face == 5:
            points[i * 4 + 0] = 1
            points[i * 4 + 1] = random() * 2 - 1
            points[i * 4 + 2] = random() * 2 - 1
        points[i * 4 + 3] = 0

    return points


def map(size: int) -> np.ndarray:
    count = math.ceil(math.sqrt(size))
    points = np.empty(size * 4, dtype=np.float32)
    noise = OpenSimplex()
    c = 0
    for i in range(count):
        for j in range(count):
            points[c * 4 + 0] = i / count - 0.5
            points[c * 4 + 1] = noise.noise2d(i * 0.01, j * 0.01) / count * 25
            if (random() <= 0.03):
                points[c * 4 + 1] += (0.5 + random()) / count * 5
            points[c * 4 + 2] = j / count - 0.5
            points[c * 4 + 3] = 0
            c += 1
            if c >= size:
                break
        if c >= size:
            break
    return points


def extern(url: str) -> np.ndarray:
    r = requests.get(url)
    words = r.text.split()
    i = 0

    while i < len(words):
        if (words[i].lower() == "points"):
            size = int(words[i+1])
            points = np.empty(size * 4, dtype=np.float32)
            i += 2
        elif words[i].lower() == "ascii":
            i += 1
            break
        else:
            i += 1
    c = 0
    while i < len(words):
        points[c * 4 + 0] = words[i + 0]
        points[c * 4 + 1] = words[i + 1]
        points[c * 4 + 2] = words[i + 2]
        points[c * 4 + 3] = 0
        c += 1
        i += 3
    return points
