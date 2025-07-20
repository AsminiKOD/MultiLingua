import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [file, setFile] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const uploadFile = async () => {
    if (!file) return alert('Please select a file!')
    const formData = new FormData()
    formData.append('file', file)
    try {
      setLoading(true)
      await axios.post('http://localhost:8000/upload', formData)
      setMessages(prev => [
        ...prev,
        { sender: 'system', text: '✅ Document uploaded and processed successfully.' }
      ])
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { sender: 'system', text: '❌ Failed to upload document.' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMessage = { sender: 'user', text: input, time: new Date().toLocaleTimeString() }
    setMessages(prev => [...prev, userMessage])

    try {
      setLoading(true)
      const res = await axios.post('http://localhost:8000/ask', { question: input })
      const botMessage = { sender: 'bot', text: res.data.answer, time: new Date().toLocaleTimeString() }
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: '❌ Error fetching answer.', time: new Date().toLocaleTimeString() }
      ])
    } finally {
      setLoading(false)
      setInput('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">📄 Document Chatbot</h2>

        <div className="flex items-center space-x-2 mb-4">
          <input
            type="file"
            onChange={e => setFile(e.target.files[0])}
            className="flex-1 text-sm border rounded px-2 py-1"
          />
          <button
            onClick={uploadFile}
            className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 text-sm"
          >
            Upload
          </button>
        </div>

        <div className="h-80 overflow-y-auto border rounded p-3 bg-gray-50 flex flex-col space-y-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-2 rounded max-w-xs text-sm ${
                msg.sender === 'user'
                  ? 'bg-indigo-100 self-end text-right'
                  : msg.sender === 'bot'
                  ? 'bg-green-100 self-start text-left'
                  : 'bg-gray-200 self-center text-center'
              }`}
            >
              <p>{msg.text}</p>
              {msg.time && <span className="text-xs text-gray-500 block mt-1">{msg.time}</span>}
            </div>
          ))}
          {loading && <p className="text-gray-500 text-center text-sm">🤖 Typing...</p>}
          <div ref={chatEndRef} />
        </div>

        <div className="flex mt-4 space-x-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type your question..."
            className="flex-1 border rounded px-2 py-1 text-sm"
          />
          <button
            onClick={sendMessage}
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
