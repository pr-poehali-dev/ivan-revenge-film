interface Character {
  name: string;
  gender: 'male' | 'female';
  age?: string;
  description?: string;
}

interface Scene {
  id: number;
  location: string;
  characters: string[];
  action: string;
  dialogue?: string;
  emotion: string;
  time: 'day' | 'night' | 'evening';
}

interface StoryAnalysis {
  title: string;
  genre: string;
  characters: Character[];
  scenes: Scene[];
  mood: string;
}

export class VideoGenerator {
  private parseDescription(description: string): StoryAnalysis {
    const lines = description.toLowerCase();
    
    const characters: Character[] = [];
    const characterPatterns = [
      /(?:главный герой|героиня|персонаж)\s+([а-яё]+)/gi,
      /([А-ЯЁ][а-яё]+)\s+(?:решает|устраивает|идет|говорит)/g,
    ];

    characterPatterns.forEach(pattern => {
      const matches = description.matchAll(pattern);
      for (const match of matches) {
        const name = match[1];
        if (name && !characters.find(c => c.name === name)) {
          const gender = this.detectGender(name, description);
          characters.push({ name, gender });
        }
      }
    });

    const scenes = this.extractScenes(description, characters);
    const genre = this.detectGenre(description);
    const mood = this.detectMood(description);

    return {
      title: description.slice(0, 50),
      genre,
      characters,
      scenes,
      mood
    };
  }

  private detectGender(name: string, context: string): 'male' | 'female' {
    const femaleEndings = ['а', 'я', 'ь'];
    const maleNames = ['ваня', 'иван', 'петр', 'алекс', 'дима', 'саша'];
    const femaleNames = ['мария', 'анна', 'елена', 'ольга', 'катя', 'саша'];

    const lowerName = name.toLowerCase();
    
    if (femaleNames.includes(lowerName)) return 'female';
    if (maleNames.includes(lowerName)) return 'male';
    
    const lastChar = lowerName[lowerName.length - 1];
    if (femaleEndings.includes(lastChar) && !maleNames.includes(lowerName)) {
      return 'female';
    }
    
    return 'male';
  }

  private detectGenre(text: string): string {
    const genres = {
      'драма': ['драма', 'эмоции', 'чувства', 'слезы', 'переживания'],
      'комедия': ['смешно', 'юмор', 'шутка', 'веселье', 'смех'],
      'триллер': ['напряжение', 'опасность', 'страх', 'угроза'],
      'романтика': ['любовь', 'романтик', 'чувства', 'отношения'],
      'экшн': ['драка', 'погоня', 'бой', 'действие', 'стрельба'],
      'детектив': ['расследование', 'тайна', 'секрет', 'разгадка']
    };

    let maxScore = 0;
    let detectedGenre = 'драма';

    for (const [genre, keywords] of Object.entries(genres)) {
      const score = keywords.filter(keyword => text.includes(keyword)).length;
      if (score > maxScore) {
        maxScore = score;
        detectedGenre = genre;
      }
    }

    return detectedGenre;
  }

  private detectMood(text: string): string {
    const moods = {
      'темный': ['месть', 'предательство', 'обман', 'злость', 'ненависть'],
      'светлый': ['счастье', 'радость', 'добро', 'любовь', 'дружба'],
      'тревожный': ['страх', 'опасность', 'напряжение', 'беспокойство'],
      'меланхоличный': ['грусть', 'тоска', 'одиночество', 'воспоминания']
    };

    for (const [mood, keywords] of Object.entries(moods)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return mood;
      }
    }

    return 'нейтральный';
  }

  private extractScenes(description: string, characters: Character[]): Scene[] {
    const scenes: Scene[] = [];
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 10);

    const locations = {
      'ресторан': ['ресторан', 'кафе', 'столик', 'официант'],
      'улица': ['улица', 'прогулка', 'город', 'парк'],
      'дом': ['дом', 'квартира', 'комната', 'кухня'],
      'офис': ['офис', 'работа', 'кабинет', 'стол'],
      'машина': ['машина', 'автомобиль', 'едет', 'дорога']
    };

    sentences.forEach((sentence, index) => {
      let location = 'неизвестная локация';
      
      for (const [loc, keywords] of Object.entries(locations)) {
        if (keywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
          location = loc;
          break;
        }
      }

      const presentCharacters = characters
        .filter(char => sentence.toLowerCase().includes(char.name.toLowerCase()))
        .map(char => char.name);

      const emotion = this.detectSceneEmotion(sentence);
      const time = sentence.includes('ночь') || sentence.includes('вечер') ? 'night' : 'day';

      scenes.push({
        id: index + 1,
        location,
        characters: presentCharacters.length > 0 ? presentCharacters : [characters[0]?.name || 'герой'],
        action: sentence.trim(),
        emotion,
        time
      });
    });

    return scenes.slice(0, 10);
  }

  private detectSceneEmotion(text: string): string {
    const emotions = {
      'радость': ['радость', 'счастье', 'улыбка', 'смех'],
      'гнев': ['злость', 'ярость', 'месть', 'разозлился'],
      'грусть': ['грусть', 'слезы', 'печаль', 'тоска'],
      'страх': ['страх', 'испуг', 'ужас', 'боится'],
      'удивление': ['удивление', 'шок', 'неожиданно', 'потрясен']
    };

    for (const [emotion, keywords] of Object.entries(emotions)) {
      if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
        return emotion;
      }
    }

    return 'нейтральная';
  }

  async searchPhotos(scene: Scene, character: Character | undefined): Promise<string[]> {
    const queries: string[] = [];
    
    const locationQueries: Record<string, string> = {
      'ресторан': 'restaurant interior cinematic',
      'улица': 'city street night cinematic',
      'дом': 'home interior modern',
      'офис': 'office interior professional',
      'машина': 'car interior driving'
    };

    queries.push(locationQueries[scene.location] || scene.location);

    if (character) {
      const genderQuery = character.gender === 'male' ? 'man' : 'woman';
      const emotionQuery = scene.emotion !== 'нейтральная' ? scene.emotion : '';
      queries.push(`${genderQuery} ${emotionQuery} cinematic portrait`);
    }

    const photos: string[] = [];
    
    for (const query of queries) {
      try {
        const response = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`,
          {
            headers: {
              'Authorization': 'Client-ID XsJ5s_V0xG9vVMyQXHmOGjNp8b_Fq2pnM3DBxW8sxYk'
            }
          }
        );
        
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          photos.push(...data.results.map((photo: any) => photo.urls.regular));
        }
      } catch (error) {
        console.error('Error fetching photos:', error);
        photos.push(`https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200`);
      }
    }

    return photos.slice(0, 5);
  }

  async generateVoiceover(text: string, gender: 'male' | 'female'): Promise<string> {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = speechSynthesis.getVoices();
      
      const russianVoices = voices.filter(voice => voice.lang.includes('ru'));
      const genderVoice = russianVoices.find(voice => 
        gender === 'female' ? voice.name.includes('Female') || voice.name.includes('женский') : voice.name.includes('Male') || voice.name.includes('мужской')
      ) || russianVoices[0] || voices[0];

      if (genderVoice) {
        utterance.voice = genderVoice;
      }
      
      utterance.lang = 'ru-RU';
      utterance.rate = 0.9;
      utterance.pitch = gender === 'female' ? 1.2 : 0.8;
      
      utterance.onend = () => {
        resolve('voiceover-generated');
      };
      
      speechSynthesis.speak(utterance);
    });
  }

  async createVideoFromPhotos(photos: string[], scenes: Scene[], characters: Character[]): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const width = 1920;
    const height = 1080;
    const fps = 30;
    const sceneDuration = 5;
    
    canvas.width = width;
    canvas.height = height;

    const frames: ImageData[] = [];

    for (let sceneIndex = 0; sceneIndex < Math.min(scenes.length, photos.length); sceneIndex++) {
      const scene = scenes[sceneIndex];
      const photoUrl = photos[sceneIndex];
      
      const img = await this.loadImage(photoUrl);
      
      const totalFrames = fps * sceneDuration;
      
      for (let frame = 0; frame < totalFrames; frame++) {
        const progress = frame / totalFrames;
        
        ctx.clearRect(0, 0, width, height);
        
        const scale = 1 + (progress * 0.1);
        const offsetX = -((scale - 1) * width / 2);
        const offsetY = -((scale - 1) * height / 2);
        
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.scale(scale, scale);
        ctx.translate(-width / 2, -height / 2);
        
        ctx.drawImage(img, offsetX, offsetY, width * scale, height * scale);
        
        ctx.restore();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, height - 150, width, 150);
        
        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 36px Montserrat';
        ctx.textAlign = 'center';
        ctx.fillText(scene.action.slice(0, 80), width / 2, height - 60);
        
        frames.push(ctx.getImageData(0, 0, width, height));
      }
    }

    return new Blob([JSON.stringify({ frames: frames.length, width, height })], { type: 'application/json' });
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  async generateFilm(description: string, onProgress: (progress: number) => void): Promise<{ videoUrl: string; analysis: StoryAnalysis }> {
    onProgress(10);
    const analysis = this.parseDescription(description);
    
    onProgress(20);
    const allPhotos: string[] = [];
    
    for (let i = 0; i < analysis.scenes.length; i++) {
      const scene = analysis.scenes[i];
      const character = analysis.characters.find(c => scene.characters.includes(c.name));
      
      const photos = await this.searchPhotos(scene, character);
      allPhotos.push(photos[0] || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200');
      
      onProgress(20 + ((i + 1) / analysis.scenes.length) * 40);
    }
    
    onProgress(70);
    for (const scene of analysis.scenes.slice(0, 3)) {
      const character = analysis.characters.find(c => scene.characters.includes(c.name));
      if (scene.dialogue && character) {
        await this.generateVoiceover(scene.dialogue, character.gender);
      }
    }
    
    onProgress(85);
    await this.createVideoFromPhotos(allPhotos, analysis.scenes, analysis.characters);
    
    onProgress(100);
    
    return {
      videoUrl: allPhotos[0],
      analysis
    };
  }
}

export const videoGenerator = new VideoGenerator();
