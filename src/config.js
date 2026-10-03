export const appConfig = {
  currency: "CNY",
  backgroundImage: "assets/background-placeholder.png",
  petSkins: {
    default: {
      label: "默认角色",
      image: "assets/pet-default.png",
    },
  },
  actions: [
    {
      key: "food",
      label: "吃饭",
      defaultAmount: 15,
      image: "assets/action-food.png",
    },
    {
      key: "water",
      label: "喝水",
      defaultAmount: 5,
      image: "assets/action-water.png",
    },
    {
      key: "shopping",
      label: "消费",
      defaultAmount: 30,
      image: "assets/action-shopping.png",
    },
    {
      key: "pocketMoney",
      label: "给零花钱",
      defaultAmount: 20,
      image: "assets/action-pocket-money.png",
    },
  ],
};
