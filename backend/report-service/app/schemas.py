from pydantic import BaseModel


class ReportViewOut(BaseModel):
    url: str
    expires_in: int


class ChatTurn(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    question: str
    history: list[ChatTurn] = []


class ChatResponse(BaseModel):
    answer: str
    disclaimer: str
