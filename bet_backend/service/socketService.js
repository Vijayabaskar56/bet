import { Server } from 'socket.io';
import decryptEncrypt from "../middleware//decryptEncrypt.js";
import EventEmitter from '../utils/EventEmitter.js';
import bettingService from './bettingService.js';
import { connectToChat, sendMsg } from './orderBookService.js'

class socketService {
    constructor() {
        this.io = null;
    }

    setIo(server) {
        this.io = new Server(server, {
            cors: {
                origin: "*",
            },
        });
        this.initializeListenors();
        this.initializeEmitter();
        this.listenEventEmittor();
    }

    getIo() {
        return this.io;
    }

    encryptPayload(data) {
        if (process.env.PRODUCTION == "true") {
            const encryptedData = decryptEncrypt.encrypt(JSON.stringify(data), process.env.CLIENT_SECRET);
            return Buffer.from(JSON.stringify(encryptedData), 'utf-8');
        }
        return data;
    }

    initializeEmitter() {
        this.io.use((socket, next) => {
            const originalEmit = socket.emit.bind(socket);

            socket.emit = (event, ...args) => {
                args[0] = this.encryptPayload(args[0]);
                originalEmit(event, ...args);
            };
            const originalBroadcastEmit = socket.broadcast.emit.bind(socket);

            socket.broadcast.emit = (event, ...args) => {
                args[0] = this.encryptPayload(args[0]);
                originalBroadcastEmit(event, ...args);
            };

            next();
        });

        const originalIoEmit = this.io.emit.bind(this.io);
        this.io.emit = (event, ...args) => {
            args[0] = this.encryptPayload(args[0]);
            originalIoEmit(event, ...args);
        };

        const originalIoToEmit = this.io.to.bind(this.io);
        this.io.to = (room) => {
            return {
                emit: (event, ...args) => {
                    args[0] = this.encryptPayload(args[0]);
                    originalIoToEmit(room).emit(event, ...args);
                }
            };
        };
    }


    initializeListenors() {
        const io = this.getIo();
        io.on('connection', (socket) => {
            socket.on('connectChat', async (request) => { // new
                connectToChat(socket, io, request)
            })

            socket.on('sendMsg', async (request) => { // new
                sendMsg(socket, io, request)
            })

            socket.on('matchData', (request) => bettingService.matchPageEvent(socket, io, request));
        })
    }

    listenEventEmittor() {
        EventEmitter.on('data-update', (data) => {
            if (data.type == 'bets') {
                this.io.to(String(data?.bet?.userId)).emit('matchData', {
                    status: true,
                    message: 'update',
                    data
                });
            }
            else {
                this.io.to(String(data.matchId)).emit('matchData', {
                    status: true,
                    message: 'update',
                    data
                });
            }
        });
    }
}

export default new socketService();