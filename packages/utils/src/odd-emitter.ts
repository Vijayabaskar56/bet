import eventEmitter from "./event-emitter";

// Note: bettingService and socketService are external dependencies that will need to be provided or injected.
// For now, I'll define the interface and keep the logic as close as possible to the original.

interface BettingService {
	getLiveOdds(room: string): Promise<any>;
}

interface SocketService {
	getIo(): any;
}

class OddEmitter {
	private activeRooms: Map<string, { lastRun: number; interval: number }>;
	private pollInterval: number;
	private jobInterval: number;
	private scheduler: NodeJS.Timeout | null;
	private bettingService?: BettingService;
	private socketService?: SocketService;

	constructor() {
		this.activeRooms = new Map();
		this.pollInterval = 5000;
		this.jobInterval = 5000;
		this.scheduler = null;
	}

	setServices(bettingService: BettingService, socketService: SocketService) {
		this.bettingService = bettingService;
		this.socketService = socketService;
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
			this.scheduler = null;
		}
	}

	async checkRooms() {
		if (!this.socketService || !this.bettingService) return;

		const now = Date.now();
		const io = this.socketService.getIo();

		for (const [room, data] of this.activeRooms.entries()) {
			const sockets = await io.in(room).fetchSockets();
			if (!sockets.length) {
				this.removeRoom(room);
				continue;
			}

			if (now - data.lastRun >= this.jobInterval) {
				try {
					const odds = await this.bettingService.getLiveOdds(room);
					for (const key in odds) {
						if (odds[key].length) {
							eventEmitter.emit("data-update", {
								matchId: room,
								type: "fancy-odds",
								odds: odds.fancy,
							});
							eventEmitter.emit("data-update", {
								matchId: room,
								type: "bookmaker-odds",
								odds: odds.bookmaker,
							});
							eventEmitter.emit("data-update", {
								matchId: room,
								type: "match-odds",
								odds: odds.match,
							});
							break;
						}
					}
					data.lastRun = now;
				} catch (error) {
					console.error(`Error fetching fancy odds for room ${room}:`, error);
				}
			}
		}
	}

	addRoom(room: string) {
		if (!this.activeRooms.has(room)) {
			this.activeRooms.set(room, { lastRun: 0, interval: this.jobInterval });
			this.startScheduler();
		}
	}

	removeRoom(room: string) {
		if (this.activeRooms.has(room)) {
			this.activeRooms.delete(room);
			if (this.activeRooms.size === 0) {
				this.stopScheduler();
			}
		}
	}

	async updateRoom(room: string) {
		if (!this.socketService) return;
		const io = this.socketService.getIo();
		const sockets = await io.in(room).fetchSockets();
		if (sockets.length) {
			this.addRoom(room);
		} else {
			this.removeRoom(room);
		}
	}
}

export const oddEmitter = new OddEmitter();
export default oddEmitter;
