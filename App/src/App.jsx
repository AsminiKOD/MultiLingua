import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { EmojiConvertor } from 'emoji-js'
import { PaperPlaneIcon } from '@radix-ui/react-icons'

const emoji = new EmojiConvertor()
emoji.replace_mode = 'unified'
emoji.allow_native = true

function App() {
  const [file, setFile] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const chatEndRef = useRef(null)

  const toggleDarkMode = () => setDarkMode(!darkMode)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const uploadFile = async () => {
    if (!file) return toast.error('Please select a file!')
    const formData = new FormData()
    formData.append('file', file)
    try {
      setLoading(true)
      await axios.post('http://localhost:8000/upload', formData)
      toast.success('✅ Document uploaded successfully.')
      setMessages(prev => [
        ...prev,
        { sender: 'system', text: '✅ Document uploaded and processed successfully.' }
      ])
    } catch {
      toast.error('❌ Failed to upload document.')
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
    const userMessage = { sender: 'user', text: emoji.replace_colons(input), time: new Date().toLocaleTimeString() }
    setMessages(prev => [...prev, userMessage])

    try {
      setLoading(true)
      const res = await axios.post('http://localhost:8000/ask', { question: input })
      const botMessage = { sender: 'bot', text: emoji.replace_colons(res.data.answer), time: new Date().toLocaleTimeString() }
      setMessages(prev => [...prev, botMessage])
    } catch {
      toast.error('❌ Failed to get response.')
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
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center py-10 px-4 transition-colors">
        <div className="w-full max-w-lg bg-white/90 dark:bg-gray-900/80 backdrop-blur-md rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.35)] transition-all">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">📝 Document Chat</h2>
            <button
              onClick={toggleDarkMode}
              className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-3 py-1 rounded-full text-xs shadow hover:scale-105 hover:shadow-lg transform transition"
            >
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>

          <div className="flex items-center space-x-2 mb-4">
            <input
              type="file"
              onChange={e => setFile(e.target.files[0])}
              className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition"
            />
            <button
              onClick={uploadFile}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1 rounded-full text-sm shadow-md hover:scale-105 hover:shadow-indigo-500 transform transition"
            >
              Upload
            </button>
          </div>

          <div className="h-80 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-800 space-y-2 transition-colors">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`rounded-2xl px-4 py-2 max-w-[80%] text-sm shadow animate-fade-in ${
                  msg.sender === 'user'
                    ? 'bg-indigo-100 dark:bg-indigo-800 self-end ml-auto text-gray-800 dark:text-gray-100'
                    : msg.sender === 'bot'
                    ? 'bg-emerald-100 dark:bg-emerald-800 self-start text-gray-800 dark:text-gray-100'
                    : 'bg-gray-200 dark:bg-gray-700 text-center text-gray-600 dark:text-gray-300 mx-auto'
                }`}
              >
                <p>{msg.text}</p>
                {msg.time && <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">{msg.time}</span>}
              </div>
            ))}
            {loading && (
              <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
                <p>🤖 Generating answer...</p>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="flex mt-4 space-x-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type your question with emojis... 😊"
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-1 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 transition"
            />
            <button
              onClick={sendMessage}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1 rounded-full text-sm shadow-md hover:scale-105 hover:shadow-emerald-500 transform transition flex items-center space-x-1"
            >
              <span>Send</span>
              <PaperPlaneIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
