"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkLineIntersection = checkLineIntersection;
exports.isConnectionBlockedByWall = isConnectionBlockedByWall;
exports.applyAction = applyAction;
exports.stepSimulationDynamics = stepSimulationDynamics;
function checkLineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
    const ccw = (ax, ay, bx, by, cx, cy) => {
        return (cy - ay) * (bx - ax) > (by - ay) * (cx - ax);
    };
    return (ccw(x1, y1, x3, y3, x4, y4) !== ccw(x2, y2, x3, y3, x4, y4) &&
        ccw(x1, y1, x2, y2, x3, y3) !== ccw(x1, y1, x2, y2, x4, y4));
}
function isConnectionBlockedByWall(source, target, obstacles) {
    for (const wall of obstacles) {
        if (checkLineIntersection(source.position.x, source.position.y, target.position.x, target.position.y, wall.x1, wall.y1, wall.x2, wall.y2)) {
            return true;
        }
    }
    return false;
}
function applyAction(currentState, action) {
    const nextEntities = currentState.entities.map(e => ({
        ...e,
        state: { ...e.state }
    }));
    let nextRelations = currentState.relations.map(r => ({
        ...r,
        properties: { ...r.properties }
    }));
    let effectDescriptionVi = '';
    switch (action.actionType) {
        case 'CUT': {
            const relIndex = nextRelations.findIndex(r => r.id === action.relationId);
            if (relIndex === -1) {
                return { nextState: currentState, effectDescriptionVi: 'Không tìm thấy liên kết cần cắt.' };
            }
            const rel = nextRelations[relIndex];
            const source = nextEntities.find(e => e.id === rel.sourceId);
            const target = nextEntities.find(e => e.id === rel.targetId);
            const cutRatio = action.parameters.cutRatio ?? 0.5;
            nextRelations.splice(relIndex, 1);
            if (source)
                source.state.activeConnectionsCount = Math.max(0, source.state.activeConnectionsCount - 1);
            if (cutRatio < 0.35) {
                if (source) {
                    const healAmount = Math.round(source.state.maxValue * 0.3);
                    source.state.value = Math.min(source.state.maxValue, source.state.value + healAmount);
                    effectDescriptionVi = `Cắt sát gốc: Hồi phục +${healAmount} HP cho ${source.label}.`;
                }
            }
            else if (cutRatio > 0.65) {
                if (target) {
                    const damage = Math.round(target.state.maxValue * 0.35);
                    target.state.value = Math.max(0, target.state.value - damage);
                    effectDescriptionVi = `Cắt thọc sâu: Gây -${damage} HP sát thương sốc lên ${target.label}.`;
                    if (target.state.value === 0 && target.faction === 'ADVERSARY') {
                        target.faction = 'NEUTRAL';
                        target.state.value = 10;
                        effectDescriptionVi += ` ${target.label} đã bị vô hiệu hóa sang trạng thái Trung Lập!`;
                    }
                }
            }
            else {
                effectDescriptionVi = 'Cắt cân bằng: Ngắt liên kết thành công.';
            }
            break;
        }
        case 'CONNECT': {
            if (!action.sourceEntityId || !action.targetEntityId) {
                return { nextState: currentState, effectDescriptionVi: 'Thiếu điểm nguồn hoặc đích.' };
            }
            const source = nextEntities.find(e => e.id === action.sourceEntityId);
            const target = nextEntities.find(e => e.id === action.targetEntityId);
            if (!source || !target) {
                return { nextState: currentState, effectDescriptionVi: 'Thực thể không tồn tại.' };
            }
            if (source.state.activeConnectionsCount >= source.state.capacity) {
                return { nextState: currentState, effectDescriptionVi: `${source.label} đã đạt giới hạn xúc tu tối đa (${source.state.capacity}).` };
            }
            if (isConnectionBlockedByWall(source, target, currentState.obstacles)) {
                return { nextState: currentState, effectDescriptionVi: 'Đường kết nối bị chặn bởi chướng ngại vật!' };
            }
            const exists = nextRelations.some(r => (r.sourceId === source.id && r.targetId === target.id) ||
                (r.sourceId === target.id && r.targetId === source.id));
            if (exists) {
                return { nextState: currentState, effectDescriptionVi: 'Hai thực thể đã có liên kết từ trước.' };
            }
            let relationType = 'FLOW_CONNECT';
            if (source.faction === target.faction) {
                relationType = 'HEAL_BUFF';
            }
            else if (source.faction !== 'NEUTRAL' && target.faction !== 'NEUTRAL') {
                relationType = 'ATTACK_DRAIN';
            }
            const dx = target.position.x - source.position.x;
            const dy = target.position.y - source.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const newRelation = {
                id: `rel-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                sourceId: source.id,
                targetId: target.id,
                type: relationType,
                properties: {
                    strength: 4.0,
                    distance: dist,
                    direction: 'DIRECTED',
                    isActive: true,
                    cuttable: true,
                    cutAffinity: 'BALANCED',
                    flowSpeed: 1.5
                }
            };
            nextRelations.push(newRelation);
            source.state.activeConnectionsCount += 1;
            effectDescriptionVi = `Kết nối thành công giữa ${source.label} và ${target.label}.`;
            break;
        }
        case 'FREEZE': {
            const target = nextEntities.find(e => e.id === action.targetEntityId);
            if (target) {
                target.state.status = 'FROZEN';
                effectDescriptionVi = `Đóng băng thành công ${target.label} trong 5 giây!`;
            }
            break;
        }
        case 'BOOST_CORE': {
            const core = nextEntities.find(e => e.type === 'CORE' && e.faction === 'PLAYER');
            if (core) {
                core.state.value = Math.min(core.state.maxValue, core.state.value + 50);
                const connectedRel = nextRelations.filter(r => r.sourceId === core.id || r.targetId === core.id);
                for (const rel of connectedRel) {
                    const otherId = rel.sourceId === core.id ? rel.targetId : rel.sourceId;
                    const node = nextEntities.find(n => n.id === otherId);
                    if (node && node.faction === 'PLAYER') {
                        node.state.value = Math.min(node.state.maxValue, node.state.value + 20);
                    }
                }
                effectDescriptionVi = `Kích hoạt Nút Lõi (Core)! Toàn bộ hệ thống liên kết được gia tăng năng lượng.`;
            }
            break;
        }
        default:
            effectDescriptionVi = 'Hành động không xác định.';
    }
    return {
        nextState: {
            ...currentState,
            entities: nextEntities,
            relations: nextRelations,
            stepCount: currentState.stepCount + 1
        },
        effectDescriptionVi
    };
}
function stepSimulationDynamics(state, dtSec) {
    const nextEntities = state.entities.map(e => ({
        ...e,
        state: { ...e.state }
    }));
    for (const rel of state.relations) {
        if (!rel.properties.isActive)
            continue;
        const source = nextEntities.find(e => e.id === rel.sourceId);
        const target = nextEntities.find(e => e.id === rel.targetId);
        if (!source || !target)
            continue;
        if (source.state.status === 'FROZEN')
            continue;
        const rate = rel.properties.strength * dtSec;
        let modifier = 1.0;
        if (source.state.role === 'ATTACKER' && rel.type === 'ATTACK_DRAIN')
            modifier = 2.0;
        if (source.state.role === 'HEALER' && rel.type === 'HEAL_BUFF')
            modifier = 2.0;
        if (target.state.role === 'DEFENDER')
            modifier *= 0.5;
        const transferAmount = rate * modifier;
        if (rel.type === 'HEAL_BUFF' || (source.faction === target.faction)) {
            target.state.value = Math.min(target.state.maxValue, target.state.value + transferAmount);
        }
        else if (rel.type === 'ATTACK_DRAIN' || (source.faction !== target.faction)) {
            target.state.value = Math.max(0, target.state.value - transferAmount);
            if (target.state.value <= 0) {
                target.faction = source.faction;
                target.state.value = 15;
                target.state.status = 'ACTIVE';
                if (target.type === 'CORE') {
                    for (const subRel of state.relations) {
                        if (subRel.sourceId === target.id || subRel.targetId === target.id) {
                            const otherId = subRel.sourceId === target.id ? subRel.targetId : subRel.sourceId;
                            const subNode = nextEntities.find(n => n.id === otherId);
                            if (subNode && subNode.faction !== source.faction) {
                                subNode.faction = source.faction;
                                subNode.state.value = Math.max(10, subNode.state.value);
                            }
                        }
                    }
                }
            }
        }
    }
    return {
        ...state,
        entities: nextEntities,
        stepCount: state.stepCount + 1
    };
}
//# sourceMappingURL=transition-solver.js.map