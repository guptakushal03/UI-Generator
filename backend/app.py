from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from code_generator import generate_html_css

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

class DrawingData(BaseModel):
    elements: list

@app.post("/generate-code")
async def generate_code(data: DrawingData):
    html, css = generate_html_css(data.elements)
    return {"html": html, "css": css}
