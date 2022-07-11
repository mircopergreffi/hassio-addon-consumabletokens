import fs from 'fs'
import http from 'http'
import https from 'https'

const start = (app, {certificatesLocation, port, securePort, useHttps}) => {
    const httpServer = http.createServer(app)
    httpServer.listen(port, () => console.log(`HTTP listening on port ${port}`))

    if (useHttps) {
        const dirname = certificatesLocation
        const privateKey = fs.readFileSync(`${dirname}/privkey.pem`, 'utf-8')
        const certificate = fs.readFileSync(`${dirname}/cert.pem`, 'utf-8')
        const ca = fs.readFileSync(`${dirname}/chain.pem`, 'utf-8')
    
        const credentials = {
            key: privateKey,
            cert: certificate,
            ca: ca
        }
    
        const httpsServer = https.createServer(credentials, app)
        httpsServer.listen(securePort, () => console.log(`HTTPS listening on port ${securePort}`))
    }
}

export default start