import os
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_community.chat_models import ChatOpenAI
from langchain_community.embeddings.openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain_core.documents import Document
from langchain_community.document_loaders import TextLoader

from deep_translator import GoogleTranslator
from langdetect import detect

load_dotenv()
OPENAI_API_KEY = os.getenv("API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("API_KEY not found in .env file")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

llm = ChatOpenAI(
    openai_api_key=OPENAI_API_KEY,
    temperature=0,
    model_name="gpt-3.5-turbo"
)
embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)

qa_chain_instance = None

# -----------------------------
# Enhanced System Prompt Template
# -----------------------------
custom_prompt = PromptTemplate(
    template="""
You are a knowledgeable assistant.  
Your job is to answer the user's question in detail using only the provided context.  
If the answer is not found in the context, reply with: "I'm sorry, I could not find the answer in the provided document."  
Explain concepts clearly, provide summaries when necessary, and do not refuse questions.  

Context:
{context}

Question:
{question}

Detailed Answer:""",
    input_variables=["question", "context"]
)

# -----------------------------
# Document Processing with Auto Language Detection
# -----------------------------
def load_and_prepare_documents(file_path):
    loader = TextLoader(file_path, encoding='utf-8')
    documents = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    split_docs = text_splitter.split_documents(documents)

    translated_docs = []
    for doc in split_docs:
        translated_text = GoogleTranslator(source='auto', target='en').translate(doc.page_content)
        translated_docs.append(Document(page_content=translated_text, metadata=doc.metadata))

    return translated_docs

# -----------------------------
# Initialize QA Chain with Retriever
# -----------------------------
def initialize_qa_chain(translated_docs):
    vector_store = Chroma.from_documents(translated_docs, embeddings)
    retriever = vector_store.as_retriever(search_kwargs={"k": 5})
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        chain_type_kwargs={"prompt": custom_prompt}
    )
    return qa_chain

# -----------------------------
# Helper Functions
# -----------------------------
def detect_language(text):
    try:
        return detect(text)
    except Exception:
        return "en"

def translate_text(text, target_lang):
    return GoogleTranslator(source='auto', target=target_lang).translate(text)

def multi_language_qa(user_question, qa_chain):
    input_lang = detect_language(user_question)
    question_in_english = translate_text(user_question, "en")
    answer_in_english = qa_chain.run(question_in_english)
    translated_answer = translate_text(answer_in_english, input_lang)
    return translated_answer

# -----------------------------
# FastAPI Routes
# -----------------------------
@app.post("/upload")
async def upload_file(file: UploadFile):
    global qa_chain_instance

    file_location = f"uploaded_{file.filename}"
    with open(file_location, "wb") as f:
        f.write(await file.read())

    docs = load_and_prepare_documents(file_location)
    qa_chain_instance = initialize_qa_chain(docs)

    return {"status": "File uploaded and QA system initialized successfully."}

class QuestionModel(BaseModel):
    question: str

@app.post("/ask")
async def ask_question(data: QuestionModel):
    if qa_chain_instance is None:
        return {"error": "No document uploaded yet."}

    answer = multi_language_qa(data.question, qa_chain_instance)
    return {"answer": answer}
