import random
from typing import Annotated
import typer
import randomname
import random
import math
import pprint
from sqlalchemy import select, func

from unitree.database import SessionLocal
from unitree.schema import NodeIn
from unitree.models import Node
from unitree.actions import insert_tree


def generate_tree(
    max_depth: int, min_children: int, max_children: int, current_depth: int = 0
):
    node = NodeIn(title=randomname.get_name(), children=[])

    if current_depth < max_depth:
        num_children = random.randint(min_children, max_children)
        for _ in range(num_children):
            child = generate_tree(
                max_depth=max_depth,
                min_children=min_children,
                max_children=max_children,
                current_depth=current_depth + 1,
            )
            node.children.append(child)

    return node


def main(
    max_depth: Annotated[int, typer.Option()],
    max_children: Annotated[int, typer.Option()],
    min_children: Annotated[int, typer.Option()] = 0,
):
    with SessionLocal() as db:
        total_count = db.execute(select(func.count()).select_from(Node)).scalar() or 0
        print("Total count", total_count)

        root = generate_tree(
            max_depth=max_depth,
            min_children=min_children,
            max_children=max_children,
        )
        pprint.pprint(root.model_dump())

        # select random id or null
        random_id = db.execute(
            select(Node.id)
            .offset(math.floor(random.random() * (total_count + 1)))
            .limit(1)
        ).scalar()
        print("Insert before", random_id)

        insert_tree(db, root, before_id=random_id)


if __name__ == "__main__":
    typer.run(main)
