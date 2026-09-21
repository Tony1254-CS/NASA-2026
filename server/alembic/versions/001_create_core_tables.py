"""create_core_tables

Revision ID: 001_create_core_tables
Revises: 
Create Date: 2026-09-22 02:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry

# revision identifiers, used by Alembic.
revision: str = '001_create_core_tables'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enable PostGIS Extension
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")

    # 2. Create cases table
    op.create_table(
        'cases',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('case_id', sa.String(), nullable=False),
        sa.Column('geometry', Geometry(geometry_type='MULTIPOLYGON', srid=4326), nullable=True),
        sa.Column('event_type', sa.String(), nullable=False),
        sa.Column('observation_start', sa.DateTime(timezone=True), nullable=False),
        sa.Column('observation_end', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='draft'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('case_id')
    )
    op.create_index(op.f('ix_cases_case_id'), 'cases', ['case_id'], unique=True)

    # 3. Create nisar_measurements table
    op.create_table(
        'nisar_measurements',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('case_id', sa.String(), nullable=False),
        sa.Column('product_id', sa.String(), nullable=False),
        sa.Column('observation_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('delta_backscatter', sa.Float(), nullable=True),
        sa.Column('affected_area', sa.Float(), nullable=True),
        sa.Column('spatial_extent', Geometry(geometry_type='POLYGON', srid=4326), nullable=True),
        sa.Column('change_metric', sa.String(), nullable=True),
        sa.Column('raster_reference', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['case_id'], ['cases.case_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_nisar_measurements_case_id'), 'nisar_measurements', ['case_id'], unique=False)

    # 4. Create evidence table
    op.create_table(
        'evidence',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('case_id', sa.String(), nullable=False),
        sa.Column('source_type', sa.String(), nullable=False),
        sa.Column('collection_id', sa.String(), nullable=True),
        sa.Column('granule_id', sa.String(), nullable=True),
        sa.Column('time_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('time_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('spatial_extent', Geometry(geometry_type='POLYGON', srid=4326), nullable=True),
        sa.Column('role', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='not_evaluated'),
        sa.Column('visualization_uri', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['case_id'], ['cases.case_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_evidence_case_id'), 'evidence', ['case_id'], unique=False)

    # 5. Create challenge_checks table
    op.create_table(
        'challenge_checks',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('case_id', sa.String(), nullable=False),
        sa.Column('check_type', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='not_evaluated'),
        sa.Column('value', sa.String(), nullable=True),
        sa.Column('threshold', sa.String(), nullable=True),
        sa.Column('rationale', sa.String(), nullable=True),
        sa.Column('source', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['case_id'], ['cases.case_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_challenge_checks_case_id'), 'challenge_checks', ['case_id'], unique=False)

    # 6. Create interpretation table
    op.create_table(
        'interpretation',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('case_id', sa.String(), nullable=False),
        sa.Column('narrative', sa.String(), nullable=False),
        sa.Column('uncertainty', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['case_id'], ['cases.case_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_interpretation_case_id'), 'interpretation', ['case_id'], unique=False)

    # 7. Create provenance table
    op.create_table(
        'provenance',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('case_id', sa.String(), nullable=False),
        sa.Column('evidence_id', sa.String(), nullable=True),
        sa.Column('collection_id', sa.String(), nullable=True),
        sa.Column('granule_id', sa.String(), nullable=True),
        sa.Column('product_id', sa.String(), nullable=True),
        sa.Column('acquisition_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('processing_method', sa.String(), nullable=True),
        sa.Column('calculation_method', sa.String(), nullable=True),
        sa.Column('source_reference', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['case_id'], ['cases.case_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['evidence_id'], ['evidence.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_provenance_case_id'), 'provenance', ['case_id'], unique=False)
    op.create_index(op.f('ix_provenance_evidence_id'), 'provenance', ['evidence_id'], unique=False)

    # 8. Create field_observations table
    op.create_table(
        'field_observations',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('case_id', sa.String(), nullable=False),
        sa.Column('photo_reference', sa.String(), nullable=True),
        sa.Column('note', sa.String(), nullable=True),
        sa.Column('observed_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('location', Geometry(geometry_type='POINT', srid=4326), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['case_id'], ['cases.case_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_field_observations_case_id'), 'field_observations', ['case_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_field_observations_case_id'), table_name='field_observations')
    op.drop_table('field_observations')
    op.drop_index(op.f('ix_provenance_evidence_id'), table_name='provenance')
    op.drop_index(op.f('ix_provenance_case_id'), table_name='provenance')
    op.drop_table('provenance')
    op.drop_index(op.f('ix_interpretation_case_id'), table_name='interpretation')
    op.drop_table('interpretation')
    op.drop_index(op.f('ix_challenge_checks_case_id'), table_name='challenge_checks')
    op.drop_table('challenge_checks')
    op.drop_index(op.f('ix_evidence_case_id'), table_name='evidence')
    op.drop_table('evidence')
    op.drop_index(op.f('ix_nisar_measurements_case_id'), table_name='nisar_measurements')
    op.drop_table('nisar_measurements')
    op.drop_index(op.f('ix_cases_case_id'), table_name='cases')
    op.drop_table('cases')
