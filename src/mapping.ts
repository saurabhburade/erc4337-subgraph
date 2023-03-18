import { ZERO_BD } from "./../helpers/constants";
import {
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";

import {
  EntryPoint,
  AccountDeployed,
  Deposited,
  SignatureAggregatorChanged,
  StakeLocked,
  StakeUnlocked,
  StakeWithdrawn,
  UserOperationEvent,
  UserOperationRevertReason,
  Withdrawn,
} from "../generated/EntryPoint/EntryPoint";
import {
  Deposit,
  ExampleEntity,
  SignatureAggregator,
  Stake,
  User,
  UserOperation,
  Withdraw,
} from "../generated/schema";
import { ONE_BD } from "../helpers/constants";

// function getTxnInputDataToDecode(event: ethereum.Event): Bytes {
//   const inputDataHexString = event.transaction.input.toHexString().slice(10); //take away function signature: '0x????????'
//   const hexStringToDecode =
//     "0x0000000000000000000000000000000000000000000000000000000000000020" +
//     inputDataHexString; // prepend tuple offset
//   return Bytes.fromByteArray(Bytes.fromHexString(hexStringToDecode));
// }
export function handleAccountDeployed(event: AccountDeployed): void {
  // TODO : EXTRACT TXN DATA OP Params using getTxnInputDataToDecode

  let user = User.load(event.params.sender.toHex());

  if (user == null) {
    user = new User(event.params.sender.toHex());
    user.timestamp = event.block.timestamp;
    user.txHash = event.transaction.hash.toHex();
    user.operations = [];
  }
  user.operationsCount = ZERO_BD;
  user.beneficiary = event.transaction.from.toHex();
  user.factory = event.params.factory.toHex();
  user.paymaster = event.params.paymaster.toHex();
  user.userOpHash = event.params.userOpHash.toHex();
  user.save();
  // let entity = ExampleEntity.load(event.transaction.from.toHex());

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  // if (entity == null) {
  //   entity = new ExampleEntity(event.transaction.from.toHex());

  //   // Entity fields can be set using simple assignments
  //   entity.count = BigInt.fromI32(0);
  // }

  // BigInt and BigDecimal math are supported
  // entity.count = entity.count + BigInt.fromI32(1);

  // Entity fields can be set based on event parameters
  // entity.userOpHash = event.params.userOpHash;
  // entity.sender = event.params.sender;

  // Entities can be written to the store with `.save()`
  // entity.save();

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.SIG_VALoperationsCountIDATION_FAILED(...)
  // - contract.balanceOf(...)
  // - contract.deposits(...)
  // - contract.getDepositInfo(...)
  // - contract.getUserOpHash(...)
  // - contract.innerHandleOp(...)
}

export function handleDeposited(event: Deposited): void {
  let deposit = Deposit.load(event.transaction.hash.toHexString());
  if (deposit === null) {
    deposit = new Deposit(event.transaction.hash.toHexString());
  }

  deposit.account = event.params.account.toHex();
  deposit.totalDeposit = event.params.totalDeposit;
  deposit.txHash = event.transaction.hash.toHexString();
  deposit.timestamp = event.block.timestamp;
  deposit.txFrom = event.transaction.from.toHex();
  let user = User.load(event.params.account.toHex());
  if (user !== null) {
    let deposits = user.deposits;
    if (deposits === null) {
      user.deposits = [];
    }
    if (deposits !== null) {
      user.deposits = deposits.concat([event.transaction.hash.toHexString()]);
    }
    user.save();
  }
  let txTo = event.transaction.to;

  if (txTo !== null) {
    deposit.txTo = txTo.toHex();
  }

  deposit.save();
}

export function handleSignatureAggregatorChanged(
  event: SignatureAggregatorChanged
): void {
  let signatureAgg = SignatureAggregator.load(
    event.params.aggregator.toHexString()
  );
  if (signatureAgg === null) {
    signatureAgg = new SignatureAggregator(
      event.params.aggregator.toHexString()
    );
    signatureAgg.timestamp = event.block.timestamp;
    signatureAgg.txHash = event.transaction.hash.toHexString();
  }
  signatureAgg.save();
}

export function handleStakeLocked(event: StakeLocked): void {
  let stake = Stake.load(event.transaction.hash.toHexString());
  if (stake === null) {
    stake = new Stake(event.transaction.hash.toHexString());
  }
  stake.type = "lock";
  stake.account = event.params.account.toHex();
  stake.totalStaked = event.params.totalStaked;
  stake.unstakeDelaySec = event.params.unstakeDelaySec;
  stake.txHash = event.transaction.hash.toHexString();
  stake.timestamp = event.block.timestamp;
  stake.txFrom = event.transaction.from.toHex();
  let txTo = event.transaction.to;

  if (txTo !== null) {
    stake.txTo = txTo.toHex();
  }

  let user = User.load(event.params.account.toHex());
  if (user !== null) {
    let stakes = user.stakes;
    if (stakes === null) {
      user.stakes = [];
    }
    if (stakes !== null) {
      user.stakes = stakes.concat([event.transaction.hash.toHexString()]);
    }
    user.save();
  }
  stake.save();
}

export function handleStakeUnlocked(event: StakeUnlocked): void {
  let stake = Stake.load(event.transaction.hash.toHexString());
  if (stake === null) {
    stake = new Stake(event.transaction.hash.toHexString());
  }
  stake.type = "unlock";
  stake.account = event.params.account.toHex();
  stake.withdrawTime = event.params.withdrawTime;
  stake.txHash = event.transaction.hash.toHexString();
  stake.timestamp = event.block.timestamp;
  stake.txFrom = event.transaction.from.toHex();
  let txTo = event.transaction.to;

  if (txTo !== null) {
    stake.txTo = txTo.toHex();
  }

  let user = User.load(event.params.account.toHex());
  if (user !== null) {
    let stakes = user.stakes;
    if (stakes === null) {
      user.stakes = [];
    }
    if (stakes !== null) {
      user.stakes = stakes.concat([event.transaction.hash.toHexString()]);
    }
    user.save();
  }
  stake.save();
}

export function handleStakeWithdrawn(event: StakeWithdrawn): void {
  let stake = Stake.load(event.transaction.hash.toHexString());
  if (stake === null) {
    stake = new Stake(event.transaction.hash.toHexString());
  }
  stake.type = "withdraw";
  stake.account = event.params.account.toHex();
  stake.withdrawAddress = event.params.withdrawAddress.toHex();
  stake.amount = event.params.amount;
  stake.txHash = event.transaction.hash.toHexString();
  stake.timestamp = event.block.timestamp;
  stake.txFrom = event.transaction.from.toHex();
  let txTo = event.transaction.to;

  if (txTo !== null) {
    stake.txTo = txTo.toHex();
  }

  let user = User.load(event.params.account.toHex());
  if (user !== null) {
    let stakes = user.stakes;
    if (stakes === null) {
      user.stakes = [];
    }
    if (stakes !== null) {
      user.stakes = stakes.concat([event.transaction.hash.toHexString()]);
    }
    user.save();
  }
  stake.save();
}

export function handleUserOperationEvent(event: UserOperationEvent): void {
  let userOperation = UserOperation.load(event.params.userOpHash.toHexString());

  if (userOperation == null) {
    userOperation = new UserOperation(event.params.userOpHash.toHexString());
    userOperation.timestamp = event.block.timestamp;
    userOperation.txHash = event.transaction.hash.toHex();
  }

  userOperation.txHash = event.transaction.hash.toHex();
  userOperation.userOpHash = event.params.userOpHash.toHex();

  userOperation.sender = event.params.sender.toHex();
  userOperation.paymaster = event.params.paymaster.toHex();
  userOperation.nonce = event.params.nonce;
  userOperation.success = event.params.success;
  userOperation.actualGasCost = event.params.actualGasCost;
  userOperation.actualGasUsed = event.params.actualGasUsed;

  let user = User.load(event.params.sender.toHex());
  if (user === null) {
    user = new User(event.params.sender.toHex());
    user.timestamp = event.block.timestamp;
    user.txHash = event.transaction.hash.toHex();
    user.operations = [];
    user.operationsCount = ZERO_BD;
  }

  let operationsCount = user.operationsCount;
  if (operationsCount !== null) {
    user.operationsCount = operationsCount.plus(ONE_BD);
  }
  let oprt = user.operations;

  if (oprt !== null) {
    user.operations = oprt.concat([event.params.userOpHash.toHex()]);
  }

  user.save();
  userOperation.save();
}

export function handleUserOperationRevertReason(
  event: UserOperationRevertReason
): void {
  let userOperation = UserOperation.load(event.params.userOpHash.toHex());
  if (userOperation == null) {
    userOperation = new UserOperation(event.params.userOpHash.toHex());
    userOperation.timestamp = event.block.timestamp;
  }
  userOperation.txHash = event.transaction.hash.toHex();

  userOperation.sender = event.params.sender.toHex();
  userOperation.userOpHash = event.params.userOpHash.toHex();
  userOperation.nonce = event.params.nonce;
  userOperation.revertReason = event.params.revertReason.toString();
  // userOperation.actualGasCost = event.params.actualGasCost;
  // userOperation.actualGasUsed = event.params.actualGasUsed;

  let user = User.load(event.params.sender.toHex());
  if (user === null) {
    user = new User(event.params.sender.toHex());
    user.timestamp = event.block.timestamp;
    user.txHash = event.transaction.hash.toHex();
    user.operations = [];
    user.totalOpsReverted = ZERO_BD;
  }

  let totalOpsReverted = user.totalOpsReverted;
  if (totalOpsReverted !== null) {
    user.totalOpsReverted = totalOpsReverted.plus(ONE_BD);
  }

  let operations = user.operations;
  if (operations !== null) {
    user.operations = operations.concat([event.params.userOpHash.toHex()]);
  }

  user.save();
  userOperation.save();
}

export function handleWithdrawn(event: Withdrawn): void {
  let withdraw = Withdraw.load(event.transaction.hash.toHexString());
  if (withdraw === null) {
    withdraw = new Withdraw(event.transaction.hash.toHexString());
  }

  withdraw.account = event.params.account.toHex();
  withdraw.totalWithdraw = event.params.amount;
  withdraw.txHash = event.transaction.hash.toHexString();
  withdraw.timestamp = event.block.timestamp;
  withdraw.txFrom = event.transaction.from.toHex();
  withdraw.withdrawAddress = event.params.withdrawAddress.toHex();
  let user = User.load(event.params.account.toHex());
  if (user !== null) {
    let withdrawals = user.withdrawals;
    if (withdrawals === null) {
      user.withdrawals = [];
    }
    if (withdrawals !== null) {
      user.withdrawals = withdrawals.concat([
        event.transaction.hash.toHexString(),
      ]);
    }
    user.save();
  }
  let txTo = event.transaction.to;

  if (txTo !== null) {
    withdraw.txTo = txTo.toHex();
  }

  withdraw.save();
}
