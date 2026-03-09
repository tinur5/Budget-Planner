// Allocation Engine - Core business logic for rule-based budget distribution
// This engine takes income and allocation rules and computes transfer suggestions

import { AllocationRule, Pot, Income } from "@prisma/client";

export interface AllocationInput {
  totalIncome: number;
  rules: (AllocationRule & { targetPot: Pot })[];
  userId?: string;
  incomeType?: string;
}

export interface AllocationResult {
  potId: string;
  potName: string;
  suggestedAmount: number;
  rationale: string;
  ruleName: string;
  ruleType: string;
}

export interface AllocationSummary {
  totalIncome: number;
  totalAllocated: number;
  remainder: number;
  allocations: AllocationResult[];
}

/**
 * Run the allocation engine for a given set of incomes and rules.
 * Rules are applied in priority order (lower number = higher priority).
 * Types:
 *   PERCENTAGE - x% of total income
 *   FIXED      - fixed amount in CHF
 *   THRESHOLD  - only if income >= threshold, then apply value (% or fixed)
 *   REMAINDER  - gets whatever is left
 */
export function runAllocationEngine(input: AllocationInput): AllocationSummary {
  const { totalIncome, rules } = input;

  // Filter active rules
  const activeRules = rules
    .filter((r) => r.isActive)
    .filter((r) => {
      // Filter by user if specified
      if (r.appliesToUserId && input.userId) {
        if (r.appliesToUserId !== input.userId) return false;
      }
      // Filter by income type if specified
      if (r.appliesToIncomeType && input.incomeType) {
        if (r.appliesToIncomeType !== input.incomeType) return false;
      }
      return true;
    })
    .sort((a, b) => a.priority - b.priority); // sort by priority

  const allocations: AllocationResult[] = [];
  let remaining = totalIncome;

  // First pass: PERCENTAGE and FIXED and THRESHOLD rules
  for (const rule of activeRules) {
    if (rule.type === "REMAINDER") continue; // skip remainder rules in first pass

    let amount = 0;

    if (rule.type === "PERCENTAGE") {
      amount = (totalIncome * rule.value) / 100;
    } else if (rule.type === "FIXED") {
      amount = rule.value;
    } else if (rule.type === "THRESHOLD") {
      // Only apply if income >= threshold
      if (rule.thresholdAmount && totalIncome < rule.thresholdAmount) {
        continue;
      }
      amount = (totalIncome * rule.value) / 100;
    }

    // Apply min/max constraints
    if (rule.minAmount !== null && rule.minAmount !== undefined) {
      amount = Math.max(amount, rule.minAmount);
    }
    if (rule.maxAmount !== null && rule.maxAmount !== undefined) {
      amount = Math.min(amount, rule.maxAmount);
    }

    // Don't exceed remaining
    amount = Math.min(amount, remaining);
    amount = Math.max(0, amount);

    if (amount > 0) {
      const rationale = buildRationale(rule, totalIncome, amount);
      allocations.push({
        potId: rule.targetPotId,
        potName: rule.targetPot.name,
        suggestedAmount: Math.round(amount * 100) / 100,
        rationale,
        ruleName: rule.name,
        ruleType: rule.type,
      });
      remaining -= amount;
    }
  }

  // Second pass: REMAINDER rules
  const remainderRules = activeRules.filter((r) => r.type === "REMAINDER");
  if (remainderRules.length > 0 && remaining > 0) {
    const rule = remainderRules[0]; // Take the first remainder rule
    allocations.push({
      potId: rule.targetPotId,
      potName: rule.targetPot.name,
      suggestedAmount: Math.round(remaining * 100) / 100,
      rationale: `Restbetrag von CHF ${formatCHF(remaining)} geht auf ${rule.targetPot.name}.`,
      ruleName: rule.name,
      ruleType: rule.type,
    });
    remaining = 0;
  }

  return {
    totalIncome,
    totalAllocated: totalIncome - remaining,
    remainder: Math.round(remaining * 100) / 100,
    allocations,
  };
}

function buildRationale(
  rule: AllocationRule & { targetPot: Pot },
  totalIncome: number,
  amount: number
): string {
  if (rule.type === "PERCENTAGE") {
    return `Von CHF ${formatCHF(totalIncome)} Einkommen werden ${rule.value}% (CHF ${formatCHF(amount)}) dem Konto "${rule.targetPot.name}" zugewiesen (Regel: "${rule.name}").`;
  }
  if (rule.type === "FIXED") {
    return `Fixbetrag CHF ${formatCHF(amount)} wird dem Konto "${rule.targetPot.name}" zugewiesen (Regel: "${rule.name}").`;
  }
  if (rule.type === "THRESHOLD") {
    return `Schwellenregel aktiv: Von CHF ${formatCHF(totalIncome)} Einkommen werden ${rule.value}% (CHF ${formatCHF(amount)}) dem Konto "${rule.targetPot.name}" zugewiesen (Regel: "${rule.name}").`;
  }
  return `CHF ${formatCHF(amount)} werden dem Konto "${rule.targetPot.name}" zugewiesen (Regel: "${rule.name}").`;
}

function formatCHF(amount: number): string {
  return new Intl.NumberFormat("de-CH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Calculate allocation from multiple income sources
export function runAllocationForIncomes(
  incomes: Income[],
  rules: (AllocationRule & { targetPot: Pot })[]
): AllocationSummary {
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
  return runAllocationEngine({
    totalIncome,
    rules,
  });
}
