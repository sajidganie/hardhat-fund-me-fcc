const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
// const { solidity } = require("ethereum-waffle")

describe("FundMe", async function () {
    let fundMe
    let mockV3Aggregator
    let deployer

    //  const sendValue = ethers.utils.parseEther("1")
    const sendValue = "1000000000000000000"

    beforeEach(async () => {
        // const accounts = await ethers.getSigners()
        // deployer = accounts[0]
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        fundMe = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContract(
            "MockV3Aggregator",
            deployer
        )
    })

    // describe("constructor", async function () {
    //     it("sets the aggregator addresses correctly", async () => {
    //         const response = await fundMe.getPriceFeed()
    //         assert.equal(response, mockV3Aggregator.address)
    //     })
    // })

    describe("fund", function () {
        // https://ethereum-waffle.readthedocs.io/en/latest/matchers.html
        // could also do assert.fail
        it("Fails if you don't send enough ETH", async () => {
            await expect(fundMe.fund()).to.be.revertedWith(
                "You need to spend more ETH!"
            )
        })

        it("Updates the amount funded data structure", async () => {
            await fundMe.fund({ value: sendValue })
            const response = await fundMe.getAddressToAmountFunded(deployer)
            assert.equal(response.toString(), sendValue.toString())
        })
        it("Adds funder to array of funders", async () => {
            await fundMe.fund({ value: sendValue })
            const response = await fundMe.getFunder(0)
            assert.equal(response, deployer)
        })
    })

    describe("withdraw", function () {
        beforeEach(async () => {
            await fundMe.fund({ value: sendValue })
        })
        it("withdraws ETH from a single funder", async () => {
            // Arrange
            const startingFundMeBalance = await ethers.provider.getBalance(
                fundMe.target
            )
            const startingDeployerBalance = await ethers.provider.getBalance(
                deployer
            )

            // Act
            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait()
            // const gasUsed = receipt.gasUsed * receipt.effectiveGasPrice
            // const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasUsed = transactionReceipt.gasUsed
            const effectiveGasPrice = await ethers.provider.getGasPrice()
            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await ethers.provider.getBalance(
                fundMe.target
            )
            const endingDeployerBalance = await ethers.provider.getBalance(
                deployer
            )

            // Assert
            // Maybe clean up to understand the testing
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(gasCost).toString()
            )
        })
        // this test is overloaded. Ideally we'd split it into multiple tests
        // but for simplicity we left it as one
    })
})
