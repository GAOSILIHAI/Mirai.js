import { EventEmitter } from "events"
import WebSocket from "ws"
import { MiraiVerifiedWebSocketResponse, MiraiWebSocketResponse } from "../types"

interface MiraiWebSocketSyncContext {
    syncId: number
    resolveContext: (data: MiraiWebSocketResponse) => void
}

/**
 * Events: [ // all of it are from underlaying websocket
 *   'unexpected-response',
 *   'message',
 *   'ping',
 *   'open',
 *   'message',
 *   'upgrade',
 *   'error', // WebSocketAdaptor & websocket
 *   'close',
 *   'miraiEvent',
 * ]
 */
export class WebSocketAdapter extends EventEmitter {
    private socket: WebSocket
    private verifiedPromise: Promise<any> | null = null
    private syncContextMap: Map<number, MiraiWebSocketSyncContext> = new Map
    private _sessionKey: string | null = null
    public get sessionKey(): string | null { return this._sessionKey }

    public constructor(private connectionString: string, private syncId: number = -1) {
        super()
        this.socket = new WebSocket(this.connectionString)
        this.verifiedPromise = new Promise((resolve, reject) => {
            this.socket.onerror = err => reject(new Error(err?.message ?? err))
            this.socket.onmessage = websocketMsg => {
                let verifiedMessage: MiraiVerifiedWebSocketResponse | null = null
                try { verifiedMessage = JSON.parse(websocketMsg.data?.toString()) }
                catch (e) { reject(e) }

                if (verifiedMessage?.data?.code === 0) {
                    this._sessionKey = verifiedMessage.data.session
                    resolve(undefined)
                } else {
                    return reject(new Error(`Verification failed ${JSON.stringify(verifiedMessage)}`))
                }
                this.socket.onmessage = null
                this.socket.onerror = null
                    ;
                ['unexpected-response', 'message', 'ping', 'open', 'message', 'upgrade', 'error', 'close']
                    .forEach(eventName => {
                        this.socket.on(eventName, (...args) => this.emit(eventName, ...args))
                    });
                this.startToReceiveMessage()
            }
        }).catch(err => console.error(err))
    }

    private startToReceiveMessage(): void {
        this.socket.onmessage = websocketMsg => {
            let miraiMessage: MiraiWebSocketResponse | null = null
            try { miraiMessage = JSON.parse(websocketMsg.data?.toString()) }
            catch (e) { this.emit('error', e) }

            const syncId = Number(miraiMessage?.syncId)
            if (typeof syncId === 'number') {
                if (syncId === this.syncId) {
                    // mriai event like FriendMessage
                    return this.emit('miraiEvent', miraiMessage)
                }
                if (this.syncContextMap.has(syncId)) {
                    this.syncContextMap.get(syncId)?.resolveContext(miraiMessage as MiraiWebSocketResponse)
                }
            }

        }
    }

    public async verify(): Promise<void> {
        await this.verifiedPromise
    }

    /**
     * 用于生成一个抽象的同步上下文放在 syncContextMap 中
     * this.sendCommand 负责调用，从而生成上下文
     * this.startToReceiveMessage 负责结束某个上下文
     * TODO: 考虑一下 forever pending 的情况
     * @param resolve 该上下文结束时回调
     * @returns 该上下文 entity
     */
    private generateSyncContext(resolve: (data: MiraiWebSocketResponse) => void): MiraiWebSocketSyncContext {
        let syncId = Math.floor(Math.random() * 1E9 /* assert concurrency < 1E9 */)
        while (this.syncContextMap.has(syncId)) {
            syncId = Math.floor(Math.random() * 1E9)
        }

        return this.syncContextMap.set(syncId, {
            syncId,
            resolveContext: (data: MiraiWebSocketResponse) => {
                this.syncContextMap.delete(syncId)
                resolve(data)
            }
        }).get(syncId) as MiraiWebSocketSyncContext
    }

    public async sendCommand({ command, subCommand, content }: {
        command: string, subCommand?: string | null, content?: any
    }): Promise<MiraiWebSocketResponse> {
        await this.verifiedPromise
        return new Promise((resolve, reject) => {
            try {
                this.socket.send(JSON.stringify({
                    syncId: this.generateSyncContext(resolve).syncId,
                    command,
                    subCommand,
                    content,
                }))
            } catch (e) { reject(e) }
        })
    }
}
