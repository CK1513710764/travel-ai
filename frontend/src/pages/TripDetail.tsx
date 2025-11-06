import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripsAPI } from '../services/api';
import type { Trip } from '../types';
import './TripDetail.css';

const TripDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTrip();
  }, [id]);

  const loadTrip = async () => {
    if (!id) return;
    try {
      const { trip } = await tripsAPI.getTripById(id);
      setTrip(trip);
    } catch (err) {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateItinerary = async () => {
    if (!id) return;
    setGenerating(true);
    setError('');
    try {
      const { trip: updatedTrip } = await tripsAPI.generateItinerary(id);
      setTrip(updatedTrip);
    } catch (err: any) {
      setError(err.response?.data?.error || 'AI 生成失败');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="loading">加载中...</div>;
  if (!trip) return <div className="error">旅行不存在</div>;

  const hasItinerary = trip.itinerary && trip.itinerary.days && trip.itinerary.days.length > 0;

  return (
    <div className="trip-detail-container">
      <header className="detail-header">
        <button onClick={() => navigate('/trips')} className="back-btn">← 返回</button>
        <h1>{trip.title}</h1>
      </header>

      <div className="trip-info">
        <div className="info-item">
          <span className="label">目的地:</span>
          <span className="value">{trip.destination}</span>
        </div>
        <div className="info-item">
          <span className="label">日期:</span>
          <span className="value">{trip.start_date} 至 {trip.end_date}</span>
        </div>
        <div className="info-item">
          <span className="label">人数:</span>
          <span className="value">{trip.traveler_count} 人</span>
        </div>
        {trip.budget_total && (
          <div className="info-item">
            <span className="label">预算:</span>
            <span className="value">¥{trip.budget_total}</span>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {!hasItinerary ? (
        <div className="no-itinerary">
          <p>还没有生成行程</p>
          <button
            onClick={handleGenerateItinerary}
            className="btn-primary"
            disabled={generating}
          >
            {generating ? 'AI 生成中...' : '🤖 生成 AI 行程'}
          </button>
        </div>
      ) : (
        <div className="itinerary-section">
          <div className="section-header">
            <h2>AI 生成的行程</h2>
            <button
              onClick={handleGenerateItinerary}
              className="btn-secondary"
              disabled={generating}
            >
              {generating ? '重新生成中...' : '重新生成'}
            </button>
          </div>

          <p className="summary">{trip.itinerary?.summary}</p>

          <div className="days-container">
            {trip.itinerary?.days?.map((day) => (
              <div key={day.day} className="day-card">
                <div className="day-header">
                  <h3>Day {day.day}: {day.title}</h3>
                  <span className="date">{day.date}</span>
                </div>

                <div className="activities">
                  {day.activities.map((activity, index) => (
                    <div key={index} className="activity">
                      <span className="time">{activity.time}</span>
                      <div className="activity-content">
                        <h4>{activity.activity}</h4>
                        <p className="location">📍 {activity.location}</p>
                        {activity.description && <p className="description">{activity.description}</p>}
                        {activity.estimatedCost && (
                          <p className="cost">💰 约 ¥{activity.estimatedCost}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {day.meals && (
                  <div className="meals">
                    <h4>餐饮推荐</h4>
                    <div className="meal-list">
                      {day.meals.breakfast && <p>🍳 早餐: {day.meals.breakfast}</p>}
                      {day.meals.lunch && <p>🍜 午餐: {day.meals.lunch}</p>}
                      {day.meals.dinner && <p>🍱 晚餐: {day.meals.dinner}</p>}
                    </div>
                  </div>
                )}

                {day.accommodation && (
                  <div className="accommodation">
                    <h4>住宿</h4>
                    <p>🏨 {day.accommodation}</p>
                  </div>
                )}

                {day.notes && (
                  <div className="notes">
                    <p>💡 {day.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {trip.itinerary?.tips && trip.itinerary?.tips.length > 0 && (
            <div className="tips-section">
              <h3>旅行小贴士</h3>
              <ul>
                {trip.itinerary?.tips?.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TripDetail;
