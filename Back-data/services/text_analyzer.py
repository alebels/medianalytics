"""
Module for text analysis using SpaCy and asyncio.
"""

import asyncio
from collections import Counter, defaultdict
import spacy
from spacy.tokenizer import Tokenizer
from spacy.util import compile_infix_regex
from spacy.lang.char_classes import LIST_ELLIPSES, LIST_ICONS
from utils.utils import clean_text

def get_nlp():
    """
    Singleton pattern to ensure only one NLP model is loaded.
    Returns:
        spacy.Language: Configured SpaCy NLP model
    """
    if not hasattr(get_nlp, "nlp"):
        get_nlp.nlp = spacy.load("en_core_web_trf", disable=["parser"])
        get_nlp.nlp.tokenizer = custom_tokenizer(get_nlp.nlp)
        
        # Add custom stop words
        my_stop_words = {"re", "ve", "ll", "n t", "em", "mr", "ms", "dr", "st", "th", "jr", "sr", "etc", "el"}
        for stopword in my_stop_words:
            lexeme = get_nlp.nlp.vocab[stopword]
            lexeme.is_stop = True
    
    return get_nlp.nlp


def custom_tokenizer(nlp) -> Tokenizer:
    """
    Creates a custom tokenizer for the given SpaCy NLP model.
    Parameters:
        nlp: The SpaCy NLP model.
    Returns:
        Tokenizer: A custom tokenizer.
    """
    infixes = LIST_ELLIPSES + LIST_ICONS + [r"(?<=[0-9])[+\-\*^](?=[0-9-])"]
    infix_re = compile_infix_regex(infixes)
    return Tokenizer(
        nlp.vocab,
        prefix_search=nlp.tokenizer.prefix_search,
        suffix_search=nlp.tokenizer.suffix_search,
        infix_finditer=infix_re.finditer,
        token_match=nlp.tokenizer.token_match,
        rules=nlp.Defaults.tokenizer_exceptions,
    )


class TextAnalyzer:
    """
    A class used to analyze text by cleaning, chunking, and processing it using SpaCy and asyncio.
    """

    def __init__(self, text: str, chunk_size: int = 800):
        """
        Initializes the TextAnalyzer.
        Parameters:
            text (str): The input text.
            chunk_size (int): Approximate maximum character length for processing chunks.
        """
        self.original_text = text
        self.chunk_size = chunk_size
        self.cleaned_chunks = self._chunk_and_clean_text()
        self.nlp = get_nlp()


    def _chunk_and_clean_text(self) -> list[str]:
        """
        Splits the text into manageable chunks at word boundaries and cleans each chunk.
        Returns:
            list[str]: A list of cleaned text chunks.
        """
        # Clean the entire text first
        cleaned_text = clean_text(self.original_text)

        # Split text into chunks without breaking words
        words = cleaned_text.split()
        chunks = []
        current_chunk = []

        for word in words:
            if len(" ".join(current_chunk + [word])) <= self.chunk_size:
                current_chunk.append(word)
            else:
                chunks.append(" ".join(current_chunk))
                current_chunk = [word]

        if current_chunk:
            chunks.append(" ".join(current_chunk))

        return chunks


    async def _process_chunks(self, process_function) -> list:
        """
        Applies a processing function asynchronously to each chunk.
        Parameters:
            process_function (Callable): A function to process each chunk.
        Returns:
            list: A list of results from processing each chunk.
        """
        return await asyncio.gather(
            *(process_function(chunk) for chunk in self.cleaned_chunks)
        )


    async def _process_chunk_with_nlp(self, chunk: str):
        """
        Processes a single chunk with SpaCy NLP pipeline.
        Parameters:
            chunk (str): The text chunk to process.
        Returns:
            Doc: Processed SpaCy Doc object.
        """
        return self.nlp(chunk)


    async def remove_stop_words(self) -> str:
        """
        Removes stop words from the cleaned text chunks asynchronously.
        Updates the `cleaned_chunks` to exclude stop words.
        """

        async def remove_stop_words_from_chunk(chunk: str):
            doc = await self._process_chunk_with_nlp(chunk)
            return " ".join([token.text for token in doc if not token.is_stop])

        self.cleaned_chunks = await self._process_chunks(remove_stop_words_from_chunk)
        return " ".join(self.cleaned_chunks).strip()


    async def frequency_all_words(self) -> dict[str, int]:
        """
        Calculates the frequency of each word across all cleaned chunks asynchronously.
        Returns:
            dict[str, int]: A dictionary with word frequencies.
        """
        word_counts = Counter()
        for chunk in self.cleaned_chunks:
            word_counts.update(chunk.split())
        return dict(word_counts)


    async def most_common_words(self, n: int = 8) -> dict[str, int]:
        """
        Returns the top `n` most common words across all cleaned chunks.
        Parameters:
            n (int): Number of top common words to return.
        Returns:
            dict[str, int]: A dictionary of the most common words and their counts.
        """
        word_counts = await self.frequency_all_words()
        return dict(Counter(word_counts).most_common(n))


    async def frequency_specific_word(self, word: str) -> int:
        """
        Finds the frequency of a specific word across all cleaned chunks asynchronously.
        Parameters:
            word (str): The word to search for.
        Returns:
            int: The frequency of the word.
        """
        word_counts = await self.frequency_all_words()
        return word_counts.get(word.lower(), 0)


    async def get_entities(self) -> dict[str, dict]:
        """
        Extracts named entities from the text asynchronously and organizes them by type.
        Returns:
            dict[str, dict]: A dictionary with entity types as keys and nested dictionaries with counts.
        """

        async def extract_entities_from_chunk(chunk: str):
            doc = await self._process_chunk_with_nlp(chunk)
            entity_counts = defaultdict(lambda: {"_total": 0, "entities": {}})
            for ent in doc.ents:
                entity_counts[ent.label_]["entities"][ent.text] = (
                    entity_counts[ent.label_]["entities"].get(ent.text, 0) + 1
                )
                entity_counts[ent.label_]["_total"] += 1
            return entity_counts

        entity_results = await self._process_chunks(extract_entities_from_chunk)

        # Merge results across chunks
        final_entities = defaultdict(lambda: {"_total": 0, "entities": {}})
        for result in entity_results:
            for entity_type, data in result.items():
                final_entities[entity_type]["_total"] += data["_total"]
                for entity, count in data["entities"].items():
                    final_entities[entity_type]["entities"][entity] = (
                        final_entities[entity_type]["entities"].get(entity, 0) + count
                    )

        return dict(final_entities)


    async def get_pos_tags(self) -> dict[str, str]:
        """
        Returns part-of-speech tags for tokens across all chunks asynchronously.
        Returns:
            dict[str, str]: A dictionary of token texts and their POS tags.
        """

        async def extract_pos_tags_from_chunk(chunk: str):
            doc = await self._process_chunk_with_nlp(chunk)
            return {token.text: token.pos_ for token in doc}

        pos_results = await self._process_chunks(extract_pos_tags_from_chunk)

        # Merge POS tags across chunks
        pos_tags = {}
        for result in pos_results:
            pos_tags.update(result)

        return pos_tags
