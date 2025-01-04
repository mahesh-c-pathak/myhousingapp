// Utility function to get the month index
export const getMonthIndex = (monthName: string): number => {
    const monthMap: Record<string, number> = {
      January: 0,
      February: 1,
      March: 2,
      April: 3,
      May: 4,
      June: 5,
      July: 6,
      August: 7,
      September: 8,
      October: 9,
      November: 10,
      December: 11,
    };
  
    // Clean up the monthName to remove extra spaces
    const cleanedMonthName = monthName.trim();
  
    // Look up the month index
    const monthIndex = monthMap[cleanedMonthName];
    if (monthIndex === undefined) {
      throw new Error(`Invalid month name: "${monthName}". Please provide a valid English month name.`);
    }
  
    return monthIndex;
  };
  