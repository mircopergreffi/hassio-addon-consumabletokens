import ipc from 'node-ipc'

ipc.config.silent = true
ipc.connectTo('repl', '/tmp/gate-controller.db', () => {
    ipc.of.repl.on('connect', () => {
        const socket = ipc.of.repl.socket
        process.stdin.pipe(socket)
        socket.pipe(process.stdout)
    })
})