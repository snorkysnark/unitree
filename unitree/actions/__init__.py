from typing import Optional
from sqlalchemy import delete, func
from sqlalchemy.orm import Session, aliased
from dataclasses import dataclass

from unitree.models import Node
from unitree.schema import NodeIn
from .lexorank import get_rank_between

Pair = aliased(Node)


def _insert_node(
    db: Session,
    root: NodeIn,
    *,
    depth: int,
    after_rank: Optional[str] = None,
    before_rank: Optional[str] = None,
):
    next_rank = get_rank_between(after_rank, before_rank)

    start_node = Node(rank=next_rank, depth=depth, title=root.title)
    db.add(start_node)
    db.flush()
    db.refresh(start_node)

    for child in root.children:
        next_rank = _insert_node(
            db,
            child,
            depth=depth + 1,
            after_rank=next_rank,
            before_rank=before_rank,
        )

    next_rank = get_rank_between(next_rank, before_rank)
    db.add(
        Node(
            rank=next_rank,
            start_id=start_node.id,
            depth=depth,
        )
    )
    return next_rank


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

    _insert_node(
        db,
        tree,
        depth=location.depth,
        after_rank=location.after_rank,
        before_rank=location.before_rank,
    )
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
    next_rank = move_location.after_rank

    for node in (
        db.query(Node)
        .where((Node.rank >= left_key) & (Node.rank <= right_key))
        .order_by(Node.rank)
    ):
        next_rank = get_rank_between(next_rank, move_location.before_rank)

        node.rank = next_rank
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
