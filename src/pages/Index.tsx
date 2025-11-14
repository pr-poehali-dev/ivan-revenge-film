import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { videoGenerator } from '@/lib/videoGenerator';

interface VideoGeneration {
  id: string;
  title: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  thumbnail: string;
  videoUrl?: string;
  photos?: string[];
  createdAt: Date;
}

export default function Index() {
  const [activeTab, setActiveTab] = useState('home');
  const [description, setDescription] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [watchingVideo, setWatchingVideo] = useState<VideoGeneration | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [generations, setGenerations] = useState<VideoGeneration[]>([
    {
      id: '1',
      title: 'Драматическая сцена в ресторане',
      status: 'completed',
      progress: 100,
      thumbnail: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400',
      videoUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200',
      photos: [
        'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200',
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200'
      ],
      createdAt: new Date('2024-11-13')
    },
    {
      id: '2',
      title: 'Романтическая прогулка по городу',
      status: 'processing',
      progress: 67,
      thumbnail: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400',
      createdAt: new Date('2024-11-14')
    }
  ]);
  const { toast } = useToast();
  const photoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, опишите ваш фильм',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    
    const newGeneration: VideoGeneration = {
      id: Date.now().toString(),
      title: description.slice(0, 50) + '...',
      status: 'processing',
      progress: 0,
      thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400',
      createdAt: new Date()
    };

    setGenerations([newGeneration, ...generations]);

    try {
      const result = await videoGenerator.generateFilm(description, (progress) => {
        setGenerations(prev => 
          prev.map(g => g.id === newGeneration.id 
            ? { ...g, progress: Math.min(progress, 100) } 
            : g
          )
        );
      });

      const photos = await Promise.all(
        result.analysis.scenes.slice(0, 5).map(async (scene) => {
          const character = result.analysis.characters.find(c => scene.characters.includes(c.name));
          const scenePhotos = await videoGenerator.searchPhotos(scene, character);
          return scenePhotos[0] || result.videoUrl;
        })
      );

      setGenerations(prev => 
        prev.map(g => g.id === newGeneration.id 
          ? { 
              ...g, 
              status: 'completed', 
              progress: 100,
              thumbnail: photos[0] || result.videoUrl,
              videoUrl: result.videoUrl,
              photos: photos
            } 
          : g
        )
      );
      
      toast({
        title: 'Готово!',
        description: `Создан фильм "${result.analysis.title}" (${result.analysis.genre})`,
      });
    } catch (error) {
      setGenerations(prev => 
        prev.map(g => g.id === newGeneration.id 
          ? { ...g, status: 'failed', progress: 0 } 
          : g
        )
      );
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать фильм',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
      setDescription('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      toast({
        title: 'Файл загружен',
        description: `${file.name} готов к обработке`
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="border-b border-[#262626] bg-[#0a0a0a]/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#d4af37] to-[#f4d03f] rounded-lg flex items-center justify-center">
              <Icon name="Film" size={24} className="text-[#0a0a0a]" />
            </div>
            <h1 className="text-2xl font-bold gold-shimmer bg-clip-text text-transparent">CineAI</h1>
          </div>
          <div className="hidden md:flex gap-8">
            <button 
              onClick={() => setActiveTab('home')}
              className={`transition-colors ${activeTab === 'home' ? 'text-[#d4af37]' : 'text-gray-400 hover:text-white'}`}
            >
              Главная
            </button>
            <button 
              onClick={() => setActiveTab('generator')}
              className={`transition-colors ${activeTab === 'generator' ? 'text-[#d4af37]' : 'text-gray-400 hover:text-white'}`}
            >
              Генератор
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`transition-colors ${activeTab === 'history' ? 'text-[#d4af37]' : 'text-gray-400 hover:text-white'}`}
            >
              История
            </button>
            <button 
              onClick={() => setActiveTab('help')}
              className={`transition-colors ${activeTab === 'help' ? 'text-[#d4af37]' : 'text-gray-400 hover:text-white'}`}
            >
              Помощь
            </button>
          </div>
        </div>
      </nav>

      {activeTab === 'home' && (
        <div className="relative">
          <div className="absolute inset-0 cinema-gradient" />
          <div className="container mx-auto px-6 py-24 relative z-10">
            <div className="max-w-4xl mx-auto text-center animate-fade-in">
              <h2 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
                Создавайте <span className="gold-shimmer bg-clip-text text-transparent">эпичные</span> фильмы за минуты
              </h2>
              <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
                AI-платформа нового поколения для генерации полнометражных видео по вашему описанию. Безлимитные генерации, профессиональный монтаж.
              </p>
              <Button 
                onClick={() => setActiveTab('generator')}
                className="bg-[#d4af37] hover:bg-[#c19d2f] text-[#0a0a0a] px-8 py-6 text-lg font-bold rounded-full"
              >
                <Icon name="Sparkles" size={20} className="mr-2" />
                Начать создание
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mt-24 animate-slide-up">
              <Card className="bg-[#1a1a1a] border-[#262626] p-8 hover:border-[#d4af37] transition-all">
                <div className="w-16 h-16 bg-[#d4af37]/10 rounded-full flex items-center justify-center mb-6">
                  <Icon name="Film" size={32} className="text-[#d4af37]" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Генерация по описанию</h3>
                <p className="text-gray-400">
                  Опишите сюжет, и нейросеть создаст часовой фильм с профессиональной озвучкой и монтажом
                </p>
              </Card>

              <Card className="bg-[#1a1a1a] border-[#262626] p-8 hover:border-[#d4af37] transition-all">
                <div className="w-16 h-16 bg-[#d4af37]/10 rounded-full flex items-center justify-center mb-6">
                  <Icon name="Upload" size={32} className="text-[#d4af37]" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Редактирование видео</h3>
                <p className="text-gray-400">
                  Загрузите свое видео, и AI исправит, дополнит и отмонтирует его автоматически
                </p>
              </Card>

              <Card className="bg-[#1a1a1a] border-[#262626] p-8 hover:border-[#d4af37] transition-all">
                <div className="w-16 h-16 bg-[#d4af37]/10 rounded-full flex items-center justify-center mb-6">
                  <Icon name="Infinity" size={32} className="text-[#d4af37]" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Безлимитные генерации</h3>
                <p className="text-gray-400">
                  Создавайте неограниченное количество фильмов без дополнительной платы
                </p>
              </Card>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'generator' && (
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto animate-fade-in">
            <h2 className="text-4xl font-bold mb-8">Генератор фильмов</h2>
            
            <Tabs defaultValue="describe" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#1a1a1a] border border-[#262626]">
                <TabsTrigger value="describe" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-[#0a0a0a]">
                  <Icon name="FileText" size={18} className="mr-2" />
                  Описать фильм
                </TabsTrigger>
                <TabsTrigger value="upload" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-[#0a0a0a]">
                  <Icon name="Upload" size={18} className="mr-2" />
                  Загрузить видео
                </TabsTrigger>
              </TabsList>

              <TabsContent value="describe" className="mt-8">
                <Card className="bg-[#1a1a1a] border-[#262626] p-8">
                  <h3 className="text-2xl font-bold mb-4">Опишите ваш фильм</h3>
                  <p className="text-gray-400 mb-6">
                    Расскажите о сюжете, персонажах, атмосфере. Чем подробнее описание, тем точнее результат.
                  </p>
                  <Textarea 
                    placeholder="Например: Драматическая короткометражка о человеке, который решает проблему с друзьями через умную месть. Главный герой Ваня устраивает публичное разоблачение в ресторане..."
                    className="min-h-[200px] bg-[#0a0a0a] border-[#262626] text-white mb-6"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <div className="flex items-center gap-4">
                    <Button 
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="bg-[#d4af37] hover:bg-[#c19d2f] text-[#0a0a0a] font-bold"
                    >
                      {isGenerating ? (
                        <>
                          <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                          Генерируем...
                        </>
                      ) : (
                        <>
                          <Icon name="Sparkles" size={18} className="mr-2" />
                          Создать фильм (60 мин)
                        </>
                      )}
                    </Button>
                    <div className="text-sm text-gray-400">
                      <Icon name="Clock" size={16} className="inline mr-1" />
                      Примерное время: 5-10 минут
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="upload" className="mt-8">
                <Card className="bg-[#1a1a1a] border-[#262626] p-8">
                  <h3 className="text-2xl font-bold mb-4">Загрузите видео для редактирования</h3>
                  <p className="text-gray-400 mb-6">
                    AI автоматически исправит, дополнит, отмонтирует и улучшит ваше видео
                  </p>
                  <div className="border-2 border-dashed border-[#262626] rounded-lg p-12 text-center hover:border-[#d4af37] transition-colors mb-6">
                    <Icon name="Upload" size={48} className="mx-auto mb-4 text-[#d4af37]" />
                    <p className="text-lg mb-2">Перетащите видео или нажмите для выбора</p>
                    <p className="text-sm text-gray-400 mb-4">Поддерживаются: MP4, MOV, AVI (макс. 2 ГБ)</p>
                    <Input 
                      type="file" 
                      accept="video/*"
                      onChange={handleFileUpload}
                      className="hidden" 
                      id="video-upload"
                    />
                    <Button 
                      onClick={() => document.getElementById('video-upload')?.click()}
                      variant="outline"
                      className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0a0a0a]"
                    >
                      Выбрать файл
                    </Button>
                  </div>
                  {uploadedFile && (
                    <div className="bg-[#0a0a0a] rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon name="FileVideo" size={24} className="text-[#d4af37]" />
                        <div>
                          <p className="font-medium">{uploadedFile.name}</p>
                          <p className="text-sm text-gray-400">{(uploadedFile.size / 1024 / 1024).toFixed(2)} МБ</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => {
                          toast({
                            title: 'Обработка запущена',
                            description: 'AI начал редактирование вашего видео'
                          });
                        }}
                        className="bg-[#d4af37] hover:bg-[#c19d2f] text-[#0a0a0a]"
                      >
                        <Icon name="Wand2" size={18} className="mr-2" />
                        Обработать
                      </Button>
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-6xl mx-auto animate-fade-in">
            <h2 className="text-4xl font-bold mb-8">История генераций</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generations.map((gen) => (
                <Card key={gen.id} className="bg-[#1a1a1a] border-[#262626] overflow-hidden hover:border-[#d4af37] transition-all">
                  <div className="relative h-48 overflow-hidden">
                    <img src={gen.thumbnail} alt={gen.title} className="w-full h-full object-cover" />
                    {gen.status === 'processing' && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="text-center">
                          <Icon name="Loader2" size={32} className="animate-spin mx-auto mb-2 text-[#d4af37]" />
                          <p className="text-sm">Генерация {gen.progress.toFixed(0)}%</p>
                        </div>
                      </div>
                    )}
                    {gen.status === 'completed' && (
                      <div className="absolute top-4 right-4 bg-green-500 px-3 py-1 rounded-full text-sm font-medium">
                        <Icon name="Check" size={14} className="inline mr-1" />
                        Готово
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">{gen.title}</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      {gen.createdAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    {gen.status === 'processing' && (
                      <Progress value={gen.progress} className="mb-4" />
                    )}
                    {gen.status === 'completed' && (
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => {
                            setWatchingVideo(gen);
                            setCurrentPhotoIndex(0);
                            if (photoIntervalRef.current) {
                              clearInterval(photoIntervalRef.current);
                            }
                            photoIntervalRef.current = setInterval(() => {
                              setCurrentPhotoIndex(prev => {
                                const maxIndex = (gen.photos?.length || 1) - 1;
                                return prev >= maxIndex ? 0 : prev + 1;
                              });
                            }, 3000);
                          }}
                          className="flex-1 bg-[#d4af37] hover:bg-[#c19d2f] text-[#0a0a0a]"
                        >
                          <Icon name="Play" size={16} className="mr-2" />
                          Смотреть
                        </Button>
                        <Button 
                          onClick={() => {
                            if (gen.videoUrl) {
                              const link = document.createElement('a');
                              link.href = gen.videoUrl;
                              link.download = `${gen.title}.jpg`;
                              link.click();
                              toast({
                                title: 'Скачивание началось',
                                description: 'Фильм сохраняется на ваше устройство'
                              });
                            }
                          }}
                          variant="outline" 
                          className="border-[#262626]"
                        >
                          <Icon name="Download" size={16} />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'help' && (
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto animate-fade-in">
            <h2 className="text-4xl font-bold mb-8">Помощь</h2>
            
            <div className="space-y-6">
              <Card className="bg-[#1a1a1a] border-[#262626] p-8">
                <h3 className="text-2xl font-bold mb-4 flex items-center">
                  <Icon name="HelpCircle" size={24} className="mr-3 text-[#d4af37]" />
                  Как создать фильм?
                </h3>
                <ol className="space-y-3 text-gray-300">
                  <li className="flex gap-3">
                    <span className="text-[#d4af37] font-bold">1.</span>
                    <span>Перейдите в раздел "Генератор"</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#d4af37] font-bold">2.</span>
                    <span>Выберите вкладку "Описать фильм"</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#d4af37] font-bold">3.</span>
                    <span>Подробно опишите сюжет, персонажей, атмосферу</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#d4af37] font-bold">4.</span>
                    <span>Нажмите "Создать фильм" и дождитесь завершения (5-10 минут)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#d4af37] font-bold">5.</span>
                    <span>Готовый фильм появится в разделе "История"</span>
                  </li>
                </ol>
              </Card>

              <Card className="bg-[#1a1a1a] border-[#262626] p-8">
                <h3 className="text-2xl font-bold mb-4 flex items-center">
                  <Icon name="Upload" size={24} className="mr-3 text-[#d4af37]" />
                  Как редактировать видео?
                </h3>
                <p className="text-gray-300 mb-4">
                  Загрузите свое видео через вкладку "Загрузить видео" в генераторе. AI автоматически:
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <Icon name="Check" size={18} className="text-[#d4af37] mt-1" />
                    <span>Исправит технические недостатки (цвет, звук, стабилизация)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" size={18} className="text-[#d4af37] mt-1" />
                    <span>Улучшит монтаж и добавит плавные переходы</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" size={18} className="text-[#d4af37] mt-1" />
                    <span>Дополнит сцены при необходимости</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" size={18} className="text-[#d4af37] mt-1" />
                    <span>Оптимизирует длительность и ритм</span>
                  </li>
                </ul>
              </Card>

              <Card className="bg-[#1a1a1a] border-[#262626] p-8">
                <h3 className="text-2xl font-bold mb-4 flex items-center">
                  <Icon name="Sparkles" size={24} className="mr-3 text-[#d4af37]" />
                  Советы для лучших результатов
                </h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-3">
                    <Icon name="Lightbulb" size={18} className="text-[#d4af37] mt-1 shrink-0" />
                    <div>
                      <strong>Будьте конкретны:</strong> Чем подробнее описание, тем точнее результат
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="Lightbulb" size={18} className="text-[#d4af37] mt-1 shrink-0" />
                    <div>
                      <strong>Укажите жанр:</strong> Драма, комедия, триллер - это влияет на стиль
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="Lightbulb" size={18} className="text-[#d4af37] mt-1 shrink-0" />
                    <div>
                      <strong>Опишите эмоции:</strong> Атмосфера и настроение важны для AI
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="Lightbulb" size={18} className="text-[#d4af37] mt-1 shrink-0" />
                    <div>
                      <strong>Структурируйте:</strong> Начало, развитие, кульминация, финал
                    </div>
                  </li>
                </ul>
              </Card>

              <Card className="bg-[#1a1a1a] border-[#262626] p-8">
                <h3 className="text-2xl font-bold mb-4 flex items-center">
                  <Icon name="MessageCircle" size={24} className="mr-3 text-[#d4af37]" />
                  Нужна помощь?
                </h3>
                <p className="text-gray-300 mb-6">
                  Если у вас возникли вопросы или проблемы, наша команда поддержки всегда готова помочь.
                </p>
                <Button className="bg-[#d4af37] hover:bg-[#c19d2f] text-[#0a0a0a]">
                  <Icon name="Mail" size={18} className="mr-2" />
                  Связаться с поддержкой
                </Button>
              </Card>
            </div>
          </div>
        </div>
      )}

      <Dialog open={!!watchingVideo} onOpenChange={(open) => {
        if (!open) {
          setWatchingVideo(null);
          if (photoIntervalRef.current) {
            clearInterval(photoIntervalRef.current);
          }
        }
      }}>
        <DialogContent className="max-w-5xl bg-[#0a0a0a] border-[#262626]">
          <DialogHeader>
            <DialogTitle className="text-2xl text-[#d4af37]">{watchingVideo?.title}</DialogTitle>
          </DialogHeader>
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            {watchingVideo?.photos && watchingVideo.photos.length > 0 ? (
              <img 
                src={watchingVideo.photos[currentPhotoIndex]} 
                alt={`Сцена ${currentPhotoIndex + 1}`}
                className="w-full h-full object-cover transition-all duration-1000 ease-in-out"
                style={{
                  transform: `scale(${1 + (currentPhotoIndex % 2) * 0.1})`,
                }}
              />
            ) : (
              <img 
                src={watchingVideo?.videoUrl || watchingVideo?.thumbnail} 
                alt="Видео"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => {
                      if (photoIntervalRef.current) {
                        clearInterval(photoIntervalRef.current);
                        photoIntervalRef.current = null;
                      } else {
                        photoIntervalRef.current = setInterval(() => {
                          setCurrentPhotoIndex(prev => {
                            const maxIndex = (watchingVideo?.photos?.length || 1) - 1;
                            return prev >= maxIndex ? 0 : prev + 1;
                          });
                        }, 3000);
                      }
                    }}
                    size="icon"
                    className="bg-[#d4af37] hover:bg-[#c19d2f] text-[#0a0a0a]"
                  >
                    <Icon name={photoIntervalRef.current ? "Pause" : "Play"} size={20} />
                  </Button>
                  <span className="text-sm">
                    Сцена {currentPhotoIndex + 1} из {watchingVideo?.photos?.length || 1}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const newIndex = Math.max(0, currentPhotoIndex - 1);
                      setCurrentPhotoIndex(newIndex);
                    }}
                    size="icon"
                    variant="outline"
                    className="border-[#d4af37] text-[#d4af37]"
                  >
                    <Icon name="ChevronLeft" size={20} />
                  </Button>
                  <Button
                    onClick={() => {
                      const maxIndex = (watchingVideo?.photos?.length || 1) - 1;
                      const newIndex = Math.min(maxIndex, currentPhotoIndex + 1);
                      setCurrentPhotoIndex(newIndex);
                    }}
                    size="icon"
                    variant="outline"
                    className="border-[#d4af37] text-[#d4af37]"
                  >
                    <Icon name="ChevronRight" size={20} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-gray-400 text-sm">
              <Icon name="Film" size={16} className="inline mr-2 text-[#d4af37]" />
              Создано {watchingVideo?.createdAt.toLocaleDateString('ru-RU')}
            </p>
            <Button
              onClick={() => {
                if (watchingVideo?.videoUrl) {
                  const link = document.createElement('a');
                  link.href = watchingVideo.videoUrl;
                  link.download = `${watchingVideo.title}.jpg`;
                  link.click();
                }
              }}
              className="bg-[#d4af37] hover:bg-[#c19d2f] text-[#0a0a0a]"
            >
              <Icon name="Download" size={16} className="mr-2" />
              Скачать фильм
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}