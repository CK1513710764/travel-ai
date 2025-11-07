import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripsAPI } from '../services/api';
import type { Trip } from '../types';
import MapView from '../components/MapView';
import ExpenseManager from '../components/ExpenseManager';
import '../components/MapView.css';
import './TripDetail.css';

const TripDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    travelerCount: 1,
    budgetTotal: '',
    preferences: '',
  });

  useEffect(() => {
    loadTrip();
  }, [id]);

  const loadTrip = async () => {
    if (!id) return;
    try {
      const { trip } = await tripsAPI.getTripById(id);
      setTrip(trip);
      // 初始化编辑表单
      setEditForm({
        title: trip.title,
        destination: trip.destination,
        startDate: trip.start_date,
        endDate: trip.end_date,
        travelerCount: trip.traveler_count,
        budgetTotal: trip.budget_total?.toString() || '',
        preferences: trip.preferences || '',
      });
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

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // 恢复原始数据
    if (trip) {
      setEditForm({
        title: trip.title,
        destination: trip.destination,
        startDate: trip.start_date,
        endDate: trip.end_date,
        travelerCount: trip.traveler_count,
        budgetTotal: trip.budget_total?.toString() || '',
        preferences: trip.preferences || '',
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!id) return;
    setError('');
    try {
      const { trip: updatedTrip } = await tripsAPI.updateTrip(id, {
        title: editForm.title,
        destination: editForm.destination,
        start_date: editForm.startDate,
        end_date: editForm.endDate,
        traveler_count: editForm.travelerCount,
        budget_total: editForm.budgetTotal ? parseFloat(editForm.budgetTotal) : undefined,
        preferences: editForm.preferences || undefined,
      });
      setTrip(updatedTrip);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.error || '保存失败');
    }
  };

  if (loading) return <div className="loading">加载中...</div>;
  if (!trip) return <div className="error">旅行不存在</div>;

  const hasItinerary = trip.itinerary && trip.itinerary.days && trip.itinerary.days.length > 0;

  return (
    <div className="trip-detail-container">
      <header className="detail-header">
        <button onClick={() => navigate('/trips')} className="back-btn">← 返回</button>
        <h1>{isEditing ? '编辑旅行信息' : trip.title}</h1>
        {!isEditing && (
          <button onClick={handleStartEdit} className="btn-secondary edit-btn">
            ✏️ 编辑
          </button>
        )}
      </header>

      {isEditing ? (
        <div className="edit-form">
          <div className="form-group">
            <label>旅行标题</label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              placeholder="例如：2025年夏季北京之旅"
            />
          </div>

          <div className="form-group">
            <label>目的地</label>
            <input
              type="text"
              value={editForm.destination}
              onChange={(e) => setEditForm({ ...editForm, destination: e.target.value })}
              placeholder="例如：北京"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>开始日期</label>
              <input
                type="date"
                value={editForm.startDate}
                onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>结束日期</label>
              <input
                type="date"
                value={editForm.endDate}
                onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>旅行人数</label>
              <input
                type="number"
                min="1"
                value={editForm.travelerCount}
                onChange={(e) => setEditForm({ ...editForm, travelerCount: parseInt(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>预算（可选）</label>
              <input
                type="number"
                min="0"
                value={editForm.budgetTotal}
                onChange={(e) => setEditForm({ ...editForm, budgetTotal: e.target.value })}
                placeholder="例如：5000"
              />
            </div>
          </div>

          <div className="form-group">
            <label>旅行偏好（可选）</label>
            <input
              type="text"
              value={editForm.preferences}
              onChange={(e) => setEditForm({ ...editForm, preferences: e.target.value })}
              placeholder="例如：喜欢美食和动漫、带孩子、喜欢历史文化"
            />
            <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              提示：说出您的兴趣和特殊需求，AI 会为您定制个性化行程
            </small>
          </div>

          <div className="form-actions">
            <button onClick={handleCancelEdit} className="btn-secondary">
              取消
            </button>
            <button onClick={handleSaveEdit} className="btn-primary">
              保存修改
            </button>
          </div>
        </div>
      ) : (
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
          {trip.preferences && (
            <div className="info-item preferences-item">
              <span className="label">旅行偏好:</span>
              <span className="value">{trip.preferences}</span>
            </div>
          )}
        </div>
      )}

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

          {/* 地图显示 */}
          <MapView itinerary={trip.itinerary || null} destination={trip.destination} />

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

      {/* 费用管理 */}
      {id && <ExpenseManager tripId={id} />}
    </div>
  );
};

export default TripDetail;
