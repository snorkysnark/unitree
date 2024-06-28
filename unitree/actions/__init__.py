from typing import Iterator, Optional
from sqlalchemy import delete, func
from sqlalchemy.orm import Session, aliased
from dataclasses import dataclass

from unitree.models import Node
from unitree.schema import NodeIn
from .lexorank import get_ranks_between

Pair = aliased(Node)


def _get_tree_length(tree: NodeIn) -> int:
    # A single NodeIn is counted as 2 nodes, since it gets turned into a START and an END node
    return 2 + sum(map(_get_tree_length, tree.children))


def _insert_node(
    db: Session,
    root: NodeIn,
    *,
    depth: int,
    ranks: Iterator[str],
):
    start_node = Node(rank=next(ranks), depth=depth, title=root.title)
    db.add(start_node)
    db.flush()
    db.refresh(start_node)

    for child in root.children:
        _insert_node(
            db,
            child,
            depth=depth + 1,
            ranks=ranks,
        )

    db.add(
        Node(
            rank=next(ranks),
            start_id=start_node.id,
            depth=depth,
        )
    )


@dataclass
class InsertionRange:
    before_rank: Optional[str]
    after_rank: Optional[str]
    depth: int

    @staticmethod
    def create_before(db: Session, node_id: Optional[int] = None):
        before_rank: Optional[str] = None
        after_rank: Optional[str] = None
        parent_depth: Optional[int] = None

        if node_id is not None:
            before_node = db.query(Node).where(Node.id == node_id).one()
            before_rank = before_node.rank

            if after_node := (  # Find the preceding node (if exists)
                db.query(Node)
                .where(Node.rank < before_node.rank)
                .order_by(Node.rank.desc())
                .limit(1)
                .one_or_none()
            ):
                after_rank = after_node.rank

                # Find the parent node: rightmost that contains the range [after_rank; before_rank]
                parent_node = (
                    db.query(Node)
                    .join(Node.end.of_type(Pair))
                    .where(
                        (Node.rank <= after_node.rank) & (Pair.rank >= before_node.rank)
                    )
                    .order_by(Node.rank.desc())
                    .limit(1)
                    .one()
                )
                parent_depth = parent_node.depth
        else:
            # If before_id = None, we are appending to the end
            after_rank = db.query(func.max(Node.rank)).scalar()

        return InsertionRange(
            before_rank,
            after_rank,
            parent_depth + 1 if parent_depth is not None else 0,
        )


def insert_tree(db: Session, tree: NodeIn, *, before_id: Optional[int] = None):
    location = InsertionRange.create_before(db, before_id)
    ranks = get_ranks_between(
        location.after_rank, location.before_rank, n=_get_tree_length(tree)
    )

    _insert_node(db, tree, depth=location.depth, ranks=ranks)
    db.commit()


def move_node(db: Session, *, node_id: int, move_before: Optional[int] = None):
    node = db.query(Node).where(Node.id == node_id).limit(1).one()
    left_key, right_key = node.get_range()
    move_location = InsertionRange.create_before(db, move_before)

    # Current and target ranges must not overlap
    if (
        move_location.before_rank
        and move_location.after_rank
        and move_location.before_rank <= right_key
        and left_key <= move_location.after_rank
    ):
        raise ValueError("Tried to move node inside of itself")

    delta_depth: int = move_location.depth - node.depth

    nodes = (
        db.query(Node)
        .where((Node.rank >= left_key) & (Node.rank <= right_key))
        .order_by(Node.rank)
    )
    ranks = get_ranks_between(
        move_location.after_rank, move_location.before_rank, n=nodes.count()
    )

    for node in nodes:
        node.rank = next(ranks)
        node.depth += delta_depth

    db.commit()


def delete_node(db: Session, node_id: int):
    left_key, right_key = (
        db.query(Node).where(Node.id == node_id).limit(1).one().get_range()
    )
    db.execute(delete(Node).where((Node.rank >= left_key) & (Node.rank <= right_key)))
    db.commit()


def get_tree(db: Session):
    return db.query(Node).order_by(Node.rank).all()
