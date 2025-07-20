import { useState } from 'react'
import axios from 'axios'

function App() {
  const [file, setFile] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const uploadFile = async () => {
    if (!file) return alert('Please select a file!')
    const formData = new FormData()
    formData.append('file', file)
    try {
      setLoading(true)
      await axios.post('http://localhost:8000/upload', formData)
      alert('File uploaded successfully!')
    } catch (error) {
      alert('Failed to upload file.')
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMessage = { sender: 'user', text: input }
    setMessages(prev => [...prev, userMessage])

    try {
      setLoading(true)
      const res = await axios.post('http://localhost:8000/ask', { question: input })
      const botMessage = { sender: 'bot', text: res.data.answer }
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Error fetching answer.' }])
    } finally {
      setLoading(false)
      setInput('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-6">
      <div className="w-full max-w-md bg-white shadow rounded p-4">
        <h2 className="text-2xl font-bold text-center mb-4">Chat with Your Document</h2>

        <div className="mb-4 flex space-x-2">
          <input
            type="file"
            onChange={e => setFile(e.target.files[0])}
            className="flex-1 border rounded px-2 py-1 text-sm"
          />
          <button
            onClick={uploadFile}
            className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition text-sm"
          >
            Upload
          </button>
        </div>

        <div className="h-64 overflow-y-auto border rounded p-2 mb-4 bg-gray-50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-2 p-2 rounded ${
                msg.sender === 'user'
                  ? 'bg-indigo-100 self-end text-right'
                  : 'bg-green-100 self-start text-left'
              }`}
            >
              <span className="text-sm">{msg.text}</span>
            </div>
          ))}
          {loading && <p className="text-gray-500 text-sm">Typing...</p>}
        </div>

        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 border rounded px-2 py-1 text-sm"
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
