from contextlib import contextmanager
from typing import Optional, cast
from sqlalchemy import delete, func
from sqlalchemy.orm import Session, aliased
from psycopg2.extensions import connection as RawConnection, cursor as RawCursor

from . import models
from .schema import NewNode

Pair = aliased(models.Node)


@contextmanager
def _raw_cursor(db: Session):
    with cast(RawConnection, db.connection()._dbapi_connection).cursor() as cursor:
        yield cursor


def _rational_intermediate(
    cursor: RawCursor, left_key: Optional[str], right_key: Optional[str]
) -> str:
    # use 1 as the initial index in tables
    if not left_key and not right_key:
        return "1"

    cursor.callproc("rational_intermediate", (left_key, right_key))
    if row := cursor.fetchone():
        return row[0]

    raise RuntimeError(
        f"rational intermediate returned no value for ({left_key}, {right_key})"
    )


def _insert_node(
    db: Session,
    root: NewNode,
    *,
    depth: int,
    after_fraction: Optional[str] = None,
    before_fraction: Optional[str] = None,
):
    with _raw_cursor(db) as cursor:
        # if both after_fraction=None and before_fraction=None, assume table is empty
        next_fraction = (
            _rational_intermediate(cursor, after_fraction, before_fraction)
            if after_fraction or before_fraction
            else "1"
        )
        start_node = models.Node(
            fraction=next_fraction, depth=depth, title=root.title, data=root.data
        )
        db.add(start_node)
        db.flush()
        db.refresh(start_node)

        for child in root.children:
            next_fraction = _insert_node(
                db,
                child,
                depth=depth + 1,
                after_fraction=next_fraction,
                before_fraction=before_fraction,
            )

        next_fraction = _rational_intermediate(cursor, next_fraction, before_fraction)
        db.add(
            models.Node(
                fraction=next_fraction,
                start_id=start_node.id,
                depth=depth,
            )
        )
        return next_fraction


def insert_tree(db: Session, root: NewNode, *, before_id: Optional[int] = None):
    before_fraction: Optional[str] = None
    parent_depth: Optional[int] = None
    after_fraction: Optional[str] = None

    if before_id is not None:
        before_node = db.query(models.Node).where(models.Node.id == before_id).one()
        before_fraction = before_node.fraction

        if after_node := (  # Find the preceding node (if exists)
            db.query(models.Node)
            .where(models.Node.fraction < before_node.fraction)
            .order_by(models.Node.fraction.desc())
            .limit(1)
            .one_or_none()
        ):
            after_fraction = after_node.fraction

            # Find the parent node: rightmost that contains the range [after_fraction; before_fraction]
            parent_node = (
                db.query(models.Node)
                .join(models.Node.end.of_type(Pair))
                .where(
                    (models.Node.fraction <= after_node.fraction)
                    & (Pair.fraction >= before_node.fraction)
                )
                .order_by(models.Node.fraction.desc())
                .limit(1)
                .one()
            )
            parent_depth = parent_node.depth
    else:
        # If before_id = None, we are appending to the end
        after_fraction = db.query(func.max(models.Node.fraction)).scalar()

    _insert_node(
        db,
        root,
        depth=parent_depth + 1 if parent_depth else 0,
        after_fraction=after_fraction,
        before_fraction=before_fraction,
    )
    db.commit()


def delete_node(db: Session, node_id: int):
    node = db.query(models.Node).where(models.Node.id == node_id).limit(1).one()
    left_key, right_key = node.get_range()

    db.execute(
        delete(models.Node).where(
            (models.Node.fraction >= left_key) & (models.Node.fraction <= right_key)
        )
    )
    db.commit()


def get_tree(db: Session):
    return db.query(models.Node).order_by(models.Node.fraction).all()
