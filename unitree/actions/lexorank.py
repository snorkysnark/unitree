from typing import Optional


ALPHABET_SIZE = 26
RANK_LENGTH = 10


def get_rank_between(first_rank: Optional[str], second_rank: Optional[str]):
    first_rank = first_rank or "a" * RANK_LENGTH
    second_rank = second_rank or "z" * RANK_LENGTH

    # Force equal length
    first_rank = first_rank.ljust(len(second_rank), "a")
    second_rank = second_rank.ljust(len(first_rank), "a")

    first_position_codes = [ord(char) for char in first_rank]
    second_position_codes = [ord(char) for char in second_rank]
    difference = 0

    for index in reversed(range(len(first_position_codes))):
        first_code = first_position_codes[index]
        second_code = second_position_codes[index]

        if second_code < first_code:
            second_code += ALPHABET_SIZE
            second_position_codes[index - 1] -= 1

        # formula: x = a * size^0 + b * size^1 + c * size^2
        powRes: int = ALPHABET_SIZE ** (len(first_rank) - index - 1)
        difference += (second_code - first_code) * powRes

    if difference <= 1:
        # add middle char from the alphabet
        return first_rank + chr(ord("a") + ALPHABET_SIZE // 2)
    else:
        new_chars = []
        half_difference = difference // 2
        offset = 0

        for index in range(len(first_rank)):
            # formula: x = difference / (size^place - 1) % size;
            # i.e. difference = 110, size = 10, we want place 2 (middle),
            # then x = 100 / 10^(2 - 1) % 10 = 100 / 10 % 10 = 11 % 10 = 1

            diff_in_symbols: int = (
                half_difference // (ALPHABET_SIZE**index) % ALPHABET_SIZE
            )
            new_element_code = (
                ord(first_rank[len(second_rank) - index - 1]) + diff_in_symbols + offset
            )
            offset = 0

            # if newElement is greater then 'z'
            if new_element_code > ord("z"):
                offset += 1
                new_element_code -= ALPHABET_SIZE

            new_chars.append(chr(new_element_code))

        return "".join(reversed(new_chars))
