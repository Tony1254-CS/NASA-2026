import uuid
from sqlalchemy import (
    Column,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    func,
)
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Case(Base):
    """
    Main TRACE Investigation Case Entity.
    Stores metadata, temporal observation window, investigation status, and PostGIS AOI geometry.
    """
    __tablename__ = "cases"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, unique=True, nullable=False, index=True)
    geometry = Column(Geometry(geometry_type="GEOMETRY", srid=4326, spatial_index=False), nullable=True)
    event_type = Column(String, nullable=False)
    observation_start = Column(DateTime(timezone=True), nullable=False)
    observation_end = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, nullable=False, default="draft")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    nisar_measurements = relationship("NisarMeasurement", back_populates="case", cascade="all, delete-orphan")
    evidence = relationship("Evidence", back_populates="case", cascade="all, delete-orphan")
    challenge_checks = relationship("ChallengeCheck", back_populates="case", cascade="all, delete-orphan")
    interpretations = relationship("Interpretation", back_populates="case", cascade="all, delete-orphan")
    provenance_records = relationship("Provenance", back_populates="case", cascade="all, delete-orphan")
    field_observations = relationship("FieldObservation", back_populates="case", cascade="all, delete-orphan")
    threshold_alerts = relationship("ThresholdAlert", back_populates="case", cascade="all, delete-orphan")


class NisarMeasurement(Base):
    """
    Primary scientific measurement entity derived from NISAR Earth observation data.
    """
    __tablename__ = "nisar_measurements"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("cases.case_id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String, nullable=False)
    observation_time = Column(DateTime(timezone=True), nullable=False)
    delta_backscatter = Column(Float, nullable=True)
    affected_area = Column(Float, nullable=True)
    spatial_extent = Column(Geometry(geometry_type="POLYGON", srid=4326, spatial_index=False), nullable=True)
    change_metric = Column(String, nullable=True)
    raster_reference = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    case = relationship("Case", back_populates="nisar_measurements")


class Evidence(Base):
    """
    Independent cross-mission observation data used to investigate a case.
    """
    __tablename__ = "evidence"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("cases.case_id", ondelete="CASCADE"), nullable=False, index=True)
    source_type = Column(String, nullable=False)  # nisar, gpm, modis, other
    collection_id = Column(String, nullable=True)
    granule_id = Column(String, nullable=True)
    time_start = Column(DateTime(timezone=True), nullable=True)
    time_end = Column(DateTime(timezone=True), nullable=True)
    spatial_extent = Column(Geometry(geometry_type="POLYGON", srid=4326, spatial_index=False), nullable=True)
    role = Column(String, nullable=True)
    status = Column(String, nullable=False, default="not_evaluated")  # supports, contradicts, not_available, not_evaluated
    visualization_uri = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    case = relationship("Case", back_populates="evidence")
    provenance_records = relationship("Provenance", back_populates="evidence", cascade="all, delete-orphan")


class ChallengeCheck(Base):
    """
    Quality control and hypothesis validation result entity.
    """
    __tablename__ = "challenge_checks"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("cases.case_id", ondelete="CASCADE"), nullable=False, index=True)
    check_type = Column(String, nullable=False)
    status = Column(String, nullable=False, default="not_evaluated")  # pass, warning, inconclusive, not_evaluated
    value = Column(String, nullable=True)
    threshold = Column(String, nullable=True)
    rationale = Column(String, nullable=True)
    source = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    case = relationship("Case", back_populates="challenge_checks")


class Interpretation(Base):
    """
    Evidence-backed scientific narrative and uncertainty evaluation.
    """
    __tablename__ = "interpretation"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("cases.case_id", ondelete="CASCADE"), nullable=False, index=True)
    narrative = Column(String, nullable=False)
    uncertainty = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship
    case = relationship("Case", back_populates="interpretations")


class Provenance(Base):
    """
    Cryptographic and processing lineage record for scientific data traceability.
    """
    __tablename__ = "provenance"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("cases.case_id", ondelete="CASCADE"), nullable=False, index=True)
    evidence_id = Column(String, ForeignKey("evidence.id", ondelete="SET NULL"), nullable=True, index=True)
    collection_id = Column(String, nullable=True)
    granule_id = Column(String, nullable=True)
    product_id = Column(String, nullable=True)
    acquisition_time = Column(DateTime(timezone=True), nullable=True)
    processing_method = Column(String, nullable=True)
    calculation_method = Column(String, nullable=True)
    source_reference = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    case = relationship("Case", back_populates="provenance_records")
    evidence = relationship("Evidence", back_populates="provenance_records")


class FieldObservation(Base):
    """
    Ground-truth field observation collected at specific spatial Point coordinates.
    Extended for Phase 5.2 Community Sentinel Network reports.
    """
    __tablename__ = "field_observations"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("cases.case_id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, nullable=True)
    photo_reference = Column(String, nullable=True)
    note = Column(String, nullable=True)
    observed_at = Column(DateTime(timezone=True), nullable=False)
    location = Column(Geometry(geometry_type="POINT", srid=4326, spatial_index=False), nullable=True)
    source_type = Column(String, nullable=False, default="community_sentinel")
    verification_state = Column(String, nullable=False, default="PENDING")  # PENDING | USER_CONFIRMED | CROSS_CHECKED | SUPPORTED | REJECTED
    sentinel_tier = Column(String, nullable=False, default="ACTIVE_REPORTER")  # NEW_REPORTER | ACTIVE_REPORTER | VERIFIED_CONTRIBUTOR
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    case = relationship("Case", back_populates="field_observations")


class ThresholdAlert(Base):
    """
    User threshold subscription for anomaly alerts on real NISAR measurements.
    Extended for Phase 5.2 Field Companion Alert Layer.
    """
    __tablename__ = "threshold_alerts"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("cases.case_id", ondelete="CASCADE"), nullable=False, index=True)
    evidence_id = Column(String, ForeignKey("evidence.id", ondelete="SET NULL"), nullable=True, index=True)
    metric_name = Column(String, nullable=False, default="delta_backscatter")  # delta_backscatter | affected_area
    threshold_value = Column(Float, nullable=False, default=-2.0)
    comparison = Column(String, nullable=False, default="less_than")  # less_than | greater_than | abs_greater_than
    is_active = Column(Boolean, nullable=False, default=True)
    triggered_state = Column(String, nullable=False, default="ARMED")  # ARMED | TRIGGERED
    alert_state = Column(String, nullable=False, default="UNAVAILABLE")  # OBSERVED CHANGE | POTENTIAL CHANGE | INCONCLUSIVE | REJECTED | UNAVAILABLE
    acknowledgement_status = Column(String, nullable=False, default="UNREAD")  # UNREAD | READ | ACKNOWLEDGED
    safe_message = Column(String, nullable=True)
    last_evaluated_val = Column(Float, nullable=True)
    last_triggered_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship
    case = relationship("Case", back_populates="threshold_alerts")

