export const NONE = 'none' as const;

export const SENTIMENTS = 'sentiments' as const;
export const SENTIMENT_GROUP = {
  POSITIVES: 'POSITIVES',
  NEGATIVES: 'NEGATIVES',
  NEUTRALS: 'NEUTRALS',
} as const;

export const IDEOLOGIES = 'ideologies' as const;
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
} as const;

export const MEDIAS = 'medias' as const;
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
} as const;

export const GITHUB_REPO = 'https://github.com/alebels/medianalytics' as const;
export const CONTACT_EMAIL = 'contact@medianalytics.org' as const;
export const X_ACCOUNT = 'https://x.com/medianalytics_' as const;

export const WORD = 'word' as const;
export const COUNT = 'count' as const;

export const DATE = 'date' as const;
export const FILTERS = {
  COUNTRIES: 'countries',
  REGIONS: 'regions',
  TYPES: 'types',
  MEDIA_GROUP: 'media_group',
} as const;
export const GRAMMAR = 'grammar' as const;

export const TO_API = {
  [MEDIAS]: 'media_id',
  [FILTERS.TYPES]: 'type',
  [FILTERS.COUNTRIES]: 'country',
  [FILTERS.REGIONS]: 'region',
  [DATE]: 'dates',
} as const;

export const NO_DATA = {
  NO_DATA: 'no_data',
  LOADING_HOME: 'loading_data_home',
  NO_DATA_FILTERS: 'no_data_filters',
} as const;

export const SORTING = {
  ASCENDING: 'asc',
  DESCENDING: 'desc',
  MAX_RANGE: 'max_range',
  MIN_RANGE: 'min_range',
  ORDER_BY_DESC: 'order_by_desc',
} as const;

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
    export: {
      scale: 1,
      width: undefined,
      csv: {
        filename: `medianalytics-chart_${
          new Date().toISOString().split('T')[0]
        }`,
        columnDelimiter: ',',
        headerCategory: 'Category',
        headerValue: 'Value',
        dateFormatter: (timestamp: number) =>
          new Date(timestamp).toLocaleDateString(),
      },
      svg: {
        filename: `medianalytics-chart_${
          new Date().toISOString().split('T')[0]
        }`,
      },
    },
  },
  zoom: {
    enabled: true,
    allowMouseWheelZoom: false,
  },
} as const;
