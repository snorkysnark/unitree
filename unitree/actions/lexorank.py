from typing import Optional
import math

# Inspired by https://medium.com/whisperarts/lexorank-what-are-they-and-how-to-use-them-for-efficient-list-sorting-a48fc4e7849f


ALPHABET_SIZE = 26
DEFAULT_LENGTH = 6


def _compute_difference(left_rank: str, right_rank: str) -> int:
    left_position_codes = [ord(char) for char in left_rank]
    right_position_codes = [ord(char) for char in right_rank]
    difference = 0

    for index in reversed(range(len(left_position_codes))):
        left_code = left_position_codes[index]
        right_code = right_position_codes[index]

        if right_code < left_code:
            right_code += ALPHABET_SIZE
            right_position_codes[index - 1] -= 1

        # formula: x = a * size^0 + b * size^1 + c * size^2
        powRes: int = ALPHABET_SIZE ** (len(left_rank) - index - 1)
        difference += (right_code - left_code) * powRes

    return difference


def _add_to_rank(rank: str, difference: int) -> str:
    new_chars = []
    offset = 0

    for index in range(len(rank)):
        diff_in_symbols: int = difference // (ALPHABET_SIZE**index) % ALPHABET_SIZE
        new_element_code = ord(rank[len(rank) - index - 1]) + diff_in_symbols + offset
        offset = 0

        # if newElement is greater then 'z'
        if new_element_code > ord("z"):
            offset += 1
            new_element_code -= ALPHABET_SIZE

        new_chars.append(chr(new_element_code))

    return "".join(reversed(new_chars))


def get_ranks_between(
    left_rank: Optional[str], right_rank: Optional[str], *, n: int = 1
):
    left_rank = left_rank or "a" * DEFAULT_LENGTH
    right_rank = right_rank or "z" * DEFAULT_LENGTH

    # Force equal length
    left_rank = left_rank.ljust(len(right_rank), "a")
    right_rank = right_rank.ljust(len(left_rank), "a")

    difference = _compute_difference(left_rank, right_rank)
    if difference <= n:
        digits_to_add = math.ceil(math.log(n + 1, ALPHABET_SIZE))

        left_rank += "a" * digits_to_add
        difference += ALPHABET_SIZE**digits_to_add

    step = difference // (n + 1)
    for i in range(1, n + 1):
        yield _add_to_rank(left_rank, step * i)


def get_rank_between(left_rank: Optional[str], right_rank: Optional[str]):
    return next(get_ranks_between(left_rank, right_rank))
