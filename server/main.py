import aiohttp
from aiohttp import web
import asyncio

from compute import compute
import generate

generateIdOffset = 1
computeIdOffset = 33


def handle(path: str, content_type: str):
	file = open(path, 'r').read()
	return web.Response(text=file, content_type=content_type)


async def websocket_handler(request):
	ws = web.WebSocketResponse()
	await ws.prepare(request)

	async for msg in ws:
		if msg.type == aiohttp.WSMsgType.ERROR:
			print('ws connection closed with exception %s' % ws.exception())
		elif msg.type == aiohttp.WSMsgType.BINARY:
			data: bytes = msg.data
			info = int.from_bytes(data[0:4], "little")
			if generateIdOffset <= info and info < computeIdOffset:
				info -= generateIdOffset
				print("started generate " + str(info))
				size = int.from_bytes(data[4:8], "little")
				await generate.create(info, { "size": size }, ws)
				print("executed generate " + str(info))
			elif computeIdOffset <= info and info <= 50:
				info -= computeIdOffset
				print("started compute " + str(info))
				await compute(info, data[4:], ws)
				print("executed compute " + str(info))
			else:
				print("wrong info code: ", info)
	return ws


def create_runner():
	app = web.Application()
	app.add_routes(
		[
		web.get('/ws', websocket_handler),
		web.get('/', lambda _: handle("./index.html", "text/html")),
		web.get('/index', lambda _: handle("./index.html", "text/html")),
		web.get('/index.html', lambda _: handle("./index.html", "text/html")),
		web.get('/main.css', lambda _: handle("./main.css", "text/css")),
		web.get('/favicon.svg', lambda _: handle("./index.html", "image/svg+xml")),
		web.get('/bundle.js', lambda _: handle("./bundle.js", "application/javascript")),
		]
	)
	return web.AppRunner(app)


async def start_server(host="localhost", port=5500):
	runner = create_runner()
	await runner.setup()
	site = web.TCPSite(runner, host, port)
	await site.start()


if __name__ == "__main__":
	loop = asyncio.new_event_loop()
	loop.run_until_complete(start_server())
	print("start")
	loop.run_forever()
