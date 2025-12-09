import bettingService from '../service/bettingService.js';
import socketService from '../service/socketService.js';
import EventEmitter from './EventEmitter.js';

class OddEmitter {
    constructor() {
        this.activeRooms = new Map(); // room -> { lastRun: timestamp, interval: number }
        this.pollInterval = 5000; // check every 2 second
        this.jobInterval = 5000; // emit job every 10 seconds per room
        this.scheduler = null;
    }

    startScheduler() {
        if (!this.scheduler) {
            this.scheduler = setInterval(() => {
                this.checkRooms();
            }, this.pollInterval);
        }
    }

    stopScheduler() {
        if (this.scheduler) {
            clearInterval(this.scheduler);
            // console.log(`Interval is cleared.`);
            this.scheduler = null;
        }
    }

    async checkRooms() {
        const now = Date.now();
        const io = socketService.getIo();

        for (const [room, data] of this.activeRooms.entries()) {
            // Check if room still has active sockets
            const sockets = await io.in(room).fetchSockets();
            if (!sockets.length) {
                // console.log(`Room ${room} is empty. Removing from schedule.`);
                this.removeRoom(room);
                continue;
            }

            // If it's time to emit for this room, do it
            if (now - data.lastRun >= this.jobInterval) {
                try {
                    const odds = await bettingService.getLiveOdds(room);
                    for (const key in odds) {
                        if (odds[key].length) {
                            EventEmitter.emit('data-update', {
                                matchId: room,
                                type: 'fancy-odds',
                                odds: odds.fancy
                            });
                            EventEmitter.emit('data-update', {
                                matchId: room,
                                type: 'bookmaker-odds',
                                odds: odds.bookmaker
                            });
                            EventEmitter.emit('data-update', {
                                matchId: room,
                                type: 'match-odds',
                                odds: odds.match
                            });

                            break;

                        }
                    }

                    // console.log(`Emitting to room ${room}`, new Date().toLocaleTimeString());
                    data.lastRun = now;
                } catch (error) {
                    console.error(`Error fetching fancy odds for room ${room}:`, error);
                }
            }
        }
    }

    // Call this when a room becomes active.
    addRoom(room) {
        if (!this.activeRooms.has(room)) {
            this.activeRooms.set(room, { lastRun: 0, interval: this.jobInterval });
            // console.log(`Added room ${room} to schedule.`);
            this.startScheduler();
        }
    }

    // Call this to remove a room when it's no longer active.
    removeRoom(room) {
        if (this.activeRooms.has(room)) {
            this.activeRooms.delete(room);
            // console.log(`Removed room ${room} from schedule.`);
            if (this.activeRooms.size === 0) {
                this.stopScheduler();
            }
        }
    }

    // Update room status manually if needed.
    async updateRoom(room) {
        const io = socketService.getIo();
        const sockets = await io.in(room).fetchSockets();
        if (sockets.length) {
            this.addRoom(room);
        } else {
            this.removeRoom(room);
        }
    }
}

export default new OddEmitter();

