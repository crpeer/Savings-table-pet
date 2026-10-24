export const appConfig = {
  currency: "CNY",
  backgroundImage: "assets/background-placeholder.png",
  defaultMonthlyBudget: 2000,
  categories: ["饮食", "日常", "交通", "娱乐", "学习", "储蓄目标"],
  milestoneMeta: {
    firstRecord: "完成第一笔记录",
    balance500: "累计金额达到 ¥500",
    goalCompleted: "完成储蓄目标",
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
      key: "saveMeal",
      label: "今天没点外卖",
      defaultAmount: 20,
      defaultCategory: "储蓄目标",
      defaultTags: ["省钱", "饮食"],
      image: "assets/action-food.png",
    },
    {
      key: "saveDrink",
      label: "今天没买奶茶",
      defaultAmount: 15,
      defaultCategory: "储蓄目标",
      defaultTags: ["省钱", "饮品"],
      image: "assets/action-water.png",
    },
    {
      key: "saveShopping",
      label: "今天没买游戏",
      defaultAmount: 50,
      defaultCategory: "储蓄目标",
      defaultTags: ["省钱", "娱乐"],
      image: "assets/action-shopping.png",
    },
    {
      key: "saveEntertainment",
      label: "今天主动存款",
      defaultAmount: 100,
      defaultCategory: "储蓄目标",
      defaultTags: ["主动储蓄", "目标"],
      image: "assets/action-pocket-money.png",
    },
  ],
};
