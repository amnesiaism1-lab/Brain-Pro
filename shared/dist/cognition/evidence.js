"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_RELATION_EVENTS_PER_ATTEMPT = void 0;
exports.validateRelationEvent = validateRelationEvent;
exports.validateRawMetricsJson = validateRawMetricsJson;
const relations_1 = require("./relations");
exports.MAX_RELATION_EVENTS_PER_ATTEMPT = 500;
function validateRelationEvent(event) {
    if (!event || typeof event !== 'object')
        return false;
    const e = event;
    if (typeof e.t !== 'number' || e.t < 0)
        return false;
    if (typeof e.exerciseSlug !== 'string')
        return false;
    if (typeof e.level !== 'number' || e.level < 1)
        return false;
    if (typeof e.trialId !== 'string')
        return false;
    if (!relations_1.ALL_RELATION_IDS.includes(e.relationId))
        return false;
    if (typeof e.relationWeight !== 'number' || e.relationWeight < 0 || e.relationWeight > 1)
        return false;
    if (!e.entities || typeof e.entities !== 'object')
        return false;
    if (typeof e.stateBefore !== 'string' || typeof e.stateAfter !== 'string')
        return false;
    if (typeof e.correct !== 'boolean')
        return false;
    return true;
}
function validateRawMetricsJson(raw) {
    if (!raw || typeof raw !== 'object') {
        return { valid: false, error: 'rawMetricsJson must be an object' };
    }
    const r = raw;
    if (r.schemaVersion !== 'v1') {
        return { valid: false, error: 'rawMetricsJson schemaVersion must be v1' };
    }
    if (!Array.isArray(r.relationEvents)) {
        return { valid: false, error: 'relationEvents must be an array' };
    }
    if (r.relationEvents.length > exports.MAX_RELATION_EVENTS_PER_ATTEMPT) {
        return {
            valid: false,
            error: `relationEvents count (${r.relationEvents.length}) exceeds maximum allowable limit (${exports.MAX_RELATION_EVENTS_PER_ATTEMPT})`
        };
    }
    for (let i = 0; i < r.relationEvents.length; i++) {
        if (!validateRelationEvent(r.relationEvents[i])) {
            return { valid: false, error: `Invalid relation event structure at index ${i}` };
        }
    }
    return { valid: true };
}
