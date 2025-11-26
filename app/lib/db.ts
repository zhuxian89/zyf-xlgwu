// 客户端数据库接口（通过 API 调用服务器端 SQLite）

export async function getUserCoins(): Promise<number> {
  try {
    const res = await fetch('/api/coins');
    const data = await res.json();
    return data.coins || 100;
  } catch (error) {
    console.error('Failed to get user coins:', error);
    return 100;
  }
}

export async function updateUserCoins(coins: number) {
  try {
    await fetch('/api/coins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coins }),
    });
  } catch (error) {
    console.error('Failed to update user coins:', error);
  }
}

export async function getQuestions() {
  try {
    const res = await fetch('/api/questions');
    const data = await res.json();
    return data.questions || [];
  } catch (error) {
    console.error('Failed to get questions:', error);
    return [];
  }
}

export async function addQuestion(subject: string, content: string, answer: string, reward: number) {
  try {
    await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, content, answer, reward }),
    });
  } catch (error) {
    console.error('Failed to add question:', error);
  }
}

export async function getAllFish() {
  try {
    const res = await fetch('/api/fish');
    const data = await res.json();
    return data.fish || [];
  } catch (error) {
    console.error('Failed to get fish:', error);
    return [];
  }
}

export async function catchFish() {
  try {
    const res = await fetch('/api/fish/catch', {
      method: 'POST',
    });
    const data = await res.json();
    return data.fish || null;
  } catch (error) {
    console.error('Failed to catch fish:', error);
    return null;
  }
}

export async function getCatchLog() {
  try {
    const res = await fetch('/api/fish/catches');
    const data = await res.json();
    return data.catches || [];
  } catch (error) {
    console.error('Failed to get catch log:', error);
    return [];
  }
}
