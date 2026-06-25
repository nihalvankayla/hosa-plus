import { useEffect, useMemo, useRef, useState } from 'react'
import { SQT1_EVENTS } from '../data/events.js'
import { askGemini } from '../lib/gemini.js'

const STUDY_PLAN_CURRICULUM = [
  week(1, 'Jun 24-Jun 30', 'Phase 1 - Build the Foundation', [
    day('Monday', ["Read through your event's official HOSA guidelines, highlight every bolded term"], '35 min'),
    day('Tuesday', ['Write definitions for 15 key terms from memory without looking'], '40 min'),
    day('Wednesday', ['Make a one-page cheat sheet of the most important concepts'], '30 min'),
    day('Thursday', ['Quiz yourself on your cheat sheet, rewrite anything you got wrong'], '35 min'),
    day('Friday', ["Do 20 flashcard reps on this week's terms"], '25 min'),
    day('Saturday', ['Write a full summary of everything you learned this week from memory, then check it'], '75 min', 'review'),
    day('Sunday', ['Rest'], 'Off', 'rest'),
  ]),
  week(2, 'Jul 1-Jul 7', 'Phase 1 - Build the Foundation', [
    day('Monday', ['Expand your term list by 15 more, write each one in a sentence'], '40 min'),
    day('Tuesday', ['Compare your definitions to the official HOSA study material, fix any gaps'], '35 min'),
    day('Wednesday', ['Do 25 flashcard reps mixing week 1 and week 2 terms'], '30 min'),
    day('Thursday', ['Take a 10-question self-written quiz on all terms so far'], '40 min'),
    day('Friday', ['Review every term you missed this week, rewrite definitions twice'], '30 min'),
    day('Saturday', ['Timed recall: write as many terms and definitions as possible in 20 minutes, then fill in what you missed'], '80 min', 'review'),
    day('Sunday', ['Rest'], 'Off', 'rest'),
  ]),
  week(3, 'Jul 8-Jul 14', 'Phase 1 - Build the Foundation', [
    day('Monday', ['Read one full topic section from your HOSA study guide, take notes in your own words'], '45 min'),
    day('Tuesday', ['Turn your notes into 10 practice questions and answer them'], '40 min'),
    day('Wednesday', ['Do 30 flashcard reps on all terms from weeks 1 through 3'], '35 min'),
    day('Thursday', ['Explain three core concepts out loud as if teaching someone, then write a summary'], '40 min'),
    day('Friday', ['Take a 15-question mixed quiz on everything covered so far'], '35 min'),
    day('Saturday', ['Review all wrong answers from this week, redo those questions, write corrected notes'], '85 min', 'review'),
    day('Sunday', ['Rest'], 'Off', 'rest'),
  ]),
  week(4, 'Jul 15-Jul 21', 'Phase 1 - Build the Foundation', [
    day('Monday', ['Read a second topic section, note anything that connects to week 1 or 2 content'], '45 min'),
    day('Tuesday', ['Do 30 flashcard reps then write 5 questions you think could appear on the real test'], '40 min'),
    day('Wednesday', ['Answer your own questions from yesterday without looking at notes'], '35 min'),
    day('Thursday', ['Take a 20-question timed quiz mixing all content so far'], '45 min'),
    day('Friday', ['Write a one-page summary of Phase 1 from memory, check it against your notes'], '40 min'),
    day('Saturday', ['Full Phase 1 review: flashcards, self-quiz, rewrite weak areas'], '90 min', 'review'),
    day('Sunday', ['Rest'], 'Off', 'rest'),
  ]),
  week(5, 'Jul 22-Jul 28', 'Phase 2 - Go Deeper', [
    day('Monday', ['Pick your weakest topic from Phase 1, read the full section again actively'], '45 min'),
    day('Tuesday', ['Write 10 why and how questions about that topic, answer each one in 2 sentences'], '40 min'),
    day('Wednesday', ['Do 35 flashcard reps weighted toward weak terms'], '35 min'),
    day('Thursday', ['Take a 20-question quiz focused on your weak topic'], '40 min'),
    day('Friday', ["Review wrong answers, find the pattern in what you're missing, write a correction note"], '35 min'),
    day('Saturday', ['Mixed 30-question quiz across all Phase 1 content, review every wrong answer'], '90 min', 'review'),
    day('Sunday', ['Rest'], 'Off', 'rest'),
  ]),
  week(6, 'Jul 29-Aug 4', 'Phase 2 - Go Deeper', [
    day('Monday', ['Read a third topic section, connect it to what you already know'], '45 min'),
    day('Tuesday', ['Make a comparison chart between two related concepts'], '40 min'),
    day('Wednesday', ['35 flashcard reps on all terms'], '35 min'),
    day('Thursday', ['Write 10 application-style questions where you have to use the concept not just define it'], '45 min'),
    day('Friday', ["Answer yesterday's questions, grade yourself, rewrite anything below full marks"], '40 min'),
    day('Saturday', ['30-question timed quiz, 45 minutes, score and log it'], '90 min', 'review'),
    day('Sunday', ['Rest'], 'Off', 'rest'),
  ]),
  week(7, 'Aug 5-Aug 11', 'Phase 2 - Go Deeper', [
    day('Monday', ['Take your lowest-scoring quiz from the past 6 weeks, redo every wrong question'], '45 min'),
    day('Tuesday', ['Write a one-page explanation of your hardest concept as simply as possible'], '40 min'),
    day('Wednesday', ['40 flashcard reps, mix all terms learned so far'], '35 min'),
    day('Thursday', ['Do a 25-question untimed quiz, focus on accuracy not speed'], '50 min'),
    day('Friday', ['Identify your top 3 weak areas right now, make a targeted drill list for each'], '35 min'),
    day('Saturday', ['Drill all three weak areas back to back, quiz on each one'], '90 min', 'review'),
    day('Sunday', ['Rest'], 'Off', 'rest'),
  ]),
  week(8, 'Aug 12-Aug 18', 'Phase 2 - Go Deeper', [
    day('Monday', ['Read a fourth topic section, annotate as you go'], '45 min'),
    day('Tuesday', ['Turn your annotations into a clean set of 20 flashcards'], '40 min'),
    day('Wednesday', ['40 reps on new flashcards only'], '35 min'),
    day('Thursday', ['30-question quiz mixing new and old content'], '45 min'),
    day('Friday', ['Review wrong answers, connect mistakes to root concepts you might be fuzzy on'], '40 min'),
    day('Saturday', ["Write out every major concept you've covered so far from memory, check completeness"], '90 min', 'review'),
    day('Sunday', ['Rest'], 'Off', 'rest'),
  ]),
  week(9, 'Aug 19-Aug 25', 'Phase 2 - Go Deeper', [
    day('Monday', ['Pick a concept that relies on understanding another concept, map the relationship on paper'], '40 min'),
    day('Tuesday', ['Write 15 multi-step questions that test deeper understanding not surface recall'], '45 min'),
    day('Wednesday', ["Answer yesterday's questions"], '40 min'),
    day('Thursday', ['35-question timed quiz, 40 minutes, log your score'], '45 min'),
    day('Friday', ['Review wrong answers and trace each mistake back to a specific gap, write a fix for each'], '40 min'),
    day('Saturday', ['40-question mixed quiz, full review of wrong answers, update your weak area list'], '90 min', 'review'),
    day('Sunday', ['Rest'], 'Off', 'rest'),
  ]),
  week(10, 'Aug 26-Sep 1', 'Phase 2 - Go Deeper', [
    day('Monday', ['Full Phase 2 concept review, reread your notes from weeks 5 through 9'], '50 min'),
    day('Tuesday', ["Write a two-page summary of everything you understand now that you didn't in Phase 1"], '45 min'),
    day('Wednesday', ['45 flashcard reps across all terms'], '40 min'),
    day('Thursday', ['40-question quiz timed at 45 minutes, this is a Phase 2 benchmark, log it'], '50 min'),
    day('Friday', ['Review benchmark results, identify exactly what to prioritize in Phase 3'], '40 min'),
    day('Saturday', ['Redo your 5 lowest-scoring topic areas back to back with a short quiz after each'], '90 min', 'review'),
    day('Sunday', ['Rest'], 'Off', 'rest'),
  ]),
  week(11, 'Sep 2-Sep 8', 'Phase 3 - Apply It', [
    day('Monday', ['Write 20 multiple choice questions with 4 options each, include tricky distractors'], '50 min'),
    day('Tuesday', ['Answer your own questions without looking at notes'], '40 min'),
    day('Wednesday', ['45 flashcard reps'], '35 min'),
    day('Thursday', ['Take a 40-question timed quiz, 40 minutes, score it'], '45 min'),
    day('Friday', ['For every wrong answer write out why the correct answer is right and why yours was wrong'], '40 min'),
    day('Saturday', ['50-question mixed quiz, full debrief, update weak list'], '90 min', 'review'),
    day('Sunday', ['Rest'], 'Off', 'rest'),
  ]),
  week(12, 'Sep 9-Sep 15', 'Phase 3 - Apply It', [
    day('Monday', ['Focus on application: given a scenario, what is the answer and why, write 10 of these'], '50 min'),
    day('Tuesday', ['Answer them, grade against your notes'], '40 min'),
    day('Wednesday', ['45 flashcard reps weighted to weak terms'], '35 min'),
    day('Thursday', ['40-question timed quiz'], '45 min'),
    day('Friday', ['Review and rewrite every wrong answer as a corrected explanation'], '40 min'),
    day('Saturday', ['50-question quiz timed at 50 minutes, log score'], '90 min', 'review'),
    day('Sunday', ['Rest'], 'Off', 'rest'),
  ]),
  week(13, 'Sep 16-Sep 22', 'Phase 3 - Apply It', [
    day('Monday', ['Compare your last 3 quiz scores, find the topic that keeps appearing in your wrong answers, drill it hard today'], '50 min'),
    day('Tuesday', ['Write 15 questions specifically on that weak topic, answer them'], '45 min'),
    day('Wednesday', ['Full 50 flashcard rep session'], '40 min'),
    day('Thursday', ['45-question timed quiz, 45 minutes'], '50 min'),
    day('Friday', ['Trace every wrong answer to its root cause, write a one-line fix for each'], '40 min'),
    day('Saturday', ['Targeted weak area quiz plus a 30-question general review'], '90 min', 'review'),
    day('Sunday', ['Rest'], 'Off', 'rest'),
  ]),
  week(14, 'Sep 23-Sep 29', 'Phase 3 - Apply It', [
    day('Monday', ['Write your hardest 25-question quiz yet, pull from every phase'], '50 min'),
    day('Tuesday', ['Take it under timed conditions'], '40 min'),
    day('Wednesday', ['50 flashcard reps'], '40 min'),
    day('Thursday', ['45-question mixed quiz'], '45 min'),
    day('Friday', ['Full debrief: score, wrong answers, root cause, fix'], '45 min'),
    day('Saturday', ['60-question practice exam timed at 60 minutes, treat it like the real thing'], '90 min', 'review'),
    day('Sunday', ['Rest'], 'Off', 'rest'),
  ]),
  week(15, 'Sep 30-Oct 6', 'Phase 3 - Apply It', [
    day('Monday', ["Review your 60-question exam from Saturday, categorize every wrong answer by topic"], '50 min'),
    day('Tuesday', ['Drill the top 2 weak topics that appeared most in wrong answers'], '45 min'),
    day('Wednesday', ['50 flashcard reps'], '40 min'),
    day('Thursday', ['50-question timed quiz, 50 minutes'], '55 min'),
    day('Friday', ['Write corrected explanations for every wrong answer this week'], '40 min'),
    day('Saturday', ['60-question timed exam, compare score to week 14, log the difference'], '90 min', 'review'),
    day('Sunday', ['Rest'], 'Off', 'rest'),
  ]),
  week(16, 'Oct 7-Oct 13', 'Phase 3 - Apply It', [
    day('Monday', ['Full Phase 3 review, reread all notes and cheat sheets'], '55 min'),
    day('Tuesday', ['Write a list of every concept you are still not confident in, be honest'], '40 min'),
    day('Wednesday', ['50 flashcard reps focused on that list'], '40 min'),
    day('Thursday', ['60-question benchmark quiz timed at 60 minutes, this is your Phase 3 final score, log it'], '65 min'),
    day('Friday', ['Analyze the benchmark fully, rank your topics from strongest to weakest, write a Phase 4 attack plan'], '45 min'),
    day('Saturday', ['Redo your 5 weakest topics with a quiz after each'], '90 min', 'review'),
    day('Sunday', ['Rest'], 'Off', 'rest'),
  ]),
  week(17, 'Oct 14-Oct 20', 'Phase 4 - Simulate the Test', [
    day('Monday', ['First full mock exam simulation: 60 questions, 60 minutes, no notes, score it like the real test'], '70 min'),
    day('Tuesday', ['Full debrief: every wrong answer reviewed and written out'], '50 min'),
    day('Wednesday', ['50 flashcard reps on terms that appeared in wrong answers'], '40 min'),
    day('Thursday', ['40-question quiz on your weakest phase 3 topics'], '45 min'),
    day('Friday', ['Write a one-page exam strategy: how will you approach each question type on test day'], '40 min'),
    day('Saturday', ["Second full mock exam, 60 questions, 60 minutes, compare to Monday's score"], '90 min', 'review'),
    day('Sunday', ['Rest'], 'Off', 'rest'),
  ]),
  week(18, 'Oct 21-Oct 27', 'Phase 4 - Simulate the Test', [
    day('Monday', ["Review Saturday's mock exam, identify any new weak areas that showed up"], '50 min'),
    day('Tuesday', ['Drill those new weak areas hard'], '45 min'),
    day('Wednesday', ['50 flashcard reps'], '40 min'),
    day('Thursday', ['Third mock exam, 60 questions, 55 minutes this time, slightly faster'], '65 min'),
    day('Friday', ["Debrief Thursday's exam fully"], '45 min'),
    day('Saturday', ["Targeted quiz on every topic that's appeared in your wrong answers more than once"], '90 min', 'review'),
    day('Sunday', ['Rest'], 'Off', 'rest'),
  ]),
  week(19, 'Oct 28-Nov 3', 'Phase 4 - Simulate the Test', [
    day('Monday', ['Fourth mock exam, 60 questions, 55 minutes'], '65 min'),
    day('Tuesday', ['Full debrief'], '45 min'),
    day('Wednesday', ['50 flashcard reps'], '40 min'),
    day('Thursday', ['30-question speed drill, try to finish in 25 minutes'], '35 min'),
    day('Friday', ['Review speed drill, note where rushing caused errors'], '35 min'),
    day('Saturday', ['Fifth mock exam, 60 questions, 50 minutes'], '90 min', 'review'),
    day('Sunday', ['Rest'], 'Off', 'rest'),
  ]),
  week(20, 'Nov 4-Nov 10', 'Phase 4 - Simulate the Test', [
    day('Monday', ['Compare all mock exam scores so far, chart your trend'], '40 min'),
    day('Tuesday', ["Drill the single topic you've missed the most questions on across all mocks"], '50 min'),
    day('Wednesday', ['50 flashcard reps'], '40 min'),
    day('Thursday', ['Sixth mock exam, 60 questions, 50 minutes'], '65 min'),
    day('Friday', ['Full debrief'], '45 min'),
    day('Saturday', ['30-question targeted quiz on your top 3 weakest topics only'], '60 min', 'review'),
    day('Sunday', ['Rest'], 'Off', 'rest'),
  ]),
  week(21, 'Nov 11-Nov 17', 'Phase 4 - Simulate the Test', [
    day('Monday', ['Seventh mock exam, 60 questions, 48 minutes, pushing speed'], '65 min'),
    day('Tuesday', ['Debrief, focus only on content errors not timing errors today'], '45 min'),
    day('Wednesday', ['50 flashcard reps'], '40 min'),
    day('Thursday', ['Eighth mock exam, 60 questions, 48 minutes'], '65 min'),
    day('Friday', ["Compare Thursday to Monday, find what improved and what didn't"], '40 min'),
    day('Saturday', ['Full Phase 4 debrief: compare all 8 mock scores, write your top 5 remaining weak areas'], '90 min', 'review'),
    day('Sunday', ['Rest'], 'Off', 'rest'),
  ]),
  week(22, 'Nov 18-Nov 24', 'Phase 4 - Simulate the Test', [
    day('Monday', ['Ninth mock exam, 60 questions, 45 minutes, closest to real test conditions yet'], '65 min'),
    day('Tuesday', ['Full debrief'], '45 min'),
    day('Wednesday', ['50 flashcard reps weighted to your top 5 weak areas'], '40 min'),
    day('Thursday', ['40-question quiz on weak areas only'], '45 min'),
    day('Friday', ['Write a clean one-page summary of your top 5 weak areas and the correct answers for each'], '40 min'),
    day('Saturday', ['Tenth mock exam, 60 questions, 45 minutes, log score, this is your Phase 4 final benchmark'], '90 min', 'review'),
    day('Sunday', ['Rest'], 'Off', 'rest'),
  ]),
  week(23, 'Nov 25-Dec 1', 'Phase 5 - Lock It In', [
    day('Monday', ['Pull your top 5 weak areas from Phase 4, read everything you have on topic 1 only'], '45 min'),
    day('Tuesday', ["Write 20 questions on topic 1, answer them, drill until you're above 85%"], '50 min'),
    day('Wednesday', ['50 flashcard reps on weak area terms only'], '40 min'),
    day('Thursday', ['40-question quiz mixing topic 1 with general content'], '45 min'),
    day('Friday', ['Debrief, rewrite every wrong answer'], '40 min'),
    day('Saturday', ['Mock exam, 60 questions, 45 minutes, your score should be climbing'], '90 min', 'review'),
    day('Sunday', ['Rest'], 'Off', 'rest'),
  ]),
  week(24, 'Dec 2-Dec 8', 'Phase 5 - Lock It In', [
    day('Monday', ['Deep drill on weak area topic 2, same process as week 23'], '50 min'),
    day('Tuesday', ['20 targeted questions on topic 2, drill to 85%'], '50 min'),
    day('Wednesday', ['50 flashcard reps'], '40 min'),
    day('Thursday', ['40-question quiz mixing topic 2 with general content'], '45 min'),
    day('Friday', ['Debrief and rewrite'], '40 min'),
    day('Saturday', ['Mock exam, 60 questions, 45 minutes'], '90 min', 'review'),
    day('Sunday', ['Rest'], 'Off', 'rest'),
  ]),
  week(25, 'Dec 9-Dec 15', 'Phase 5 - Lock It In', [
    day('Monday', ['Drill weak area topics 3 and 4 back to back'], '55 min'),
    day('Tuesday', ['20 questions on each'], '50 min'),
    day('Wednesday', ['50 flashcard reps'], '40 min'),
    day('Thursday', ['Full 60-question mock exam, 45 minutes'], '65 min'),
    day('Friday', ['Full debrief'], '45 min'),
    day('Saturday', ["Targeted drill on anything that appeared wrong in Thursday's exam"], '90 min', 'review'),
    day('Sunday', ['Rest'], 'Off', 'rest'),
  ]),
  week(26, 'Dec 16-Dec 22', 'Phase 5 - Lock It In', [
    day('Monday', ['Final deep drill on weak area topic 5'], '50 min'),
    day('Tuesday', ['20 targeted questions, drill to 90% accuracy'], '50 min'),
    day('Wednesday', ['50 flashcard reps, all terms'], '40 min'),
    day('Thursday', ['Full mock exam, 60 questions, 45 minutes, this is your last full benchmark before taper week, log it'], '65 min'),
    day('Friday', ['Full debrief, write your final weak area one-pager'], '45 min'),
    day('Saturday', ['Light mixed review, no new content, only review'], '60 min', 'review'),
    day('Sunday', ['Rest'], 'Off', 'rest'),
  ]),
  week(27, 'Dec 23-Jan 1', 'Taper', [
    day('Monday', ['Light review of your one-page weak area summary only'], '20 min'),
    day('Tuesday', ["20 flashcard reps on terms you're least confident in"], '15 min'),
    day('Wednesday', ['Read through your Phase 1 cheat sheet, nothing new'], '20 min'),
    day('Thursday', ['Rest'], 'Off', 'rest'),
    day('Friday', ['Rest'], 'Off', 'rest'),
    day('Saturday Dec 28', ['One final 30-question light quiz, untimed, just to stay warm'], '30 min', 'review'),
    day('Sunday Dec 29', ['Rest'], 'Off', 'rest'),
    day('Monday Dec 30', ['Read your exam strategy one-pager you wrote in week 17, visualize test day'], '15 min'),
    day('Tuesday Dec 31', ['Rest completely'], 'Off', 'rest'),
    day('Jan 1', ['Competition day'], 'Ready', 'review'),
  ]),
]

function week(number, range, phase, days) {
  return {
    id: `week-${number}`,
    title: number === 27 ? 'Week 27 - Taper' : `Week ${number}`,
    range,
    phase,
    days,
  }
}

function day(label, tasks, time, type = 'study') {
  return { label, tasks, time, type }
}

function StudyPlan() {
  const [selectedEventIds, setSelectedEventIds] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [plan, setPlan] = useState([])
  const [advice, setAdvice] = useState('')
  const [adviceStatus, setAdviceStatus] = useState('idle')
  const [planRunId, setPlanRunId] = useState(0)
  const adviceRequestKeyRef = useRef('')

  const selectedEvents = useMemo(
    () => SQT1_EVENTS.filter((event) => selectedEventIds.includes(event.id)),
    [selectedEventIds],
  )

  const targetDate = useMemo(() => getNextJanuaryFirst(new Date()), [])

  useEffect(() => {
    if (!plan.length || !selectedEvents.length || adviceStatus !== 'idle') return

    let isMounted = true
    const requestKey = `curriculum:${planRunId}`
    if (adviceRequestKeyRef.current === requestKey) return
    adviceRequestKeyRef.current = requestKey

    async function loadAdvice() {
      setAdviceStatus('loading')
      try {
        const response = await askGemini(
          'Write exactly 2 encouraging sentences for a high school student about to start a 27-week HOSA SQT prep journey ending January 1st.',
          'You are a calm, practical HOSA competition coach. Return exactly two sentences, with no title or bullet list.',
        )
        if (isMounted) {
          setAdvice(response.trim())
          setAdviceStatus('ready')
        }
      } catch {
        if (isMounted) {
          setAdvice('You are starting early enough to build real confidence one week at a time. Trust the schedule, be honest about weak areas, and let January 1st become the proof of steady work.')
          setAdviceStatus('ready')
        }
      }
    }

    loadAdvice()

    return () => {
      isMounted = false
    }
  }, [adviceStatus, plan.length, planRunId, selectedEvents])

  function toggleEvent(eventId) {
    setSelectedEventIds((current) =>
      current.includes(eventId) ? current.filter((id) => id !== eventId) : [...current, eventId],
    )
  }

  function generatePlan() {
    if (!selectedEvents.length || isGenerating) return

    setIsGenerating(true)
    setPlan([])
    setAdvice('')
    setAdviceStatus('idle')

    window.setTimeout(() => {
      setPlan(STUDY_PLAN_CURRICULUM)
      setPlanRunId((current) => current + 1)
      setIsGenerating(false)
    }, 2000)
  }

  return (
    <div id="v-study-plan" className="view active study-plan-page">
      <div className="ph">
        <div>
          <div className="ph-eye">SQT Roadmap</div>
          <div className="ph-title">Study Plan</div>
          <div className="ph-sub">Your roadmap to States.</div>
        </div>
      </div>

      <section className="card study-plan-selector">
        <div className="card-hd">
          <div className="card-title">Choose Your Events</div>
          <span className="ctag">{selectedEvents.length || 'No'} selected</span>
        </div>
        <div className="study-plan-chip-grid">
          {SQT1_EVENTS.map((event) => (
            <button
              className={`study-plan-chip ${selectedEventIds.includes(event.id) ? 'active' : ''}`}
              key={event.id}
              type="button"
              onClick={() => toggleEvent(event.id)}
            >
              <span>{event.name}</span>
            </button>
          ))}
        </div>
        <div className="study-plan-actions">
          <button className="btn btn-p" type="button" onClick={generatePlan} disabled={!selectedEvents.length || isGenerating}>
            {isGenerating ? 'Generating...' : 'Generate My Plan'}
          </button>
          <span>Runs through {formatDate(targetDate)}</span>
        </div>
      </section>

      {isGenerating && (
        <section className="card study-plan-loading">
          <div className="study-plan-spinner" />
          <div>
            <div className="card-title">Building your weekly roadmap</div>
            <p className="side-copy">Balancing daily work across your selected SQT events.</p>
          </div>
        </section>
      )}

      {plan.length > 0 && (
        <div className="study-plan-output">
          <section className="card study-plan-coach-card">
            <div className="card-hd">
              <div className="card-title">Coach Note</div>
              <span className="ctag">{adviceStatus === 'loading' ? 'Writing' : 'Personalized'}</span>
            </div>
            <p>{adviceStatus === 'loading' ? 'Preparing personalized coaching advice...' : advice}</p>
          </section>

          <div className="study-plan-week-list">
            {plan.map((week) => (
              <section className="card study-plan-week-card" key={week.id}>
                <div className="card-hd">
                  <div>
                    <div className="card-title">{week.title}</div>
                    <div className="study-plan-week-range">{week.range}</div>
                  </div>
                  <span className={`ctag ${week.phase === 'Mock Test Mode' ? 'maroon' : ''}`}>{week.phase}</span>
                </div>
                <div className="study-plan-days">
                  {week.days.map((day) => (
                    <div className={`study-plan-day-row ${day.type}`} key={`${week.id}-${day.label}`}>
                      <div className="study-plan-day-name">{day.label}</div>
                      <div className="study-plan-day-tasks">
                        {day.tasks.map((task) => (
                          <div key={task}>{task}</div>
                        ))}
                      </div>
                      <div className="study-plan-time">{day.time}</div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function getNextJanuaryFirst(date) {
  const year = date.getMonth() === 0 && date.getDate() === 1 ? date.getFullYear() : date.getFullYear() + 1
  return new Date(year, 0, 1)
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default StudyPlan
