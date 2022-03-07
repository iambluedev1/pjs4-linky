const web3 = require("web3");
const { contracts } = require("@eternals/provider");

module.exports = {
  plans: async (req, res) => {
    res.send({
      plans: [
        {
          index: 1,
          duration: 10125,
          price: 10000000000000000000 / 10 ** 18,
        },
        {
          index: 2,
          duration: 60750,
          price: 60000000000000000000 / 10 ** 18,
        },
        {
          index: 3,
          duration: 1971000,
          price: 120000000000000000000 / 10 ** 18,
        },
      ],
    });
  },
  checkSubscription: async (req, res) => {
    const { publicAddress } = req.query;

    if (publicAddress === undefined || publicAddress === "") {
      return res.status(400).json({
        error: true,
        message: "Missing public address",
      });
    }

    if (!web3.utils.isAddress(publicAddress)) {
      return res.status(400).json({
        error: true,
        message: "Invalid public address",
      });
    }

    const { Subscription } = eternals.provider.contracts;

    const [isSubscribed, until, plan] =
      await Subscription.isAccountStillSubscribed(publicAddress);

    return res.json({
      publicAddress,
      isSubscribed,
      until: Number(until),
      plan: Number(plan),
    });
  },
  subscribe: async (req, res) => {
    let { plan } = req.query;
    const { publicAddress } = req.query;

    if (plan === undefined || plan === "") {
      return res.status(400).json({
        error: true,
        message: "Missing plan",
      });
    }

    if (publicAddress === undefined || publicAddress === "") {
      return res.status(400).json({
        error: true,
        message: "Missing public address",
      });
    }

    if (!web3.utils.isAddress(publicAddress)) {
      return res.status(400).json({
        error: true,
        message: "Invalid public address",
      });
    }

    plan = parseInt(plan, 10);

    if (plan > 3 || plan === 0) {
      return res.status(400).json({
        error: true,
        message: "Invalid plan",
      });
    }

    const { Subscription } =
      eternals.provider.withSalt(publicAddress).contracts;

    const { data, iv } = await Subscription.subscribe(plan);

    return res.json({
      publicAddress,
      contract: contracts.Subscription.address,
      d: data,
      i: iv,
    });
  },
};
