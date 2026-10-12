"""
Module for text analysis using SpaCy and asyncio.
"""

import asyncio
from collections import Counter, defaultdict
import re
import spacy
from spacy.tokenizer import Tokenizer
from spacy.util import compile_infix_regex
from spacy.lang.char_classes import LIST_ELLIPSES, LIST_ICONS
from utils.utils import clean_text

MY_STOP_WORDS = {
    "re", "ve", "ll", "nt", "n't", "em", "mr", "ms", "dr", "st", "th", "jr", "sr", 
    "etc", "el", "news", "said", "says", "told", "new", "added", "called", 
    "like", "including", "according", "reported"
}

def get_nlp():
    """
    Singleton pattern to ensure only one NLP model is loaded.
    Returns:
        spacy.Language: Configured SpaCy NLP model
    """
    if not hasattr(get_nlp, "nlp"):
        get_nlp.nlp = spacy.load("en_core_web_trf", disable=["parser"])
        get_nlp.nlp.tokenizer = custom_tokenizer(get_nlp.nlp)
        
        for stopword in MY_STOP_WORDS:
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
        self.raw_chunks = self._chunk_text(self.original_text)
        self.cleaned_chunks = self._chunk_and_clean_text()
        self.nlp = get_nlp()
        self._raw_docs = None
        self._word_counts = None


    def _chunk_text(self, text: str) -> list[str]:
        """
        Splits text into manageable chunks at sentence boundaries without breaking words.
        Parameters:
            text (str): The text to chunk.
        Returns:
            list[str]: A list of text chunks.
        """
        if not text or not text.strip():
            return []

        # Split on sentence boundaries (. ! ?) or newlines
        sentences = re.split(r"(?<=[.!?])\s+|\n+", text.strip())
        chunks = []
        current_chunk = []
        current_len = 0

        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue

            # If a single sentence exceeds chunk_size, split it by words
            if len(sentence) > self.chunk_size:
                if current_chunk:
                    chunks.append(" ".join(current_chunk))
                    current_chunk = []
                    current_len = 0

                words = sentence.split()
                temp_chunk = []
                for word in words:
                    if temp_chunk and len(" ".join(temp_chunk + [word])) > self.chunk_size:
                        chunks.append(" ".join(temp_chunk))
                        temp_chunk = [word]
                    else:
                        temp_chunk.append(word)
                if temp_chunk:
                    chunks.append(" ".join(temp_chunk))
                continue

            # Check if adding this sentence exceeds chunk_size
            candidate_len = current_len + len(sentence) + (1 if current_chunk else 0)
            if current_chunk and candidate_len > self.chunk_size:
                chunks.append(" ".join(current_chunk))
                current_chunk = [sentence]
                current_len = len(sentence)
            else:
                current_chunk.append(sentence)
                current_len = candidate_len

        if current_chunk:
            chunks.append(" ".join(current_chunk))

        return chunks


    def _chunk_and_clean_text(self) -> list[str]:
        """
        Splits the text into manageable chunks at word boundaries and cleans each chunk.
        Returns:
            list[str]: A list of cleaned text chunks.
        """
        cleaned_text = clean_text(self.original_text)
        return self._chunk_text(cleaned_text)


    async def _get_raw_docs(self) -> list:
        """
        Processes raw text chunks with the SpaCy NLP pipeline using batching.
        Caches the parsed Doc objects so both entity extraction and POS tagging
        reuse the same inference pass without duplicate model evaluations.
        """
        if self._raw_docs is None:
            if not self.raw_chunks:
                self._raw_docs = []
            else:
                def run_pipe():
                    return list(self.nlp.pipe(self.raw_chunks, batch_size=8))

                self._raw_docs = await asyncio.to_thread(run_pipe)
        return self._raw_docs


    async def remove_stop_words(self) -> str:
        """
        Removes stop words from the cleaned text chunks.
        Uses fast vocabulary tokenizer lookup without running heavy transformer inference.
        """
        def filter_chunk(chunk: str) -> str:
            doc = self.nlp.make_doc(chunk)
            return " ".join([token.text for token in doc if not token.is_stop])

        self.cleaned_chunks = [filter_chunk(chunk) for chunk in self.cleaned_chunks]
        self._word_counts = None  # Reset cached counts if chunks are updated
        return " ".join(self.cleaned_chunks).strip()


    async def frequency_all_words(self) -> dict[str, int]:
        """
        Calculates and caches the frequency of each word across all cleaned chunks.
        Returns:
            dict[str, int]: A dictionary with word frequencies.
        """
        if self._word_counts is None:
            counts = Counter()
            for chunk in self.cleaned_chunks:
                # Ensure words satisfy DB schema constraints (2 <= length <= 70)
                words = [w for w in chunk.split() if 2 <= len(w) <= 70]
                counts.update(words)
            self._word_counts = counts

        return dict(self._word_counts)


    async def most_common_words(self, n: int = 8) -> dict[str, int]:
        """
        Returns the top `n` most common words across all cleaned chunks.
        Parameters:
            n (int): Number of top common words to return.
        Returns:
            dict[str, int]: A dictionary of the most common words and their counts.
        """
        if self._word_counts is None:
            await self.frequency_all_words()
        return dict(self._word_counts.most_common(n))


    async def frequency_specific_word(self, word: str) -> int:
        """
        Finds the frequency of a specific word across all cleaned chunks.
        Parameters:
            word (str): The word to search for.
        Returns:
            int: The frequency of the word.
        """
        if self._word_counts is None:
            await self.frequency_all_words()
        return self._word_counts.get(word.lower(), 0)


    async def get_entities(self) -> dict[str, dict]:
        """
        Extracts named entities from the raw text and organizes them by type.
        Returns:
            dict[str, dict]: A dictionary with entity types as keys and nested dictionaries with counts.
        """
        docs = await self._get_raw_docs()
        final_entities = defaultdict(lambda: {"_total": 0, "entities": {}})

        for doc in docs:
            for ent in doc.ents:
                text = ent.text.strip()
                if not text:
                    continue
                final_entities[ent.label_]["entities"][text] = (
                    final_entities[ent.label_]["entities"].get(text, 0) + 1
                )
                final_entities[ent.label_]["_total"] += 1

        return dict(final_entities)


    async def get_pos_tags(self) -> dict[str, str]:
        """
        Returns part-of-speech tags for tokens across all chunks.
        Uses majority voting per token so the dominant grammatical category in the article is assigned.
        Returns:
            dict[str, str]: A dictionary of token texts and their POS tags.
        """
        docs = await self._get_raw_docs()
        pos_counts = defaultdict(Counter)

        for doc in docs:
            for token in doc:
                if not token.is_punct and not token.is_space:
                    pos_counts[token.text][token.pos_] += 1
                    pos_counts[token.text.lower()][token.pos_] += 1

        pos_tags = {
            token_key: counts.most_common(1)[0][0]
            for token_key, counts in pos_counts.items()
        }

        return pos_tags
