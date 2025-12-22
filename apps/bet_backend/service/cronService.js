import { Match } from "../model/MatchModel.js";
import { Trade } from "../model/TradeModel.js";
import bettingService from "./bettingService.js";

export default class cronService {

    static init = async () => {
        const cron = (await import("node-cron")).default;

        // Task 1 - 1st second
        cron.schedule('1 * * * * *', () => {
            // console.log('Task 1 running at 1st second');
            this.matchOddsMarketResults();
        });

        // Task 2 - 21st second
        cron.schedule('21 * * * * *', () => {
            // console.log('Task 2 running at 21st second');
            this.bookmakerMarketResults();
        });

        // Task 3 - 41th second
        cron.schedule('41 * * * * *', () => {
            // console.log('Task 3 running at 41th second');
            this.fancyMarketResults();
        });

    }

    static matchOddsMarketResults = async () => {
        try {
            const matches = await Match.aggregate([
                {
                    $match: {
                        openDate: {
                            $lt: new Date()
                        },
                        matchRunners: {
                            $elemMatch: {
                                isCompleted: false
                            }
                        }
                    },
                },
                {
                    $unwind: {
                        path: "$matchRunners",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        matchId: 1,
                        matchName: 1,
                        currentMarketId: "$matchRunners.marketId"
                    }
                },
                {
                    $lookup: {
                        from: "trades",
                        let: {
                            matchMarketId: { $toString: "$currentMarketId" },
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$marketId", "$$matchMarketId"] },
                                            { $eq: ["$marketType", 1] },
                                            { $eq: ["$status", "matched"] },
                                        ],
                                    },
                                },
                            },
                            {
                                $group: {
                                    _id: "$marketId",
                                    bets: { $push: "$$ROOT" },
                                },
                            },
                        ],
                        as: "matchedTrades",
                    },
                },
                {
                    $lookup: {
                        from: "bets",
                        let: {
                            matchMarketId: { $toString: "$currentMarketId" }
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            {
                                                $eq: [
                                                    "$marketId",
                                                    "$$matchMarketId",
                                                ],
                                            },
                                            { $eq: ["$marketType", 1] },
                                            { $eq: ["$status", "pending"] },
                                        ],
                                    },
                                },
                            },
                            {
                                $group: {
                                    _id: "$marketId",
                                    bets: { $push: "$$ROOT" },
                                },
                            },
                        ],
                        as: "pendingBets",
                    },
                },
                {
                    $project: {
                        matchId: 1,
                        marketId: "$currentMarketId",
                        matchName: 1,
                        pendingBets: 1,
                        matchedTrades: 1,
                    },
                },
            ]);

            let base = `${process.env.MATCH_RESULT_API}`;
            const axios = (await import("axios")).default;

            if (matches.length == 0) return;

            for (const match of matches) {
                const matchId = Number(match.matchId);
                let endpoint = `${base}${match.marketId}`;
                const response = await axios.get(endpoint).then(res => res.data).catch(null);
                if (response?.data?.length) {
                    for (const trade of match?.matchedTrades) {
                        if (trade?.bets?.length) {
                            let result = response.data.find(r => r.mid == trade._id);
                            if (result) {
                                await bettingService.settleTrade(trade._id, String(result.secId), trade?.bets);
                            };
                        }
                    }

                    for (const bet of match?.pendingBets) {
                        if (bet?.bets?.length) {
                            await bettingService.settleUnmatchedBets('canceled', bet?.bets);
                        }
                    }

                    await Match.findOneAndUpdate({ matchId, "matchRunners.marketId": match.marketId }, { $set: { "matchRunners.$.isCompleted": true } });
                }
                else {
                    const status = await this.checkLastActive(match.matchId);
                    if (status) {
                        console.log('match result omitted', match.matchId, match.marketId)
                        for (const trade of match?.matchedTrades) {
                            if (trade?.bets?.length) {
                                await bettingService.settleTrade(trade._id, 'canceled', trade?.bets);
                            }
                        }

                        for (const bet of match?.pendingBets) {
                            if (bet?.bets?.length) {
                                await bettingService.settleUnmatchedBets('canceled', bet?.bets);
                            }
                        }
                        await Match.findOneAndUpdate({ matchId, "matchRunners.marketId": match.marketId }, { $set: { "matchRunners.$.isCompleted": true } });
                    }
                }
            }
        } catch (error) {
            console.log(error.message);
        }
    }

    static bookmakerMarketResults = async () => {
        try {
            const trades = await Trade.aggregate([
                {
                    $match: {
                        marketType: 2,
                        status: 'matched'
                    }
                },
                {
                    $group: {
                        _id: "$marketId",
                        bets: { $push: "$$ROOT" }
                    }
                }
            ]);
            if (trades.length == 0) {
                return;
            }
            let base = `${process.env.MATCH_RESULT_API}`;
            const axios = (await import("axios")).default;

            for (const trade of trades) {

                if (trade?.bets?.length) {
                    let endpoint = `${base}${trade._id}`;
                    const response = await axios.get(endpoint).then(res => res.data).catch(null);
                    const matchId = trade?.bets[0].matchId;

                    if (response?.data?.length) {
                        let result = response.data.find(r => r.mid == trade._id);
                        if (result) {
                            await bettingService.settleBookmakerTrade(String(result.secId), trade?.bets)
                            await Match.findOneAndUpdate({ matchId }, { $addToSet: { settledMarkets: trade._id } });
                        }

                    }
                    else {
                        const status = await this.checkLastActive(matchId);
                        if (status) {
                            await bettingService.settleTrade(trade._id, 'canceled', trade?.bets);
                            await Match.findOneAndUpdate({ matchId }, { $set: { isBookMakerSettled: true } });
                        }
                    }
                }

            }
        } catch (error) {
            console.log(error.message);
        }
    }

    static fancyMarketResults = async () => {
        try {
            const trades = await Trade.aggregate([
                {
                    $match: {
                        marketType: 3,
                        status: 'matched'
                    }
                },
                {
                    $group: {
                        _id: "$marketId",
                        bets: { $push: "$$ROOT" }
                    }
                }
            ]);
            if (trades.length == 0) {
                return;
            }
            let base = `${process.env.MATCH_RESULT_API}`;
            const axios = (await import("axios")).default;

            for (const trade of trades) {
                if (trade?.bets?.length) {
                    const matchId = trade?.bets[0].matchId;

                    let endpoint = `${base}${trade._id}`;
                    const response = await axios.get(endpoint).then(res => res.data);

                    if (response?.data?.length) {
                        await bettingService.settleFancyTrade(response.data[0].result, trade?.bets);

                        await Match.findOneAndUpdate({ matchId }, { $addToSet: { settledMarkets: trade._id } });
                    }
                    else {
                        const status = await this.checkLastActive(matchId);
                        if (status) {
                            await bettingService.settleTrade(trade._id, 'canceled', trade?.bets);
                        }
                    }
                }
            }
        } catch (error) {
            console.log(error.message);
        }
    }

    static checkLastActive = async (matchId) => {
        try {
            const match = await Match.findOne({ matchId });
            const allMatches = await bettingService.getLiveMatches(true);
            const currentSportMatches = allMatches.find(m => m.sportid == match.sportId)
            if (currentSportMatches) {
                const isExist = currentSportMatches?.matchList.find(m => m.matchId == match.matchId)
                if (!isExist) {
                    if (match.lastActive) {
                        const timeElapsed = Math.abs(Date.now() - match.lastActive) / 36e5; // (1000 * 60 * 60)
                        if (timeElapsed > 1) {
                            return true;
                        }
                    }
                    else {
                        match.lastActive = Date.now();
                        await match.save();
                    }
                }
            }
            return false;
        } catch (error) {
            console.log(error);
            return false;
        }
    }
}