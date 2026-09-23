"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMA_ALPHA = exports.MIN_CONFIDENT_EXPOSURE = void 0;
exports.createInitialMastery = createInitialMastery;
exports.createInitialMasteriesMap = createInitialMasteriesMap;
exports.updateMasteryFromEvents = updateMasteryFromEvents;
const relations_1 = require("./relations");
exports.MIN_CONFIDENT_EXPOSURE = 40;
exports.EMA_ALPHA = 0.08;
function createInitialMastery(relationId) {
    return {
        relationId,
        exposureCount: 0,
        accuracy: 0.5,
        medianResponseMs: 600,
        stability: 0.5,
        localContexts: [],
        transferScore: 0,
        interferenceScore: 0,
        currentTier: 1,
        updatedAt: new Date().toISOString()
    };
}
function createInitialMasteriesMap() {
    const map = {};
    for (const id of relations_1.ALL_RELATION_IDS) {
        map[id] = createInitialMastery(id);
    }
    return map;
}
function updateMasteryFromEvents(current, events) {
    const relevantEvents = events.filter(e => e.relationId === current.relationId);
    if (relevantEvents.length === 0)
        return current;
    let acc = current.accuracy;
    let exposure = current.exposureCount;
    const contexts = new Set(current.localContexts);
    const responseTimes = [];
    for (const ev of relevantEvents) {
        exposure += 1;
        const trialVal = ev.correct ? 1.0 : 0.0;
        acc = exports.EMA_ALPHA * trialVal + (1 - exports.EMA_ALPHA) * acc;
        contexts.add(ev.exerciseSlug);
        if (ev.responseMs && ev.responseMs > 50 && ev.responseMs < 10000) {
            responseTimes.push(ev.responseMs);
        }
    }
    // Calculate median response time
    let medianMs = current.medianResponseMs;
    if (responseTimes.length > 0) {
        responseTimes.sort((a, b) => a - b);
        const mid = Math.floor(responseTimes.length / 2);
        const batchMedian = responseTimes.length % 2 !== 0
            ? responseTimes[mid]
            : (responseTimes[mid - 1] + responseTimes[mid]) / 2;
        medianMs = Math.round(0.2 * batchMedian + 0.8 * current.medianResponseMs);
    }
    // Stability heuristic: high if accuracy is near extreme (high accuracy consistently)
    const stability = Math.min(1.0, Math.max(0.1, 1 - Math.abs(0.85 - acc) * 0.5));
    // Tier determination:
    // Tier 1: exposure < 40
    // Tier 2: exposure >= 40 && acc >= 0.70
    // Tier 3: exposure >= 80 && acc >= 0.85 && contexts >= 2
    // Tier 4: exposure >= 120 && acc >= 0.90 && contexts >= 3 && stability >= 0.80
    let currentTier = 1;
    if (exposure >= 120 && acc >= 0.90 && contexts.size >= 3 && stability >= 0.80) {
        currentTier = 4;
    }
    else if (exposure >= 80 && acc >= 0.85 && contexts.size >= 2) {
        currentTier = 3;
    }
    else if (exposure >= 40 && acc >= 0.70) {
        currentTier = 2;
    }
    // Transfer score based on cross-game exposure and accuracy
    const transferScore = contexts.size > 1 ? Math.min(1.0, (acc * (contexts.size - 1)) / 3) : 0;
    return {
        ...current,
        exposureCount: exposure,
        accuracy: Math.round(acc * 1000) / 1000,
        medianResponseMs: medianMs,
        stability: Math.round(stability * 1000) / 1000,
        localContexts: Array.from(contexts),
        transferScore: Math.round(transferScore * 1000) / 1000,
        currentTier,
        updatedAt: new Date().toISOString()
    };
}
