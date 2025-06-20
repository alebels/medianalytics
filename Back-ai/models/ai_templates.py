from typing import Final

TEMPLATE_IDEOLOGICAL: Final = """
    Your task is to analyze this text and identify three distinct ideologies from the list:

    Text to analyze: '{text}'.
    Ideologies list: {ideologies}.

    Instructions:
    1. Carefully read and understand the text and the list of ideologies.
    2. Select exactly 3 different ideologies from the provided list that best describe the text.
    3. Return only these 3 different ideologies in uppercase format.
    4. If the text lacks clear ideological markers, select from: NON-IDEOLOGICAL, NON-POLITICAL, NON-PARTISAN, or UNBIASED.
    5. Ensure each different ideology exists in the provided list.
"""


TEMPLATE_SENTIMENT: Final = """
    Your task is to analyze this text and identify three distinct sentiments from the list:

    Text to analyze: '{text}'.
    Sentiments list: {sentiments}.

    Instructions:
    1. Carefully read and understand the text and the list of sentiments.
    2. Select exactly 3 different sentiments from the provided list that best describe the text.
    3. Return only these 3 different sentiments in uppercase format.
    4. Ensure each different sentiment exists in the provided list.
"""