import { UserOperationStruct } from "@account-abstraction/contracts";

export interface StoredOp {
  op: UserOperationStruct;
  amount: string;
  chainId: number;
  receivingToken: string;
}
