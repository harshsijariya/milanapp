from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.encoders import jsonable_encoder
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api/v1")

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Helper function to convert MongoDB document to dict
def mongo_to_dict(doc):
    """Convert MongoDB document to JSON-serializable dict"""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [mongo_to_dict(item) for item in doc]
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == '_id':
                result['_id'] = str(value)
            elif isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, dict):
                result[key] = mongo_to_dict(value)
            elif isinstance(value, list):
                result[key] = mongo_to_dict(value)
            else:
                result[key] = value
        return result
    return doc

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid authentication")
    user = await db.user_profile.find_one({"id": int(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Pydantic Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthRequest(BaseModel):
    email: EmailStr
    name: str
    google_id: str

class UserProfileCreate(BaseModel):
    name: Optional[str] = None
    marital_status: Optional[str] = None
    gender: Optional[str] = None
    complexion: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[int] = None
    diet: Optional[str] = None
    disability: Optional[str] = None
    blood_group: Optional[str] = None
    profile_created_by: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    town: Optional[str] = None
    mobile_number: Optional[str] = None
    fathers_contact_number: Optional[str] = None
    whatsapp_number: Optional[str] = None
    present_address: Optional[str] = None
    permanent_address: Optional[str] = None
    gotra: Optional[str] = None
    aakna: Optional[str] = None
    mother_tongue: Optional[str] = None
    date_of_birth: Optional[str] = None
    time_of_birth: Optional[str] = None
    place_of_birth: Optional[str] = None
    zodiac: Optional[str] = None
    fathers_name: Optional[str] = None
    fathers_occupation: Optional[str] = None
    mothers_name: Optional[str] = None
    mothers_occupation: Optional[str] = None
    no_of_married_brothers: Optional[int] = None
    no_of_unmarried_brothers: Optional[int] = None
    no_of_married_sisters: Optional[int] = None
    no_of_unmarried_sisters: Optional[int] = None
    maternal_uncles_name: Optional[str] = None
    maternal_uncles_aakna: Optional[str] = None
    house_status: Optional[str] = None
    car_status: Optional[str] = None
    education: Optional[str] = None
    education_detail: Optional[str] = None
    occupation_detail: Optional[str] = None
    annual_income: Optional[str] = None
    profession: Optional[str] = None
    partner_preferences: Optional[str] = None
    manglik: Optional[str] = None
    nakshatra: Optional[str] = None
    about_myself: Optional[str] = None
    work_city: Optional[str] = None
    employed_in: Optional[str] = None
    organization: Optional[str] = None
    profile_image: Optional[str] = None  # base64 (primary photo)
    profile_images: Optional[List[str]] = None  # list of base64 photos

class LikeRequest(BaseModel):
    liked_profile_id: int

class ShortlistRequest(BaseModel):
    shortlist_id: int

# Authentication Routes
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.user_profile.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Get next ID
    last_user = await db.user_profile.find_one(sort=[("id", -1)])
    next_id = (last_user["id"] + 1) if last_user else 1
    
    # Create user
    hashed_pw = hash_password(user_data.password)
    new_user = {
        "id": next_id,
        "email": user_data.email,
        "password": hashed_pw,
        "name": user_data.name,
        "status": "active",
        "creation_date": datetime.utcnow(),
        "last_login": datetime.utcnow(),
        "last_active": datetime.utcnow()
    }
    
    await db.user_profile.insert_one(new_user)
    
    token = create_access_token({"user_id": next_id, "email": user_data.email})
    
    return {
        "token": token,
        "user": {
            "id": next_id,
            "email": user_data.email,
            "name": user_data.name
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.user_profile.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Update last login
    await db.user_profile.update_one(
        {"id": user["id"]},
        {"$set": {"last_login": datetime.utcnow(), "last_active": datetime.utcnow()}}
    )
    
    token = create_access_token({"user_id": user["id"], "email": user["email"]})
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user.get("name", "")
        }
    }

@api_router.post("/auth/google")
async def google_auth(auth_data: GoogleAuthRequest):
    # Check if user exists
    user = await db.user_profile.find_one({"email": auth_data.email})
    
    if not user:
        # Create new user
        last_user = await db.user_profile.find_one(sort=[("id", -1)])
        next_id = (last_user["id"] + 1) if last_user else 1
        
        new_user = {
            "id": next_id,
            "email": auth_data.email,
            "name": auth_data.name,
            "google_id": auth_data.google_id,
            "status": "active",
            "creation_date": datetime.utcnow(),
            "last_login": datetime.utcnow(),
            "last_active": datetime.utcnow()
        }
        
        await db.user_profile.insert_one(new_user)
        user_id = next_id
    else:
        user_id = user["id"]
        # Update last login
        await db.user_profile.update_one(
            {"id": user_id},
            {"$set": {"last_login": datetime.utcnow(), "last_active": datetime.utcnow()}}
        )
    
    token = create_access_token({"user_id": user_id, "email": auth_data.email})
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": auth_data.email,
            "name": auth_data.name
        }
    }

# Profile Routes
@api_router.get("/profile/me")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    # Convert MongoDB document to JSON-serializable dict
    user_data = mongo_to_dict(current_user)
    # Remove sensitive data
    if 'password' in user_data:
        del user_data['password']
    return user_data

@api_router.put("/profile/update")
async def update_profile(profile_data: UserProfileCreate, current_user: dict = Depends(get_current_user)):
    update_data = profile_data.dict(exclude_unset=True)
    update_data["last_active"] = datetime.utcnow()
    
    await db.user_profile.update_one(
        {"id": current_user["id"]},
        {"$set": update_data}
    )
    
    updated_user = await db.user_profile.find_one({"id": current_user["id"]})
    return mongo_to_dict(updated_user)

@api_router.get("/profiles")
async def get_profiles(skip: int = 0, limit: int = 20, current_user: dict = Depends(get_current_user)):
    # Get profiles excluding current user
    profiles = await db.user_profile.find(
        {"id": {"$ne": current_user["id"]}, "status": "active"},
        {"password": 0}
    ).skip(skip).limit(limit).to_list(limit)
    
    return [mongo_to_dict(p) for p in profiles]

@api_router.get("/profile/{profile_id}")
async def get_profile(profile_id: int, current_user: dict = Depends(get_current_user)):
    profile = await db.user_profile.find_one({"id": profile_id}, {"password": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Track view
    await db.views.update_one(
        {"profile_id": profile_id, "viewed_by": current_user["id"]},
        {"$set": {"viewed_at": datetime.utcnow()}},
        upsert=True
    )
    
    return mongo_to_dict(profile)

# Like/Unlike Routes
@api_router.post("/like")
async def like_profile(like_data: LikeRequest, current_user: dict = Depends(get_current_user)):
    # Check if already liked
    existing = await db.profile_likes.find_one({
        "liked_profile_id": like_data.liked_profile_id,
        "liker_id": current_user["id"]
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already liked this profile")
    
    await db.profile_likes.insert_one({
        "liked_profile_id": like_data.liked_profile_id,
        "liker_id": current_user["id"],
        "liked_at": datetime.utcnow(),
        "status": "pending"
    })
    
    return {"message": "Profile liked successfully"}

@api_router.delete("/unlike/{profile_id}")
async def unlike_profile(profile_id: int, current_user: dict = Depends(get_current_user)):
    result = await db.profile_likes.delete_one({
        "liked_profile_id": profile_id,
        "liker_id": current_user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Like not found")
    
    return {"message": "Profile unliked successfully"}

@api_router.get("/likes/received")
async def get_received_likes(current_user: dict = Depends(get_current_user)):
    # Get all likes where current user is the liked profile
    likes = await db.profile_likes.find({"liked_profile_id": current_user["id"]}).to_list(100)
    
    # Get profile details for each liker
    result = []
    for like in likes:
        profile = await db.user_profile.find_one({"id": like["liker_id"]}, {"password": 0})
        if profile:
            result.append({
                "profile": mongo_to_dict(profile),
                "liked_at": like["liked_at"],
                "status": like.get("status", "pending")
            })
    
    return result

@api_router.get("/likes/sent")
async def get_sent_likes(current_user: dict = Depends(get_current_user)):
    # Get all likes sent by current user
    likes = await db.profile_likes.find({"liker_id": current_user["id"]}).to_list(100)
    
    # Get profile details for each liked profile
    result = []
    for like in likes:
        profile = await db.user_profile.find_one({"id": like["liked_profile_id"]}, {"password": 0})
        if profile:
            result.append({
                "profile": mongo_to_dict(profile),
                "liked_at": like["liked_at"],
                "status": like.get("status", "pending")
            })
    
    return result

@api_router.put("/like/accept/{liker_id}")
async def accept_like(liker_id: int, current_user: dict = Depends(get_current_user)):
    result = await db.profile_likes.update_one(
        {"liked_profile_id": current_user["id"], "liker_id": liker_id},
        {"$set": {"status": "accepted"}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Like not found")
    
    return {"message": "Like accepted"}

@api_router.put("/like/decline/{liker_id}")
async def decline_like(liker_id: int, current_user: dict = Depends(get_current_user)):
    result = await db.profile_likes.update_one(
        {"liked_profile_id": current_user["id"], "liker_id": liker_id},
        {"$set": {"status": "declined"}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Like not found")
    
    return {"message": "Like declined"}

# Shortlist Routes
@api_router.post("/shortlist")
async def add_to_shortlist(shortlist_data: ShortlistRequest, current_user: dict = Depends(get_current_user)):
    existing = await db.shortlist.find_one({
        "profile_id": current_user["id"],
        "shortlist_id": shortlist_data.shortlist_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already in shortlist")
    
    await db.shortlist.insert_one({
        "profile_id": current_user["id"],
        "shortlist_id": shortlist_data.shortlist_id
    })
    
    return {"message": "Added to shortlist"}

@api_router.delete("/shortlist/{profile_id}")
async def remove_from_shortlist(profile_id: int, current_user: dict = Depends(get_current_user)):
    result = await db.shortlist.delete_one({
        "profile_id": current_user["id"],
        "shortlist_id": profile_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not in shortlist")
    
    return {"message": "Removed from shortlist"}

@api_router.get("/shortlist")
async def get_shortlist(current_user: dict = Depends(get_current_user)):
    shortlisted = await db.shortlist.find({"profile_id": current_user["id"]}).to_list(100)
    
    result = []
    for item in shortlisted:
        profile = await db.user_profile.find_one({"id": item["shortlist_id"]}, {"password": 0})
        if profile:
            result.append(mongo_to_dict(profile))
    
    return result

# Views Routes
@api_router.get("/views/profile")
async def get_profile_views(current_user: dict = Depends(get_current_user)):
    views = await db.views.find({"profile_id": current_user["id"]}).to_list(100)
    
    result = []
    for view in views:
        profile = await db.user_profile.find_one({"id": view["viewed_by"]}, {"password": 0})
        if profile:
            result.append({
                "profile": mongo_to_dict(profile),
                "viewed_at": view["viewed_at"]
            })
    
    return result

# Include router
app.include_router(api_router)

# Add CORS middleware BEFORE router (this is important!)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
