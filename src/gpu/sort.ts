import { device, ReadBuffer } from './gpu.js'

export  async function Sort(data: GPUBuffer, length: number): Promise<void> {
	const arr = new Float32Array(await ReadBuffer(data, length * 4 * 4))
	quickSort(arr, 0, length - 1)
	for (let i = 0; i < length-1; i++) {
		if (arr[i*4] > arr[(i+1)*4]) {
			console.log(i)
		}
	}
	device.queue.writeBuffer(data, 0, arr)
}

function quickSort(arr: Float32Array, low: number, high: number) {
	if (low < high) 
	{
		const id = Math.floor(Math.random() * high) * 4 
		const  pivot = arr[id] // pivot 
		let i = (low - 1) // Index of smaller element and indicates the right position of pivot found so far
  
		for (let j = low; j <= high - 1; j++) 
		{ 
		// If current element is smaller than the pivot 
			if (arr[j*4] < pivot) 
			{ 
				i++ // increment index of smaller element
				swap(arr, i, j)
			} 
		} 
		swap(arr, i+1, high)
		const pi = (i + 1)
  
		// Separately sort elements before 
		// partition and after partition 
		quickSort(arr, low, pi - 1)
		quickSort(arr, pi + 1, high)
	} 
}

function swap(arr: Float32Array, a: number, b: number) {
	const t0 = arr[a*4+0]
	const t1 = arr[a*4+1]
	const t2 = arr[a*4+2]
	const t3 = arr[a*4+3]
	arr[a*4+0] = arr[b*4+0]
	arr[a*4+1] = arr[b*4+1]
	arr[a*4+2] = arr[b*4+2]
	arr[a*4+3] = arr[b*4+3]
	arr[b*4+0] = t0
	arr[b*4+1] = t1
	arr[b*4+2] = t2
	arr[b*4+3] = t3
}
