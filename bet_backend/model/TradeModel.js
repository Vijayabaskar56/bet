import mongoose from "mongoose"
import { db } from "../db/index.js"

const tradeSchema = new mongoose.Schema({
    matchId: { type: String, required: true }, // Example: "Manchester vs Chelsea"
    marketId: { type: String, required: true }, // Example: "Manchester vs Chelsea"
    marketType: { type: Number, enum: [1, 2, 3], default: 1 }, /* 1 -> match odds, 2 -> bookmaker odds, 3 -> fancy odds */
    selectionId: { type: String, required: true }, // Selection
    winner: { type: String }, // Selection
    eventName: {
        type: String,
        required: true
    }, // Only for lay bets
    selectionName: {
        type: String,
        required: true
    }, // Only for lay bets
    backUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // User who placed back bet
    layUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // User who placed lay bet
    odds: { type: Number, required: true },
    stake: { type: Number, required: true },
    liability: { type: Number, required: true }, // (odds - 1) * stake
    status: { type: String, enum: ['matched', 'settled', 'canceled'], default: 'matched' }, // Starts as matched
    createdAt: { type: Date, default: Date.now },
    pnl: { type: Number, default: 0 },
});

const Trade = db.model('Trade', tradeSchema);

export {
    Trade
}