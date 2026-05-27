import { useEffect, useState } from 'react'
import { useGameStore } from '../stores/useGameStore.ts'
import { DAILY_GOAL } from '../types/game.ts'

export function GamificationBar() {
  const totalPoints = useGameStore(state => state.totalPoints)
  const consecutiveZeroDays = useGameStore(state => state.consecutiveZeroDays)
  const getLavaState = useGameStore(state => state.getLavaState)
  const getTodayPoints = useGameStore(state => state.getTodayPoints)

  const [todayPoints, setTodayPoints] = useState(0)

  // Load today's points on mount and when total points changes
  useEffect(() => {
    const loadTodayPoints = async () => {
      const points = await getTodayPoints()
      setTodayPoints(points)
    }
    loadTodayPoints()
  }, [totalPoints, getTodayPoints])

  const lavaState = getLavaState()
  const progressPercent = Math.min((todayPoints / DAILY_GOAL) * 100, 100)
  const goalMet = todayPoints >= DAILY_GOAL

  return (
    <div className="gamification-bar">
      <div className="stats-section">
        <div className="stat">
          <span className="stat-label">Total Points</span>
          <span className="stat-value">{totalPoints}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Today's Progress</span>
          <span className="stat-value">
            {todayPoints} / {DAILY_GOAL}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Status</span>
          <span className={`stat-value status-${lavaState.warningLevel}`}>
            {lavaState.isDrowning ? 'Drowning!' : goalMet ? 'Goal Met!' : 'In Progress'}
          </span>
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-bar">
          <div
            className={`progress-fill ${goalMet ? 'goal-met' : ''}`}
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={todayPoints}
            aria-valuemin={0}
            aria-valuemax={DAILY_GOAL}
            aria-label={`Daily goal progress: ${todayPoints} of ${DAILY_GOAL} points`}
          />
        </div>
        <p className="progress-text">
          {goalMet
            ? '🎉 Daily goal achieved!'
            : `${DAILY_GOAL - todayPoints} more ${todayPoints === DAILY_GOAL - 1 ? 'point' : 'points'} to reach daily goal`}
        </p>
      </div>

      <div className="lava-section">
        <div className="lava-guy-container">
          {/* Placeholder for lava guy SVG and animation - will be added in next task */}
          <div className={`lava-guy-placeholder ${lavaState.warningLevel}`}>
            <span className="guy-icon">🧍</span>
          </div>
        </div>
        <div className="lava-info">
          {lavaState.isDrowning ? (
            <p className="lava-warning danger">Your little guy has drowned! Complete tasks to revive.</p>
          ) : consecutiveZeroDays > 0 ? (
            <p className={`lava-warning ${lavaState.warningLevel}`}>
              ⚠️ {lavaState.daysUntilDrowning} {lavaState.daysUntilDrowning === 1 ? 'day' : 'days'} until drowning!
              <br />
              <span className="warning-detail">
                {consecutiveZeroDays} consecutive {consecutiveZeroDays === 1 ? 'day' : 'days'} with zero points
              </span>
            </p>
          ) : (
            <p className="lava-info-safe">✅ Your little guy is safe! Keep completing tasks.</p>
          )}
        </div>
      </div>
    </div>
  )
}
