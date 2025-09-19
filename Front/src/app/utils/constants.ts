export const NONE = 'none';

export const SENTIMENTS = 'sentiments';
export const SENTIMENT_GROUP = {
  POSITIVES: 'POSITIVES',
  NEGATIVES: 'NEGATIVES',
  NEUTRALS: 'NEUTRALS',
};

export const IDEOLOGIES = 'ideologies';
export const IDEOLOGY_GROUP = {
  POLITICAL_SPECTRUM: 'POLITICAL_SPECTRUM',
  ECONOMIC_ORIENTATIONS: 'ECONOMIC_ORIENTATIONS',
  POLITICAL_SYSTEMS: 'POLITICAL_SYSTEMS',
  NATIONAL_STANCES: 'NATIONAL_STANCES',
  GEOPOLITICAL_ALIGNMENTS: 'GEOPOLITICAL_ALIGNMENTS',
  RELIGIOUS_ORIENTATIONS: 'RELIGIOUS_ORIENTATIONS',
  SOCIAL_MOVEMENTS: 'SOCIAL_MOVEMENTS',
  PHILOSOPHICAL_ORIENTATIONS: 'PHILOSOPHICAL_ORIENTATIONS',
  EPISTEMOLOGICAL_ORIENTATIONS: 'EPISTEMOLOGICAL_ORIENTATIONS',
};

export const MEDIAS = 'medias';
export const MEDIA_GROUP = {
  MEDIA: {
    text: 'MEDIA',
    icon: 'newspaper',
  },
  ORGANIZATION: {
    text: 'ORGANIZATION',
    icon: 'globe-americas',
  },
  GOVERNMENT: {
    text: 'GOVERNMENT',
    icon: 'bank2',
  },
  COMPANY: {
    text: 'COMPANY',
    icon: 'buildings',
  },
};

export const GITHUB_REPO = 'https://github.com/alebels/medianalytics';
export const CONTACT_EMAIL = 'contact@medianalytics.org';
export const X_ACCOUNT = 'https://x.com/medianalytics_';

export const WORD = 'word';
export const COUNT = 'count';

export const DATE = 'date';
export const FILTERS = {
  COUNTRIES: 'countries',
  REGIONS: 'regions',
  TYPES: 'types',
  MEDIA_GROUP: 'media_group',
};
export const GRAMMAR = 'grammar';

export const TO_API = {
  [MEDIAS]: 'media_id',
  [FILTERS.TYPES]: 'type',
  [FILTERS.COUNTRIES]: 'country',
  [FILTERS.REGIONS]: 'region',
  [DATE]: 'dates',
};

export const NO_DATA = {
  NO_DATA: 'no_data',
  LOADING_HOME: 'loading_data_home',
  NO_DATA_FILTERS: 'no_data_filters',
};

export const SORTING = {
  ASCENDING: 'asc',
  DESCENDING: 'desc',
  MAX_RANGE: 'max_range',
  MIN_RANGE: 'min_range',
  ORDER_BY_DESC: 'order_by_desc',
};

export const CHART_COLORS = ['var(--color-accent)'];

export const CHART_THEME = {
  fontFamily: 'SourceSans3',
  background: 'var(--color-miscellany)',
  foreColor: 'var(--color-text)',
  toolbar: {
    show: true,
    tools: {
      download: true,
      selection: true,
      zoom: true,
      zoomin: true,
      zoomout: true,
      pan: true,
      reset: true,
    },
  },
  export: {
    scale: undefined,
    width: undefined,
    csv: {
      filename: undefined,
      columnDelimiter: ',',
    },
    svg: {
      filename: undefined,
    },
  },
  zoom: {
    enabled: true,
    allowMouseWheelZoom: false,
  },
};
