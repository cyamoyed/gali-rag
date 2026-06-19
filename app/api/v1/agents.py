from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.core.database import get_db
from app.schemas.schemas import AgentCreate, AgentUpdate, AgentResponse, ChatRequest, ConversationResponse
from app.services.agent_service import agent_service
from app.services.conv_service import conv_service
from app.services.kb_service import kb_service
from app.services.model_service import model_service
from app.models.models import Conversation, ChatMessage
import json
import asyncio

router = APIRouter()


@router.post("/agents", response_model=AgentResponse, summary="创建智能体")
def create_agent(data: AgentCreate, db: Session = Depends(get_db)):
    if data.llm_model_id:
        model = model_service.get(db, data.llm_model_id)
        if not model or model.model_type != "llm":
            raise HTTPException(400, "对话模型不存在或类型不正确")
    if data.knowledge_base_ids:
        for kb_id in data.knowledge_base_ids:
            if not kb_service.get(db, kb_id):
                raise HTTPException(400, f"知识库ID {kb_id} 不存在")
    agent = agent_service.create(
        db,
        kb_ids=data.knowledge_base_ids,
        name=data.name,
        description=data.description,
        avatar=data.avatar,
        llm_model_id=data.llm_model_id,
        system_prompt=data.system_prompt,
        opening_message=data.opening_message,
        suggested_questions=data.suggested_questions,
        temperature=data.temperature,
        max_tokens=data.max_tokens,
        top_k=data.top_k,
        similarity_threshold=data.similarity_threshold,
    )
    return AgentResponse(
        id=agent.id, name=agent.name, description=agent.description,
        avatar=agent.avatar, llm_model_id=agent.llm_model_id,
        system_prompt=agent.system_prompt, opening_message=agent.opening_message,
        suggested_questions=agent.suggested_questions,
        temperature=agent.temperature, max_tokens=agent.max_tokens,
        top_k=agent.top_k, similarity_threshold=agent.similarity_threshold,
        api_key=agent.api_key, status=agent.status,
        knowledge_base_ids=[kb.id for kb in agent.knowledge_bases],
        created_at=agent.created_at, updated_at=agent.updated_at,
    )


@router.get("/agents", response_model=List[AgentResponse], summary="查询智能体列表")
def list_agents(status: Optional[str] = None, db: Session = Depends(get_db)):
    agents = agent_service.get_all(db, status)
    result = []
    for a in agents:
        result.append(AgentResponse(
            id=a.id, name=a.name, description=a.description,
            avatar=a.avatar, llm_model_id=a.llm_model_id,
            system_prompt=a.system_prompt, opening_message=a.opening_message,
            suggested_questions=a.suggested_questions,
            temperature=a.temperature, max_tokens=a.max_tokens,
            top_k=a.top_k, similarity_threshold=a.similarity_threshold,
            api_key=a.api_key, status=a.status,
            knowledge_base_ids=[kb.id for kb in a.knowledge_bases],
            created_at=a.created_at, updated_at=a.updated_at,
        ))
    return result


@router.get("/agents/{agent_id}", response_model=AgentResponse, summary="查询单个智能体")
def get_agent(agent_id: int, db: Session = Depends(get_db)):
    agent = agent_service.get(db, agent_id)
    if not agent:
        raise HTTPException(404, "智能体不存在")
    return AgentResponse(
        id=agent.id, name=agent.name, description=agent.description,
        avatar=agent.avatar, llm_model_id=agent.llm_model_id,
        system_prompt=agent.system_prompt, opening_message=agent.opening_message,
        suggested_questions=agent.suggested_questions,
        temperature=agent.temperature, max_tokens=agent.max_tokens,
        top_k=agent.top_k, similarity_threshold=agent.similarity_threshold,
        api_key=agent.api_key, status=agent.status,
        knowledge_base_ids=[kb.id for kb in agent.knowledge_bases],
        created_at=agent.created_at, updated_at=agent.updated_at,
    )


@router.put("/agents/{agent_id}", response_model=AgentResponse, summary="更新智能体")
def update_agent(agent_id: int, data: AgentUpdate, db: Session = Depends(get_db)):
    if data.llm_model_id:
        model = model_service.get(db, data.llm_model_id)
        if not model or model.model_type != "llm":
            raise HTTPException(400, "对话模型不存在或类型不正确")
    if data.knowledge_base_ids is not None:
        for kb_id in data.knowledge_base_ids:
            if not kb_service.get(db, kb_id):
                raise HTTPException(400, f"知识库ID {kb_id} 不存在")
    agent = agent_service.update(
        db, agent_id,
        kb_ids=data.knowledge_base_ids,
        name=data.name,
        description=data.description,
        avatar=data.avatar,
        llm_model_id=data.llm_model_id,
        system_prompt=data.system_prompt,
        opening_message=data.opening_message,
        suggested_questions=data.suggested_questions,
        temperature=data.temperature,
        max_tokens=data.max_tokens,
        top_k=data.top_k,
        similarity_threshold=data.similarity_threshold,
    )
    if not agent:
        raise HTTPException(404, "智能体不存在")
    return AgentResponse(
        id=agent.id, name=agent.name, description=agent.description,
        avatar=agent.avatar, llm_model_id=agent.llm_model_id,
        system_prompt=agent.system_prompt, opening_message=agent.opening_message,
        suggested_questions=agent.suggested_questions,
        temperature=agent.temperature, max_tokens=agent.max_tokens,
        top_k=agent.top_k, similarity_threshold=agent.similarity_threshold,
        api_key=agent.api_key, status=agent.status,
        knowledge_base_ids=[kb.id for kb in agent.knowledge_bases],
        created_at=agent.created_at, updated_at=agent.updated_at,
    )


@router.delete("/agents/{agent_id}", summary="删除智能体")
def delete_agent(agent_id: int, db: Session = Depends(get_db)):
    if not agent_service.delete(db, agent_id):
        raise HTTPException(404, "智能体不存在")
    return {"code": 200, "message": "智能体已删除"}


@router.post("/agents/{agent_id}/publish", summary="发布智能体")
def publish_agent(agent_id: int, db: Session = Depends(get_db)):
    agent = agent_service.publish(db, agent_id)
    if not agent:
        raise HTTPException(404, "智能体不存在")
    return {"code": 200, "message": "智能体已发布", "data": {"api_key": agent.api_key}}


@router.post("/agents/{agent_id}/unpublish", summary="下线智能体")
def unpublish_agent(agent_id: int, db: Session = Depends(get_db)):
    agent = agent_service.unpublish(db, agent_id)
    if not agent:
        raise HTTPException(404, "智能体不存在")
    return {"code": 200, "message": "智能体已下线"}


@router.post("/agents/{agent_id}/regenerate-key", summary="重新生成API Key")
def regenerate_key(agent_id: int, db: Session = Depends(get_db)):
    api_key = agent_service.regenerate_api_key(db, agent_id)
    if not api_key:
        raise HTTPException(404, "智能体不存在")
    return {"code": 200, "data": {"api_key": api_key}}


@router.post("/agents/{agent_id}/chat", summary="智能体对话（流式/非流式，支持草稿测试）")
async def agent_chat(agent_id: int, data: ChatRequest, db: Session = Depends(get_db)):
    agent = agent_service.get(db, agent_id)
    if not agent:
        raise HTTPException(404, "智能体不存在")
    if not agent.llm_model_id:
        raise HTTPException(400, "智能体未配置对话模型")
    if not agent.knowledge_bases:
        raise HTTPException(400, "智能体未关联知识库")

    if data.conversation_id:
        conv = conv_service.get(db, data.conversation_id)
        if not conv:
            raise HTTPException(404, "会话不存在")
    else:
        conv = conv_service.create(db, agent_id=agent_id, source=data.source)

    chat_history = conv_service.get_chat_history(db, conv.id)
    conv_service.add_message(db, conv.id, "user", data.query)

    kb_collections = [kb.chroma_collection for kb in agent.knowledge_bases]

    agent_llm = _build_agent_llm(agent)

    if data.stream:
        return StreamingResponse(
            _agent_stream_response(
                data.query, agent, kb_collections, conv.id, chat_history, agent_llm, db=db,
            ),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )
    else:
        result = _run_agent_rag(data.query, agent, kb_collections, chat_history, agent_llm, db=db)
        if result["no_match"]:
            answer = result["answer"]
        else:
            answer = agent_llm.generate(result["prompt"])

        conv_service.add_message(
            db, conv.id, "assistant", answer,
            cited_sources=json.dumps(result["cited_sources"], ensure_ascii=False),
            conflict_info=json.dumps(result["conflict_info"], ensure_ascii=False) if result["conflict_info"] else "",
            latency_ms=result["latency_ms"],
        )
        return {
            "code": 200,
            "data": {
                "answer": answer,
                "conversation_id": conv.id,
                "cited_sources": result["cited_sources"],
                "conflict_info": result["conflict_info"],
                "latency_ms": result["latency_ms"],
            },
        }


@router.get("/agents/{agent_id}/conversations", response_model=List[ConversationResponse], summary="智能体会话列表")
def list_agent_conversations(agent_id: int, db: Session = Depends(get_db)):
    agent = agent_service.get(db, agent_id)
    if not agent:
        raise HTTPException(404, "智能体不存在")
    convs = conv_service.get_by_agent(db, agent_id)
    conv_ids = [c.id for c in convs]
    count_map = {}
    if conv_ids:
        rows = db.query(ChatMessage.conversation_id, func.count(ChatMessage.id)).filter(
            ChatMessage.conversation_id.in_(conv_ids)
        ).group_by(ChatMessage.conversation_id).all()
        count_map = {cid: cnt for cid, cnt in rows}
    return [
        ConversationResponse(
            id=c.id, agent_id=c.agent_id, title=c.title,
            message_count=count_map.get(c.id, 0),
            created_at=c.created_at, updated_at=c.updated_at,
        )
        for c in convs
    ]


def _build_agent_llm(agent):
    from app.rag.llm_client import LLMClient
    local_client = LLMClient()
    llm_model = agent.llm_model
    if llm_model:
        local_client.configure(
            provider=llm_model.provider,
            api_key=llm_model.api_key,
            base_url=llm_model.base_url,
            model=llm_model.model_name,
            temperature=agent.temperature,
        )
    return local_client


def _run_agent_rag(query: str, agent, kb_collections: list, chat_history: list, agent_llm=None, db=None) -> dict:
    import time
    start_time = time.time()
    all_reranked = []

    from app.rag.query_rewriter import query_rewriter
    from app.rag.multi_retriever import multi_retriever
    from app.rag.reranker import reranker
    from app.services.prompt_service import prompt_service
    from app.services.doc_service import doc_service

    preset_id = agent.preset_id if hasattr(agent, 'preset_id') else None
    rewritten_query = query_rewriter.rewrite(query, chat_history, custom_llm_client=agent_llm, db=db, preset_id=preset_id)

    for kb in agent.knowledge_bases:
        emb_client = doc_service._get_embedding_client(kb)
        query_embedding = emb_client.embed_query(rewritten_query)
        candidates = multi_retriever.retrieve(
            collection_name=kb.chroma_collection,
            query=rewritten_query,
            query_embedding=query_embedding,
        )
        reranked = reranker.rerank(
            query=rewritten_query, documents=candidates,
            top_k=agent.top_k, threshold=agent.similarity_threshold,
        )
        all_reranked.extend(reranked)

    all_reranked.sort(key=lambda x: x.get("final_score", x.get("score", 0)), reverse=True)
    all_reranked = all_reranked[:agent.top_k]

    if not all_reranked:
        no_match_msg = prompt_service.get_no_match_message()
        latency = int((time.time() - start_time) * 1000)
        return {
            "answer": no_match_msg, "cited_sources": [],
            "conflict_info": None, "latency_ms": latency, "no_match": True,
        }

    from app.rag.conflict_detector import conflict_detector
    conflict_info = conflict_detector.detect(rewritten_query, all_reranked, custom_llm_client=agent_llm, db=db, preset_id=preset_id)

    context = "\n\n---\n\n".join([
        f"[片段ID: {c.get('id', '')}, 相似度: {c.get('final_score', c.get('score', 0))}]\n{c.get('content', '')}"
        for c in all_reranked
    ])

    from app.utils.token_counter import truncate_history_by_tokens
    trimmed_history = truncate_history_by_tokens(chat_history, max_tokens=1024)
    history_text = "\n".join([f"{'用户' if m['role'] == 'user' else '助手'}: {m['content']}" for m in trimmed_history]) if trimmed_history else ""

    if agent.system_prompt:
        final_prompt = f"{agent.system_prompt}\n\n## 参考文档片段\n{context}\n\n## 对话历史\n{history_text}\n\n## 用户问题\n{query}\n\n回答:"
    else:
        from app.services.prompt_service import prompt_service
        qa_template = prompt_service.get_prompt_by_category("qa_main", db, preset_id=preset_id)
        cited_preview = "\n".join([
            f"- [{c.get('metadata', {}).get('doc_name', '')}] 片段ID: {c.get('id', '')}"
            for c in all_reranked
        ])
        conflict_text = conflict_info.get("description", "存在信息冲突") if conflict_info and conflict_info.get("has_conflict") else "无冲突"
        final_prompt = qa_template.replace("{{retrieval_chunks}}", context)
        final_prompt = final_prompt.replace("{{chat_history}}", history_text or "无")
        final_prompt = final_prompt.replace("{{cited_sources}}", cited_preview)
        final_prompt = final_prompt.replace("{{conflict_info}}", conflict_text)
        final_prompt = final_prompt.replace("{{user_query}}", query)

    cited_sources = []
    for chunk in all_reranked:
        cited_sources.append({
            "chunk_id": chunk.get("metadata", {}).get("chunk_db_id", 0),
            "doc_id": chunk.get("metadata", {}).get("doc_id", 0),
            "doc_name": chunk.get("metadata", {}).get("doc_name", ""),
            "content": chunk.get("content", "")[:500],
            "score": chunk.get("final_score", chunk.get("score", 0)),
        })

    latency = int((time.time() - start_time) * 1000)
    return {
        "prompt": final_prompt, "cited_sources": cited_sources,
        "conflict_info": conflict_info, "latency_ms": latency, "no_match": False,
    }


async def _agent_stream_response(query, agent, kb_collections, conv_id, chat_history, agent_llm, db=None):
    import time
    from app.core.database import SessionLocal
    start = time.time()
    full_answer = ""

    try:
        yield f"data: {json.dumps({'type': 'conversation_id', 'conversation_id': conv_id}, ensure_ascii=False)}\n\n"

        result = _run_agent_rag(query, agent, kb_collections, chat_history, agent_llm, db=db)

        if result["no_match"]:
            full_answer = result["answer"]
            yield f"data: {json.dumps({'type': 'token', 'content': result['answer']}, ensure_ascii=False)}\n\n"
        else:
            yield f"data: {json.dumps({'type': 'start'}, ensure_ascii=False)}\n\n"
            for token in agent_llm.generate_stream(result["prompt"]):
                full_answer += token
                yield f"data: {json.dumps({'type': 'token', 'content': token}, ensure_ascii=False)}\n\n"

        yield f"data: {json.dumps({'type': 'sources', 'cited_sources': result['cited_sources']}, ensure_ascii=False)}\n\n"
        yield f"data: {json.dumps({'type': 'conflict', 'conflict_info': result['conflict_info']}, ensure_ascii=False)}\n\n"
        latency = int((time.time() - start) * 1000)
        yield f"data: {json.dumps({'type': 'latency', 'latency_ms': latency}, ensure_ascii=False)}\n\n"
        yield f"data: {json.dumps({'type': 'end'}, ensure_ascii=False)}\n\n"

        db = SessionLocal()
        try:
            conv_service.add_message(
                db, conv_id, "assistant", full_answer,
                cited_sources=json.dumps(result.get("cited_sources", []), ensure_ascii=False),
                latency_ms=int((time.time() - start) * 1000),
            )
        finally:
            db.close()
    except Exception as e:
        error_msg = f"生成回答时出错: {str(e)}"
        yield f"data: {json.dumps({'type': 'error', 'content': error_msg}, ensure_ascii=False)}\n\n"
        if full_answer:
            db = SessionLocal()
            try:
                conv_service.add_message(db, conv_id, "assistant", full_answer,
                                         latency_ms=int((time.time() - start) * 1000))
            finally:
                db.close()
