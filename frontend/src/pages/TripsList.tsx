import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { tripsAPI } from '../services/api';
import type { Trip } from '../types';
import './TripsList.css';

const TripsList = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const { trips } = await tripsAPI.getTrips();
      setTrips(trips);
    } catch (error) {
      console.error('加载旅行列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="trips-container">
      <header className="trips-header">
        <div className="header-content">
          <h1>我的旅行</h1>
          <div className="header-actions">
            <span className="user-info">你好, {user?.fullName || user?.email}</span>
            <button onClick={handleLogout} className="btn-secondary">退出登录</button>
          </div>
        </div>
      </header>

      <main className="trips-main">
        <div className="trips-actions">
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary"
          >
            + 创建新旅行
          </button>
        </div>

        {trips.length === 0 ? (
          <div className="empty-state">
            <p>还没有旅行计划</p>
            <p className="empty-hint">点击上方按钮创建你的第一个旅行计划吧！</p>
          </div>
        ) : (
          <div className="trips-grid">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onClick={() => navigate(`/trips/${trip.id}`)} />
            ))}
          </div>
        )}
      </main>

      {showCreateForm && (
        <CreateTripModal
          onClose={() => setShowCreateForm(false)}
          onCreated={(trip) => {
            setShowCreateForm(false);
            navigate(`/trips/${trip.id}`);
          }}
        />
      )}
    </div>
  );
};

// 旅行卡片组件
const TripCard: React.FC<{ trip: Trip; onClick: () => void }> = ({ trip, onClick }) => {
  const hasItinerary = trip.itinerary && trip.itinerary.days && trip.itinerary.days.length > 0;

  return (
    <div className="trip-card" onClick={onClick}>
      <div className="trip-card-header">
        <h3>{trip.title}</h3>
        {hasItinerary && <span className="badge">已生成行程</span>}
      </div>
      <div className="trip-card-body">
        <p className="destination">📍 {trip.destination}</p>
        <p className="dates">
          📅 {trip.start_date} 至 {trip.end_date}
        </p>
        <p className="travelers">👥 {trip.traveler_count} 人</p>
        {trip.budget_total && (
          <p className="budget">💰 预算: ¥{trip.budget_total}</p>
        )}
      </div>
    </div>
  );
};

// 创建旅行模态框
const CreateTripModal: React.FC<{
  onClose: () => void;
  onCreated: (trip: Trip) => void;
}> = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    travelerCount: 1,
    budgetTotal: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { trip } = await tripsAPI.createTrip({
        title: formData.title,
        destination: formData.destination,
        startDate: formData.startDate,
        endDate: formData.endDate,
        travelerCount: formData.travelerCount,
        budgetTotal: formData.budgetTotal ? parseFloat(formData.budgetTotal) : undefined,
        currency: 'CNY',
      });
      onCreated(trip);
    } catch (err: any) {
      setError(err.response?.data?.error || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>创建新旅行</h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>旅行标题</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="例如：2025年夏季北京之旅"
              required
            />
          </div>

          <div className="form-group">
            <label>目的地</label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              placeholder="例如：北京"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>开始日期</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>结束日期</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>旅行人数</label>
              <input
                type="number"
                min="1"
                value={formData.travelerCount}
                onChange={(e) => setFormData({ ...formData, travelerCount: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="form-group">
              <label>预算（可选）</label>
              <input
                type="number"
                min="0"
                value={formData.budgetTotal}
                onChange={(e) => setFormData({ ...formData, budgetTotal: e.target.value })}
                placeholder="例如：5000"
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              取消
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TripsList;
