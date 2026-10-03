export const appConfig = {
  currency: "CNY",
  backgroundImage: "assets/background-placeholder.png",
  defaultMonthlyBudget: 2000,
  categories: ["饮食", "日常", "交通", "娱乐", "学习", "储蓄目标"],
  milestoneMeta: {
    firstRecord: "完成第一笔记录",
    balance500: "累计金额达到 ¥500",
    level3: "宠物达到 3 级",
    level5: "宠物达到 5 级",
    monthly10: "本月完成 10 笔记录",
  },
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
      defaultCategory: "饮食",
      defaultTags: ["日常", "饱腹"],
      image: "assets/action-food.png",
    },
    {
      key: "water",
      label: "喝水",
      defaultAmount: 5,
      defaultCategory: "饮食",
      defaultTags: ["日常", "补水"],
      image: "assets/action-water.png",
    },
    {
      key: "shopping",
      label: "消费",
      defaultAmount: 30,
      defaultCategory: "日常",
      defaultTags: ["消费"],
      image: "assets/action-shopping.png",
    },
    {
      key: "pocketMoney",
      label: "给零花钱",
      defaultAmount: 20,
      defaultCategory: "储蓄目标",
      defaultTags: ["奖励"],
      image: "assets/action-pocket-money.png",
    },
  ],
};
