"""Report access (S3 presign) and the document-scoped RAG chat (§4/§5 of the blueprint).

Access is scoped: staff (LAB_STAFF/LAB_ADMIN) may view any report; patients only their own
(account owner via mapping -> appointment). The RAG search is strictly filtered by report_id, so
context never bleeds across patients.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import CurrentUser, get_current_user
from ..bedrock import embed_text, generate_answer
from ..config import settings
from ..db import get_session
from ..s3 import generate_presigned_get_url
from ..schemas import ChatRequest, ChatResponse, ReportViewOut

router = APIRouter(tags=["reports"])

_DISCLAIMER = (
    "This AI explanation is for general understanding only and is not medical advice. "
    "Please consult a licensed clinician about your results."
)
_SYSTEM_PROMPT = (
    "You are a careful assistant that explains a single patient's lab report in plain, "
    "empathetic language. Answer ONLY from the provided report context. If the answer is not "
    "in the context, say you don't have that information. Never diagnose or prescribe."
)


async def _resolve_report_key(
    session: AsyncSession, report_id: uuid.UUID, user: CurrentUser
) -> str | None:
    """Return the report's S3 object key if this user may access it, else None.

    NOTE: assumes `lab_reports.s3_url` stores the object key within the reports bucket.
    """
    is_staff = bool({"LAB_STAFF", "LAB_ADMIN"}.intersection(user.groups))
    if is_staff:
        sql = "SELECT s3_url FROM lab_reports WHERE report_id = CAST(:rid AS uuid)"
        params: dict[str, str] = {"rid": str(report_id)}
    else:
        sql = (
            "SELECT lr.s3_url FROM lab_reports lr "
            "JOIN appointment_test_mapping atm ON atm.mapping_id = lr.mapping_id "
            "JOIN appointments a ON a.appointment_id = atm.appointment_id "
            "WHERE lr.report_id = CAST(:rid AS uuid) AND a.account_owner_id = CAST(:uid AS uuid)"
        )
        params = {"rid": str(report_id), "uid": user.sub}
    row = (await session.execute(text(sql), params)).first()
    return row[0] if row else None


@router.get("/reports", response_model=list[dict])
async def list_my_reports(user: CurrentUser = Depends(get_current_user)) -> list[dict]:
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "Not implemented in scaffold")


@router.get("/reports/{report_id}/view", response_model=ReportViewOut)
async def view_report(
    report_id: uuid.UUID,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ReportViewOut:
    key = await _resolve_report_key(session, report_id, user)
    if key is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Report not found")
    return ReportViewOut(
        url=generate_presigned_get_url(key),
        expires_in=settings.presigned_url_ttl_seconds,
    )


@router.post("/reports/{report_id}/chat", response_model=ChatResponse)
async def chat_with_report(
    report_id: uuid.UUID,
    payload: ChatRequest,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ChatResponse:
    # Authorize first (also confirms the report exists / is visible to this user).
    if await _resolve_report_key(session, report_id, user) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Report not found")

    question_vector = embed_text(payload.question)
    vector_literal = "[" + ",".join(f"{x:.8f}" for x in question_vector) + "]"

    # Document-scoped cosine search: strictly filtered to this report.
    rows = (
        await session.execute(
            text(
                "SELECT chunk_content FROM report_embeddings "
                "WHERE report_id = CAST(:rid AS uuid) "
                "ORDER BY embedding <=> CAST(:qvec AS vector) ASC LIMIT 3"
            ),
            {"rid": str(report_id), "qvec": vector_literal},
        )
    ).scalars().all()

    context_block = "\n\n".join(rows) if rows else "(no relevant report context found)"
    user_prompt = f"Report context:\n{context_block}\n\nPatient question: {payload.question}"
    answer = generate_answer(_SYSTEM_PROMPT, user_prompt)
    return ChatResponse(answer=answer, disclaimer=_DISCLAIMER)
