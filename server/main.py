import types
import aiohttp
from aiohttp import web, WSCloseCode
import asyncio
from numba import cuda
from numba.cuda.cudadrv.devices import reset
import numpy as np

from aiohttp.client import request

from compute.main import compute, generate


def handle(path: str, content_type: str):
    file = open(path, 'r').read()
    return web.Response(
        text=file,
        content_type=content_type
    )


"""
        case "js":
            content_type = ""
        case "css":
            content_type = ""
        case "svg":
            content_type = ""
        case _:
            return"""


async def websocket_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    async for msg in ws:
        # ws.__next__() automatically terminates the loop
        # after ws.close() or ws.exception() is called

        if msg.type == aiohttp.WSMsgType.ERROR:
            print('ws connection closed with exception %s' %
                  ws.exception())
        elif msg.type == aiohttp.WSMsgType.BINARY:
            data: bytes = msg.data
            info = int.from_bytes(data[0:4], "little")
            result: np.ndarray = None
            if 1 <= info and info < 32:
                size = int.from_bytes(data[4:8], "little")
                result = generate(info-1, {"size": size})
            elif info == 32 + 1:
                k = int.from_bytes(data[4:8], "little")
                result = await compute("nearestIter", {"k": k})
            else:
                result = bytes([])
                print("wrong info code: ", info)

            if type(result) == np.ndarray:
                await ws.send_bytes(result.tobytes())
    return ws


def create_runner():
    app = web.Application()
    app.add_routes([
        web.get('/ws', websocket_handler),
        web.get('/', lambda _: handle("./index.html", "text/html")),
        web.get('/index', lambda _: handle("./index.html", "text/html")),
        web.get('/index.html', lambda _: handle("./index.html", "text/html")),
        web.get('/main.css', lambda _: handle("./main.css", "text/css")),
        web.get('/favicon.svg', lambda _: handle("./index.html", "image/svg+xml")),
        web.get(
            '/bundle.js',
            lambda _: handle("./bundle.js", "application/javascript")
        ),
    ])
    return web.AppRunner(app)


async def start_server(host="localhost", port=5500):
    runner = create_runner()
    await runner.setup()
    site = web.TCPSite(runner, host, port)
    await site.start()


if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    loop.run_until_complete(start_server())
    loop.run_forever()
