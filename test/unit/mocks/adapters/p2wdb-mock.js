class Write {
    constructor({ wif }) {
        if (!wif) {
            throw new Error(
                'WIF private key required when instantiating P2WDB Write library.'
            )
        }
        if (wif === 'validWif') {
            this.funds = true
        } else {
            this.funds = false
        }

    }

    async checkForSufficientFunds () {
        return this.funds
    }

    async postEntry () {
        return { hash: 'testhash' }
    }
}

module.exports = {
    Write
}