import { Bet } from "../model/BetModel.js";
import { Match } from "../model/MatchModel.js";
import EventEmitter from "../utils/EventEmitter.js";

class BookMaker {
    constructor(matchId, marketId, margin) {
        this.matchId = matchId;
        this.marketId = marketId;
        this.markets = [];
        this.bets = []; // Track user bets
        this.margin = margin;// 5% profit margin
    }

    async loadMarkets() {
        const match = await Match.findOne({ matchId: this.matchId });
        if (!match) throw new Error('Match not found');

        const markets = match?.bookmakerRunners?.filter(b => b.mid == this.marketId);
        if (!markets?.length) throw new Error('No bookmakers found');

        const bets = await Bet.find({ matchId: this.matchId, marketId: this.marketId, status: 'pending' });
        this.markets = markets;
        this.bets = bets;

    }

    // Function to adjust odds dynamically
    async adjustOdds() {

        const totalNet = this.markets.reduce((sum, outcome) => sum + ((outcome.virtualStake * 0.5) + outcome.bs1 - outcome.ls1), 0);
        this.markets.forEach(outcome => {
            const netStake = (outcome.virtualStake * 0.5) + outcome.bs1 - outcome.ls1
            const p = netStake / totalNet;
            outcome.b1 = parseInt(((1 / (p * 1.10)) - 1) * 100);
            outcome.l1 = parseInt(((1 / (p * 1.2)) - 1) * 100);
        });


        // this.markets.forEach(market => {
        //     let probBack = 1 / market.b1;
        //     let probLay = 1 / market.l1;
        //     let totalProb = probBack + probLay;

        //     // Adjust probabilities & recalculate odds with margin
        //     let adjProbBack = (probBack / totalProb) * (1 + this.margin);
        //     let adjProbLay = (probLay / totalProb) * (1 + this.margin);

        //     market.b1 = +(1 / adjProbBack).toFixed(2);
        //     market.l1 = +(1 / adjProbLay).toFixed(2);
        // });

        await Match.findOneAndUpdate({ matchId: this.matchId }, { $set: { bookmakerRunners: this.markets } });

        EventEmitter.emit('data-update', {
            matchId: this.matchId,
            type: 'bookmaker-odds',
            odds: this.markets
        });

    }

    // Place a bet and update market stake
    placeBet(user, marketName, outcome, stake) {
        let market = this.markets.find(m => m.name === marketName);
        if (!market) return console.log("Market not found!");

        this.bets.push({ user, marketName, outcome, stake });

        if (outcome === "Back") {
            market.bs1 += stake;
        } else if (outcome === "Lay") {
            market.ls1 += stake;
        }

        // Recalculate odds based on the new stake
        this.adjustOdds();
    }

    // Calculate market liability
    calculateMarketLiability() {
        return this.markets.map(market => {
            let liability = (market.l1 * market.ls1) - (market.b1 * market.bs1);
            return {
                name: market.name,
                b1: market.b1,
                l1: market.l1,
                marketLiability: liability.toFixed(2)
            };
        });
    }

    // Simulate final settlement & calculate bookmaker profit
    settleBets(winningMarket) {
        let market = this.markets.find(m => m.name === winningMarket);
        if (!market) return console.log("Market not found!");

        let totalBets = this.bets.reduce((sum, bet) => sum + bet.stake, 0);
        let totalPayout = 0;

        this.bets.forEach(bet => {
            if (bet.marketName === winningMarket && bet.outcome === "Back") {
                totalPayout += bet.stake * market.b1;
            }
        });

        let bookmakerProfit = totalBets - totalPayout;
        return {
            totalBets,
            totalPayout,
            bookmakerProfit
        };
    }

    // Get structured data for frontend display
    getMarketView() {
        return this.markets.map(market => ({
            name: market.name,
            back: market.b1,
            lay: market.l1,
            marketLiability: this.calculateMarketLiability()
        }));
    }

    static getInitialOdds(Bookmakers) {
        return Bookmakers?.map(bookmaker => {
            let netStake = (100000 * 0.5) + 0 - 0;
            let sumNet = 100000;
            const p = netStake / sumNet; // implied probability

            return {
                ...bookmaker,
                b1: parseInt(bookmaker.b1 ? bookmaker.b1 : ((1 / (p * 1.1)) - 1) * 100),
                bs1: 0,
                l1: parseInt(bookmaker.l1 ? bookmaker.l1 : (((1 / (p * 1.2)) - 1) * 100)),
                ls1: 0,
                virtualStake: 100000
            }
        });
    }
}


export default BookMaker;

