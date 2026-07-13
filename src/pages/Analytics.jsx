import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { askGemini } from '../lib/gemini.js'
import { readinessAreas } from '../data/hosaDashboardData.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { saveUserDataToAccount, loadUserDataFromAccount } from '../lib/userDataSync.js'

// Pre-defined initial mock sources
const INITIAL_SOURCES = [
  {
    id: 'src-1',
    title: 'HOSA A&P Study Guide 2026',
    tag: 'Guide',
    tagClass: 'guide',
    meta: '148 pages',
    active: true,
    content: 'Focuses on human anatomy and physiology, including the cardiovascular system, respiratory system, nervous system, cardiac cycle, endocrine system, and skeletal structures. Core concepts involve homeostasis, blood flow pathways, neural transmission, and muscle contraction.'
  },
  {
    id: 'src-2',
    title: 'Clinical Nursing Competencies',
    tag: 'PDF',
    tagClass: 'pdf',
    meta: '62 pages',
    active: true,
    content: 'Detailing standard clinical procedures, infection control, IV insertion protocols, medication administration safety (the 6 rights), patient assessment, wound care, and vital signs monitoring. Emphasizes patient safety and sterile techniques.'
  },
  {
    id: 'src-3',
    title: 'My Pharmacology Notes',
    tag: 'Notes',
    tagClass: 'notes',
    meta: '2,340 words',
    active: true,
    content: 'Notes on beta-adrenergic blockers (metoprolol, carvedilol) focusing on heart rate and renin reduction. Includes ACE inhibitors (lisinopril), calcium channel blockers, dosage calculations, and key adverse effects like orthostatic hypotension.'
  },
  {
    id: 'src-4',
    title: 'Emergency Preparedness Protocols',
    tag: 'PDF',
    tagClass: 'pdf',
    meta: '88 pages',
    active: false,
    content: 'Covers mass casualty triage using the START method (Simple Triage and Rapid Treatment), disaster response command structures, chemical exposure protocols, and emergency first aid for trauma and hemorrhage control.'
  },
  {
    id: 'src-5',
    title: 'Pasted: Cardiac Cycle Notes',
    tag: 'Pasted',
    tagClass: 'paste',
    meta: '890 words',
    active: true,
    content: 'Steps of the cardiac cycle: atrial systole, isovolumetric contraction, ventricular ejection, isovolumetric relaxation, and passive ventricular filling. Emphasizes pressure-volume relationships and the origin of heart sounds S1 and S2.'
  }
]

function Analytics() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sources, setSources] = useState(INITIAL_SOURCES)
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'model',
      content: "I've loaded your active sources. You have solid coverage of A&P, Clinical Nursing, and Pharmacology notes. What do you want to work on? I can explain a concept, quiz weak areas, or flag gaps before States."
    }
  ])

  // Load chat history from cache instantly, then fetch from Supabase in the background
  useEffect(() => {
    if (user?.id) {
      // 1. Instant load from localStorage cache
      const saved = localStorage.getItem(`hosa-plus-aihub-chat:${user.id}`)
      if (saved) {
        try {
          setChatHistory(JSON.parse(saved))
        } catch (e) {
          console.error(e)
        }
      }

      // 2. Load from Supabase in the background
      loadUserDataFromAccount(user.id).then(userData => {
        if (userData?.chatHistory && userData.chatHistory.length > 0) {
          setChatHistory(userData.chatHistory)
        }
      })
    }
  }, [user?.id])

  // Save chat history to localStorage and Supabase
  useEffect(() => {
    if (user?.id && chatHistory.length > 0) {
      // Still write to localStorage instantly
      localStorage.setItem(`hosa-plus-aihub-chat:${user.id}`, JSON.stringify(chatHistory))
      // Save to Supabase account in background
      saveUserDataToAccount(user.id, chatHistory, undefined)
    }
  }, [chatHistory, user?.id])

  // Handle auto-trigger of query parameter on mount/redirect
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      // Clear query parameter so it doesn't run again on reload
      setSearchParams({}, { replace: true })

      const runInitialQuery = async () => {
        setLoading(true)

        // Small delay to ensure loaded chat history has settled
        await new Promise((resolve) => setTimeout(resolve, 200))

        let currentHistory = []
        setChatHistory((prev) => {
          if (prev.length > 0 && prev[prev.length - 1].content === q && prev[prev.length - 1].role === 'user') {
            return prev
          }
          currentHistory = [...prev, { role: 'user', content: q }]
          return currentHistory
        })

        try {
          const sourceContext = getSourcesContext()
          let systemInstruction = `You are HOSA+ AI, a high-fidelity intelligence assistant built for clinical and medical competitive preparation.
Your goal is to help the student master their topics based on the active sources they have toggled.
Current Mode Selected by Student: "${mode}".
Below is the content of the student's active sources. You MUST ground your responses, quizzes, explanations, and advice in these sources as much as possible.

--- ACTIVE SOURCES CONTEXT ---
${sourceContext}
--- END CONTEXT ---

Guidelines:
- If Mode is "explain": provide clear, clinically robust breakdowns of concepts, highlighting key terms.
- If Mode is "quiz": act as an examiner. Ask ONE medical or clinical question at a time. Challenge their reasoning, evaluate their answer, and provide positive/constructive feedback.
- If Mode is "weak": identify potential conceptual weak spots, ask probing diagnostics, and outline critical areas they need to review.
- If Mode is "summarize": provide condensed, highly readable takeaways with bold points.
- Always sound professional, supportive, and clinical.`

          const response = await askGemini(q, systemInstruction, currentHistory.slice(0, -1))
          setChatHistory((prev) => [...prev, { role: 'model', content: response }])
        } catch (err) {
          console.error(err)
          setChatHistory((prev) => [
            ...prev,
            {
              role: 'model',
              content: "Sorry, I encountered an issue connecting to Gemini. Please check your internet connection or API key."
            }
          ])
        } finally {
          setLoading(false)
        }
      }

      runInitialQuery()
    }
  }, [searchParams, setSearchParams])

  const [inputVal, setInputVal] = useState('')
  const [mode, setMode] = useState('explain')
  const [loading, setLoading] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(263) // 04:23 to match demo
  const [studioOutput, setStudioOutput] = useState('')
  const [studioLoading, setStudioLoading] = useState(false)
  
  // Custom source inputs
  const [showAddSource, setShowAddSource] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newTag, setNewTag] = useState('Notes')
  const [webSearchQuery, setWebSearchQuery] = useState('')

  const chatEndRef = useRef(null)
  const notepadRef = useRef(null)

  // Increment session timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatHistory])

  // Sync state to contenteditable notepad
  useEffect(() => {
    if (notepadRef.current) {
      notepadRef.current.innerText = studioOutput
    }
  }, [studioOutput])

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60)
    const remainingSecs = secs % 60
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`
  }

  const toggleSource = (id) => {
    setSources((prev) =>
      prev.map((src) => (src.id === id ? { ...src, active: !src.active } : src))
    )
  }

  const activeSources = sources.filter((s) => s.active)
  const activeCount = activeSources.length
  const totalCount = sources.length
  const percentUsed = Math.round((activeCount / totalCount) * 100)

  // Compile active sources context for Gemini prompt
  const getSourcesContext = () => {
    if (activeSources.length === 0) {
      return "No active sources are selected. Use general medical knowledge."
    }
    return activeSources.map((s) => `[Source: ${s.title} (${s.tag})]\n${s.content}`).join('\n\n')
  }

  // Handle Chat message submit
  const handleSend = async () => {
    if (!inputVal.trim() || loading) return

    const userMessage = inputVal
    setInputVal('')
    setChatHistory((prev) => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const sourceContext = getSourcesContext()
      
      let systemInstruction = `You are HOSA+ AI, a high-fidelity intelligence assistant built for clinical and medical competitive preparation.
Your goal is to help the student master their topics based on the active sources they have toggled.
Current Mode Selected by Student: "${mode}".
Below is the content of the student's active sources. You MUST ground your responses, quizzes, explanations, and advice in these sources as much as possible.

--- ACTIVE SOURCES CONTEXT ---
${sourceContext}
--- END CONTEXT ---

Guidelines:
- If Mode is "explain": provide clear, clinically robust breakdowns of concepts, highlighting key terms.
- If Mode is "quiz": act as an examiner. Ask ONE medical or clinical question at a time. Challenge their reasoning, evaluate their answer, and provide positive/constructive feedback.
- If Mode is "weak": identify potential conceptual weak spots, ask probing diagnostics, and outline critical areas they need to review.
- If Mode is "summarize": provide condensed, highly readable takeaways with bold points.
- Always sound professional, supportive, and clinical.`

      const response = await askGemini(userMessage, systemInstruction, chatHistory)
      setChatHistory((prev) => [...prev, { role: 'model', content: response }])
    } catch (err) {
      console.error(err)
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'model',
          content: "Sorry, I encountered an issue connecting to Gemini. Please check your internet connection or API key."
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Handle web search or quick add
  const handleWebSearch = async (e) => {
    if (e.key === 'Enter' && webSearchQuery.trim()) {
      const query = webSearchQuery
      setWebSearchQuery('')
      
      // Add a loading source to show feedback
      const tempId = `web-${Date.now()}`
      const newSrc = {
        id: tempId,
        title: `Searching: "${query}"...`,
        tag: 'Web',
        tagClass: 'guide',
        meta: 'Loading...',
        active: true,
        content: 'Loading search context...'
      }
      setSources((prev) => [...prev, newSrc])

      try {
        const prompt = `Search result content summary for HOSA study related to: "${query}". Write a brief 3-4 sentence comprehensive overview summarizing the core medical/clinical concepts of this topic so it can be used as a study source.`
        const result = await askGemini(prompt, "You are a medical research engine indexing key concepts for a HOSA competitor.")
        
        setSources((prev) =>
          prev.map((src) =>
            src.id === tempId
              ? {
                  ...src,
                  title: `Web: ${query.length > 28 ? query.substring(0, 25) + '...' : query}`,
                  meta: 'Retrieved',
                  content: result
                }
              : src
          )
        )
      } catch (err) {
        console.error(err)
        setSources((prev) => prev.filter((src) => src.id !== tempId))
      }
    }
  }

  // Handle manual source submission
  const handleAddCustomSource = () => {
    if (!newTitle.trim() || !newContent.trim()) return

    const newSrc = {
      id: `custom-${Date.now()}`,
      title: newTitle,
      tag: newTag,
      tagClass: newTag.toLowerCase() === 'pdf' ? 'pdf' : newTag.toLowerCase() === 'guide' ? 'guide' : newTag.toLowerCase() === 'pasted' ? 'paste' : 'notes',
      meta: `${newContent.split(/\s+/).length} words`,
      active: true,
      content: newContent
    }

    setSources((prev) => [...prev, newSrc])
    setNewTitle('')
    setNewContent('')
    setShowAddSource(false)
  }

  // Studio tool execution (Study Guide, Flashcards, Quiz generation)
  const runStudioTool = async (toolType, toolLabel) => {
    setStudioLoading(true)
    setStudioOutput(`Generating ${toolLabel} from ${activeCount} active sources...`)

    try {
      const sourceContext = getSourcesContext()
      let prompt = ''

      switch (toolType) {
        case 'audio':
          prompt = `Create a short, engaging educational podcast script where a clinical tutor explains key points from these sources in a conversational style. Format as a host script: \n\n${sourceContext}`
          break
        case 'guide':
          prompt = `Generate a structured, clinical Study Guide summarizing these sources. Include high-yield bullet points, core definitions, and key exam concepts: \n\n${sourceContext}`
          break
        case 'mindmap':
          prompt = `Create a hierarchical ASCII text mind map showing structural connections and sub-relationships between topics in these sources: \n\n${sourceContext}`
          break
        case 'flashcards':
          prompt = `Generate a set of 5 distinct flashcard terms and definitions from these sources. Format clearly: \nTerm: [name]\nDefinition: [explanation]\n\n${sourceContext}`
          break
        case 'quiz':
          prompt = `Generate a 5-question multiple choice quiz with brief answer explanations based on these sources:\n\n${sourceContext}`
          break
        case 'table':
          prompt = `Synthesize a markdown comparison table organizing the key medical terms, drug classes, or clinical concepts present in these sources:\n\n${sourceContext}`
          break
        default:
          prompt = `Summarize: \n\n${sourceContext}`
      }

      const response = await askGemini(prompt, "You are an advanced HOSA Studio content generator. Provide clean, well-formatted text output.")
      setStudioOutput(response)
    } catch (err) {
      console.error(err)
      setStudioOutput("Error generating studio content. Please try again.")
    } finally {
      setStudioLoading(false)
    }
  }

  return (
    <div id="v-aihub" className="view active" style={{ padding: 0, height: '100vh', overflow: 'hidden' }}>
      <div className="aihub-wrap" style={{ display: 'flex', flex: 1, height: '100%', minHeight: 0 }}>
        
        {/* ── SOURCES PANEL (LEFT) ── */}
        <div className="aihub-left" style={{ width: '280px', flexShrink: 0 }}>
          <div className="aihub-left-hdr">
            <div className="aihub-left-title">Sources</div>
            <button className="aihub-add-btn" onClick={() => setShowAddSource(!showAddSource)}>
              <span style={{ fontSize: '15px', fontWeight: 300 }}>+</span> Add sources
            </button>
            <div className="aihub-search-bar" style={{ marginTop: '9px' }}>
              <span style={{ color: '#a0adc2', fontSize: '12px' }}>🔍</span>
              <input
                type="text"
                placeholder="Search web for new sources..."
                value={webSearchQuery}
                onChange={(e) => setWebSearchQuery(e.target.value)}
                onKeyDown={handleWebSearch}
              />
            </div>
          </div>

          <div className="aihub-sources-list" style={{ flex: 1, overflowY: 'auto' }}>
            {showAddSource && (
              <div style={{ padding: '10px', background: '#f8faff', border: '1px solid #dde5f5', borderRadius: '8px', margin: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#1a2340', marginBottom: '6px' }}>New Source</div>
                <input
                  type="text"
                  placeholder="Title (e.g. Cardiopulmonary Notes)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: '100%', fontSize: '11px', padding: '6px', border: '1px solid #dde5f5', borderRadius: '4px', marginBottom: '6px' }}
                />
                <textarea
                  placeholder="Paste context content here..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={4}
                  style={{ width: '100%', fontSize: '11px', padding: '6px', border: '1px solid #dde5f5', borderRadius: '4px', marginBottom: '6px', fontFamily: 'inherit' }}
                />
                <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                  <select
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    style={{ fontSize: '11px', padding: '4px', border: '1px solid #dde5f5', borderRadius: '4px', flex: 1 }}
                  >
                    <option value="Notes">Notes</option>
                    <option value="PDF">PDF</option>
                    <option value="Guide">Guide</option>
                    <option value="Pasted">Pasted</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowAddSource(false)} style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleAddCustomSource} style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', border: 'none', background: 'var(--navy)', color: 'white', cursor: 'pointer' }}>Add</button>
                </div>
              </div>
            )}

            <div style={{ fontSize: '9px', color: '#b0bcd0', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'var(--mono)', marginBottom: '8px', padding: '0 12px' }}>
              Saved sources
            </div>

            {sources.map((source) => (
              <div key={source.id} className={`aihub-source-card ${source.active ? 'active' : ''}`}>
                <div className="aihub-source-toggle">
                  <div className={`aihub-toggle ${source.active ? 'on' : ''}`} onClick={() => toggleSource(source.id)}></div>
                  <div className="aihub-source-title" style={{ userSelect: 'none' }}>{source.title}</div>
                </div>
                <div className="aihub-source-meta">
                  <span className={`aihub-tag ${source.tagClass}`}>{source.tag}</span>
                  <span>{source.meta}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="aihub-ctx">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <div className="aihub-ctx-lbl">Context used</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: '#1A2E4A', fontWeight: 600 }}>{percentUsed}%</div>
            </div>
            <div className="aihub-ctx-bar">
              <div className="aihub-ctx-fill" style={{ width: `${percentUsed}%` }}></div>
            </div>
            <div className="aihub-ctx-txt">{activeCount} of {totalCount} sources active</div>
          </div>
        </div>

        {/* ── CHAT PANEL (MIDDLE) ── */}
        <div className="aihub-right" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="aihub-right-hdr">
            <div className="aihub-right-hdr-title">
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 6px rgba(34,197,94,0.5)', marginRight: '6px' }}></span>
              AI Hub
              <span style={{ fontSize: '10px', color: '#b0bcd0', fontWeight: 400, marginLeft: '6px' }}>· Active Session</span>
            </div>
            <div className="aihub-right-hdr-timer">
              {formatTime(elapsedSeconds)} elapsed · {chatHistory.length} messages
            </div>
          </div>

          <div className="aihub-mode-bar">
            <span style={{ fontSize: '10.5px', color: '#8a9ab8', whiteSpace: 'nowrap', flexShrink: 0 }}>Mode</span>
            <select className="aihub-mode-select" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="explain">Explain</option>
              <option value="quiz">Quiz Me</option>
              <option value="weak">Find Weak Points</option>
              <option value="summarize">Summarize</option>
            </select>
            <div style={{ flex: 1 }}></div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: '#b0bcd0' }}>
              {chatHistory.length} msgs
            </span>
          </div>

          <div className="aihub-chat" style={{ flex: 1, overflowY: 'auto' }}>
            {chatHistory.map((msg, index) => (
              <div key={index} className={`aihub-msg ${msg.role === 'user' ? 'user' : 'ai'}`}>
                <div className="aihub-msg-lbl">
                  {msg.role === 'user' ? 'YOU' : 'HOSA+ AI'}
                </div>
                <div className="aihub-msg-bubble" style={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="aihub-msg ai">
                <div className="aihub-msg-lbl">HOSA+ AI</div>
                <div className="aihub-msg-bubble" style={{ color: '#8a9ab8', fontStyle: 'italic' }}>
                  Generating response...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="aihub-input-bar">
            <input
              className="aihub-inp"
              placeholder="Start typing..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading}
              autoComplete="off"
            />
            <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: '#b0bcd0', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {activeCount} sources
            </span>
            <button className="aihub-send" onClick={handleSend} disabled={loading}>
              &#10148;
            </button>
          </div>
        </div>

        {/* ── STUDIO PANEL (RIGHT) ── */}
        <div className="aihub-studio" style={{ width: '280px', flexShrink: 0 }}>
          <div className="aihub-studio-hdr">
            <div className="aihub-studio-title">Studio</div>
            <div className="aihub-studio-sub">Generate from your sources</div>
          </div>
          <div className="aihub-studio-list" style={{ flex: 1, overflowY: 'auto' }}>
            <div className="aihub-srow featured-row" onClick={() => runStudioTool('audio', 'Audio Overview')}>
              <div>
                <div className="aihub-srow-label">Audio Overview</div>
                <div className="aihub-srow-sub">AI-generated podcast script</div>
              </div>
              <span className="aihub-srow-arrow">&#8250;</span>
            </div>
            <div className="aihub-srow" onClick={() => runStudioTool('guide', 'Study Guide')}>
              <div>
                <div className="aihub-srow-label">Study Guide</div>
                <div className="aihub-srow-sub">Summary + key points</div>
              </div>
              <span className="aihub-srow-arrow">&#8250;</span>
            </div>
            <div className="aihub-srow" onClick={() => runStudioTool('mindmap', 'Mind Map')}>
              <div>
                <div className="aihub-srow-label">Mind Map</div>
                <div className="aihub-srow-sub">Visual concept hierarchy</div>
              </div>
              <span className="aihub-srow-arrow">&#8250;</span>
            </div>
            <div className="aihub-srow" onClick={() => runStudioTool('flashcards', 'Flashcards')}>
              <div>
                <div className="aihub-srow-label">Flashcards</div>
                <div className="aihub-srow-sub">Export list to review</div>
              </div>
              <span className="aihub-srow-arrow">&#8250;</span>
            </div>
            <div className="aihub-srow" onClick={() => runStudioTool('quiz', 'Quiz')}>
              <div>
                <div className="aihub-srow-label">Quiz</div>
                <div className="aihub-srow-sub">5 MCQ questions</div>
              </div>
              <span className="aihub-srow-arrow">&#8250;</span>
            </div>
            <div className="aihub-srow" onClick={() => runStudioTool('table', 'Data Table')}>
              <div>
                <div className="aihub-srow-label">Data Table</div>
                <div className="aihub-srow-sub">Drug charts, values</div>
              </div>
              <span className="aihub-srow-arrow">&#8250;</span>
            </div>
          </div>

          <div className="aihub-studio-footer" style={{ borderTop: '1px solid #edf0f7' }}>
            {studioLoading ? (
              <div style={{ fontSize: '11px', color: '#8a9ab8', fontStyle: 'italic', padding: '10px 0', textAlign: 'center' }}>
                Generating...
              </div>
            ) : (
              <div
                className="aihub-note-pad"
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Jot down a note or select a Studio tool above to generate notes..."
                ref={notepadRef}
                style={{ maxHeight: '200px', overflowY: 'auto' }}
              />
            )}
            <div className="aihub-studio-note">Studio output saves here after generation.</div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Analytics
