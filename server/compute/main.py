import types
from typing import Dict
from typing_extensions import Literal
from numba import cuda
from numba.core.types.misc import NoneType, Undefined
from numba.cuda.cudadrv.devicearray import DeviceNDArray
from numba.cuda.cudadrv.driver import Stream
import numpy as np
import math
from random import random
from .generate import sphere, cube, map, extern

from .nearest import nearest_iter

stream: Stream = cuda.stream()

size: int = 0
cloud: np.ndarray
d_cloud: DeviceNDArray

k: int = 0
nearest: np.ndarray
d_nearest: DeviceNDArray


async def compute(name: Literal["nearestIter"], paramter: Dict) -> np.ndarray:
    global size, cloud, d_cloud, k, nearest, d_nearest

    thread_per_block = 256
    blockspergrid = math.ceil(size / thread_per_block)

    if name == "nearestIter":
        if size == 0:
            print("cloud needed for nearest")
            return
        k = paramter["k"]
        d_nearest = cuda.device_array(size*k, dtype=np.uint32, stream=stream)
        nearest = np.empty(size*k, dtype=np.uint32)
        nearest_iter[blockspergrid, thread_per_block, stream](
            d_cloud, d_nearest, size, k
        )
        await stream.async_done()
        d_nearest.copy_to_host(nearest)
        return nearest
    print("compute error: name '" + name + "' wrong")


def generate(id: int, parameter: Dict) -> np.ndarray:
    global size, cloud, d_cloud
    size = parameter["size"]
    if id == 0:
        cloud = sphere(size)
    elif id == 1:
        cloud = cube(size)
    elif id == 2:
        cloud = map(size)
    elif id == 3:
        cloud = extern(
            "https://raw.githubusercontent.com/PointCloudLibrary/pcl/master/test/bunny.pcd"
        )
    elif id == 4:
        cloud = extern(
            "https://raw.githubusercontent.com/PointCloudLibrary/pcl/master/test/rops_cloud.pcd"
        )
    else:
        print("generate error: id '" + id + "' wrong")
    d_cloud = cuda.to_device(cloud, stream=stream)
    return cloud
