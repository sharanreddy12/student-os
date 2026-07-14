"""expand subjects with production fields

Revision ID: 002
Revises: 001
Create Date: 2026-07-13 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('subjects', sa.Column('semester', sa.Integer(), nullable=True))
    op.add_column('subjects', sa.Column('credits', sa.Integer(), nullable=True))
    op.add_column('subjects', sa.Column('faculty_name', sa.String(), nullable=True))
    op.add_column('subjects', sa.Column('classroom', sa.String(), nullable=True))
    op.add_column('subjects', sa.Column('minimum_attendance_percentage', sa.Integer(), nullable=True))
    op.add_column('subjects', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('subjects', sa.Column('is_active', sa.Boolean(), nullable=True, server_default=sa.true()))
    op.add_column('subjects', sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))

    op.execute("UPDATE subjects SET semester = 1 WHERE semester IS NULL")
    op.execute("UPDATE subjects SET credits = 3 WHERE credits IS NULL")
    op.execute("UPDATE subjects SET minimum_attendance_percentage = 75 WHERE minimum_attendance_percentage IS NULL")
    op.execute("UPDATE subjects SET is_active = TRUE WHERE is_active IS NULL")

    op.alter_column('subjects', 'semester', nullable=False)
    op.alter_column('subjects', 'credits', nullable=False)
    op.alter_column('subjects', 'minimum_attendance_percentage', nullable=False)
    op.alter_column('subjects', 'is_active', nullable=False)


def downgrade() -> None:
    op.drop_column('subjects', 'updated_at')
    op.drop_column('subjects', 'is_active')
    op.drop_column('subjects', 'description')
    op.drop_column('subjects', 'minimum_attendance_percentage')
    op.drop_column('subjects', 'classroom')
    op.drop_column('subjects', 'faculty_name')
    op.drop_column('subjects', 'credits')
    op.drop_column('subjects', 'semester')
