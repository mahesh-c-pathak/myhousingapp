// floorService.ts

// Function to generate floor-wise numbers based on the given format
export const generateFloorWiseNumbers = (
    totalFloors: string,
    unitsPerFloor: string,
    selectedFormat: number | null,
    numberFormats: Array<{ label: string, type: string }>
  ) => {
    const floors = parseInt(totalFloors);
    const units = parseInt(unitsPerFloor);
  
    if (isNaN(floors) || isNaN(units) || selectedFormat === null) {
      alert('Please enter valid numbers for floors, units, and select a format!');
      return null;
    }
  
    const formatType = numberFormats[selectedFormat].type;
    const result: Record<string, Record<string, any>> = {};
  
    const generateFlatObject = (flatNumber: string) => ({
      resident: 'owner',
      flatType: 'owner',
      bills: {
        bill1: { status: 'unpaid', amount: 0 },
        bill2: { status: 'unpaid', amount: 0 },
      },
    });
  
    if (formatType === 'floorUnit') {
      for (let floor = 1; floor <= floors; floor++) {
        result[`Floor ${floor}`] = {};
        for (let unit = 1; unit <= units; unit++) {
          const flatNumber = `${floor}0${unit}`;
          result[`Floor ${floor}`][flatNumber] = generateFlatObject(flatNumber);
        }
      }
    } else if (formatType === 'sequential') {
      let counter = 1;
      for (let floor = 1; floor <= floors; floor++) {
        result[`Floor ${floor}`] = {};
        for (let unit = 1; unit <= units; unit++) {
          const flatNumber = counter.toString();
          result[`Floor ${floor}`][flatNumber] = generateFlatObject(flatNumber);
          counter++;
        }
      }
    } else if (formatType === 'groundUnit') {
      for (let floor = 0; floor < floors; floor++) {
        const floorKey = `Floor ${floor === 0 ? 'G' : floor}`;
        result[floorKey] = {};
        for (let unit = 1; unit <= units; unit++) {
          const flatNumber = floor === 0 ? `G${unit}` : `${floor}0${unit}`;
          result[floorKey][flatNumber] = generateFlatObject(flatNumber);
        }
      }
    } else if (formatType === 'vertical') {
      for (let unit = 1; unit <= units; unit++) {
        for (let floor = 1; floor <= floors; floor++) {
          const floorKey = `Floor ${floor}`;
          if (!result[floorKey]) result[floorKey] = {};
          const flatNumber = `${floor}0${unit}`;
          result[floorKey][flatNumber] = generateFlatObject(flatNumber);
        }
      }
    }
  
    return result;
  };
  