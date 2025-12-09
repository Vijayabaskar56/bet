import { helper } from "../helper/helper.js";
import { siteSetting } from "../model/adminModel.js";
import { Bet } from "../model/BetModel.js";
import { Match } from "../model/MatchModel.js";
import { Trade } from "../model/TradeModel.js";
import { user } from "../model/userModel.js";
import bettingService from "../service/bettingService.js";
import BookMaker from "../service/BookMaker.js";
import EventEmitter from "../utils/EventEmitter.js";

export default class bettingController {

    static landingData = async (req, res) => {
        try {
            const [matches, banners] = await Promise.all([
                bettingService.getLiveMatches(),
                bettingService.getBanners()
            ]);
            res.send(await helper.jsonresponse(true, "commonmessage.detailsfetchsuccess", { matches, banners }))
        } catch (error) {
            res.send(await helper.jsonresponse(false, error.message, []))
        }
    }

    static liveMatches = async (req, res) => {
        try {
            const matches = await bettingService.getLiveMatches();
            res.send(await helper.jsonresponse(true, "commonmessage.detailsfetchsuccess", matches))
        } catch (error) {
            res.send(await helper.jsonresponse(false, error.message, []))
        }
    }

    static upcomingEvents = async (req, res) => {
        try {

            const list = await bettingService.getLiveMatches();

            const leagues = [];
            const events = [];

            for (const { sportid, name, matchList } of list) {
                const submenuMap = {};

                for (const match of matchList) {
                    // Build the events array
                    if (match?.inPlay) {
                        events.push({ ...match, sportId: sportid, sportName: name });
                    }

                    // Group by league for the leagues array
                    const league = match.league;
                    if (!submenuMap[league]) {
                        submenuMap[league] = [];
                    }
                    submenuMap[league].push(match);
                }

                leagues.push({
                    name,
                    submenus: Object.entries(submenuMap).map(([league, matches]) => ({
                        name: league,
                        matches: matches.map(match => {
                            return {
                                ...match,
                                sportId: sportid
                            }
                        }),
                    })),
                });
            }
            res.send(await helper.jsonresponse(true, "commonmessage.detailsfetchsuccess", { events: events.slice(0, 100), leagues }))
        } catch (error) {
            res.send(await helper.jsonresponse(false, error.message, []))
        }
    }

    static matchOdds = async (req, res) => {
        try {
            const { sportId, matchId } = req.params;

            let match = await Match.findOne({ matchId });

            if (!match) {

                const sports = await bettingService.getLiveMatches();
                if (!sports.length) throw new Error('Currently no matches found');

                const currentSportMatches = sports.find(sp => String(sp.sportid) == sportId);
                if (!currentSportMatches) throw new Error('Sport type not found');
                if (!currentSportMatches?.matchList.length) throw new Error('Currently no matches found for this sport');

                let matchDetails = currentSportMatches?.matchList.find(m => m.matchId == matchId);
                if (!matchDetails) throw new Error('match is not found');

                const response2 = await bettingService.getLiveOdds(matchDetails.matchId);
                const matchRunners = response2?.match?.map(r => {
                    return {
                        ...r,
                        runners: r.runners.map(run => {
                            return {
                                ...run.ex,
                                name: run.name,
                                runnerStatus: run.runnerStatus,
                                selectionId: run.selectionId,
                            }
                        }),
                        isCompleted: false
                    }
                });

                if (!matchRunners.length) throw new Error('Market not available');
                let scoreUrl = await bettingService.getScoreUrl(sportId, matchId);
                match = new Match({
                    matchName: matchDetails.matchName,
                    // runners,
                    matchId: matchDetails.matchId, // Selection
                    marketId: matchDetails.marketId, // Selection
                    openDate: new Date(matchDetails.openDate),
                    league: matchDetails.league,
                    inPlay: matchDetails.inPlay,
                    maxBet: matchDetails.maxBet,
                    minBet: matchDetails.minBet,
                    maxBetRate: matchDetails.maxBetRate,
                    minBetRate: matchDetails.minBetRate,
                    scoreUrl,
                    sportId: Number(sportId),
                    matchRunners
                });

                match.bookmakerRunners = BookMaker.getInitialOdds(response2?.bookmaker);;

                if (match?.bookmakerRunners?.length) {
                    match.bookmakerMarketId = match?.bookmakerRunners[0].mid;
                }

                match.fancyRunners = response2?.fancy || [];

                await match.save();
            }

            if (match.isCompleted) throw new Error('match already completed');

            // let { bookmakerOdds, fancyOdds } = await bettingService.getBookmakerFancyOdds(match);
            let details = match.toObject();
            let { match: matchOdds, bookmaker, fancy } = await bettingService.getLiveOdds(details.matchId);

            delete details.fancyRunners;
            delete details.bookmakerRunners;
            delete details.runners;
            delete details.matchRunners;

            const siteSettings = await siteSetting.findOne({})

            const limitSettings = {
                match: siteSettings.match,
                bookmark: siteSettings.bookmark,
                fancy: siteSettings.fancy,
            }

            return res.send(await helper.jsonresponse(true, "commonmessage.detailsfetchsuccess", { details, matchOdds: matchOdds, bookmakerOdds: bookmaker, fancyOdds: fancy, limitSettings }));

        } catch (error) {
            // //console.log(error)
            return res.send(await helper.jsonresponse(null, error.message, []));
        }
    }

    static placeBet = async (req, res) => {
        try {
            const token = req.params.token
            const { matchId, marketId, selectionId, type, odds, stake, marketType } = req.body;

            const userDetails = await user.findById(token.id)
            if (!userDetails) {
                //console.log("userDetails not found.");
                return res.send(await helper.jsonresponse(false, "userDetails not found.", null));
            }

            let match = await Match.findOne({ matchId });
            if (!match) throw new Error('match not found');

            const siteSettings = await siteSetting.findOne({})
            let currentOdds = await bettingService.getLiveOdds(matchId);

            if (marketType == 1) { // Match odd
                const matchOdd = currentOdds?.match.find(b => b.marketId == marketId);
                if (!matchOdd || !matchOdd.runners) throw new Error('No match odd found for this marketId');

                const selectionDetails = matchOdd?.runners?.find(b => b.selectionId == selectionId);
                if (!selectionDetails) throw new Error('No selection found for this marketId');

                if (stake > siteSettings.match.maxBet) throw new Error(`Stake should not be more than ${siteSettings.match.maxBet}`);
                if (stake < siteSettings.match.minBet) throw new Error(`Stake should not be less than ${siteSettings.match.minBet}`);
                const liability = type === 'lay' ? (odds - 1) * stake : 0;

                // Check if userDetails has enough funds
                if ((type === 'back' && userDetails.balance < stake) || (type === 'lay' && userDetails.balance < liability)) {
                    //console.log("Insufficient funds.");
                    return res.send(await helper.jsonresponse(false, "betting.insufficient", null));
                }

                // Deduct stake or liability from userDetails balance
                if (type === 'back') {
                    userDetails.balance -= stake;
                    userDetails.escrowBalance += stake;
                } else if (type === 'lay') {
                    userDetails.balance -= liability;
                    userDetails.escrowBalance += liability;
                }

                await userDetails.save();

                // Create and save bet
                const bet = new Bet({
                    marketId,
                    matchId,
                    selectionId,
                    userId: userDetails._id,
                    type,
                    odds,
                    stake,
                    initialStake: stake,
                    liability: type === 'lay' ? liability : undefined,
                    status: 'pending',
                    marketType: 1,
                    eventName: matchOdd.Name,
                    selectionName: selectionDetails.name
                });

                await bet.save();
                //console.log(`Bet placed: ${type} @ ${odds} for ${stake}`);

                // Attempt to match with existing opposite bets
                bettingService.matchBet(bet);
                return res.send(await helper.jsonresponse(true, "betting.betPlace", bet));

            }
            else if (marketType == 2) { // Book maker odd
                const matchOdd = currentOdds?.bookmaker.find(b => b.mid == marketId);
                if (!matchOdd) throw new Error('No match odd found for this marketId');

                const selectionDetails = currentOdds?.bookmaker?.find(b => b.sid == selectionId);
                if (!selectionDetails) throw new Error('No selection found for this marketId');

                if (stake > siteSettings.bookmark.maxBet) throw new Error(`Stake should not be more than ${siteSettings.bookmark.maxBet}`);
                if (stake < siteSettings.bookmark.minBet) throw new Error(`Stake should not be less than ${siteSettings.bookmark.minBet}`);
                const markets = match?.bookmakerRunners?.filter(b => b.mid == marketId);
                if (!markets?.length) {
                    let bmList = await bettingService.getLiveOdds(matchId);
                    const bm = bmList?.bookmaker.find(b => b.mid == marketId);
                    if (bm) {
                        match.bookmakerRunners = bmList?.bookmaker;
                        match.bookmakerMarketId = bmList?.bookmaker[0].mid;
                        await match.save();
                    }
                    else {
                        throw new Error('No bookmakers found')
                    }
                };

                const liability = type === 'lay' ? (odds * stake) / 100 : stake;

                // Check if userDetails has enough funds
                if (userDetails.balance < liability) {
                    //console.log("Insufficient funds.");
                    return res.send(await helper.jsonresponse(false, "betting.insufficient", null));
                }

                // Deduct liability from userDetails balance

                userDetails.balance -= liability;
                userDetails.escrowBalance += liability;

                // Create and save bet
                const bet = new Bet({
                    marketId,
                    matchId,
                    selectionId,
                    userId: userDetails._id,
                    type,
                    odds,
                    stake,
                    initialStake: stake,
                    liability: type === 'lay' ? liability : undefined,
                    status: 'matched',
                    marketType: 2,
                    eventName: matchOdd.matchName,
                    selectionName: selectionDetails.nation
                });

                const trade = new Trade({
                    matchId,
                    marketId,
                    selectionId,
                    odds: odds,
                    stake: stake,
                    liability,
                    marketType: 2,
                    eventName: matchOdd.matchName,
                    selectionName: selectionDetails.nation
                });

                if (type === 'back') {
                    trade.backUserId = userDetails._id
                }
                else {
                    trade.layUserId = userDetails._id
                }

                await bet.save();
                await trade.save();
                await userDetails.save();
                let updateQuery = type == 'back' ? { "bookmakerRunners.$.bs1": stake } : { "bookmakerRunners.$.ls1": liability };
                await Match.findOneAndUpdate({ _id: match._id, "bookmakerRunners.sid": Number(selectionId) }, { $inc: updateQuery });
                //console.log(`Bet placed: ${type} @ ${odds} for ${stake}`);
                bettingService.updateBookmakerOdds(bet);
                return res.send(await helper.jsonresponse(true, "betting.betPlace", bet));

            }
            else if (marketType == 3) {
                if (stake > siteSettings.fancy.maxBet) throw new Error(`Stake should not be more than ${siteSettings.fancy.maxBet}`);
                if (stake < siteSettings.fancy.minBet) throw new Error(`Stake should not be less than ${siteSettings.fancy.minBet}`);

                const fancy = currentOdds?.fancy.find(b => b.sid == marketId);
                if (!fancy) throw new Error('No fancy found for this marketId');

                const liability = type === 'lay' ? (odds * stake) / 100 : stake;

                // Check if userDetails has enough funds
                if (userDetails.balance < liability) {
                    //console.log("Insufficient funds.");
                    return res.send(await helper.jsonresponse(false, "betting.insufficient", null));
                }

                // Deduct liability from userDetails balance

                userDetails.balance -= liability;
                userDetails.escrowBalance += liability;

                // Create and save bet
                const bet = new Bet({
                    marketId,
                    matchId,
                    selectionId,
                    userId: userDetails._id,
                    type,
                    odds,
                    stake,
                    initialStake: stake,
                    liability,
                    status: 'matched',
                    marketType: 3,
                    eventName: fancy.nation,
                    selectionName: selectionId,
                });

                const trade = new Trade({
                    matchId,
                    marketId,
                    selectionId,
                    odds: odds,
                    stake: stake,
                    liability,
                    marketType: 3,
                    eventName: fancy.nation,
                    selectionName: selectionId,
                });

                if (type === 'back') {
                    trade.backUserId = userDetails._id
                }
                else {
                    trade.layUserId = userDetails._id
                }

                await Promise.all([
                    bet.save(),
                    trade.save(),
                    userDetails.save()
                ]);

                //console.log(`Bet placed: ${type} @ ${odds} for ${stake}`);
                EventEmitter.emit('data-update', {
                    matchId: bet.matchId,
                    type: 'bets',
                    bet
                });
                return res.send(await helper.jsonresponse(true, "betting.betPlace", bet));
            }

        } catch (error) {
            return res.send(await helper.jsonresponse(null, error.message, null));
        }
    }

    static currentBets = async (req, res) => {

        try {
            let userId = req.params.token.id;
            let matchId = req.params.matchId;
            const result = await Bet.aggregate([
                {
                    $addFields: { userIdString: { "$toString": "$userId" } }
                },
                { $match: { userIdString: userId, matchId, }, },
                {
                    $facet: {
                        matched: [
                            { $match: { status: 'matched' }, },
                            { $sort: { createdAt: -1 } }
                        ],
                        unmatched: [
                            { $match: { status: 'pending' }, },
                            { $sort: { createdAt: -1 } }
                        ]
                    }
                }
            ]);
            let bets = {
                matched: result?.length ? result[0].matched : [],
                unmatched: result?.length ? result[0].unmatched : []
            }

            return res.send(await helper.jsonresponse(true, "betting.betPlace", bets));
        } catch (error) {
            return res.send(await helper.jsonresponse(null, error.message, null));
        }
    }

    static cancelBet = async (req, res) => {
        try {
            const betId = req.params.betId;
            const userId = req.params.token.id;
            const [bet, userDetails] = await Promise.all([
                Bet.findOne({ _id: betId, userId }),
                user.findById(userId)
            ]);
            if (!bet) throw new Error('Bet record not found');
            if (bet.status != 'pending') throw new Error('Only pending bets can be cenceled');

            if (bet.type === 'back') {
                userDetails.balance += bet.stake;
                userDetails.escrowBalance -= bet.stake;
            } else {
                userDetails.balance += bet.liability;
                userDetails.escrowBalance -= bet.liability;
            }
            bet.status = 'canceled';
            await bet.save();
            EventEmitter.emit('data-update', {
                matchId: bet.matchId,
                type: 'bets',
                bet
            })
            // let odds = await bettingService.getMarketMatchOdds(bet.matchId);
            // EventEmitter.emit('data-update', {
            //     matchId: bet.matchId,
            //     type: 'match-odds',
            //     odds
            // })
            await userDetails.save();
            return res.send(await helper.jsonresponse(true, "betting.betDeleted", bet));
        } catch (error) {
            return res.send(await helper.jsonresponse(null, error.message, null));
        }

    }

    static betHistory = async (req, res) => {
        try {
            let userId = req.params.token.id;
            let { startDate, endDate, page, limit, betType } = req.query;
            page = Number(page || 1);
            limit = Number(limit || 10);

            const matchConditions = {
                $expr: {
                    $and: [
                        {
                            $or: [
                                { $eq: ["$backUserId", "$currentUserId"] },
                                { $eq: ["$layUserId", "$currentUserId"] }
                            ]
                        },
                        { $eq: ["$status", "settled"] },
                    ]
                },
                marketType: betType ? Number(betType) : { $exists: true }
            };

            // Add date filtering if provided
            if (startDate || endDate) {
                matchConditions.createdAt = {};
                if (startDate) matchConditions.createdAt.$gte = new Date(new Date(startDate).setHours(0, 0, 0, 1));
                if (endDate) matchConditions.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
            }

            const result = await Trade.aggregate([
                // Convert userId to ObjectId and add as a field
                {
                    $addFields: {
                        currentUserId: { $toObjectId: userId }
                    }
                },
                // Apply your match conditions first
                { $match: matchConditions },
                // Create a new field "betTypes" which is an array containing "back" and/or "lay"
                {
                    $addFields: {
                        betTypes: {
                            $concatArrays: [
                                { $cond: { if: { $eq: ["$backUserId", "$currentUserId"] }, then: ["back"], else: [] } },
                                { $cond: { if: { $eq: ["$layUserId", "$currentUserId"] }, then: ["lay"], else: [] } }
                            ]
                        }
                    }
                },
                // Unwind the betTypes array to get separate documents for each bet type
                { $unwind: "$betTypes" },
                // Perform the lookup into the "matches" collection using a pipeline
                {
                    $lookup: {
                        from: "matches",
                        let: { betMatchId: { $toInt: "$matchId" } },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$matchId", "$$betMatchId"]
                                    }
                                }
                            }
                        ],
                        as: "match"
                    }
                },
                {
                    $unwind: {
                        path: "$match",
                        preserveNullAndEmptyArrays: true
                    }
                },
                // Project fields and use "betTypes" as the "type" field
                {
                    $project: {
                        matchName: "$match.matchName",
                        eventName: {
                            $concat: ["$eventName", " / ", "$selectionName"]
                        },
                        winner: 1,
                        selectionId: 1,
                        odds: 1,
                        stake: 1,
                        oddType: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$marketType", 1] }, then: "Match" },
                                    { case: { $eq: ["$marketType", 2] }, then: "Bookmaker" },
                                    { case: { $eq: ["$marketType", 3] }, then: "Fancy" }
                                ],
                                default: "Unknown"
                            }
                        },
                        type: "$betTypes", // now this is either "back" or "lay"
                        profitLoss: {
                            $round: [
                                {
                                    $switch: {
                                        branches: [
                                            {
                                                case: { $eq: ["$marketType", 1] },
                                                then: {
                                                    $cond: {
                                                        if: { $eq: ["$selectionId", "$winner"] },
                                                        then: {
                                                            $cond: {
                                                                if: { $eq: ["$betTypes", "back"] },
                                                                then: { $multiply: [{ $subtract: ["$odds", 1] }, "$stake"] },
                                                                else: { $multiply: [{ $subtract: ["$odds", 1] }, -1, "$stake"] }
                                                            }
                                                        },
                                                        else: {
                                                            $cond: {
                                                                if: { $eq: ["$betTypes", "back"] },
                                                                then: { $multiply: [{ $subtract: ["$odds", 1] }, -1, "$stake"] },
                                                                else: { $multiply: [{ $subtract: ["$odds", 1] }, "$stake"] }
                                                            }
                                                        }
                                                    }
                                                },

                                            },
                                            {
                                                case: { $eq: ["$marketType", 2] },
                                                then: {
                                                    $cond: {
                                                        if: { $eq: ["$selectionId", "$winner"] },
                                                        then: {
                                                            $cond: {
                                                                if: { $eq: ["$backUserId", "$currentUserId"] },
                                                                then: { $divide: [{ $multiply: ["$odds", "$stake"] }, 100] },
                                                                else: { $multiply: ["$liability", -1] }
                                                            }
                                                        },
                                                        else: {
                                                            $cond: {
                                                                if: { $eq: ["$backUserId", "$currentUserId"] },
                                                                then: { $multiply: ["$liability", -1] },
                                                                else: "$stake"
                                                            }
                                                        }
                                                    }
                                                },

                                            },
                                            {
                                                case: { $eq: ["$marketType", 3] },
                                                then: "$pnl"
                                            },
                                        ],
                                        default: 0
                                    },
                                },
                                2
                            ]
                        },
                        createdAt: 1
                    }
                },
                // Use facet for pagination and total count
                {
                    $facet: {
                        totalCount: [{ $count: "total" }],
                        result: [
                            { $sort: { createdAt: -1 } },
                            { $skip: (page - 1) * limit },
                            { $limit: limit }
                        ]
                    }
                }
            ]);

            const response = {
                totalCount: result?.length ? (result[0].totalCount?.length > 0 ? result[0].totalCount[0].total : 0) : 0,
                result: result?.length ? (result[0].result || []) : []
            }

            return res.send(await helper.jsonresponse(true, "betting.betPlace", response));
        } catch (error) {
            return res.send(await helper.jsonresponse(null, error.message, []));
        }
    }

    static userBets = async (req, res) => {
        try {
            let userId = req.params.token.id;
            let { startDate, endDate, page, limit, betType } = req.query;
            page = Number(page || 1);
            limit = Number(limit || 10);

            const matchConditions = {
                $expr: {
                    $and: [
                        { $eq: ["$userId", "$currentUserId"] },
                    ],
                },
                marketType: betType ? Number(betType) : { $exists: true }
            };

            // Add date filtering if provided
            if (startDate || endDate) {
                matchConditions.createdAt = {};
                if (startDate) matchConditions.createdAt.$gte = new Date(new Date(startDate).setHours(0, 0, 0, 1));
                if (endDate) matchConditions.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
            }

            const result = await Bet.aggregate([
                // Convert userId to ObjectId and add as a field
                {
                    $addFields: {
                        currentUserId: { $toObjectId: userId }
                    }
                },
                { $match: matchConditions },
                {
                    $lookup: {
                        from: "matches",
                        let: { betMatchId: { $toInt: "$matchId" } },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$matchId", "$$betMatchId"]
                                    }
                                }
                            }
                        ],
                        as: "match"
                    }
                },
                {
                    $unwind: {
                        path: "$match",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        matchName: "$match.matchName",
                        eventName: {
                            $concat: [
                                "$eventName",
                                " / ",
                                "$selectionName",
                            ],
                        },
                        winner: 1,
                        selectionId: 1,
                        matchId: 1,
                        price: "$odds",
                        side: "$type",
                        size: {
                            $cond: {
                                if: { $eq: ["$marketType", 1] },
                                then: "$initialStake",
                                else: "$stake",
                            },
                        },
                        status: 1,
                        oddType: {
                            $switch: {
                                branches: [
                                    {
                                        case: { $eq: ["$marketType", 1] },
                                        then: "Match",
                                    },
                                    {
                                        case: { $eq: ["$marketType", 2] },
                                        then: "Bookmaker",
                                    },
                                    {
                                        case: { $eq: ["$marketType", 3] },
                                        then: "Fancy",
                                    },
                                ],
                                default: "Unknown",
                            },
                        },
                        createdAt: 1,
                    },
                },
                // Use facet for pagination and total count
                {
                    $facet: {
                        totalCount: [{ $count: "total" }],
                        result: [
                            { $sort: { createdAt: -1 } },
                            { $skip: (page - 1) * limit },
                            { $limit: limit }
                        ]
                    }
                }
            ]);

            const response = {
                totalCount: result?.length ? (result[0].totalCount?.length > 0 ? result[0].totalCount[0].total : 0) : 0,
                result: result?.length ? (result[0].result || []) : []
            }

            return res.send(await helper.jsonresponse(true, "betting.betPlace", response));
        } catch (error) {
            return res.send(await helper.jsonresponse(null, error.message, []));
        }
    }

}
