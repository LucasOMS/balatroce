import { BotRequest, BotRequestName } from "../bot-request";

type ShopActionWithIndex = {
  action: "buy_card" | "buy_and_use_card" | "redeem_voucher";
  index: number;
};

type SimpleShopAction = {
  action: "next_round" | "reroll";
};

export interface ShopAction extends BotRequest {
  name: BotRequestName.SHOP;
  arguments: SimpleShopAction | ShopActionWithIndex;
}
