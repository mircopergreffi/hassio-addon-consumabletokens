
import express, { urlencoded } from 'express'
import path from 'path'
import ServerStart from './server-start.js'
import process from 'process'
import ipc from 'node-ipc'
import repl from 'repl'
import moment from 'moment'
import * as tokens from './tokens.js'

process.title = 'gate-controller-http'
const ipcSocketPath = '/tmp/gate-controller.server'

async function startHttp() {
    const __dirname = path.resolve();
    const app = express()

    app.set('view engine', 'pug')

    app.use("/res", express.static(path.join(__dirname, 'static/res')))

    app.get('/', (req, res) => {
        res.render(path.join(__dirname, 'static/index'))
    })

    app.get('/token', (req, res) => {
        const tokenId = req.query.token
        const token = tokens.getToken(tokenId)
        if (!token){
            res.redirect('/')
            return
        }
        const valid = tokens.isTokenValid(token)
        res.render(path.join(__dirname, 'static/token'), {valid, token, moment})
    })

    app.get('/success', (req, res) => {
        const tokenId = req.query.token
        const token = tokens.getToken(tokenId)
        if (!token){
            res.redirect('/')
            return
        }
        const valid = tokens.isTokenValid(token)
        res.render(path.join(__dirname, 'static/success'), {valid, token, moment})
    })

    app.get('/error', (req, res) => {
        const tokenId = req.query.token
        res.render(path.join(__dirname, 'static/error'), {error: req.query.error, tokenId})
    })

    app.get('/open', (req, res) => {
        function error(error, tokenId) {
            res.redirect('/error?error='+encodeURIComponent(error)+'&token='+encodeURIComponent(tokenId))
        }
        const tokenId = req.query.token
        const token = tokens.getToken(tokenId)
        if (tokens.isTokenValid(token)){
            const deviceId = token.device
            ipc.of.server.once(`status-${deviceId}`, (up) => {
                if (!up) {
                    error('Device not available.', tokenId)
                    return
                }
                ipc.of.server.emit('open', deviceId)
                ipc.of.server.once(`opening-${deviceId}`, (opening) => {
                    if (!opening){
                        error('Something went wrong', tokenId)
                        return
                    }
                    tokens.useToken(tokenId)
                    res.redirect('/success?token='+encodeURIComponent(tokenId))
                })
            })
            ipc.of.server.emit('status', deviceId)
        } else {
            error('Invalid/expired token.', tokenId)
        }
    })
    
    // app.listen(port, () => console.log(`Listening on: ${port}`))

    ServerStart(app, {
        certificatesLocation: '/',
        port: 8081,
        securePort: 8082,
        useHttps: false
    })
}

ipc.config.silent = true
;(async () => {
    await tokens.initTokens()

    ipc.config.maxRetries = 0
    ipc.connectTo('server', ipcSocketPath, () => {
        ipc.of.server.on('connect', () => {
            startHttp()

            ipc.serve('/tmp/gate-controller.db', () => {
                ipc.server.on('connect', (socket) => {
                    const remote = repl.start('tokens:db>', socket)
                    remote.context.tokens = tokens
                    remote.context.moment = moment
                })
            })
            ipc.server.start()
        })
    })
})()