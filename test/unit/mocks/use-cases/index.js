/*
  Mocks for the use cases.
*/
/* eslint-disable */

class UserUseCaseMock {
  async createUser (userObj) {
    return {}
  }

  async getAllUsers () {
    return true
  }

  async getUser (params) {
    return true
  }

  async updateUser (existingUser, newData) {
    return true
  }

  async deleteUser (user) {
    return true
  }

  async authUser (login, passwd) {
    return {
      generateToken: () => { }
    }
  }
}

class EntryUseCaseMock {
  async createEntry (userObj) {
    return {}
  }
}

class Offer {
  async createOffer () {
    return {}
  }
  async listOffers () {
    return {}
  }
  async findOfferByHash() {
    return {}
  }
}

class Order {
  async createOrder () {
    return {}
  }
  async listOrders () {
    return {}
  }
  async findOrder () {
    return {}
  }
  async takeOrder () {
    return {}
  }
  async findOrderByHash() {
    return {}
  }
  async checkTakenOrder () {
    return {}
  }
  async completeOrder() {
    return {}
  }
}

class UseCasesMock {
  constuctor (localConfig = {}) {
    // this.user = new UserUseCaseMock(localConfig)
  }

  user = new UserUseCaseMock()
  entry = new EntryUseCaseMock()
  offer = new Offer()
  order = new Order()
}

module.exports = UseCasesMock
