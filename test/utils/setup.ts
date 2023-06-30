import { ethers } from "hardhat";
import { Seaport } from "../../src/seaport";
import type {
  TestERC721,
  TestERC20,
  TestERC1155,
  Seaport as SeaportContract,
  DomainRegistry,
  TestERC20USDC,
  TestERC1271Wallet,
  UpgradeableOpenfortAccount,
} from "../../src/typechain-types";
import { expect } from "chai";

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const sinonChai = require("sinon-chai");

chai.use(chaiAsPromised);
chai.use(sinonChai);

type Fixture = {
  seaportContract: SeaportContract;
  seaport: Seaport;
  domainRegistry: DomainRegistry;
  testErc721: TestERC721;
  testErc20: TestERC20;
  testErc20USDC: TestERC20USDC;
  testErc1155: TestERC1155;
  testERC1271Wallet: TestERC1271Wallet;
  upgradeableOpenfortAccount: UpgradeableOpenfortAccount;
  seaportWithSigner: Seaport;
};

export const describeWithFixture = (
  name: string,
  suiteCb: (fixture: Fixture) => unknown
) => {
  describe(name, () => {
    const fixture: Partial<Fixture> = {};

    beforeEach(async () => {
      const SeaportFactory = await ethers.getContractFactory(
        "seaport_v1_5/contracts/Seaport.sol:Seaport"
      );

      const ConduitControllerFactory = await ethers.getContractFactory(
        "ConduitController"
      );

      const conduitController = await ConduitControllerFactory.deploy();

      const seaportContract = (await SeaportFactory.deploy(
        conduitController.address
      )) as SeaportContract;

      await seaportContract.deployed();

      const DomainRegistryFactory = await ethers.getContractFactory(
        "DomainRegistry"
      );
      const domainRegistry = await DomainRegistryFactory.deploy();
      await domainRegistry.deployed();

      const seaport = new Seaport(ethers.provider, {
        overrides: {
          contractAddress: seaportContract.address,
          domainRegistryAddress: domainRegistry.address,
        },
        seaportVersion: "1.5",
      });
      const [signer] = await ethers.getSigners();
      const seaportWithSigner = new Seaport(signer, {
        overrides: {
          contractAddress: seaportContract.address,
          domainRegistryAddress: domainRegistry.address,
        },
        seaportVersion: "1.5",
      });

      const TestERC721 = await ethers.getContractFactory("TestERC721");
      const testErc721 = await TestERC721.deploy();
      await testErc721.deployed();

      const TestERC1155 = await ethers.getContractFactory("TestERC1155");
      const testErc1155 = await TestERC1155.deploy();
      await testErc1155.deployed();

      const TestERC20 = await ethers.getContractFactory("TestERC20");
      const testErc20 = await TestERC20.deploy();
      await testErc20.deployed();

      const TestERC20USDC = await ethers.getContractFactory("TestERC20USDC");
      const testErc20USDC = await TestERC20USDC.deploy();
      await testErc20USDC.deployed();

      const TestERC1271Wallet = await ethers.getContractFactory(
        "TestERC1271Wallet"
      );
      const testERC1271Wallet = await TestERC1271Wallet.deploy();
      await testERC1271Wallet.deployed();

      const UpgradeableOpenfortAccount = await ethers.getContractFactory(
        "UpgradeableOpenfortAccount"
      );
      const upgradeableOpenfortAccount_implementation =
        await UpgradeableOpenfortAccount.deploy();
      await upgradeableOpenfortAccount_implementation.deployed();

      const UpgradeableOpenfortFactory = await ethers.getContractFactory(
        "UpgradeableOpenfortFactory"
      );
      const upgradeableOpenfortFactory =
        await UpgradeableOpenfortFactory.deploy(
          "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
          upgradeableOpenfortAccount_implementation.address
        );
      await upgradeableOpenfortFactory.deployed();

      const [orderSigner] = await ethers.getSigners();
      const nonce = ethers.utils.hexZeroPad(ethers.utils.hexlify(1), 32);
      const upgradeableOpenfortAccount_tx =
        await upgradeableOpenfortFactory.createAccountWithNonce(
          orderSigner.address,
          nonce
        );
      const receipt = await upgradeableOpenfortAccount_tx.wait();
      expect(
        receipt.events![1].address ==
          (await upgradeableOpenfortFactory.getAddressWithNonce(
            orderSigner.address,
            nonce
          ))
      );
      const upgradeableOpenfortAccount = UpgradeableOpenfortAccount.attach(
        receipt.events![1].address
      );

      // In order for cb to get the correct fixture values we have
      // to pass a reference to an object that you we mutate.
      fixture.seaportContract = seaportContract;
      fixture.seaport = seaport;
      fixture.seaportWithSigner = seaportWithSigner;
      fixture.domainRegistry = domainRegistry;
      fixture.testErc721 = testErc721;
      fixture.testErc1155 = testErc1155;
      fixture.testErc20 = testErc20;
      fixture.testErc20USDC = testErc20USDC;
      fixture.testERC1271Wallet = testERC1271Wallet;
      fixture.upgradeableOpenfortAccount = upgradeableOpenfortAccount;
    });

    suiteCb(fixture as Fixture);
  });
};
