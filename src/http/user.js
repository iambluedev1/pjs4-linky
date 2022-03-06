const ethers = require("ethers");
const web3 = require("web3");
const { customAlphabet } = require("nanoid");
const jwt = require("jsonwebtoken");

const nanoid = customAlphabet("1234567890", 6);

const signToken = (id) => {
  return jwt.sign({ id }, eternals.config.jwt.secret, {
    expiresIn: eternals.config.jwt.expiresIn,
  });
};

module.exports = {
  getToken: async (req, res) => {
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

    const { User } = eternals.schemas;

    const entity = await User.findOne({
      attributes: ["id"],
      where: {
        publicAddress: publicAddress.toLowerCase(),
      },
    });

    const code = parseInt(nanoid(), 10);

    if (entity !== null) {
      res.json({
        publicAddress,
        code,
      });
    }

    if (entity == null) {
      try {
        await User.create({
          publicAddress: publicAddress.toLowerCase(),
          code,
          lastConnectedAt: null,
        });
      } catch (e) {
        eternals.log.error(`Unable to create user for ${publicAddress}`, e);
        return res.status(500).json({ error: true });
      }

      res.json({
        publicAddress,
        code,
      });
    }

    try {
      await User.update(
        { code },
        {
          where: {
            publicAddress: publicAddress.toLowerCase(),
          },
        }
      );
    } catch (e) {
      eternals.log.error(`Unable to save code for user ${publicAddress}`, e);
    }
  },
  verify: async (req, res) => {
    const { publicAddress, signature } = req.query;

    if (publicAddress === undefined || publicAddress === "") {
      return res.status(400).json({
        error: true,
        message: "Missing public address",
      });
    }

    if (signature === undefined || signature === "") {
      return res.status(400).json({
        error: true,
        message: "Missing signature",
      });
    }

    if (!web3.utils.isAddress(publicAddress)) {
      return res.status(400).json({
        error: true,
        message: "Invalid public address",
      });
    }

    const { User } = eternals.schemas;

    const entity = await User.findOne({
      attributes: ["code"],
      where: {
        publicAddress: publicAddress.toLowerCase(),
      },
    });

    if (entity == null) {
      return res.status(400).json({
        error: true,
        message: "Public address not recognized",
      });
    }

    let decodedAddress = null;

    try {
      decodedAddress = ethers.utils.verifyMessage(
        entity.code.toString(),
        signature
      );
    } catch (e) {
      return res.status(400).json({
        error: true,
        message: "Invalid signature",
      });
    }

    if (publicAddress.toLowerCase() === decodedAddress.toLowerCase()) {
      const token = signToken(entity.id);

      const cookieOptions = {
        expires: new Date(
          Date.now() +
            parseInt(eternals.config.jwt.cookieExpiresIn, 10) *
              24 *
              60 *
              60 *
              1000
        ),
        httpOnly: true,
      };

      if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

      res.cookie("jwt", token, cookieOptions);
      res.status(200).json({ success: true, token });

      try {
        await User.update(
          { lastConnectedAt: Date.now() },
          {
            where: {
              publicAddress: publicAddress.toLowerCase(),
            },
          }
        );
      } catch (e) {
        eternals.log.error(
          `Unable to save last connection date for user ${publicAddress}`,
          e
        );
      }
    } else {
      return res.status(400).json({
        error: true,
        message: "Invalid signature",
      });
    }
  },
};
