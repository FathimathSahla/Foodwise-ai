function predictDemand({
  averageConsumption,
  expectedPeople,
  historicalPeople,
  isHoliday
}) {
  const safeAverage = Number(averageConsumption) || 0;
  const people = Number(expectedPeople) || 0;
  const historical = Number(historicalPeople) || 1;

  const peopleFactor = people / historical;

  let holidayFactor = isHoliday ? 1.10 : 1;

  const predictedDemand = Math.ceil(
    safeAverage * peopleFactor * holidayFactor
  );

  const recommendedPreparation = Math.ceil(predictedDemand * 1.05);

  const confidence = Math.min(
    98,
    Math.max(
      60,
      75 + Math.min(20, historical / 10)
    )
  );

  return {
    predictedDemand,
    recommendedPreparation,
    confidence: Number(confidence.toFixed(2))
  };
}

module.exports = { predictDemand };
