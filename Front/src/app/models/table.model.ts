import { ItemRead } from './items.model';

export class DataCountTable {
  constructor(
    public readonly data: ItemRead[] = [],
    public readonly label1 = '',
    public readonly label2 = '',
    public readonly sortOrder = 1
  ) {}
}

export class GeneralMediaRead {
  constructor(
    public readonly name = '',
    public readonly full_name = '',
    public readonly type = '',
    public readonly country = '',
    public readonly region = '',
    public readonly url = '',
    public readonly total_articles = 0,
    public readonly average_words_article = 0,
    public readonly top_words: ItemRead[] = [],
    public readonly top_sentiments: ItemRead[] = [],
    public readonly bottom_sentiments: ItemRead[] = [],
    public readonly top_ideologies: ItemRead[] = [],
    public readonly bottom_ideologies: ItemRead[] = []
  ) {}
}

export class GeneralMediaTable {
  constructor(
    public readonly data: GeneralMediaRead[] = [],
    public readonly labelName = '',
    public readonly labelType = '',
    public readonly labelCountry = '',
    public readonly labelRegion = '',
    public readonly labelUrl = '',
    public readonly labelTotalArticles = '',
    public readonly labelAverageWordsArticle = '',
    public readonly labelTopWords = '',
    public readonly labelTopSentiments = '',
    public readonly labelBottomSentiments = '',
    public readonly labelTopIdeologies = '',
    public readonly labelBottomIdeologies = '',
    public readonly labelTopGrammar = ''
  ) {}
}
