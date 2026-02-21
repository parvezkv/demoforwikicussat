import uuid
import os
import shutil
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, String, Boolean, DateTime, ForeignKey, Text, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.dialects.postgresql import UUID

# Database Setup
# Supabase Connection URL
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:reKeFrCSGcjjhdZI@db.xdxtvjslcyhhohneupao.supabase.co:5432/postgres?sslmode=require"
engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models
class Message(Base):
    __tablename__ = "wiki_cusat_messages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow)
    room_id = Column(String, index=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("wiki_cusat_messages.id", ondelete="CASCADE"), nullable=True)
    sender_name = Column(String)
    content = Column(Text)
    media_url = Column(String, nullable=True)
    media_type = Column(String, nullable=True)
    is_anonymous = Column(Boolean, default=False)
    likes = Column(Integer, default=0)
    dislikes = Column(Integer, default=0)

class Vote(Base):
    __tablename__ = "wiki_cusat_votes"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("wiki_cusat_messages.id", ondelete="CASCADE"))
    user_name = Column(String)
    vote_type = Column(String) # 'like' or 'dislike'

Base.metadata.create_all(bind=engine)

# Pydantic Schemas
class MessageBase(BaseModel):
    room_id: str
    content: str
    sender_name: str
    is_anonymous: bool = False
    parent_id: Optional[uuid.UUID] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None

class VoteRequest(BaseModel):
    user_name: str
    vote_type: str # 'like', 'dislike', 'none'

class MessageDisplay(MessageBase):
    id: uuid.UUID
    created_at: datetime
    likes: int
    dislikes: int
    class Config:
        orm_mode = True

# FastAPI App
app = FastAPI()

# Ensure uploads directory exists
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# Mount static files to serve uploaded images
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_extension = os.path.splitext(file.filename)[1]
    file_name = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"url": f"/uploads/{file_name}"}

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Connection Manager for WebSockets
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.get("/messages/{room_id}", response_model=List[MessageDisplay])
def get_messages(room_id: str, db: Session = Depends(get_db)):
    return db.query(Message).filter(Message.room_id == room_id).order_by(Message.created_at.desc()).all()

@app.post("/messages", response_model=MessageDisplay)
async def create_message(message: MessageBase, db: Session = Depends(get_db)):
    db_message = Message(**message.dict())
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    # Broadcast new message via JSON
    await manager.broadcast(db_message.id.hex) 
    return db_message

@app.put("/messages/{message_id}", response_model=MessageDisplay)
async def update_message(message_id: uuid.UUID, message_update: MessageBase, db: Session = Depends(get_db)):
    db_message = db.query(Message).filter(Message.id == message_id).first()
    if not db_message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    db_message.content = message_update.content
    db.commit()
    db.refresh(db_message)
    
    # Broadcast update
    await manager.broadcast(f"update:{db_message.id.hex}")
    return db_message

@app.post("/messages/{message_id}/vote", response_model=MessageDisplay)
async def vote_message(message_id: uuid.UUID, vote: VoteRequest, db: Session = Depends(get_db)):
    db_message = db.query(Message).filter(Message.id == message_id).first()
    if not db_message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Check for existing vote
    existing_vote = db.query(Vote).filter(Vote.message_id == message_id, Vote.user_name == vote.user_name).first()
    
    # Logic: 
    # If same as existing -> remove vote
    # If different -> update vote
    # If new -> add vote
    
    new_type = vote.vote_type if vote.vote_type in ['like', 'dislike'] else None
    
    if existing_vote:
        # User is changing or removing their vote
        if existing_vote.vote_type == 'like':
            db_message.likes -= 1
        else:
            db_message.dislikes -= 1
            
        if existing_vote.vote_type == new_type:
            # Toggle off
            db.delete(existing_vote)
        else:
            # Change type
            existing_vote.vote_type = new_type
            if new_type == 'like':
                db_message.likes += 1
            elif new_type == 'dislike':
                db_message.dislikes += 1
            else:
                db.delete(existing_vote)
    elif new_type:
        # New vote
        new_vote_entry = Vote(message_id=message_id, user_name=vote.user_name, vote_type=new_type)
        db.add(new_vote_entry)
        if new_type == 'like':
            db_message.likes += 1
        else:
            db_message.dislikes += 1
            
    db.commit()
    db.refresh(db_message)
    await manager.broadcast(f"update:{db_message.id.hex}")
    return db_message

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
