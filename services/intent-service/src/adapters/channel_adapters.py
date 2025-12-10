"""
Channel adapters provide normalized intent request payloads for WhatsApp, email, and chat integrations.
"""
import re
from typing import Dict, Optional

from pydantic import BaseModel, Field


def _cleanup_text(text: str) -> str:
    collapsed = " ".join(text.strip().splitlines())
    cleaned = re.sub(r"https?://\S+", "", collapsed)
    cleaned = re.sub(r"\s{2,}", " ", cleaned)
    return cleaned.strip()


class WhatsAppChannelPayload(BaseModel):
    message_id: str
    body: str = Field(..., description="The WhatsApp message body")
    from_number: str
    customer_id: Optional[str] = None
    metadata: Optional[Dict[str, str]] = None


class EmailChannelPayload(BaseModel):
    subject: str
    body: str
    from_email: str
    thread_id: Optional[str] = None
    customer_id: Optional[str] = None
    metadata: Optional[Dict[str, str]] = None


class ChatChannelPayload(BaseModel):
    conversation_id: str
    user_input: str
    user_id: str
    customer_id: Optional[str] = None
    metadata: Optional[Dict[str, str]] = None


def prepare_whatsapp_payload(payload: WhatsAppChannelPayload) -> Dict[str, Optional[str]]:
    text = _cleanup_text(payload.body)
    metadata = {
        "message_id": payload.message_id,
        "from_number": payload.from_number,
        **(payload.metadata or {}),
    }
    return {
        "text": text,
        "channel": "whatsapp",
        "customer_id": payload.customer_id or payload.from_number,
        "source": "whatsapp",
        "metadata": metadata,
    }


def prepare_email_payload(payload: EmailChannelPayload) -> Dict[str, Optional[str]]:
    combined = f"{payload.subject} {payload.body}"
    cleaned = _cleanup_text(combined)
    metadata = {
        "from_email": payload.from_email,
        "thread_id": payload.thread_id,
        **(payload.metadata or {}),
    }
    return {
        "text": cleaned,
        "channel": "email",
        "customer_id": payload.customer_id or payload.from_email,
        "source": "email",
        "metadata": metadata,
    }


def prepare_chat_payload(payload: ChatChannelPayload) -> Dict[str, Optional[str]]:
    text = _cleanup_text(payload.user_input)
    metadata = {
        "conversation_id": payload.conversation_id,
        "user_id": payload.user_id,
        **(payload.metadata or {}),
    }
    return {
        "text": text,
        "channel": "chat",
        "customer_id": payload.customer_id or payload.user_id,
        "source": "chat",
        "metadata": metadata,
    }

