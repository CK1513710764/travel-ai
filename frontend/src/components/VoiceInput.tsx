import { useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import './VoiceInput.css';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  placeholder?: string;
}

/**
 * 语音输入组件
 * 使用 Web Speech API 进行语音识别
 */
const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, placeholder = '点击麦克风开始语音输入' }) => {
  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    continuous: false,
    lang: 'zh-CN',
  });

  // 当有最终结果时，传递给父组件
  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
      // 重置以便下次使用
      setTimeout(() => {
        resetTranscript();
      }, 500);
    }
  }, [transcript, onTranscript, resetTranscript]);

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div className="voice-input-unsupported">
        <span className="voice-input-error-icon">⚠️</span>
        <span className="voice-input-error-text">浏览器不支持语音识别</span>
      </div>
    );
  }

  return (
    <div className="voice-input-container">
      <button
        type="button"
        onClick={handleClick}
        className={`voice-input-button ${isListening ? 'listening' : ''}`}
        title={isListening ? '点击停止或等待自动识别完成' : placeholder}
      >
        {isListening ? (
          <span className="voice-input-icon recording">🎤</span>
        ) : (
          <span className="voice-input-icon">🎤</span>
        )}
      </button>

      {isListening && (
        <div className="voice-input-status">
          <div className="voice-input-pulse"></div>
          <span className="voice-input-text">
            {interimTranscript ? '正在识别...' : '请说话...'}
          </span>
          <small style={{ display: 'block', marginTop: '4px', fontSize: '11px', color: '#9ca3af' }}>
            讲完后会自动停止，或点击麦克风手动停止
          </small>
        </div>
      )}

      {interimTranscript && (
        <div className="voice-input-interim">
          <span className="voice-input-label">识别中:</span>
          <span className="voice-input-interim-text">{interimTranscript}</span>
        </div>
      )}

      {error && (
        <div className="voice-input-error">
          <span className="voice-input-error-icon">❌</span>
          <span className="voice-input-error-text">{error}</span>
        </div>
      )}
    </div>
  );
};

export default VoiceInput;
