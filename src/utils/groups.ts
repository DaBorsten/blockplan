export const resolveGroupIds = (g: number): number[] => {
  switch (g) {
    case 1:
      return [1, 2, 3];
    case 2:
      return [1, 2];
    case 3:
      return [1, 3];
    default:
      return [g];
  }
};
