import { expect } from "chai";
import { parseEther, verifyTypedData } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { ItemType, MAX_INT } from "../src/constants";
import { CreateOrderAction } from "../src/types";
import { generateRandomSalt } from "../src/utils/order";
import { describeWithFixture } from "./utils/setup";

const OPENSEA_DOMAIN = "opensea.io";
const OPENSEA_TAG = "360c6ebe";

describeWithFixture(
  "As a user I want to create and fulfill an order using an Openfort account.",
  (fixture) => {
    it("Should create the order after setting needed approvals and then fulfill", async () => {
      const {
        seaportContract,
        seaport,
        seaportWithSigner,
        testErc721,
        upgradeableOpenfortAccount,
        testErc20,
      } = fixture;
      const [orderSigner, zone, nftOwner] = await ethers.getSigners();

      //  ----------- /Playing arround with my Openfort Account/ -----------
      // Get the owner and verify it is the intended one (orderSigner)
      const openfort_owner = await upgradeableOpenfortAccount.owner();
      expect(openfort_owner == orderSigner.address);
      // console.log("Owner: ", orderSigner.address);

      // Successfully register a session key
      const regKey = await upgradeableOpenfortAccount
        .connect(orderSigner)
        ["registerSessionKey(address,uint48,uint48)"](openfort_owner, 0, 999);
      // console.log(regKey);

      // Update the EntryPoint direclty
      const updateEntryPoint = await upgradeableOpenfortAccount
        .connect(orderSigner)
        .updateEntryPoint(openfort_owner);
      // console.log(updateEntryPoint);

      //  ----------- /Stop playing arround/ -----------

      const nftId = "1";
      await testErc721.mint(nftOwner.address, nftId);
      const startTime = "0";
      const endTime = MAX_INT.toString();
      const salt = generateRandomSalt();
      // Mint 10 tokens to the Openfort wallet
      await testErc20.mint(
        upgradeableOpenfortAccount.address,
        parseEther("10")
      );

      // Give allowance to the seaport contract
      // Generate the calldata to send to the execute() function of my Openfort account
      let amount = parseEther("10");
      const approveCallData = testErc20.interface.encodeFunctionData(
        "approve",
        [seaportContract.address, amount]
      );
      // console.log(amount);

      // Actually call the prepared approval
      const approveCallDataBytes = ethers.utils.arrayify(approveCallData);
      const exec = await upgradeableOpenfortAccount
        .connect(orderSigner)
        .execute(testErc20.address, 0, approveCallDataBytes);
      // console.log(exec);

      // Create an order to buy the NFT for 10 testErc20 tokens
      const orderUseCase = await seaportWithSigner.createOrder(
        {
          startTime,
          endTime,
          salt,
          offer: [
            {
              amount: ethers.utils.parseEther("10").toString(),
              token: testErc20.address,
            },
          ],
          consideration: [
            {
              itemType: ItemType.ERC721,
              token: testErc721.address,
              identifier: nftId,
            },
          ],
          // 2.5% fee
          fees: [{ recipient: zone.address, basisPoints: 250 }],
        },
        upgradeableOpenfortAccount.address
      );

      // Verify the action was registerd in the order
      const offerActions = orderUseCase.actions;
      expect(offerActions).to.have.lengthOf(1);

      // Verify the order action is of type create
      const createOrderAction = offerActions[0] as CreateOrderAction;
      expect(createOrderAction.type).to.equal("create");
      const message = await createOrderAction.getMessageToSign();
      // console.log(message);

      const order = await orderUseCase.executeAllActions();
      console.log(order.signature);
      // console.log(order.signature);

      // const sig = await upgradeableOpenfortAccount.isValidSignature(
      //   message,
      //   order.signature
      // );
      // console.log(sig);

      const fulfillUsaCase = await seaport.fulfillOrders({
        fulfillOrderDetails: [{ order }],
        accountAddress: nftOwner.address,
        domain: OPENSEA_DOMAIN,
      });

      const fulfillActions = fulfillUsaCase.actions;

      const fulfillAction1 = fulfillActions[0];
      await fulfillAction1.transactionMethods.transact();
      const fulfillAction2 = fulfillActions[1];
      await fulfillAction2.transactionMethods.transact();

      const exchange = fulfillActions[2];
      expect(exchange.type).to.equal("exchange");

      const exchangeTransaction =
        await exchange.transactionMethods.buildTransaction();
      expect(exchangeTransaction.data?.slice(-8)).to.eq(OPENSEA_TAG);

      const transaction = await exchange.transactionMethods.transact();

      expect(transaction.data.slice(-8)).to.eq(OPENSEA_TAG);

      // Verify that my Openfort account is now the owner of
      expect(await testErc721.ownerOf(nftId)).to.equal(
        upgradeableOpenfortAccount.address
      );
      // Verify that the original NFT owner (minter) has now 9.75 testErc20 tokens
      expect(await testErc20.balanceOf(nftOwner.address)).to.equal(
        ethers.utils.parseEther("9.75")
      );
      // Verify that the zone address has received the fee (2.5%)
      expect(await testErc20.balanceOf(zone.address)).to.equal(
        ethers.utils.parseEther("0.25")
      );
    });
  }
);
