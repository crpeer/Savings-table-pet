export const manualInputAdapter = {
  parse({ actionKey, amount, note }) {
    return {
      actionKey,
      amount: Number(amount),
      note: note || "",
    };
  },
};

export const ocrInputAdapter = {
  async extractFromImage(_file) {
    throw new Error("OCR 接口预留：请在 src/input.js 中接入识别服务");
  },

  parseText(text) {
    const amountMatch = text.match(/(\d+(?:\.\d+)?)/);
    return {
      rawText: text,
      amount: amountMatch ? Number(amountMatch[1]) : null,
    };
  },
};
