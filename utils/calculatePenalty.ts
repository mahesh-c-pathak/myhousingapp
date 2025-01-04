// utils/calculatePenalty.ts
export const calculatePenalty = (dueDate: Date, totalAmount: number): number => {
    const today = new Date();
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const penaltyRate = 0.0006; // 2% per day
  
    return diffDays > 0 ? diffDays * penaltyRate * totalAmount : 0;
  };
  