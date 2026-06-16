"""SQLAlchemy models for Supabase PostgreSQL (raw SQLAlchemy, no Prisma)."""



from datetime import datetime



from sqlalchemy import BigInteger, Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func

from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.compiler import compiles

@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(element, compiler, **kw):
    return "JSON"

@compiles(BigInteger, "sqlite")
def compile_bigint_sqlite(element, compiler, **kw):
    return "INTEGER"

from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship





class Base(DeclarativeBase):

    pass





class Equipment(Base):

    __tablename__ = "equipment"



    id: Mapped[str] = mapped_column(String(50), primary_key=True)

    name: Mapped[str] = mapped_column(String(200), nullable=False)

    type: Mapped[str] = mapped_column(String(100), nullable=False)

    location: Mapped[str | None] = mapped_column(String(200))

    install_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    age_days: Mapped[int] = mapped_column(Integer, default=0)

    status: Mapped[str] = mapped_column(String(50), default="active")

    criticality: Mapped[str | None] = mapped_column(String(50), default="medium")

    manufacturer: Mapped[str | None] = mapped_column(String(100))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())



    sensor_readings: Mapped[list["SensorReading"]] = relationship(back_populates="equipment")

    maintenance_events: Mapped[list["MaintenanceEvent"]] = relationship(back_populates="equipment")

    failure_predictions: Mapped[list["FailurePrediction"]] = relationship(back_populates="equipment")

    alerts: Mapped[list["Alert"]] = relationship(back_populates="equipment")

    logbook_entries: Mapped[list["LogbookEntry"]] = relationship(back_populates="equipment")





class SensorReading(Base):

    __tablename__ = "sensor_readings"



    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    time: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    equipment_id: Mapped[str] = mapped_column(String(50), ForeignKey("equipment.id", ondelete="CASCADE"))

    temperature: Mapped[float | None] = mapped_column(Float)

    vibration: Mapped[float | None] = mapped_column(Float)

    pressure: Mapped[float | None] = mapped_column(Float)

    current: Mapped[float | None] = mapped_column(Float)

    rpm: Mapped[float | None] = mapped_column(Float)

    flow_rate: Mapped[float | None] = mapped_column(Float)



    equipment: Mapped["Equipment"] = relationship(back_populates="sensor_readings")





class MaintenanceEvent(Base):

    __tablename__ = "maintenance_events"



    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    equipment_id: Mapped[str] = mapped_column(String(50), ForeignKey("equipment.id", ondelete="CASCADE"))

    event_type: Mapped[str | None] = mapped_column(String(100))

    description: Mapped[str | None] = mapped_column(Text)

    performed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    cost: Mapped[float | None] = mapped_column(Float)

    downtime_hours: Mapped[float | None] = mapped_column(Float)



    equipment: Mapped["Equipment"] = relationship(back_populates="maintenance_events")





class FailurePrediction(Base):

    __tablename__ = "failure_predictions"



    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    equipment_id: Mapped[str] = mapped_column(String(50), ForeignKey("equipment.id", ondelete="CASCADE"))

    failure_type: Mapped[str | None] = mapped_column(String(100))

    confidence: Mapped[float | None] = mapped_column(Float)

    anomaly_score: Mapped[float | None] = mapped_column(Float)

    risk_level: Mapped[str | None] = mapped_column(String(50))

    rul_hours: Mapped[float | None] = mapped_column(Float)

    root_cause: Mapped[str | None] = mapped_column(Text)

    predicted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())



    equipment: Mapped["Equipment"] = relationship(back_populates="failure_predictions")





class Alert(Base):

    __tablename__ = "alerts"



    id: Mapped[str] = mapped_column(String(50), primary_key=True)

    equipment_id: Mapped[str] = mapped_column(String(50), ForeignKey("equipment.id", ondelete="CASCADE"))

    severity: Mapped[str | None] = mapped_column(String(50))

    message: Mapped[str | None] = mapped_column(Text)

    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())



    equipment: Mapped["Equipment"] = relationship(back_populates="alerts")





class SpareInventory(Base):

    __tablename__ = "spare_inventory"



    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    part_name: Mapped[str | None] = mapped_column(String(200))

    category: Mapped[str | None] = mapped_column(String(100))

    quantity: Mapped[int] = mapped_column(Integer, default=0)

    reorder_level: Mapped[int] = mapped_column(Integer, default=5)

    unit_cost: Mapped[float | None] = mapped_column(Float)

    last_updated: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())





class LogbookEntry(Base):

    __tablename__ = "logbook_entries"



    id: Mapped[str] = mapped_column(String(50), primary_key=True)

    equipment_id: Mapped[str] = mapped_column(String(50), ForeignKey("equipment.id", ondelete="CASCADE"))

    event_type: Mapped[str] = mapped_column(String(100), nullable=False)

    diagnosis: Mapped[str | None] = mapped_column(Text)

    recommendation: Mapped[str | None] = mapped_column(Text)

    root_cause: Mapped[str | None] = mapped_column(Text)

    action_taken: Mapped[str | None] = mapped_column(Text)

    extra_metadata: Mapped[dict | None] = mapped_column("metadata", JSONB, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())



    equipment: Mapped["Equipment"] = relationship(back_populates="logbook_entries")





class FeedbackEntry(Base):

    __tablename__ = "feedback_entries"



    id: Mapped[str] = mapped_column(String(50), primary_key=True)

    equipment_id: Mapped[str] = mapped_column(String(50), ForeignKey("equipment.id", ondelete="CASCADE"))

    recommendation_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)

    actual_root_cause: Mapped[str | None] = mapped_column(Text)

    repair_outcome: Mapped[str | None] = mapped_column(Text)

    notes: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())





class IngestRecord(Base):

    __tablename__ = "ingest_history"



    id: Mapped[str] = mapped_column(String(50), primary_key=True)

    input_type: Mapped[str] = mapped_column(String(100), nullable=False)

    equipment_id: Mapped[str | None] = mapped_column(String(50))

    payload_summary: Mapped[str | None] = mapped_column(Text)

    routing: Mapped[dict | None] = mapped_column(JSONB, default=dict)

    status: Mapped[str] = mapped_column(String(50), default="completed")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())





class KnowledgeDocument(Base):

    __tablename__ = "knowledge_documents"



    id: Mapped[str] = mapped_column(String(50), primary_key=True)

    filename: Mapped[str] = mapped_column(String(500), nullable=False)

    doc_type: Mapped[str] = mapped_column(String(100), default="manual")

    equipment_id: Mapped[str | None] = mapped_column(String(50))

    size_bytes: Mapped[int] = mapped_column(Integer, default=0)

    indexed: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())





class ReportRecord(Base):

    __tablename__ = "reports"



    id: Mapped[str] = mapped_column(String(50), primary_key=True)

    equipment_id: Mapped[str] = mapped_column(String(50), ForeignKey("equipment.id", ondelete="CASCADE"))

    report_type: Mapped[str] = mapped_column(String(100), nullable=False)

    content: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())





class AdminUser(Base):

    __tablename__ = "admin_users"



    id: Mapped[str] = mapped_column(String(50), primary_key=True)

    email: Mapped[str] = mapped_column(String(200), nullable=False)

    name: Mapped[str] = mapped_column(String(200), nullable=False)

    role_id: Mapped[str] = mapped_column(String(50), nullable=False)

    enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())





class AuditLog(Base):

    __tablename__ = "audit_logs"



    id: Mapped[str] = mapped_column(String(50), primary_key=True)

    action: Mapped[str] = mapped_column(String(200), nullable=False)

    user: Mapped[str] = mapped_column(String(200), nullable=False)

    resource: Mapped[str] = mapped_column(String(200), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())





class AlertHistory(Base):

    __tablename__ = "alert_history"



    id: Mapped[str] = mapped_column(String(50), primary_key=True)

    alert_id: Mapped[str] = mapped_column(String(50), ForeignKey("alerts.id", ondelete="CASCADE"))

    action: Mapped[str] = mapped_column(String(100), nullable=False)

    user: Mapped[str] = mapped_column(String(200), nullable=False)

    assignee: Mapped[str | None] = mapped_column(String(200))

    notes: Mapped[str | None] = mapped_column(Text)

    work_order_id: Mapped[str | None] = mapped_column(String(50))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())





class AdminSetting(Base):

    __tablename__ = "admin_settings"



    key: Mapped[str] = mapped_column(String(100), primary_key=True)

    value: Mapped[str] = mapped_column(Text, nullable=False)


