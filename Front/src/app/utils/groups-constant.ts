import { MEDIA_GROUP } from './constants';
import { SelectGroupSimple } from '../models/primeng.model';

export const MEDIA_GROUPS: SelectGroupSimple[] = [
  new SelectGroupSimple(MEDIA_GROUP.MEDIA.text, MEDIA_GROUP.MEDIA.icon),
  new SelectGroupSimple(
    MEDIA_GROUP.ORGANIZATION.text,
    MEDIA_GROUP.ORGANIZATION.icon,
  ),
  new SelectGroupSimple(
    MEDIA_GROUP.GOVERNMENT.text,
    MEDIA_GROUP.GOVERNMENT.icon,
  ),
  new SelectGroupSimple(MEDIA_GROUP.COMPANY.text, MEDIA_GROUP.COMPANY.icon),
] as const;
