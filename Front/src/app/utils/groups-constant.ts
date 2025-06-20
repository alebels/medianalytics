import { IDEOLOGY_GROUP, MEDIA_GROUP, SENTIMENT_GROUP } from "./constants";
import { SelectGroupItem2, SelectGroupSimple } from "../models/primeng.model";

export const MEDIA_GROUPS: SelectGroupSimple[] = [
    new SelectGroupSimple(MEDIA_GROUP.MEDIA, 'newspaper'),
    new SelectGroupSimple(MEDIA_GROUP.ORGANIZATION, 'globe-americas'),
    new SelectGroupSimple(MEDIA_GROUP.GOVERNMENT, 'bank2'),
    new SelectGroupSimple(MEDIA_GROUP.COMPANY, 'buildings')
];

export const SENTIMENTS_GROUPS: SelectGroupItem2[] = [
    new SelectGroupItem2(SENTIMENT_GROUP.POSITIVES, 'emoji-smile', 'var(--color-positive)'),
    new SelectGroupItem2(SENTIMENT_GROUP.NEGATIVES, 'emoji-frown', 'var(--color-negative)'),
    new SelectGroupItem2(SENTIMENT_GROUP.NEUTRALS, 'emoji-neutral', 'var(--color-neutral)')
];

export const IDEOLOGIES_GROUPS: SelectGroupItem2[] = [
    new SelectGroupItem2(IDEOLOGY_GROUP.POLITICAL_SPECTRUM, 'journal-medical', 'var(--color-political-spectrum)'),
    new SelectGroupItem2(IDEOLOGY_GROUP.ECONOMIC_ORIENTATIONS, 'currency-exchange', 'var(--color-economic-orientations)'),
    new SelectGroupItem2(IDEOLOGY_GROUP.POLITICAL_SYSTEMS, 'bank', 'var(--color-political-systems)'),
    new SelectGroupItem2(IDEOLOGY_GROUP.NATIONAL_STANCES, 'person-vcard', 'var(--color-national-stances)'),
    new SelectGroupItem2(IDEOLOGY_GROUP.GEOPOLITICAL_ALIGNMENTS, 'globe2', 'var(--color-geopolitical-alignments)'),
    new SelectGroupItem2(IDEOLOGY_GROUP.RELIGIOUS_ORIENTATIONS, 'postage-heart', 'var(--color-religious-orientations)'),
    new SelectGroupItem2(IDEOLOGY_GROUP.SOCIAL_MOVEMENTS, 'people', 'var(--color-social-movements)'),
    new SelectGroupItem2(IDEOLOGY_GROUP.PHILOSOPHICAL_ORIENTATIONS, 'chat-text', 'var(--color-philosophical-orientations)'),
    new SelectGroupItem2(IDEOLOGY_GROUP.EPISTEMOLOGICAL_ORIENTATIONS, 'pencil', 'var(--color-epistemological-orientations)')
];