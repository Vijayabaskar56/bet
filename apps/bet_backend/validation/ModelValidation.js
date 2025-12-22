import Joi from 'joi'

class modelValid {

    static authSchema = Joi.object({
        user_name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().pattern(new RegExp('[a-zA-Z0-9]')).min(4).max(15).required(),
        confirmPassword: Joi.string().required(),
    })

    //usermodel  reg schema  validation
    static userModelValidation = Joi.object({
        user_name: Joi.string().regex(/^(?=.{1,25}$)(?![_.])(?!.*[_.]{2})[a-zA-Z._]+(?!.[0-9])(?<![_.]$)/),
        email: Joi.string().email(),
        phone_no: Joi.number().min(10 ** 9).max(10 ** 10),
        password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).min(4).max(15),
        repeat_password: Joi.ref('password'),
        dob: Joi.date().raw(),
        email_verified_at: Joi.date(),
        email_verify: Joi.string(),
        country: Joi.string().min(2),
        profileimg: Joi.string(),
        twofa: Joi.number(),
        twofa_otp: Joi.string(),
        twofa_status: Joi.string(),
        google2fa_secret: Joi.string(),
        google2fa_verify: Joi.string(),
        kyc_verify: Joi.string(),
        kyc_level: Joi.string(),
        profile_otp: Joi.string(),
        app_finger_status: Joi.string(),
        app_face_status: Joi.string(),
        reason: Joi.string(),
        type: Joi.string(),
        parent_id: Joi.string(),
        mobile_user: Joi.string(),
        modifiedAt: Joi.date(),
        createdAt: Joi.date(),
        deleteFlag: Joi.boolean(),
        address: Joi.string().min(8).max(50),
        city: Joi.string(),
        role: Joi.string(),
        is_address: Joi.string(),
        is_logged: Joi.string(),
        ipaddr: Joi.string(),
        location: Joi.string(),
        trade_count: Joi.string(),
        feedback_per: Joi.string(),
        verifytoken: Joi.string(),
        device_type: Joi.string(),
        remember_token: Joi.string(),
        recaptcha: Joi.string()
    })

    //usermodel  reg schema  validation for register page only
    static userRegisterModelValidation = Joi.object({
        user_name: Joi.string().regex(/^(?![_.])(?!.*[\s])(?!.*[_.])[a-zA-Z._0-9]+(?<![_.]$)/).min(3).max(30).required().messages({
            'string.pattern.base': 'Try again Another UserName',
            'string.min': 'Minimum 3 character',
            'string.max': 'Maximum 30 character'
        }),
        email: Joi.string().email().required(),
        password: Joi.string().pattern(new RegExp(/^(?!.*[\s])(?=.*([A-Z]){1,})(?=.*[!@#$&*]{1,})(?=.*[0-9]{1,})(?=.*[a-z]{1,}).{8,20}$/)).required(),
        confirmPassword: Joi.ref('password'),
        code: Joi.string()
    })
    //user login
    static userLogin = Joi.object({
        email: Joi.string().regex(/^(?!.*[\s])/).required(),
        password: Joi.string().pattern(new RegExp(/^(?!.*[\s])(?=.*([A-Z]){1,})(?=.*[!@#$&*]{1,})(?=.*[0-9]{1,})(?=.*[a-z]{1,}).{8,20}$/)).required(),
        ip_address: Joi.string(),
        country: Joi.string(),
        city: Joi.string(),
        device: Joi.string(),
        os: Joi.string(),
        browser: Joi.string(),
        browser_version: Joi.string(),
    })
    //contactus
    static contacts = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        contact_number: Joi.number().required(),
        message: Joi.string().required()
    })
    //cryptoTransactionsHistrory
    static cryptoTransaction = Joi.object({
        user_id: Joi.string(),
        coin_id: Joi.string().required(),
        bank_id: Joi.string(),
        payment_id: Joi.string(),
        transaction_type: Joi.number(),
        transaction_method: Joi.number(),
        transaction_id: Joi.string(),
        block_number: Joi.number(),
        from_address: Joi.string(),
        to_address: Joi.string().required(),
        amount: Joi.number().required(),
        deposit_fee: Joi.number(),
        withdraw_fee: Joi.number(),
        admin_view: Joi.number(),
        document_proof: Joi.string(),
        status: Joi.number()

    })
    //new wallet model schema
    static newWalletValid = Joi.object({
        name: Joi.string().min(3).max(20).required(),
        slug: Joi.string().required(),
        coin_id: Joi.string().required(),
        wallet_address: Joi.string().required(),
        hex_address: Joi.string().required(),
        publickey: Joi.string().required(),
        wif: Joi.string().required(),
        privatekey: Joi.string().required(),
        balance: Joi.number().required(),
        received: Joi.number().required(),
        escrow_balance: Joi.number().required(),
        available_balance: Joi.number().required(),
        status: Joi.number().required(),
        createdAt: Joi.date().required(),
        modifiedAt: Joi.date().required()
    })
    //forgot password
    static forPasswordValid = Joi.object({
        email: Joi.string().email().required(),
        new_password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).min(4).max(15).required(),
        confirm_password: Joi.ref('password'),
        profile_otp: Joi.number().required()
    })


    // buyTrademode schema
    static buyTradeValid = Joi.object({
        user_id: Joi.string().required(),
        order_id: Joi.string().required(),
        pair_id: Joi.string().required(),
        order_type: Joi.number().required(),
        price: Joi.number().required(),
        volume: Joi.number().required(),
        value: Joi.number().required(),
        fees: Joi.number().required(),
        commission: Joi.number().required(),
        remaining: Joi.number().required(),
        balance: Joi.number().required(),
        status: Joi.number().required(),
        createdAt: Joi.date().required(),
        modifiedAt: Joi.date().required()
    })

    //sellTrademodel
    static sellTradeValid = Joi.object({
        user_id: Joi.string().required(),
        order_id: Joi.string().required(),
        pair_id: Joi.string().required(),
        order_type: Joi.number().required(),
        price: Joi.number().required(),
        min_price: Joi.number().required(),
        max_price: Joi.number().required(),
        volume: Joi.number().required(),
        value: Joi.number().required(),
        fees: Joi.number().required(),
        commission: Joi.number().required(),
        remaining: Joi.number().required(),
        balance: Joi.number().required(),
        status: Joi.number().required(),
        createdAt: Joi.date().required(),
        modifiedAt: Joi.date().required()
    })

    //complete trade model
    static completeTradeValid = Joi.object({
        user_id: Joi.string().required(),
        buytrade_id: Joi.string().required(),
        selltrade_id: Joi.string().required(),
        pair_id: Joi.string().required(),
        bot_type: Joi.number().default("null").required(),
        price: Joi.number().required(),
        volume: Joi.number().required(),
        value: Joi.number().required(),
        order_type: Joi.number().required()

    })


    //newTradePair
    static updateTradePairDetailsValid = Joi.object({
        tradepairid: Joi.string().required(),
        coinone: Joi.string(),
        cointwo: Joi.string(),
        coinone_id: Joi.string().required(),
        cointwo_id: Joi.string().required(),
        coinone_type: Joi.number(),
        cointwo_type: Joi.number(),
        status: Joi.number(),
        price: Joi.number(),
        min_buy_trade_amount: Joi.number(),
        max_buy_trade_amount: Joi.number(),
        min_sell_trade_amount: Joi.number(),
        max_sell_trade_amount: Joi.number(),
        buy_trade_commission: Joi.number(),
        sell_trade_commission: Joi.number()


    })

    //newCyrptocurrencies
    static addcoinvalid = Joi.object({
        name: Joi.string().required(),
        slug: Joi.string().required(),
        contract_address: Joi.string().required(),
        abi: Joi.string(),
        decimal: Joi.number(),
        live_price: Joi.number(),
        point_value: Joi.number(),
        capitalization: Joi.string(),
        changes_24_hrs: Joi.string(),
        image: Joi.string(),
        min_deposit_limit: Joi.number(),
        max_deposit_limit: Joi.number(),
        deposit_fee: Joi.number(),
        min_withdraw_limit: Joi.number(),
        max_withdraw_limit: Joi.number(),
        per_day_withdraw_limit: Joi.number(),
        withdraw_fee: Joi.number(),
        deposit_status: Joi.number(),
        withdraw_status: Joi.number(),
        min_buy_trade_limit: Joi.number(),
        sell_buy_trade_limit: Joi.number(),
        max_buy_per_day: Joi.number(),
        max_sell_per_day: Joi.number(),
        maker_fee: Joi.number(),
        taker_fee: Joi.number(),
        coin_type: Joi.number(),
        isowntoken: Joi.number(),
        orderlist: Joi.number(),
        status: Joi.number(),
        ico_status: Joi.number(),
        buy_trade_commission: Joi.number(),
        sell_trade_commission: Joi.number(),
        block_number: Joi.number()
    })
    //addCommissionSettings
    static addCommissionSettings = Joi.object({
        coin_id: Joi.string().required(),
        name: Joi.string(),
        slug: Joi.string(),
        contract_address: Joi.string(),
        abi: Joi.string(),
        decimal: Joi.number(),
        live_price: Joi.number(),
        point_value: Joi.number(),
        capitalization: Joi.string(),
        changes_24_hrs: Joi.string(),
        image: Joi.string(),
        min_deposit_limit: Joi.number(),
        max_deposit_limit: Joi.number(),
        deposit_fee: Joi.number(),
        min_withdraw_limit: Joi.number(),
        max_withdraw_limit: Joi.number(),
        per_day_withdraw_limit: Joi.number(),
        withdraw_fee: Joi.number(),
        deposit_status: Joi.number(),
        withdraw_status: Joi.number(),
        min_buy_trade_limit: Joi.number(),
        sell_buy_trade_limit: Joi.number(),
        max_buy_per_day: Joi.number(),
        max_sell_per_day: Joi.number(),
        maker_fee: Joi.number(),
        taker_fee: Joi.number(),
        coin_type: Joi.number(),
        isowntoken: Joi.number(),
        orderlist: Joi.number(),
        status: Joi.number(),
        ico_status: Joi.number(),
        buy_trade_commission: Joi.number(),
        sell_trade_commission: Joi.number(),
        block_number: Joi.number(),
        token_distribute: Joi.number(),
        start_date: Joi.date(),
        end_date: Joi.date()
    })
    //updateCommissionDetails
    static updateCommissionDetails = Joi.object({
        commission_id: Joi.string().required(),
        name: Joi.string(),
        slug: Joi.string(),
        contract_address: Joi.string(),
        abi: Joi.string(),
        decimal: Joi.number(),
        live_price: Joi.number(),
        point_value: Joi.number(),
        capitalization: Joi.string(),
        changes_24_hrs: Joi.string(),
        image: Joi.string(),
        min_deposit_limit: Joi.number(),
        max_deposit_limit: Joi.number(),
        //.greater(Joi.ref('min_deposit_limit')).error(() => {
        //     return {
        //       message: 'Maximum Deposit Limit  must be greater than or equal to Minimum Deposit Limit'
        //     };
        //   }),
        deposit_fee: Joi.number(),
        min_withdraw_limit: Joi.number(),
        max_withdraw_limit: Joi.number(),
        per_day_withdraw_limit: Joi.number(),
        withdraw_fee: Joi.number(),
        deposit_status: Joi.number(),
        withdraw_status: Joi.number(),
        min_buy_trade_limit: Joi.number(),
        sell_buy_trade_limit: Joi.number(),
        max_buy_per_day: Joi.number(),
        max_sell_per_day: Joi.number(),
        maker_fee: Joi.number(),
        taker_fee: Joi.number(),
        coin_type: Joi.number(),
        isowntoken: Joi.number(),
        orderlist: Joi.number(),
        status: Joi.number(),
        ico_status: Joi.number(),
        buy_trade_commission: Joi.number(),
        sell_trade_commission: Joi.number(),
        block_number: Joi.number(),
        type: Joi.string(),
        staking_status: Joi.number(),
    })
    //virtualBalance
    static virtualBalance = Joi.object({
        user_id: Joi.string().required(),
        coin_id: Joi.string().required(),
        balance: Joi.number().required()
    })
    //ticketMessage
    static ticketMessage = Joi.object({
        support_ticket_id: Joi.number().required(),
        messager_id: Joi.string(),
        message: Joi.string().required(),
        image_url: Joi.string(),
        status: Joi.number(),
        admin_view: Joi.number(),
        user_view: Joi.number(),
        sender_id: Joi.number()
    })
    static ticketComplete = Joi.object({
        support_ticket_id: Joi.number().required(),
    })
    //KYC
    static kyc = Joi.object({
        user_id: Joi.string().required(),
        id_type: Joi.string(),
        id_number: Joi.string(),
        id_address: Joi.string(),
        expiry_date: Joi.string(),
        id_front_image: Joi.string(),
        id_back_image: Joi.string(),
        status: Joi.number().required(),
        first_name: Joi.string(),
        last_name: Joi.string(),
        city: Joi.string().regex(/^(?=.{1,25}$)(?![_.])(?!.*[_.]{2})[a-zA-Z._]+(?!.[0-9])(?<![_.]$)/),
    })
    //KYC/getKycSearchData
    static getKycSearchData = Joi.object({
        id_type: Joi.string(),
        id_number: Joi.string(),
        id_address: Joi.string(),
        expiry_date: Joi.string(),
        id_front_image: Joi.string(),
        id_back_image: Joi.string(),
        user_id: Joi.string(),
        status: Joi.number(),
        start_date: Joi.date(),
        end_date: Joi.date()
    })
    //cms/insert
    static cms = Joi.object({
        title: Joi.string().required(),
        content: Joi.string().required(),
        status: Joi.number().required()
    })
    //cms/update
    static cmsupdate = Joi.object({
        id: Joi.string(),
        title: Joi.string().required(),
        content: Joi.string(),
        status: Joi.number()
    })
    //admin login
    static login = Joi.object({
        email_id: Joi.string().required(),
        password: Joi.string().pattern(new RegExp('[a-zA-Z0-9]')).min(4).max(15).required()
    })
    //user/icoTokenCalculation
    static icoTokenCalculation = Joi.object({
        coin_id: Joi.string().required(),
        quantity: Joi.string().required()
    })
    //buyTradeHistory
    static buyTradeHistory = Joi.object({
        order_type: Joi.number().required(),
    })
    //user/profile/update
    static profileupdate = Joi.object({
        user_name: Joi.string().regex(/^(?=.{4,25}$)(?![_.])(?!.*[\s])(?!.*[_.]{2})[a-zA-Z._]+(?!.[0-9])(?<![_.]$)/).messages({
            'string.pattern.base': 'Invalid input. Please enter a string with any numbers.',
        }),
        mobile_number: Joi.number().min(9),
        address: Joi.string().min(8).max(50),
        country: Joi.string().min(2).required(),
        // email : Joi.string().email(),
        // password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).min(4).max(15),
        // repeat_password: Joi.ref('password'),
        // dob:  Joi.date().raw(),
        // email_verified_at: Joi.date(),
        // email_verify: Joi.string(),
        // country: Joi.string().min(2).required(),
        // profileimg: Joi.string(),
        // twofa: Joi.string(),
        // twofa_otp: Joi.string(),
        // twofa_status: Joi.string(),
        // google2fa_secret: Joi.string(),
        // google2fa_verify: Joi.string(),
        // kyc_verify: Joi.string(),
        // kyc_level: Joi.string(),
        // profile_otp: Joi.string(),
        // app_finger_status: Joi.string(),
        // app_face_status: Joi.string(),
        // reason: Joi.string(),
        // type: Joi.string(),
        // parent_id: Joi.string(),

        // modifiedAt: Joi.date(),
        // createdAt: Joi.date(),
        // deleteFlag: Joi.boolean(),

        // city: Joi.string(),
        // role: Joi.string(),
        // is_address: Joi.string(),
        // is_logged: Joi.string(),
        // ipaddr: Joi.string(),
        // location: Joi.string(),
        // trade_count: Joi.string(),
        // feedback_per: Joi.string(),
        // verifytoken: Joi.string(),
        // device_type: Joi.string(),
        // remember_token: Joi.string()
    })
    //user
    static accountverify = Joi.object({
        email: Joi.string(),
        otp: Joi.number(),
    })
    static forgotpassword = Joi.object({
        email: Joi.string().email().required(),
        otp: Joi.number().required(),
        password: Joi.string().pattern(new RegExp(/^(?!.*[\s])(?=.*([A-Z]){1,})(?=.*[!@#$&*]{1,})(?=.*[0-9]{1,})(?=.*[a-z]{1,}).{8,20}$/)).required(),
        confirmPassword: Joi.ref('password')
    })
    static email = Joi.object({
        email: Joi.string().email().required()

    })
    //VERFIY OTP
    static verifyOtp = Joi.object({
        // secrectkey : Joi.string().required(),
        otp: Joi.number().required(),
        withdrawLimitDaily: Joi.number().optional(),
        withdrawLimitMonthly: Joi.number().optional(),
        id: Joi.string().optional(),
        status: Joi.string().required(),
    })
    //verifyTwofaOtp
    static verifytwofaOtp = Joi.object({
        twofa_otp: Joi.number().required(),
        status: Joi.string().required()
    })
    //disablemailauthentication
    static disablemailauthentication = Joi.object({
        email: Joi.string().email().required(),
        twofa_otp: Joi.number().required()
    })
    //user/createUsdtAddress
    static coinId = Joi.object({
        coin_id: Joi.string().length(24).required()
    })
    //admin/Add TradePair
    static addTradePair = Joi.object({
        coinone_id: Joi.string().required(),
        cointwo_id: Joi.string().required()
    })
    //icoCoinSchema
    static updateIcoCoin = Joi.object({
        id: Joi.string().required(),
        coin_id: Joi.string().required(),
        min_deposit_limit: Joi.number(),
        max_deposit_limit: Joi.number(),
        token_distribute: Joi.number(),
        start_date: Joi.date(),
        end_date: Joi.date(),
        status: Joi.number(),
        isDeleted: Joi.boolean()
    })
    static addIcoBonus = Joi.object({
        bonus_id: Joi.string().required(),
        coin_id: Joi.string(),
        coin_quantity_from: Joi.number().required(),
        coin_quantity_to: Joi.number().required(),
        distribute_percentage: Joi.number().required(),
        status: Joi.number(),
        isDeleted: Joi.boolean()
    })
    //spot
    static orders = Joi.object({
        tradepair_id: Joi.required(),
        price: Joi.string().required(),
        quantity: Joi.string().required(),
        market_price: Joi.string(),
    })
    static cancelOrders = Joi.object({
        trade_id: Joi.string().required(),
        pair_id: Joi.string().required()
    })
    static stopLimit = Joi.object({
        tradepair_id: Joi.string().required(),
        price: Joi.number(),
        min_price: Joi.number(),
        max_price: Joi.number(),
        stop: Joi.number(),
        quantity: Joi.number().required(),
        value: Joi.number(),
    })
    //supportTicket
    static raiseTicket = Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required()
    })
    static sendMessage = Joi.object({
        support_ticket_id: Joi.number().required(),
        message: Joi.string().required()
    })
    static dispute = Joi.object({
        add_id: Joi.string().length(24).required(),
        trade_id: Joi.string().length(24).required()
    })
    //2falosting
    static twofaLosting = Joi.object({
        user_name: Joi.string().required(),
        dob: Joi.string().required(),
        mobile_number: Joi.number().required(),
        image: Joi.string().required(),
    })
    //kycsubmit
    static kycsubmit = Joi.object({
        first_name: Joi.string().required(),
        last_name: Joi.string().required(),
        date: Joi.string().required(),
        city: Joi.string().required(),
        country: Joi.string().required(),
        country_code: Joi.string().required(),
        phoneNumber: Joi.string().required(),
        address: Joi.string().required(),
        id_type: Joi.string().required(),
        id_number: Joi.string().required(),
        expiry_date: Joi.string().required()
    })
    static kycUserData = Joi.object({
        user_id: Joi.string().length(24).required(),
    })
    static fiatdepositrequest = Joi.object({
        coin_id: Joi.string(),
        bank_id: Joi.string(),
        amount: Joi.number(),
        transaction_type: Joi.number().required(),
        transaction_method: Joi.number().required(),
        document_proof: Joi.string(),
        payment_id: Joi.string()
    })
    static fiatdepositimage = Joi.object({
        document_proof: Joi.any().required(),
    })
    //announcement create
    static bannerCreate = Joi.object({
        title: Joi.string(),
        content: Joi.string(),
        banner_image: Joi.string(),
        status: Joi.number(),
        type: Joi.number(),
        start_date: Joi.string(),
        end_date: Joi.string(),
    })

    //announcement update
    static bannerUpdate = Joi.object({
        banner_id: Joi.string(),
        title: Joi.string(),
        content: Joi.string(),
        banner_image: Joi.string(),
        status: Joi.number(),
        type: Joi.number(),
        start_date: Joi.string(),
        end_date: Joi.string(),
    })
    //PtoP Validation
    static addPost = Joi.object({
        coin_id: Joi.string().required(),
        currency_id: Joi.string().required(),
        country_id: Joi.string().required(),
        trade_type: Joi.number().required(),
        margin: Joi.number().required(),
        max_transaction_limit: Joi.number().required(),
        min_transaction_limit: Joi.number().required(),
        payment_method: Joi.number().required(),
        payment_window: Joi.number().required()
    })

    static createLaunchpad = Joi.object({
        address: Joi.string().required(),
        currency: Joi.string(),
        fee: Joi.number(),
        listing_type: Joi.number(),// 1:AutoListing; 2:ManualListing
        Affiliate_type: Joi.number(),// 1:DisableAffiliate; 2:EnableAffiliate
        percentage: Joi.number(), // if create EnableAffiliate,use percentage
        presale_rate: Joi.number(),
        whitelist: Joi.number(),// 1:Disable; 2:Enable
        softcap: Joi.number(),
        hardcap: Joi.number(),
        min_buy: Joi.number(),
        max_buy: Joi.number(),
        refund_type: Joi.number(), // 1:Refund; 2:Burn
        router: Joi.number(), // eg: 1:swapdex
        liquidity_percentage: Joi.number(),
        listing_rate: Joi.number(),
        start_time: Joi.date(),
        end_time: Joi.date(),
        liq_lockup: Joi.number(),
        logo_url: Joi.string(),
        website: Joi.string(),
        facebook: Joi.string(),
        twitter: Joi.string(),
        github: Joi.string(),
        telegram: Joi.string(),
        instagram: Joi.string(),
        discord: Joi.string(),
        reddit: Joi.string(),
        youtube: Joi.string(),
        description: Joi.string(),
        createdAt: Joi.date()
    })

    static dex_token = Joi.object({
        name: Joi.string(),
        symbol: Joi.string(),
        address: Joi.string(),
        total_supply: Joi.number(),
        decimal: Joi.number(),
        logo: Joi.string(),
        status: Joi.number()
    })

    static blocked_user = Joi.object({
        id: Joi.string().required().messages({
            'string.base': "Should be a Give Type of String",
            'any.required': "Please Enter id",
            'string.empty': "Id Cannot be an Empty Field"
        }),
        blocked: Joi.boolean().required().messages({
            'boolean.base': "Please Enter Blocked Status Like Boolean Type",
            'any.required': "Please Enter blocked",
        }),
        reason: Joi.string().messages({
            'string.base': "Should be a Give Type of String",
            'string.empty': "Reason Cannot be an Empty Field"
        })
    })

    static suspend_user = Joi.object({
        id: Joi.string().required().messages({
            'string.base': "Should be a Give Type of String",
            'any.required': "Please Enter id",
            'string.empty': "Id Cannot be an Empty Field"
        }),
        // reason: Joi.string().required().messages({
        //     'string.base': "Should be a Give Type of String",
        //     'any.required': "Please Enter reason",
        //     'string.empty': "Reason Cannot be an Empty Field"
        // }),
        // date: Joi.string().required().messages({
        //     'string.base': "Should be a Give Type of String",
        //     'any.required': "Please Enter date",
        //     'string.empty': "Date Cannot be an Empty Field"
        // }),
    })

    static updateSubscribe = Joi.object({
        type: Joi.number().required().messages({
            'any.required': "Please Enter type",
            'string.empty': "type Cannot be an Empty Field"
        }),
        planId: Joi.string().required().messages({
            'string.base': "Should be a Give Type of String",
            'any.required': "Please Enter planId",
            'string.empty': "planId Cannot be an Empty Field"
        }),
        planName: Joi.string().messages({
            'string.empty': "planName Cannot be an Empty Field"
        }),
        amount: Joi.number().messages({
            'string.empty': "amount Cannot be an Empty Field"
        })
    })

    static placeBet = Joi.object({
        marketId: Joi.required().messages({
            'any.required': "Please Enter marketId",
            'string.empty': "planId Cannot be an Empty Field"
        }),
        marketType: Joi.number().required().valid(1, 2, 3).messages({
            'number.base': "Should be a Give Type of number",
            'any.required': "marketType is required",
            'number.empty': "marketType Cannot be an Empty Field"
        }),
        matchId: Joi.required().messages({
            'any.required': "Please Enter matchId",
            'string.empty': "matchId Cannot be an Empty Field"
        }),
        selectionId: Joi.string().required().messages({
            'string.base': "selectionId Should be a Give Type of String",
            'any.required': "Please Enter selectionId",
            'string.empty': "selectionId Cannot be an Empty Field"
        }),
        type: Joi.string().required().valid('back', 'lay').messages({
            'string.base': "Should be a Give Type of String",
            'any.required': "Please Enter marketId",
            'string.empty': "type Cannot be an Empty Field"
        }),
        odds: Joi.number().required().min(1.01).messages({
            'any.required': "Please Enter odds",
            'string.empty': "odds Cannot be an Empty Field"
        }),
        stake: Joi.number().required().min(1).messages({
            'any.required': "Please Enter stake",
            'string.empty': "stake Cannot be an Empty Field"
        })
    })
}
export { modelValid }
