import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Web Speech API 的 TypeScript 类型定义
 */
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface UseSpeechRecognitionOptions {
  onTranscript?: (transcript: string) => void;
  continuous?: boolean;
  lang?: string;
}

/**
 * 语音识别 Hook
 */
export const useSpeechRecognition = (options: UseSpeechRecognitionOptions = {}) => {
  const { onTranscript, continuous = false, lang = 'zh-CN' } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string>('');
  const [isSupported, setIsSupported] = useState(false);

  // 保存 recognition 实例的引用
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // 检查浏览器支持
  useEffect(() => {
    const supported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    setIsSupported(supported);

    if (!supported) {
      setError('您的浏览器不支持语音识别功能。请使用 Chrome、Edge 或 Safari 浏览器。');
    }

    // 清理函数：组件卸载时停止识别
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // 忽略停止时的错误
        }
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('语音识别不可用');
      return;
    }

    // 如果已经在监听，先停止
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // 忽略错误
      }
    }

    try {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionAPI();

      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.lang = lang;

      recognition.onstart = () => {
        console.log('语音识别已启动');
        setIsListening(true);
        setError('');
        setTranscript('');
        setInterimTranscript('');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimText += result[0].transcript;
          }
        }

        if (finalTranscript) {
          console.log('识别到最终结果:', finalTranscript);
          // 只设置最新的结果，不累加
          setTranscript(finalTranscript);
          if (onTranscript) {
            onTranscript(finalTranscript);
          }
        }

        setInterimTranscript(interimText);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('语音识别错误:', event.error);

        // no-speech 错误不显示给用户（这是正常的，表示用户停止说话）
        if (event.error === 'no-speech') {
          setIsListening(false);
          return;
        }

        let errorMessage = '语音识别错误';
        switch (event.error) {
          case 'audio-capture':
            errorMessage = '无法访问麦克风，请检查权限';
            break;
          case 'not-allowed':
            errorMessage = '麦克风权限被拒绝';
            break;
          case 'network':
            errorMessage = '网络错误，请检查网络连接';
            break;
          case 'aborted':
            // 用户主动停止，不显示错误
            return;
          default:
            errorMessage = `语音识别错误: ${event.error}`;
        }

        setError(errorMessage);
        setIsListening(false);
      };

      recognition.onend = () => {
        console.log('语音识别已结束');
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('启动语音识别失败:', err);
      setError('启动语音识别失败: ' + err.message);
      setIsListening(false);
    }
  }, [isSupported, continuous, lang, onTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        console.log('手动停止语音识别');
        recognitionRef.current.stop();
      } catch (e) {
        console.error('停止识别时出错:', e);
      }
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
};
