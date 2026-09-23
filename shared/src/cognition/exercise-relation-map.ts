import { RelationId } from './relations';
import { ExerciseSlug } from '../types';

export interface IExerciseRelationMapping {
  slug: ExerciseSlug;
  primaryRelation: RelationId;
  secondaryRelations: RelationId[];
  levelAffinity: Record<number, RelationId[]>; // Extra relations active at specific levels
}

export const EXERCISE_RELATION_MAP: Record<ExerciseSlug, IExerciseRelationMapping> = {
  'schulte-table': {
    slug: 'schulte-table',
    primaryRelation: 'TARGET_POSITION',
    secondaryRelations: ['ORDER_SEQUENCE', 'FOCUS_FIELD', 'INHIBITION'],
    levelAffinity: {
      1: ['TARGET_POSITION'],
      2: ['TARGET_POSITION'],
      3: ['ORDER_SEQUENCE'],
      4: ['ORDER_SEQUENCE'],
      5: ['FOCUS_FIELD'],
      8: ['ORDER_SEQUENCE', 'INHIBITION'],
      9: ['INHIBITION'],
      10: ['SPATIAL_TRANSFORM'],
      11: ['TARGET_POSITION', 'SPATIAL_TRANSFORM'],
      12: ['FOCUS_FIELD', 'SPATIAL_TRANSFORM']
    }
  },
  'digit-span': {
    slug: 'digit-span',
    primaryRelation: 'ORDER_SEQUENCE',
    secondaryRelations: ['TEMPORAL_PREDICT', 'IDENTITY_MATCH'],
    levelAffinity: {
      8: ['ORDER_SEQUENCE', 'INHIBITION'],
      9: ['ORDER_SEQUENCE', 'INHIBITION'],
      10: ['ORDER_SEQUENCE', 'SPATIAL_TRANSFORM']
    }
  },
  'spatial-memory': {
    slug: 'spatial-memory',
    primaryRelation: 'TARGET_POSITION',
    secondaryRelations: ['ORDER_SEQUENCE', 'SPATIAL_TRANSFORM'],
    levelAffinity: {
      6: ['SPATIAL_TRANSFORM'],
      9: ['SPATIAL_TRANSFORM', 'INHIBITION']
    }
  },
  'find-letter': {
    slug: 'find-letter',
    primaryRelation: 'TARGET_DISTRACTOR',
    secondaryRelations: ['SIMILARITY_DIFF', 'FOCUS_FIELD'],
    levelAffinity: {
      5: ['SIMILARITY_DIFF'],
      8: ['FOCUS_FIELD']
    }
  },
  'find-number': {
    slug: 'find-number',
    primaryRelation: 'TARGET_DISTRACTOR',
    secondaryRelations: ['ORDER_SEQUENCE', 'RULE_ACTION'],
    levelAffinity: {
      10: ['RULE_ACTION'],
      11: ['ORDER_SEQUENCE', 'RULE_ACTION']
    }
  },
  'stroop-clash': {
    slug: 'stroop-clash',
    primaryRelation: 'INHIBITION',
    secondaryRelations: ['RULE_ACTION', 'IDENTITY_MATCH'],
    levelAffinity: {
      1: ['INHIBITION'],
      6: ['INHIBITION', 'RULE_ACTION'],
      10: ['INHIBITION', 'SIMILARITY_DIFF']
    }
  },
  'even-odd': {
    slug: 'even-odd',
    primaryRelation: 'RULE_ACTION',
    secondaryRelations: ['INHIBITION'],
    levelAffinity: {
      4: ['INHIBITION'],
      9: ['RULE_ACTION', 'SIMILARITY_DIFF'],
      10: ['RULE_ACTION'],
      11: ['INHIBITION']
    }
  },
  'rsvp-speed-reader': {
    slug: 'rsvp-speed-reader',
    primaryRelation: 'TEMPORAL_PREDICT',
    secondaryRelations: ['PART_WHOLE', 'CONTEXT_MEANING'],
    levelAffinity: {
      6: ['PART_WHOLE'],
      9: ['CONTEXT_MEANING']
    }
  },
  'reading-assessment': {
    slug: 'reading-assessment',
    primaryRelation: 'CONTEXT_MEANING',
    secondaryRelations: ['TEMPORAL_PREDICT', 'ORDER_SEQUENCE'],
    levelAffinity: {
      1: ['CONTEXT_MEANING'],
      6: ['CONTEXT_MEANING', 'ORDER_SEQUENCE']
    }
  },
  'reading-pacer': {
    slug: 'reading-pacer',
    primaryRelation: 'TEMPORAL_PREDICT',
    secondaryRelations: ['FOCUS_FIELD'],
    levelAffinity: {
      4: ['FOCUS_FIELD']
    }
  },
  'word-chunking': {
    slug: 'word-chunking',
    primaryRelation: 'PART_WHOLE',
    secondaryRelations: ['CONTEXT_MEANING'],
    levelAffinity: {
      5: ['CONTEXT_MEANING']
    }
  },
  'word-search': {
    slug: 'word-search',
    primaryRelation: 'PART_WHOLE',
    secondaryRelations: ['TARGET_POSITION', 'SIMILARITY_DIFF'],
    levelAffinity: {
      4: ['SPATIAL_TRANSFORM']
    }
  },
  'text-scanning': {
    slug: 'text-scanning',
    primaryRelation: 'TARGET_DISTRACTOR',
    secondaryRelations: ['CONTEXT_MEANING'],
    levelAffinity: {
      5: ['CONTEXT_MEANING']
    }
  },
  'twin-words': {
    slug: 'twin-words',
    primaryRelation: 'IDENTITY_MATCH',
    secondaryRelations: ['SIMILARITY_DIFF'],
    levelAffinity: {
      4: ['SIMILARITY_DIFF']
    }
  },
  'anagram': {
    slug: 'anagram',
    primaryRelation: 'PART_WHOLE',
    secondaryRelations: ['ORDER_SEQUENCE', 'SIMILARITY_DIFF'],
    levelAffinity: {
      6: ['ORDER_SEQUENCE']
    }
  },
  'green-dot': {
    slug: 'green-dot',
    primaryRelation: 'FOCUS_FIELD',
    secondaryRelations: ['TARGET_DISTRACTOR'],
    levelAffinity: {
      1: ['FOCUS_FIELD']
    }
  },
  'peripheral-vision': {
    slug: 'peripheral-vision',
    primaryRelation: 'FOCUS_FIELD',
    secondaryRelations: ['TARGET_POSITION'],
    levelAffinity: {
      4: ['TARGET_POSITION']
    }
  },
  'saccade-tracker': {
    slug: 'saccade-tracker',
    primaryRelation: 'FOCUS_FIELD',
    secondaryRelations: ['ORDER_SEQUENCE', 'RULE_ACTION'],
    levelAffinity: {
      6: ['RULE_ACTION']
    }
  },
  'card-flip': {
    slug: 'card-flip',
    primaryRelation: 'IDENTITY_MATCH',
    secondaryRelations: ['SPATIAL_TRANSFORM', 'TARGET_POSITION'],
    levelAffinity: {
      4: ['TARGET_POSITION', 'SPATIAL_TRANSFORM']
    }
  }
};

export function getRelationsForExercise(slug: ExerciseSlug, level: number): RelationId[] {
  const map = EXERCISE_RELATION_MAP[slug];
  if (!map) return ['TARGET_POSITION'];

  const set = new Set<RelationId>();
  set.add(map.primaryRelation);

  const levelRelations = map.levelAffinity[level];
  if (levelRelations && levelRelations.length > 0) {
    levelRelations.forEach(r => set.add(r));
  } else if (map.secondaryRelations.length > 0) {
    set.add(map.secondaryRelations[0]);
  }

  return Array.from(set);
}
