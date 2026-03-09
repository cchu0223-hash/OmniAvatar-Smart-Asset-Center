import { useEffect, useRef, useState } from 'react';

type TextTypeProps = {
  text: string | string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  loop?: boolean;
  cursor?: boolean;
  cursorChar?: string;
  className?: string;
  cursorClassName?: string;
};

const TextType = ({
  text,
  typingSpeed = 80,
  deletingSpeed = 40,
  pauseDuration = 1500,
  loop = true,
  cursor = true,
  cursorChar = '|',
  className = '',
  cursorClassName = '',
}: TextTypeProps) => {
  const texts = Array.isArray(text) ? text : [text];
  const [displayed, setDisplayed] = useState('');
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'deleting'>('typing');
  const [textIndex, setTextIndex] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  // Cursor blink
  useEffect(() => {
    const id = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const current = texts[textIndex];

    if (phase === 'typing') {
      if (displayed.length < current.length) {
        timeout.current = setTimeout(() => {
          setDisplayed(current.slice(0, displayed.length + 1));
        }, typingSpeed);
      } else {
        timeout.current = setTimeout(() => setPhase('pausing'), pauseDuration);
      }
    } else if (phase === 'pausing') {
      if (!loop && textIndex === texts.length - 1) return;
      setPhase('deleting');
    } else if (phase === 'deleting') {
      if (displayed.length > 0) {
        timeout.current = setTimeout(() => {
          setDisplayed(displayed.slice(0, -1));
        }, deletingSpeed);
      } else {
        const next = (textIndex + 1) % texts.length;
        setTextIndex(next);
        setPhase('typing');
      }
    }

    return () => clearTimeout(timeout.current);
  }, [displayed, phase, textIndex, texts, typingSpeed, deletingSpeed, pauseDuration, loop]);

  return (
    <span className={className}>
      {displayed}
      {cursor && (
        <span
          className={cursorClassName}
          style={{ opacity: cursorVisible ? 1 : 0, transition: 'opacity 0.1s' }}
        >
          {cursorChar}
        </span>
      )}
    </span>
  );
};

export default TextType;
