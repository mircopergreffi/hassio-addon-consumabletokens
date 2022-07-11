import { join, dirname } from 'path'
import { Low, JSONFile } from 'lowdb'
import { fileURLToPath } from 'url'
import moment from 'moment';

const TOKEN_ALPHABET = '1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM'
const TOKEN_LENGTH = 32
function RANDOM_TOKEN_ID() {
    const indexes = new Array(TOKEN_LENGTH).fill('a').map(x => Math.floor(Math.random() * TOKEN_ALPHABET.length))
    const tokenid = indexes.reduce((str, i) => str + TOKEN_ALPHABET[i], '')
    return tokenid
}

let db = undefined

export let initTokens = async () => {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    // Use JSON file for storage
    const file = join(__dirname, 'tokens.json')
    const adapter = new JSONFile(file)
    db = new Low(adapter)
    await db.read()
    db.data = db.data || [] 
    await db.write()
    initTokens = () => {}
}

export let reload = () => {
    db.read()
}

export function isTokenValid(token) {
    const now = moment()
    return token
        && (token.remainingUses === 'infinite' || token.remainingUses > 0)
        && moment(token.dateStart).isBefore(now)
        && (!token.dateEnd || moment(token.dateEnd).isAfter(now))
}

export function useToken(tokenId) {
    const token = db.data.find(x => x.id === tokenId)
    if (isTokenValid(token) && token.remainingUses !== 'infinite') {
        token.remainingUses -= 1
        db.write()
    }
    return token
}

export function getToken(tokenId) {
    const token = db.data.find(x => x.id === tokenId)
    return token
}

export function getTokens(predicate) {
    const tokens = db.data.filter(predicate)
    return tokens
}

export function deleteToken(tokenId) {
    db.data = db.data.filter(x => x.id !== tokenId)
    db.write()
}

export function deleteTokens(predicate) {
    db.data = db.data.filter(x => !predicate(x))
    db.write()
}

export function addTokens({owner='Nobody', device='device-id', remainingUses='infinite', dateStart=moment(), dateEnd=false, tags='', count=1}={}) {
    let newTokens = []
    for (let i = 0; i < count ; i++){
        let tokenId = ''
        do {
            tokenId = RANDOM_TOKEN_ID()
        } while (db.data.find(x => x.id === tokenId))
        const token = {
            id: tokenId,
            owner,
            device,
            remainingUses,
            dateStart, dateEnd,
            tags
        }
        db.data.push(token)
        newTokens.push(token)
    }
    db.write()
    return newTokens
}