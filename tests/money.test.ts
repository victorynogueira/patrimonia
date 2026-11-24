import { describe, expect, it } from "vitest";
import { formatMoney, parseMoneyInput, variationPercent } from "@/lib/money";

describe("parseMoneyInput", () => {
  it("converte decimais brasileiros para centavos", () => {
    expect(parseMoneyInput("1234,56")).toBe(123456);
    expect(parseMoneyInput("1.234,56")).toBe(123456);
    expect(parseMoneyInput("1.234.567,89")).toBe(123456789);
  });

  it("aceita números e remove formatação", () => {
    expect(parseMoneyInput(10.5)).toBe(1050);
    expect(parseMoneyInput("R$ 89,90")).toBe(8990);
  });

  it("preserva sinal negativo e retorna 0 para entrada vazia", () => {
    expect(parseMoneyInput("-42,50")).toBe(-4250);
    expect(parseMoneyInput("   ")).toBe(0);
  });
});

describe("formatMoney", () => {
  it("formata centavos em BRL", () => {
    expect(formatMoney(123456)).toContain("1.234,56");
  });
});

describe("variationPercent", () => {
  it("calcula variação e trata base zero", () => {
    expect(variationPercent(110, 100)).toBe(10);
    expect(variationPercent(5, 0)).toBe(100);
  });
});
