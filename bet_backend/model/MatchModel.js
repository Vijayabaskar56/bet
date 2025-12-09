import mongoose from "mongoose"
import { db } from "../db/index.js"

const MatchSchema = new mongoose.Schema(
    {
        matchName: { type: String, required: true }, // Example: "Manchester vs Chelsea"
        runners: [
            {
                type: mongoose.Schema.Types.Mixed
            }
        ],
        sportId: { type: Number, required: true }, // Selection
        matchId: { type: Number, required: true }, // Selection
        marketId: { type: String, required: true },
        bookmakerMarketId: { type: String, default: "" },
        matchRunners: [
            {
                type: mongoose.Schema.Types.Mixed
            }
        ],
        bookmakerRunners: [
            {
                type: mongoose.Schema.Types.Mixed
            }
        ],
        fancyRunners: [
            {
                type: mongoose.Schema.Types.Mixed
            }
        ],
        settledMarkets: {
            type: [String],
            default: []
        },
        openDate: { type: Date, default: Date.now },
        league: { type: String },
        inPlay: { type: Boolean, required: true },
        isCompleted: { type: Boolean, default: false },
        isBookMakerSettled: { type: Boolean, default: false },
        maxBet: { type: Number, default: 0 },
        minBet: { type: Number, default: 0 },
        maxBetRate: { type: Number, default: 0 },
        minBetRate: { type: Number, default: 0 },
        scoreUrl: { type: String, required: true },
        bmOdds: { type: Boolean, default: false },
        fOdds: { type: Boolean, default: false },
        lastActive: { type: Date }
    },
    {
        timestamps: true
    }
);

const Match = db.model('Match', MatchSchema);


export {
    Match
}
