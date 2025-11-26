// 简单的本地存储方案（浏览器端）
// 生产环境可以替换成真正的数据库API

export interface Question {
  id: number;
  subject: 'math' | 'chinese';
  content: string;
  answer: string;
  reward: number;
}

export interface Fish {
  id: number;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  imageUrl: string;
}

// 初始化默认数据
export function initStorage() {
  if (typeof window === 'undefined') return;
  
  if (!localStorage.getItem('user')) {
    localStorage.setItem('user', JSON.stringify({ coins: 100, name: 'Little Hero' }));
  }
  
  if (!localStorage.getItem('questions')) {
    const defaultQuestions: Question[] = [
      { id: 1, subject: 'math', content: '8 × 7 = ?', answer: '56', reward: 10 },
      { id: 2, subject: 'math', content: '36 ÷ 6 = ?', answer: '6', reward: 10 },
      { id: 3, subject: 'chinese', content: '"春眠不觉晓"的下一句是？', answer: '处处闻啼鸟', reward: 15 },
    ];
    localStorage.setItem('questions', JSON.stringify(defaultQuestions));
  }
  
  if (!localStorage.getItem('fishCollection')) {
    localStorage.setItem('fishCollection', JSON.stringify([]));
  }
}

export function getUser() {
  if (typeof window === 'undefined') return { coins: 100, name: 'Player' };
  return JSON.parse(localStorage.getItem('user') || '{"coins":100,"name":"Player"}');
}

export function updateCoins(coins: number) {
  if (typeof window === 'undefined') return;
  const user = getUser();
  user.coins = coins;
  localStorage.setItem('user', JSON.stringify(user));
}

export function getQuestions(): Question[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem('questions') || '[]');
}

export function addQuestion(q: Omit<Question, 'id'>) {
  if (typeof window === 'undefined') return;
  const questions = getQuestions();
  const newQ = { ...q, id: Date.now() };
  questions.push(newQ);
  localStorage.setItem('questions', JSON.stringify(questions));
}
