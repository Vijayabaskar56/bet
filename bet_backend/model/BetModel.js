import mongoose from "mongoose"
import { db } from "../db/index.js"

const betSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    marketId: { type: String, required: true },
    marketType: { type: Number, enum: [1, 2, 3], required: true }, /* 1 -> match odds, 2 -> bookmaker odds, 3 -> fancy odds */
    matchId: { type: String, required: true }, // Example: "Manchester vs Chelsea"
    selectionId: { type: String, required: true }, // Selection
    type: { type: String, enum: ['back', 'lay'], required: true },
    odds: { type: Number, required: true },
    stake: { type: Number, required: true },
    initialStake: { type: Number, required: true },
    liability: {
        type: Number,
        required: function () { return this.type === 'lay'; }
    }, // Only for lay bets
    eventName: {
        type: String,
        required: true
    }, // Only for lay bets
    selectionName: {
        type: String,
        required: true
    }, // Only for lay bets
    status: { type: String, enum: ['pending', 'matched', 'settled', 'canceled', 'refunded'], default: 'pending' },
    matchedTradeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trade' }, // Link to matched trade
    createdAt: { type: Date, default: Date.now }
});

const Bet = db.model('Bet', betSchema);


export {
    Bet
}