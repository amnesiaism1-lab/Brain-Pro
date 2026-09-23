import React, { useState } from 'react';
import { IReadingText } from '@brain-exercises/shared';
import { 
  BookOpen, Globe, Sparkles, Check, X, Search, RefreshCw, Loader2, ArrowRight
} from 'lucide-react';
import { readingContentService, POPULAR_WIKIPEDIA_TOPICS } from '../../services/readingContentService';
import { useAppStore } from '../../store/useAppStore';

interface ReadingTextSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentText: IReadingText;
  onSelectText: (text: IReadingText) => void;
}

export const ReadingTextSourceModal: React.FC<ReadingTextSourceModalProps> = ({
  isOpen,
  onClose,
  currentText,
  onSelectText
}) => {
  const { playSound } = useAppStore();
  const [activeTab, setActiveTab] = useState<'CURATED' | 'WIKI'>('CURATED');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingWiki, setIsLoadingWiki] = useState(false);
  const [wikiStatusMsg, setWikiStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const allAvailableTexts = readingContentService.getAllTexts();
  const filteredTexts = allAvailableTexts.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (text: IReadingText) => {
    playSound('click');
    onSelectText(text);
    onClose();
  };

  const handleFetchTopic = async (topicTitle: string) => {
    playSound('click');
    setIsLoadingWiki(true);
    setWikiStatusMsg(`Đang tải dữ liệu "${topicTitle}" từ Wikipedia...`);

    const article = await readingContentService.fetchWikipediaArticle(topicTitle);
    setIsLoadingWiki(false);

    if (article) {
      playSound('correct');
      setWikiStatusMsg(null);
      onSelectText(article);
      onClose();
    } else {
      playSound('wrong');
      setWikiStatusMsg('Không thể kết nối đến Wikipedia hoặc bài viết quá ngắn. Vui lòng thử lại!');
    }
  };

  const handleFetchRandomWiki = async () => {
    playSound('click');
    setIsLoadingWiki(true);
    setWikiStatusMsg('Đang chọn ngẫu nhiên bài viết tri thức từ Wikipedia...');

    const article = await readingContentService.fetchRandomWikipediaArticle();
    setIsLoadingWiki(false);

    if (article) {
      playSound('correct');
      setWikiStatusMsg(null);
      onSelectText(article);
      onClose();
    } else {
      playSound('wrong');
      setWikiStatusMsg('Lỗi tải bài ngẫu nhiên. Vui lòng thử lại chủ đề khác!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FDFBF7] dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl flex flex-col max-h-[85vh] animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E6DDCE] dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Kho Tri Thức & Văn Bản Luyện Đọc</h3>
              <p className="text-xs text-slate-500">Chọn chủ đề bài đọc hoặc tải tri thức mới từ Wikipedia tiếng Việt</p>
            </div>
          </div>
          <button
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/60">
          <button
            onClick={() => {
              playSound('click');
              setActiveTab('CURATED');
            }}
            className={`py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'CURATED'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Bài Tuyển Chọn ({allAvailableTexts.length})</span>
          </button>

          <button
            onClick={() => {
              playSound('click');
              setActiveTab('WIKI');
            }}
            className={`py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'WIKI'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4 text-blue-500" />
            <span>Wikipedia Live API</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-3">
          {activeTab === 'CURATED' && (
            <>
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tiêu đề hoặc lĩnh vực khoa học..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Text Cards List */}
              <div className="space-y-2.5 pt-1">
                {filteredTexts.map(text => {
                  const isSelected = text.id === currentText.id;
                  return (
                    <div
                      key={text.id}
                      onClick={() => handleSelect(text)}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 group ${
                        isSelected
                          ? 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-500 ring-2 ring-brand-500/20 shadow-md'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-slate-600 hover:shadow-sm'
                      }`}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {text.category}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {text.wordCount} từ
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">
                          {text.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {text.previewExcerpt}
                        </p>
                      </div>

                      <div className="shrink-0 self-center">
                        {isSelected ? (
                          <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 group-hover:text-brand-600 group-hover:bg-brand-50 flex items-center justify-center transition-colors">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'WIKI' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs sm:text-sm text-blue-800 dark:text-blue-200 flex items-start gap-3">
                <Globe className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Kết nối Trực tiếp Wikipedia Tiếng Việt</p>
                  <p className="mt-1 text-xs opacity-90 leading-relaxed">
                    Hệ thống trích xuất tự động văn bản tri thức chuẩn bách khoa từ Wikipedia, làm sạch định dạng và tối ưu số từ (200–350 từ) để phục vụ cho các bài tập luyện mắt và đọc nhanh.
                  </p>
                </div>
              </div>

              {/* Random Wiki Button */}
              <button
                disabled={isLoadingWiki}
                onClick={handleFetchRandomWiki}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-brand-600/25 flex items-center justify-center gap-2 btn-press disabled:opacity-50"
              >
                {isLoadingWiki ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang kết nối Wikipedia...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Tải Ngẫu Nhiên Bài Tri Thức Mới</span>
                  </>
                )}
              </button>

              {wikiStatusMsg && (
                <p className="text-xs text-center font-bold text-brand-600 dark:text-brand-400 animate-pulse">
                  {wikiStatusMsg}
                </p>
              )}

              {/* Popular Topics Grid */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  Chủ Đề Bách Khoa Đề Xuất
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {POPULAR_WIKIPEDIA_TOPICS.map((topic, i) => (
                    <button
                      key={i}
                      disabled={isLoadingWiki}
                      onClick={() => handleFetchTopic(topic.title)}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-500 hover:shadow-md text-left transition-all group btn-press disabled:opacity-50"
                    >
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
                        {topic.category}
                      </span>
                      <h5 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-brand-600 mt-1">
                        {topic.title}
                      </h5>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {topic.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
