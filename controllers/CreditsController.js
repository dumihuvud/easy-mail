class CreditsController {
  constructor(io) {
    this.io = io
  }

  isEnoughCredits = (req, res, next) => {
    if (req.user.credits < 1) {
      return res.status(401).send({ error: 'Not enough credits!' })
    }

    next()
  }
}

module.exports = CreditsController