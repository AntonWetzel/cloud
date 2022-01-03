import struct
from aiohttp.web_ws import WebSocketResponse
from numba import cuda
from numba.cuda.cudadrv.devicearray import DeviceNDArray
from numba.cuda.cudadrv.driver import Stream
import numpy as np
import math

import compute.compute as compute
import generate as generate


def number_to_bytes(n: int) -> bytes:
	return n.to_bytes(4, 'little')


class Handler:
	def __init__(self, ws: WebSocketResponse) -> None:
		self.stream: Stream = cuda.stream()

		self.size: int = 0
		self.cloud: np.ndarray = np.array([])
		self.d_cloud: DeviceNDArray

		self.k: int = 0
		self.surround: np.ndarray
		self.d_surround: DeviceNDArray

		self.curvature: np.ndarray
		self.d_curvature: np.ndarray

		self.ws = ws

	async def update_cloud(self, cloud: np.ndarray, size: int, reset_sur: bool = False):
		self.cloud = cloud
		self.size = size
		self.d_cloud = cuda.to_device(cloud, stream=self.stream)
		if reset_sur:
			self.k = 0
		await self.ws.send_bytes(number_to_bytes(1) + number_to_bytes(size) + cloud.tobytes())

	async def send_surrounding(self):
		await self.ws.send_bytes(number_to_bytes(2) + number_to_bytes(self.k) + self.surround.tobytes())

	async def send_curvature(self):
		await self.ws.send_bytes(number_to_bytes(3) + self.curvature.tobytes())

	async def compute(self, id: int, data: bytes):

		thread_per_block = 256
		blockspergrid = math.ceil(self.size / thread_per_block)

		if id == 0 or id == 1:
			if self.size == 0:
				print("cloud needed for surround")
				return
			self.k = int.from_bytes(data[0:4], "little")
			self.d_surround = cuda.device_array(self.size * self.k, dtype=np.uint32, stream=self.stream)
			if id == 0:
				compute.nearest_iter[blockspergrid, thread_per_block,
					self.stream](self.d_cloud, self.d_surround, self.size, self.k)
			elif id == 1:
				compute.nearest_list[blockspergrid, thread_per_block,
					self.stream](self.d_cloud, self.d_surround, self.size, self.k)
			self.surround = self.d_surround.copy_to_host(stream=self.stream)
			await self.stream.async_done()
			await self.send_surrounding()
		elif id == 2 or id == 3:
			if self.size == 0:
				print("cloud needed for surround")
				return
			self.k = int.from_bytes(data[0:4], "little")
			self.d_surround = cuda.device_array(self.size * self.k, dtype=np.uint32, stream=self.stream)
			cloud = self.cloud.reshape(self.size, 4)
			ind = np.lexsort((cloud[:, 2], cloud[:, 1], cloud[:, 0]))
			cloud = cloud[ind]
			cloud = cloud.reshape(self.size * 4)
			await self.update_cloud(cloud, self.size)
			if id == 2:
				compute.nearest_iter_sorted[blockspergrid, thread_per_block,
					self.stream](self.d_cloud, self.d_surround, self.size, self.k)
			elif id == 3:
				compute.nearest_list_sorted[blockspergrid, thread_per_block,
					self.stream](self.d_cloud, self.d_surround, self.size, self.k)
			self.surround = self.d_surround.copy_to_host(stream=self.stream)
			await self.stream.async_done()
			await self.send_surrounding()
		elif id == 4:
			if self.size == 0:
				print("cloud needed for surround")
				return
			self.k = compute.triangulate_max
			self.d_surround = cuda.device_array(self.size * self.k, dtype=np.uint32, stream=self.stream)
			compute.triangulate_all[blockspergrid, thread_per_block,
				self.stream](self.d_cloud, self.d_surround, self.size)
			self.surround = self.d_surround.copy_to_host(stream=self.stream)
			await self.stream.async_done()
			await self.send_surrounding()
		elif id == 5:
			if self.k == 0:
				print("surrounding needed for triangulation with surrounding")
				return
			new_k = compute.triangulate_max
			new_d_surround = cuda.device_array(self.size * new_k, dtype=np.uint32, stream=self.stream)
			compute.triangulate_with_sur[blockspergrid, thread_per_block,
				self.stream](self.d_cloud, self.d_surround, new_d_surround, self.size, self.k)
			self.d_surround = new_d_surround
			self.k = new_k
			self.surround = self.d_surround.copy_to_host(stream=self.stream)
			await self.stream.async_done()
			await self.send_surrounding()
		elif id == 6:
			[amount] = struct.unpack('<f', data[0:4])
			print("amount:", amount)
			compute.noise(self.cloud, amount, self.size)
			await self.update_cloud(self.cloud, self.size, True)
		elif id == 7:
			if self.k == 0:
				print("surround needed for laplace")
				return
			cloud = compute.frequenzy(self.cloud, self.surround, self.size, self.k)
			await self.update_cloud(cloud, self.size, self.ws)
		elif id == 8:
			if self.k == 0:
				print("surround needed for laplace")
				return
			self.curvature = compute.high_frequenzy(self.cloud, self.surround, self.size, self.k)
			self.d_curvature = cuda.to_device(self.curvature, stream=self.stream)
			await self.send_curvature()
		else:
			print("compute error: id '" + str(id) + "' wrong")

	async def create(self, id: int, size: int):
		size, cloud = generate.create(id, size)
		await self.update_cloud(cloud, size, True)
