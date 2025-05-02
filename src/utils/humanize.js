export const humanizeNotes = (notes, options = {}) => {
  const {
    timingVariation = 0.02, // Timing variation as a fraction of a beat
    velocityVariation = 0.1, // Velocity variation (0-1 scale)
    durationVariation = 0.05, // Duration variation as a fraction of note duration
  } = options;

  return notes.map(note => {
    const timeOffset = (Math.random() * 2 - 1) * timingVariation;
    const velocityOffset = (Math.random() * 2 - 1) * velocityVariation;
    const durationOffset = (Math.random() * 2 - 1) * durationVariation;

    return {
      ...note,
      startTime: Math.max(0, note.startTime + timeOffset),
      velocity: Math.min(1, Math.max(0.1, note.velocity + velocityOffset)),
      duration: Math.max(0.1, note.duration * (1 + durationOffset)),
    };
  });
};

export const applyArticulation = (notes, articulationType) => {
  const articulationTypes = {
    legato: { durationMultiplier: 1.0, velocityMultiplier: 0.9 },
    staccato: { durationMultiplier: 0.5, velocityMultiplier: 1.1 },
    marcato: { durationMultiplier: 0.8, velocityMultiplier: 1.2 },
    tenuto: { durationMultiplier: 1.0, velocityMultiplier: 1.0 },
  };

  const { durationMultiplier, velocityMultiplier } =
    articulationTypes[articulationType] || articulationTypes.legato;

  return notes.map(note => ({
    ...note,
    duration: note.duration * durationMultiplier,
    velocity: Math.min(1, note.velocity * velocityMultiplier),
  }));
};

export const applyDynamics = (notes, dynamicType) => {
  const dynamicTypes = {
    crescendo: (i, total) => 0.7 + (i / total) * 0.3,
    diminuendo: (i, total) => 1.0 - (i / total) * 0.3,
    swell: (i, total) => 0.7 + Math.sin((i / total) * Math.PI) * 0.3,
    fade: (i, total) => 1.0 - Math.pow(i / total, 2) * 0.5,
    accent: i => (i % 4 === 0 ? 1.0 : 0.8),
  };

  const dynamicFn = dynamicTypes[dynamicType] || (() => 1.0);

  return notes.map((note, i, arr) => ({
    ...note,
    velocity: note.velocity * dynamicFn(i, arr.length),
  }));
};

export const generateExpressionEvents = (notes, expressionType) => {
  if (!notes || notes.length === 0) return [];

  const events = [];
  const totalDuration = notes.reduce(
    (max, note) => Math.max(max, note.startTime + note.duration),
    0
  );

  if (expressionType === 'volume-swell' || expressionType === 'all') {
    const volumePoints = [
      { time: 0, value: 100 },
      { time: totalDuration / 3, value: 80 },
      { time: (totalDuration * 2) / 3, value: 110 },
      { time: totalDuration, value: 90 },
    ];

    volumePoints.forEach(point => {
      events.push({
        type: 'controller',
        controllerNumber: 7, // Volume
        value: point.value,
        time: point.time,
      });
    });
  }

  if (expressionType === 'expression-fade' || expressionType === 'all') {
    const expressionPoints = [
      { time: 0, value: 100 },
      { time: totalDuration / 2, value: 70 },
      { time: totalDuration, value: 110 },
    ];

    expressionPoints.forEach(point => {
      events.push({
        type: 'controller',
        controllerNumber: 11, // Expression
        value: point.value,
        time: point.time,
      });
    });
  }

  if (expressionType === 'modulation' || expressionType === 'all') {
    notes.forEach(note => {
      if (note.duration >= 2) {
        events.push({
          type: 'controller',
          controllerNumber: 1, // Modulation
          value: 50 + Math.floor(Math.random() * 30),
          time: note.startTime,
        });
      }
    });
  }

  return events;
};
