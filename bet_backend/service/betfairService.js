/* jslint node:true, esnext:true */

class Betfair {
    /**
     * @constructor
     * @param {string} appKey - Betfair application key
     * @param {string} [username] - Betfair username
     * @param {string} [password] - Betfair password
     * @param {boolean} [keepAlive=false] - Keep token alive until logout
     */
    constructor(appKey, username = '', password = '', keepAlive = false) {
        this.appKey = appKey;
        this.authKey = '';
        this.username = username;
        this.password = password;
        this.keepAlive = keepAlive;
        this.keepAliveTimeout = 3600000;
        this.locale = 'en';

        // Kick off login (note: constructor cannot be async, so login is not awaited)
        this.login().catch(console.error);
    }

    /**
     * Log in to Betfair.
     * @param {string} [username] - Betfair username
     * @param {string} [password] - Betfair password
     * @param {boolean} [keepAlive] - Whether to keep token alive
     */
    async login(username = this.username, password = this.password, keepAlive = this.keepAlive) {
        this.keepAlive = keepAlive;
        const response = await this._request(
            'identitysso.betfair.com',
            '/api/login',
            'application/x-www-form-urlencoded',
            { username, password }
        );
        this.authKey = response.token;
        if (this.keepAlive) {
            setTimeout(() => this._keepAliveReset(), this.keepAliveTimeout);
        }
        return response;
    }

    /**
     * Log out from Betfair.
     */
    async logout() {
        this.keepAlive = false;
        return this._request('identitysso.betfair.com', '/api/logout');
    }

    async _keepAliveReset() {
        if (this.keepAlive) {
            const response = await this._request('identitysso.betfair.com', '/api/keepAlive');
            if (response.status === 'FAIL') {
                await this.login();
            } else {
                setTimeout(() => this._keepAliveReset(), this.keepAliveTimeout);
            }
        }
    }

    // --- API Methods ---

    async listCompetitions(filter) {
        return this._devApi('listCompetitions', { filter, locale: this.locale });
    }

    async listCountries(filter) {
        return this._devApi('listCountries', { filter, locale: this.locale });
    }

    async listCurrentOrders(params = {}) {
        return this._devApi('listCurrentOrders', params);
    }

    async listClearedOrders(params) {
        return this._devApi('listClearedOrders', params);
    }

    async listEvents(filter) {
        return this._devApi('listEvents', { filter, locale: this.locale });
    }

    async listEventTypes(filter) {
        return this._devApi('listEventTypes', { filter, locale: this.locale });
    }

    async listMarketBook(marketIds, opts = {}) {
        return this._devApi(
            'listMarketBook',
            Object.assign({ marketIds, locale: this.locale }, opts)
        );
    }

    async listRunnerBook(marketId, selectionId, opts = {}) {
        return this._devApi(
            'listRunnerBook',
            Object.assign({ marketIds: marketId, selectionId, locale: this.locale }, opts)
        );
    }

    async listMarketCatalogue(filter, maxResults, opts = {}) {
        return this._devApi(
            'listMarketCatalogue',
            Object.assign({ filter, maxResults, locale: this.locale }, opts)
        );
    }

    async listMarketProfitAndLoss(params = {}) {
        return this._devApi('listMarketProfitAndLoss', params);
    }

    async listMarketTypes(filter) {
        return this._devApi('listMarketTypes', { filter, locale: this.locale });
    }

    async listTimeRanges(filter, granularity) {
        return this._devApi('listTimeRanges', { filter, granularity, locale: this.locale });
    }

    async listVenues(filter) {
        return this._devApi('listVenues', { filter, locale: this.locale });
    }

    async placeOrders(marketId, instructions, opts = {}) {
        return this._devApi(
            'placeOrders',
            Object.assign({ marketId, instructions, locale: this.locale }, opts)
        );
    }

    async cancelOrders(marketId, instructions, opts = {}) {
        return this._devApi(
            'cancelOrders',
            Object.assign({ marketId, instructions, locale: this.locale }, opts)
        );
    }

    async updateOrders(marketId, instructions, opts = {}) {
        return this._devApi(
            'updateOrders',
            Object.assign({ marketId, instructions, locale: this.locale }, opts)
        );
    }

    async replaceOrders(marketId, instructions, opts = {}) {
        return this._devApi(
            'replaceOrders',
            Object.assign({ marketId, instructions, locale: this.locale }, opts)
        );
    }

    // --- Static Builders ---

    /**
     * Build a place instruction.
     */
    static buildPlaceInstruction(selectionId, handicap = 0, orderType, side, limitOrder) {
        const orderTypeDictionary = {
            LIMIT: 'limitOrder',
            LIMIT_ON_CLOSE: 'limitOnCloseOrder',
            MARKET_ON_CLOSE: 'marketOnCloseOrder'
        };
        return {
            selectionId,
            handicap,
            orderType,
            side,
            limitOrder,
            [orderTypeDictionary[orderType]]: limitOrder
        };
    }

    static buildLimitOrder(size, price, persistenceType, timeInForce, minFillSize, betTargetType, betTargetSize) {
        return { size, price, persistenceType, timeInForce, minFillSize, betTargetType, betTargetSize };
    }

    static buildMarketOnCloseOrder(liability) {
        return { liability };
    }

    static buildLimitOnCloseOrder(liability, price) {
        return { liability, price };
    }

    static buildReplaceInstruction(betId, newPrice) {
        return { betId, newPrice };
    }

    static buildCancelInstruction(betId, sizeReduction) {
        return { betId, sizeReduction };
    }

    static buildUpdateInstruction(betId, newPersistenceType) {
        return { betId, newPersistenceType };
    }

    // --- Accounts API Methods ---

    async getAccountDetails() {
        return this._accountsApi('getAccountDetails');
    }

    async getAccountFunds(wallet) {
        const params = wallet ? { wallet } : {};
        return this._accountsApi('getAccountFunds', params);
    }

    async getDeveloperAppKeys() {
        return this._accountsApi('getDeveloperAppKeys');
    }

    async getAccountStatement(params = {}) {
        return this._accountsApi('getAccountStatement', params);
    }

    async listCurrencyRates(fromCurrency) {
        const params = fromCurrency ? { fromCurrency } : {};
        return this._accountsApi('listCurrencyRates', params);
    }

    // --- Internal API Request Helpers ---

    /**
     * Call the developer (betting) API.
     * @private
     */
    async _devApi(method, params) {
        const payload = [
            {
                jsonrpc: '2.0',
                method: `SportsAPING/v1.0/${method}`,
                params
            }
        ];
        return this._request(
            'developers.betfair.com',
            '/api.betfair.com/exchange/betting/json-rpc/v1',
            'text/plain;charset=UTF-8',
            JSON.stringify(payload)
        );
    }

    /**
     * Call the accounts API.
     * @private
     */
    async _accountsApi(method, params = {}) {
        const payload = [
            {
                jsonrpc: '2.0',
                method: `AccountAPING/v1.0/${method}`,
                params
            }
        ];
        return this._request(
            'developers.betfair.com',
            '/api.betfair.com/exchange/account/json-rpc/v1',
            'text/plain;charset=UTF-8',
            JSON.stringify(payload)
        );
    }

    /**
     * Make an HTTP POST request.
     * @private
     * @param {string} host - Hostname of endpoint.
     * @param {string} path - Path of endpoint.
     * @param {string} contentType - Content type of payload.
     * @param {object|string} [params] - Payload (object for URL encoded, string for JSON)
     */
    async _request(host, path, contentType = 'application/json', params) {
        // Construct the URL
        const url = new URL(path, `https://${host}`);
        const headers = {
            'Content-Type': contentType,
            'X-Application': this.appKey,
            Accept: 'application/json'
        };

        if (this.authKey) {
            headers['X-Authentication'] = this.authKey;
        }

        let body = params;
        if (contentType === 'application/x-www-form-urlencoded' && params && typeof params === 'object') {
            // Use URLSearchParams to build a urlencoded string.
            body = new URLSearchParams(params).toString();
        }

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers,
            body
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Request failed: ${response.status} ${response.statusText} - ${errorText}`);
        }
        return response.json();
    }
}

export {
    Betfair
}
