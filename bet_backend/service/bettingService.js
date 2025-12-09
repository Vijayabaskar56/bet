import { helper } from "../helper/helper.js";
import axios from "axios"
import { Bet } from "../model/BetModel.js";
import { Match } from "../model/MatchModel.js";
import { Trade } from "../model/TradeModel.js";
import { user } from "../model/userModel.js";
import EventEmitter from "../utils/EventEmitter.js";
import { checking } from "../commonClass/mostCommonClass.js";
import BookMaker from "./BookMaker.js";
import OddEmitter from "../utils/OddEmitter.js";
import { siteSetting } from "../model/adminModel.js";

export default class bettingService {
    static isRunning = false;

    static getLiveMatches = async (all = false) => {
        let matches = [];

        try {
            const matchData = await helper.redisClient.get('sp-live-matches');

            if (matchData) {
                const parsedData = JSON.parse(matchData);
                matches = parsedData.matches || [];

                // If data is older than 5 seconds, refresh it in background
                if ((Date.now() - parsedData.lastUpdate) > 5000) {
                    // Refresh in background (non-blocking)
                    this._refreshLiveMatches();
                }
            } else {
                // No cached data at all -> pull immediately
                matches = await this._refreshLiveMatches();
            }

            const settings = await siteSetting.findOne({}).select('controls').lean();
            if (!all && settings?.controls) {
                const activeSports = settings.controls.filter(c => c.status).map(c => c.sportid);
                return matches.filter(match => activeSports.includes(match.sportid));
            }

            return matches;
        } catch (error) {
            console.error(error.message);
            return matches;
        }
    }

    // Private static method to refresh live matches
    static _refreshLiveMatches = async () => {
        try {
            const endpoint = `${process.env.BETTING_API_ENDPOINT}active_match`;
            const response = await axios.get(endpoint).then(res => res.data);
            if (!response.data) throw new Error('No matches found');

            const matches = await Promise.all(response.data.map(async (match) => {
                const url = `${endpoint}/${match.sportid}`;
                const res = await axios.get(url).then(r => r.data);
                return {
                    ...match,
                    matchList: res.data
                };
            }));

            await helper.redisClient.set('sp-live-matches', JSON.stringify({
                lastUpdate: Date.now(),
                matches
            }));
            return matches;
        } catch (error) {
            console.error('Error refreshing live matches:', error.message);
            return [];
        }
    }

    static getMatchOdds = async (marketId) => {
        let odds = []
        try {
            const result = await Bet.aggregate([
                {
                    $match: {
                        marketId: marketId,
                        status: { $in: ["pending"] } // Ensure only active bets
                    }
                },
                {
                    $group: {
                        _id: {
                            selectionId: "$selectionId",
                            odds: "$odds",
                            type: "$type"
                        },
                        totalStake: { $sum: "$stake" }
                    }
                },
                {
                    $group: {
                        _id: "$_id.selectionId",
                        availableBack: {
                            $push: {
                                $cond: [
                                    { $eq: ["$_id.type", "back"] },
                                    { odds: "$_id.odds", stake: "$totalStake" },
                                    "$$REMOVE"
                                ]
                            }
                        },
                        availableLay: {
                            $push: {
                                $cond: [
                                    { $eq: ["$_id.type", "lay"] },
                                    { odds: "$_id.odds", stake: "$totalStake" },
                                    "$$REMOVE"
                                ]
                            }
                        }
                    }
                }

            ]);
            const mandatorySelections = await Match.findOne({ marketId: marketId }).select('runners').lean(); // ["home", "away", "draw"];

            const odds = mandatorySelections.runners.map(side => {
                let arr = result.find(r => r._id == side.selectionId);

                if (arr) {
                    arr = {
                        name: side.name,
                        runnerStatus: side.runnerStatus,
                        selectionId: side.selectionId,
                        availableBack: arr.availableBack,
                        availableLay: arr.availableLay
                    };
                } else {
                    arr = {
                        name: side.name,
                        runnerStatus: side.runnerStatus,
                        selectionId: side.selectionId,
                        availableBack: [],
                        availableLay: []
                    };
                }
                // Sort availableBack in ascending order (lowest odds first)
                arr.availableBack.sort((a, b) => a.odds - b.odds);

                // Sort availableLay in ascending order (lowest odds first)
                arr.availableLay.sort((a, b) => a.odds - b.odds);


                // Ensure only top 3 records, fill missing ones
                while (arr.availableBack.length < 3) arr.availableBack.push({ odds: 0, stake: 0 });
                arr.availableBack = arr.availableBack.slice(0, 3);

                while (arr.availableLay.length < 3) arr.availableLay.unshift({ odds: 0, stake: 0 });
                arr.availableLay = arr.availableLay.slice(0, 3);

                const [availableToBack, availableToLay] = [arr.availableLay, arr.availableBack];
                arr.availableBack = availableToBack;
                arr.availableLay = availableToLay;

                return arr;
            });

            return odds;
        } catch (error) {
            return odds;
        }
    }

    static getMarketMatchOdds = async (matchId) => {
        let odds = [];
        const match = await Match.findOne({ matchId }).select('matchRunners').lean();
        let matchRunners = match?.matchRunners || [];
        let marketIds = matchRunners.map(m => m.marketId);
        try {
            const result = await Bet.aggregate([
                {
                    $match: {
                        marketId: { $in: marketIds },
                        status: { $in: ["pending"] }, // Ensure only active bets
                    },
                },
                // Group by marketId, selectionId, odds and type to sum stake per unique bet condition
                {
                    $group: {
                        _id: {
                            marketId: "$marketId",
                            selectionId: "$selectionId",
                            odds: "$odds",
                            type: "$type",
                        },
                        totalStake: { $sum: "$stake" },
                    },
                },
                // Group by marketId and selectionId to build availableBack and availableLay arrays for each selection
                {
                    $group: {
                        _id: {
                            marketId: "$_id.marketId",
                            selectionId: "$_id.selectionId",
                        },
                        availableBack: {
                            $push: {
                                $cond: [
                                    { $eq: ["$_id.type", "back"] },
                                    {
                                        odds: "$_id.odds",
                                        stake: "$totalStake",
                                    },
                                    "$$REMOVE",
                                ],
                            },
                        },
                        availableLay: {
                            $push: {
                                $cond: [
                                    { $eq: ["$_id.type", "lay"] },
                                    {
                                        odds: "$_id.odds",
                                        stake: "$totalStake",
                                    },
                                    "$$REMOVE",
                                ],
                            },
                        },
                    },
                },
                // Group by marketId to create a selections array
                {
                    $group: {
                        _id: "$_id.marketId",
                        selections: {
                            $push: {
                                selectionId: "$_id.selectionId",
                                availableBack: "$availableBack",
                                availableLay: "$availableLay",
                            },
                        },
                    },
                },
                // Reshape the output document to include marketId at the top level
                {
                    $project: {
                        marketId: "$_id",
                        selections: 1,
                        _id: 0,
                    },
                },
            ]);

            const odds = matchRunners.map(runners => {
                let market = result.find(r => r.marketId == runners.marketId);

                return {
                    ...runners,
                    runners: runners?.runners?.map(side => {
                        let arr = market?.selections?.find(m => m.selectionId == side.selectionId)
                        if (arr) {
                            arr = {
                                name: side.name,
                                runnerStatus: side.runnerStatus,
                                selectionId: side.selectionId,
                                availableBack: arr.availableBack,
                                availableLay: arr.availableLay
                            };
                        } else {
                            arr = {
                                name: side.name,
                                runnerStatus: side.runnerStatus,
                                selectionId: side.selectionId,
                                availableBack: [],
                                availableLay: []
                            };
                        }
                        // Sort availableBack in ascending order (lowest odds first)
                        arr.availableBack.sort((a, b) => a.odds - b.odds);

                        // Sort availableLay in ascending order (lowest odds first)
                        arr.availableLay.sort((a, b) => a.odds - b.odds);


                        // Ensure only top 3 records, fill missing ones
                        while (arr.availableBack.length < 3) arr.availableBack.push({ odds: 0, stake: 0 });
                        arr.availableBack = arr.availableBack.slice(0, 3);

                        while (arr.availableLay.length < 3) arr.availableLay.unshift({ odds: 0, stake: 0 });
                        arr.availableLay = arr.availableLay.slice(0, 3);

                        const [availableToBack, availableToLay] = [arr.availableLay, arr.availableBack];
                        arr.availableBack = availableToBack;
                        arr.availableLay = availableToLay;

                        return arr;
                    })
                }

            });

            return odds;
        } catch (error) {
            return odds;
        }
    }

    static getBookmakerFancyOdds = async (match) => {
        let bookmakerOdds = match?.bookmakerRunners || [];
        let fancyOdds = match?.fancyRunners || [];
        try {
            if (match.sportId == 4 && (!bookmakerOdds?.length || !fancyOdds?.length)) {
                let endpoint = `${process.env.BETTING_API_ENDPOINT}fancy/${match.matchId}`;
                const response2 = await axios.get(endpoint).then(res => res.data);
                fancyOdds = response2.fancy2;

                bookmakerOdds = BookMaker.getInitialOdds(response2?.Bookmaker);
                let payload = {}

                if (fancyOdds.length) {
                    payload.fancyRunners = fancyOdds;
                }
                if (bookmakerOdds?.length) {
                    payload.bookmakerMarketId = odds[0].mid;
                    payload.bookmakerRunners = odds;
                }
                if (Object.keys(payload).length !== 0) {
                    await Match.findByIdAndUpdate(match._id, {
                        $set: payload
                    })
                }
            }
            return {
                bookmakerOdds,
                fancyOdds
            };

        } catch (error) {
            return {
                bookmakerOdds,
                fancyOdds
            };
        }
    }

    static matchPageEvent = async (socket, io, request) => {
        let { _token, status, matchId } = request;
        matchId = String(matchId);
        // Validate token existence
        if (!_token) {
            return io.to(socket.id).emit("connectChat", {
                result: false,
                message: "Token is Not Found",
                request
            });
        }

        // Validate the token
        const token = await checking.validToken("check", JSON.stringify(_token), null);
        if (!token) {
            return io.to(socket.id).emit("connectChat", {
                result: false,
                message: "Token is Expired",
                request
            });
        }

        const userId = token.id;
        if (status) {
            const match = await Match.findOne({ matchId });
            if (!match) {
                return io.to(socket.id).emit("matchData", {
                    result: false,
                    message: "Match not found",
                    request
                });
            }
            socket.join((matchId));
            socket.join(userId);

            const odds = await bettingService.getMarketMatchOdds(match.matchId);
            io.to(matchId).emit("matchData", {
                status: true,
                message: "subscribed",
                data: { matchId, odds }
            });
        } else {
            socket.leave(matchId);
            socket.leave(userId);

            io.to(matchId).emit("matchData", {
                status: true,
                message: "unsubscribed",
                data: null
            });
        }
        OddEmitter.updateRoom(matchId);
    }

    // matching
    static matchBet = async (order) => {
        try {
            // Emit an update event
            EventEmitter.emit('data-update', {
                matchId: order.matchId,
                marketId: order.marketId,
                type: 'bets',
                bet: order
            });

            // Get all opposite pending bets for the same market and selection.
            let matchQuery = {
                marketId: order.marketId,
                selectionId: order.selectionId,
                type: { $ne: order.type },
                status: 'pending',
                marketType: 1
            };

            const oppositeOrders = await Bet.find(matchQuery);

            if (order.type === 'back') {
                // For a back bet, we want to match with lay orders that offer the highest odds.
                let orders = oppositeOrders
                    .filter(o => o.odds >= order.odds) // ensure the lay's odds meet the back's minimum limit
                    .sort((a, b) => b.odds - a.odds);  // descending: highest odds first

                for (const layOrder of orders) {
                    if (order.stake > 0) {
                        // Declare available stake on the lay order
                        let availableLayStake = layOrder.stake;

                        // Only match if the lay order's odds meet the backer's minimum.
                        if (layOrder.odds >= order.odds) {
                            // Determine the matched stake: the minimum of the back order’s remaining stake and the lay order’s available stake.
                            const matchedStake = order.stake >= availableLayStake ? availableLayStake : order.stake;

                            // Update the stakes on both orders.
                            if (order.stake >= availableLayStake) {
                                order.stake -= availableLayStake;
                                layOrder.stake = 0;
                            } else {
                                layOrder.stake -= order.stake;
                                order.stake = 0;
                            }

                            // Use the lay order's odds as the matched odds.
                            const matchedOdds = layOrder.odds;
                            // Compute liability based on the matched odds.
                            const liability = (matchedOdds - 1) * matchedStake;

                            // Create the trade record.
                            const trade = new Trade({
                                matchId: order.matchId,
                                marketId: order.marketId,
                                selectionId: order.selectionId,
                                backUserId: order.userId,
                                layUserId: layOrder.userId,
                                odds: matchedOdds,
                                stake: matchedStake,
                                liability: liability,
                                eventName: order.eventName,
                                selectionName: order.selectionName
                            });

                            // Mark orders as matched if fully filled.
                            if (layOrder.stake === 0) layOrder.status = 'matched';
                            if (order.stake === 0) order.status = 'matched';

                            // Save trade and update orders.
                            await Promise.all([
                                trade.save(),
                                order.save(),
                                layOrder.save()
                            ]);

                            // Emit update events.
                            if (layOrder.status === 'matched') {
                                EventEmitter.emit('data-update', {
                                    matchId: layOrder.matchId,
                                    marketId: layOrder.marketId,
                                    type: 'bets',
                                    bet: layOrder
                                });
                            }
                            if (order.status === 'matched') {
                                EventEmitter.emit('data-update', {
                                    matchId: order.matchId,
                                    marketId: order.marketId,
                                    type: 'bets',
                                    bet: order
                                });
                            }

                            if (order.stake === 0) break; // fully matched, exit loop.
                        }
                    }
                }
            } else if (order.type === 'lay') {
                // For a lay bet, we want to match with back orders that offer the lowest odds.
                let orders = oppositeOrders
                    .filter(o => o.odds <= order.odds) // ensure the back order's odds are within the layer's acceptable range
                    .sort((a, b) => a.odds - b.odds);   // ascending: lowest odds first

                for (const backOrder of orders) {
                    // Use && instead of bitwise &
                    if (order.stake > 0 && backOrder.odds <= order.odds) {
                        let availableBackStake = backOrder.stake;
                        const matchedStake = order.stake >= availableBackStake ? availableBackStake : order.stake;

                        if (order.stake >= availableBackStake) {
                            order.stake -= availableBackStake;
                            backOrder.stake = 0;
                        } else {
                            backOrder.stake -= order.stake;
                            order.stake = 0;
                        }

                        // Use the back order's odds as the matched odds.
                        const matchedOdds = backOrder.odds;
                        // Compute liability for the layer based on the matched odds.
                        const liability = (matchedOdds - 1) * matchedStake;

                        // **IMPORTANT:** When a lay order is incoming, the back order is the existing one.
                        // So the trade should record the backUserId from the back order and layUserId from the incoming order.
                        const trade = new Trade({
                            matchId: order.matchId,
                            marketId: order.marketId,
                            selectionId: order.selectionId,
                            backUserId: backOrder.userId,
                            layUserId: order.userId,
                            odds: matchedOdds,
                            stake: matchedStake,
                            liability: liability,
                            eventName: order.eventName,
                            selectionName: order.selectionName
                        });

                        if (backOrder.stake === 0) backOrder.status = 'matched';
                        if (order.stake === 0) order.status = 'matched';

                        await Promise.all([
                            trade.save(),
                            order.save(),
                            backOrder.save()
                        ]);

                        if (backOrder.status === 'matched') {
                            EventEmitter.emit('data-update', {
                                matchId: backOrder.matchId,
                                marketId: backOrder.marketId,
                                type: 'bets',
                                bet: backOrder
                            });
                        }
                        if (order.status === 'matched') {
                            EventEmitter.emit('data-update', {
                                matchId: order.matchId,
                                marketId: order.marketId,
                                type: 'bets',
                                bet: order
                            });
                        }

                        if (order.stake === 0) break;
                    }
                }
            }

            // After matching, update the market odds (for example, recalc best back/lay prices).
            // let odds = await bettingService.getMarketMatchOdds(order.matchId);
            // EventEmitter.emit('data-update', {
            //     matchId: order.matchId,
            //     marketId: order.marketId,
            //     type: 'match-odds',
            //     odds
            // });
        } catch (error) {
            console.log(error);
        }
    };

    static settleTrade = async (marketId, winningSelection, trades) => {
        try {
            for (const trade of trades) {

                const [backUser, layUser] = await Promise.all([
                    user.findById(trade.backUserId),
                    user.findById(trade.layUserId)
                ]);

                if (!backUser || !layUser) {
                    // console.log("One of the users does not exist.");
                    continue;
                }

                let backUserProfit = 0, layUserProfit = 0;

                if (winningSelection == 'canceled') {
                    if (backUser) {
                        backUser.balance += trade.stake;
                        backUser.escrowBalance -= trade.stake;
                        // await backUser.save();
                    }

                    if (layUser) {
                        layUser.balance += trade.liability;
                        layUser.escrowBalance -= trade.liability;
                        // await layUser.save();
                    }
                }
                else {
                    if (trade.selectionId === winningSelection) {
                        // ✅ **Back bet wins, Lay bet loses**
                        backUserProfit = trade.stake * (trade.odds - 1);  // Profit = (Odds - 1) * Stake
                        layUserProfit = -trade.liability;  // Lay user loses liability

                        // 🔹 **Backer gets profit + stake back**
                        backUser.balance += backUserProfit + trade.stake;
                        backUser.escrowBalance -= trade.stake;

                        // 🔹 **Layer loses liability**
                        layUser.escrowBalance -= trade.liability;

                    } else {
                        // ✅ **Back bet loses, Lay bet wins**
                        backUserProfit = -trade.stake; // Back user loses stake
                        layUserProfit = trade.stake;  // Lay user wins stake

                        // 🔹 **Backer loses stake**
                        backUser.escrowBalance -= trade.stake;

                        // 🔹 **Layer gets stake + liability**
                        layUser.balance += layUserProfit + trade.liability;
                        layUser.escrowBalance -= trade.liability;
                    }
                }

                await Promise.all([
                    // ✅ **Save user balance updates**
                    backUser.save(), layUser.save(),
                    // ✅ **Update trade status**
                    Trade.updateOne({ _id: trade._id }, { $set: { status: winningSelection == 'canceled' ? winningSelection : 'settled', winner: winningSelection } }),
                    // ✅ **Update associated bets**
                ]);

                // console.log(`✅ Trade ${trade._id} settled. Winner: ${winningSelection}`);
                // console.log(`💰 Back User New Balance: ${backUser.balance}`);
                // console.log(`💰 Lay User New Balance: ${layUser.balance}`);
            }
            await Bet.updateMany({ marketId, status: 'matched' }, { $set: { status: winningSelection == 'canceled' ? winningSelection : 'settled' } })


        } catch (error) {
            console.error("❌ Error in settlement:", error);
        }
    };

    static settleUnmatchedBets = async (winningSelection, pendingBets) => {
        try {
            for (const bet of pendingBets) {
                const userData = await user.findById(bet.userId);
                if (userData) {
                    if (bet.type == 'back') {
                        userData.balance += bet.stake;
                        userData.escrowBalance -= bet.stake;
                    }
                    else {
                        userData.balance += bet.liability;
                        userData.escrowBalance -= bet.liability;
                    }
                    await userData.save();
                }
                await Bet.updateOne({ _id: bet._id }, { $set: { status: 'canceled', winner: winningSelection } });
            }
        } catch (error) {
            console.log(error)
        }
    }

    static settleBookmakerTrade = async (winningSelection, trades) => {
        try {
            let totalSystemIn = 0, totalSystemOut = 0;

            for (const trade of trades) {
                let userDetails = null, investment = 0, profit = 0, loss = 0;
                if (trade.backUserId) {
                    userDetails = await user.findById(trade.backUserId);
                    if (!userDetails) {
                        continue;
                    }
                    investment = trade.stake;
                    userDetails.escrowBalance -= trade.stake

                    if (winningSelection == 'canceled') {
                        userDetails.balance += trade.stake
                    }
                    else {
                        if (trade.selectionId == winningSelection) {
                            // ✅ **bet wins**
                            // 🔹 **Backer gets profit + stake back**
                            profit = (trade.odds * trade.stake) / 100
                            userDetails.balance += (profit + trade.stake);
                            totalSystemOut += profit;
                        }
                        else {
                            // ✅ **bet loses**
                            // 🔹 **Backer loses liability**
                            loss = trade.stake;
                            totalSystemIn += loss;
                        }
                    }

                }
                else if (trade.layUserId) {
                    userDetails = await user.findById(trade.layUserId);
                    if (!userDetails) {
                        continue;
                    }

                    investment = trade.liability;
                    userDetails.escrowBalance -= trade.liability

                    if (winningSelection == 'canceled') {
                        userDetails.balance += trade.liability
                    }
                    else {
                        if (trade.selectionId == winningSelection) {
                            // ✅ **bet loses**
                            // 🔹 **Layer loses liability**
                            loss = trade.liability;
                            totalSystemIn += loss;
                        }
                        else {
                            // ✅ **bet wins**
                            // 🔹 **Layer gets profit + stake back**
                            profit = trade.stake
                            userDetails.balance += (profit + trade.liability);
                            totalSystemOut += profit;

                        }
                    }

                }

                await Promise.all([
                    // ✅ **Save user balance updates**
                    userDetails.save(),
                    // ✅ **Update trade status**
                    Trade.updateOne({ _id: trade._id }, { $set: { status: winningSelection == 'canceled' ? winningSelection : 'settled', winner: winningSelection } }),
                    await Bet.updateOne({ marketId: trade.marketId }, { $set: { status: winningSelection == 'canceled' ? winningSelection : 'settled' } })
                ]);

            }



        } catch (error) {
            console.error("❌ Error in settlement:", error);
        }
    };

    static settleFancyTrade = async (winningSelection, trades) => {
        try {
            let totalSystemIn = 0, totalSystemOut = 0;

            for (const trade of trades) {
                let userDetails = null, investment = 0, profit = 0, loss = 0, pnl = 0;
                if (trade.backUserId) {
                    userDetails = await user.findById(trade.backUserId);
                    if (!userDetails) {
                        // console.log("userDetail does not exist.");
                        continue;
                    }
                    investment = trade.stake;

                    userDetails.escrowBalance -= trade.stake

                    if (winningSelection == 'canceled') {
                        userDetails.balance += trade.stake
                    }
                    else {
                        if (Number(trade.selectionId) <= winningSelection) {
                            // ✅ **bet wins**
                            // 🔹 **Backer gets profit + stake back**
                            pnl = profit = (trade.odds * trade.stake) / 100
                            userDetails.balance += (profit + trade.stake);
                            totalSystemOut += profit;
                        }
                        else {
                            // ✅ **bet loses**
                            // 🔹 **Backer loses liability**
                            loss = trade.stake;
                            pnl = -trade.stake;
                            totalSystemIn += loss;
                        }
                    }
                }
                else if (trade.layUserId) {
                    userDetails = await user.findById(trade.layUserId);
                    if (!userDetails) {
                        // console.log("userDetails does not exist.");
                        continue;
                    }

                    investment = trade.liability;

                    userDetails.escrowBalance -= trade.liability

                    if (winningSelection == 'canceled') {
                        userDetails.balance += trade.liability
                    }
                    else {
                        if (Number(trade.selectionId) <= winningSelection) {
                            // ✅ **bet loses**
                            // 🔹 **Layer loses liability**
                            loss = trade.liability;
                            pnl = -trade.liability;
                            totalSystemIn += loss;
                        }
                        else {
                            // ✅ **bet wins**
                            // 🔹 **Layer gets profit + stake back**
                            pnl = profit = trade.stake
                            userDetails.balance += (profit + trade.liability);
                            totalSystemOut += profit;

                        }
                    }
                }

                await Promise.all([
                    // ✅ **Save user balance updates**
                    userDetails.save(),
                    // ✅ **Update trade status**
                    Trade.updateOne({ _id: trade._id }, { $set: { status: winningSelection == 'canceled' ? winningSelection : 'settled', winner: winningSelection, pnl } }),
                    // ✅ **Update associated bets**
                    Bet.updateMany({ userId: userDetails._id, marketId: trade.marketId }, { $set: { status: winningSelection == 'canceled' ? winningSelection : 'settled' } })
                ]);

                // console.log(`✅ Trade ${trade._id} settled. Winner: ${winningSelection}`, trade.backUserId ? 'back' : 'lay', 'input', investment, 'profit', profit, 'loss', loss);
                // console.log(`💰 User New Balance: ${userDetails.balance}`);


            }

            // console.log(`💰 System In: ${totalSystemIn}`);
            // console.log(`💰 System Out: ${totalSystemOut}`);
            // console.log(`💰 System Profit: ${totalSystemIn - totalSystemOut}`);

        } catch (error) {
            console.error("❌ Error in settlement:", error);
        }
    };

    static getScoreUrl = async (sportId, matchId) => {
        try {
            const axios = (await import("axios")).default;
            let endpoint = `${process.env.MATCH_SCORE_API}${matchId}/${sportId}`;
            const response = await axios.get(endpoint).then(res => res.data);
            if (response?.result?.length) {
                return response.result[0].ScoreUrl;
            }
            throw new Error('Invalid');

        } catch (error) {
            return sportId == 4 ? `https://scoredata.365cric.com/#/score5/${matchId}` : `https://score.247idhub.com/go-score/template/${sportId}/${matchId}/`
        }
    }

    static getBanners = async () => {
        let banners = []
        try {
            let bannerData = await helper.redisClient.get('sp-banners');
            if (bannerData && ((Date.now() - JSON.parse(bannerData).lastUpdate) < (60 * 1000 * 1000))) {
                banners = JSON.parse(bannerData).banners
            }
            else {
                const axios = (await import("axios")).default;
                const https = (await import("https"));

                const httpsAgent = new https.Agent({
                    rejectUnauthorized: false
                });
                let endpoint = `${process.env.BANNERS_API}`;
                const response = await axios.get(endpoint, { httpsAgent }).then(res => res.data);
                if (!response?.bannerImg?.length) throw new Error('No banners found');

                const keywords = ['aviator'];

                banners = response?.bannerImg.filter(url =>
                    !keywords.some(keyword => url.toLowerCase().includes(keyword.toLowerCase()))
                );

                await helper.redisClient.set('sp-banners', JSON.stringify({ lastUpdate: Date.now(), banners }));
            }
            return banners;
        } catch (error) {
            return []
        }
    }

    static updateBookmakerOdds = async (order) => {
        try {
            EventEmitter.emit('data-update', {
                matchId: order.matchId,
                type: 'bets',
                bet: order
            });

            // const bookmaker = new BookMaker(order.matchId, order.marketId, 0.05);

            // await bookmaker.loadMarkets();
            // await bookmaker.adjustOdds();

        } catch (error) {
            return null;
        }
    }

    static getLiveOdds = async (matchId) => {
        try {
            let endpoint = `${process.env.BETTING_API_ENDPOINT}fancy/${matchId}`;
            const response2 = await axios.get(endpoint).then(res => res.data);
            return {
                match: response2?.Odds || [],
                fancy: response2?.Fancy2 || [],
                bookmaker: response2?.Bookmaker || []
            };
        } catch (error) {
            console.log("getLiveOdds", error.message);
            return {
                match: [],
                fancy: [],
                bookmaker: []
            };
        }
    }

}