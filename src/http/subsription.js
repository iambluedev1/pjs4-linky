const ethers = require("ethers");
const web3 = require("web3");
const { JsonRpcProvider } = require("@ethersproject/providers");
const crypto = require("crypto");

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

    // TODO: mutualisation du provider / contract
    const provider = new JsonRpcProvider(
      "https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
    );
    const contract = new ethers.Contract(
      "0x7fcb08f177ef74ba5b8ed65c9c42489a5ddb8035",
      [
        "function isAccountStillSubscribed(address _account) public view returns (bool,uint256,uint256)",
      ],
      provider
    );

    const [isSubscribed, until, plan] = await contract.isAccountStillSubscribed(
      publicAddress
    );

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

    const contract = new ethers.utils.Interface([
      "function subscribe(uint256 _choice)",
    ]);

    // TODO : mutualisation de cette partie
    const iv = crypto.randomBytes(16);
    const hash = crypto.createHash("sha1");
    hash.update(publicAddress);

    const cipher = crypto.createCipheriv(
      "aes-128-cbc",
      Buffer.from(hash.digest("binary").substring(0, 16), "binary"),
      iv
    );
    const encrypted = Buffer.concat([
      cipher.update(contract.encodeFunctionData("subscribe", [plan])),
      cipher.final(),
    ]);

    return res.json({
      publicAddress,
      contract: "0x7fcb08f177ef74ba5b8ed65c9c42489a5ddb8035", // TODO: mutualisation de l'addr + ABI
      d: encrypted.toString("hex"),
      i: iv.toString("hex"),
    });
  },
};
