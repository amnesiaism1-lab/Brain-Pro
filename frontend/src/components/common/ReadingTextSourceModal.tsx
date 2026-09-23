import React, { useState } from 'react';
import { IReadingText } from '@brain-exercises/shared';
import { 
  BookOpen, Globe, Sparkles, Check, X, Search, RefreshCw, Loader2, ArrowRight, FileText, Send
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
  const [activeTab, setActiveTab] = useState<'CURATED' | 'WIKI' | 'CUSTOM'>('CURATED');
  const [curatedSearch, setCuratedSearch] = useState('');
  
  // Wiki search state
  const [wikiQuery, setWikiQuery] = useState('');
  const [wikiSearchResults, setWikiSearchResults] = useState<Array<{ title: string; snippet: string }>>([]);
  const [isSearchingWiki, setIsSearchingWiki] = useState(false);
  const [isLoadingWikiArticle, setIsLoadingWikiArticle] = useState(false);
  const [wikiStatusMsg, setWikiStatusMsg] = useState<string | null>(null);

  // Custom text paste state
  const [customTitle, setCustomTitle] = useState('');
  const [customContent, setCustomContent] = useState('');

  if (!isOpen) return null;

  const allAvailableTexts = readingContentService.getAllTexts();
  const filteredTexts = allAvailableTexts.filter(t => 
    t.title.toLowerCase().includes(curatedSearch.toLowerCase()) ||
    t.category.toLowerCase().includes(curatedSearch.toLowerCase())
  );

  const handleSelect = (text: IReadingText) => {
    playSound('click');
    onSelectText(text);
    onClose();
  };

  const handleSearchWiki = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!wikiQuery.trim()) return;
    playSound('click');
    setIsSearchingWiki(true);
    setWikiStatusMsg(null);

    const results = await readingContentService.searchWikipediaArticles(wikiQuery);
    setIsSearchingWiki(false);
    setWikiSearchResults(results);
    if (results.length === 0) {
      setWikiStatusMsg(`Không tìm thấy kết quả phù hợp cho "${wikiQuery}". Hãy thử từ khóa khác!`);
    }
  };

  const handleFetchTopic = async (topicTitle: string) => {
    playSound('click');
    setIsLoadingWikiArticle(true);
    setWikiStatusMsg(`Đang tải dữ liệu bách khoa "${topicTitle}" từ Wikipedia...`);

    const article = await readingContentService.fetchWikipediaArticle(topicTitle);
    setIsLoadingWikiArticle(false);

    if (article) {
      playSound('correct');
      setWikiStatusMsg(null);
      onSelectText(article);
      onClose();
    } else {
      playSound('wrong');
      setWikiStatusMsg('Không thể trích xuất nội dung từ trang này hoặc bài viết quá ngắn. Vui lòng thử bài khác!');
    }
  };

  const handleFetchRandomWiki = async () => {
    playSound('click');
    setIsLoadingWikiArticle(true);
    setWikiStatusMsg('Đang chọn ngẫu nhiên bài viết tri thức từ Wikipedia...');

    const article = await readingContentService.fetchRandomWikipediaArticle();
    setIsLoadingWikiArticle(false);

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

  const handleCreateCustomText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customContent.trim()) return;
    playSound('correct');
    const created = readingContentService.createCustomReadingText(
      customTitle || 'Tài Liệu Tự Chọn',
      customContent
    );
    onSelectText(created);
    onClose();
  };

  const customWordsCount = customContent.trim() ? customContent.trim().split(/\s+/).length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FDFBF7] dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl flex flex-col max-h-[90vh] animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E6DDCE] dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Kho Tri Thức & Văn Bản Luyện Đọc</h3>
              <p className="text-xs text-slate-500">Đa dạng hóa bài luyện từ Wikipedia Live API, bài tuyển chọn hoặc tài liệu cá nhân</p>
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

        {/* 3 Tab Switcher */}
        <div className="grid grid-cols-3 gap-1.5 mt-4 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-xs">
          <button
            onClick={() => {
              playSound('click');
              setActiveTab('CURATED');
            }}
            className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'CURATED'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="truncate">Tuyển Chọn ({allAvailableTexts.length})</span>
          </button>

          <button
            onClick={() => {
              playSound('click');
              setActiveTab('WIKI');
            }}
            className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'WIKI'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span className="truncate">Wikipedia Live API</span>
          </button>

          <button
            onClick={() => {
              playSound('click');
              setActiveTab('CUSTOM');
            }}
            className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'CUSTOM'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-500" />
            <span className="truncate">Tự Nhập Văn Bản</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-3">
          {/* TAB 1: CURATED TEXTS */}
          {activeTab === 'CURATED' && (
            <>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm bài đọc theo tiêu đề hoặc lĩnh vực..."
                  value={curatedSearch}
                  onChange={e => setCuratedSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

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

          {/* TAB 2: WIKIPEDIA LIVE API */}
          {activeTab === 'WIKI' && (
            <div className="space-y-4">
              {/* Live Search Bar for Wikipedia */}
              <form onSubmit={handleSearchWiki} className="relative flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm bất kỳ chủ đề tri thức nào trên Wikipedia..."
                    value={wikiQuery}
                    onChange={e => setWikiQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearchingWiki || !wikiQuery.trim()}
                  className="px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {isSearchingWiki ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Tìm</span>
                </button>
              </form>

              {/* Status or loading message */}
              {wikiStatusMsg && (
                <p className="text-xs text-center font-bold text-brand-600 dark:text-brand-400 animate-pulse bg-brand-50 dark:bg-brand-950/40 p-2.5 rounded-xl">
                  {wikiStatusMsg}
                </p>
              )}

              {/* Search Results list if available */}
              {wikiSearchResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Kết quả tìm kiếm trên Wikipedia ({wikiSearchResults.length})
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {wikiSearchResults.map((res, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleFetchTopic(res.title)}
                        className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-500 hover:shadow-md cursor-pointer transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="flex-1">
                          <h5 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-brand-600">
                            {res.title}
                          </h5>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {res.snippet}
                          </p>
                        </div>
                        <button
                          disabled={isLoadingWikiArticle}
                          className="px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 text-xs font-bold shrink-0 group-hover:bg-brand-600 group-hover:text-white transition-all"
                        >
                          Tải bài này
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Random Wiki Button */}
              <button
                disabled={isLoadingWikiArticle}
                onClick={handleFetchRandomWiki}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-brand-600/25 flex items-center justify-center gap-2 btn-press disabled:opacity-50"
              >
                {isLoadingWikiArticle ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang kết nối Wikipedia...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Tải Ngẫu Nhiên Bài Tri Thức Mới (Không giới hạn)</span>
                  </>
                )}
              </button>

              {/* Popular Curated Topics Grid */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  Chủ Đề Bách Khoa Khuyên Dùng
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {POPULAR_WIKIPEDIA_TOPICS.map((topic, i) => (
                    <button
                      key={i}
                      disabled={isLoadingWikiArticle}
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

          {/* TAB 3: CUSTOM TEXT PASTE */}
          {activeTab === 'CUSTOM' && (
            <form onSubmit={handleCreateCustomText} className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-200">
                <p className="font-bold flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Luyện tập với tài liệu riêng của bạn
                </p>
                <p className="mt-1 text-[11px] opacity-90 leading-relaxed">
                  Dán bất kỳ đoạn văn bản, bài báo, tài liệu học tập hoặc báo cáo công việc vào đây. Hệ thống sẽ tự động phân tích và tạo bài tập đọc nhanh & trắc nghiệm hiểu cho văn bản của bạn.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tiêu đề tài liệu
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Báo cáo công việc tuần, Chương 1 Sách Lược Sử Loài Người..."
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nội dung văn bản
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {customWordsCount} từ
                  </span>
                </div>
                <textarea
                  rows={6}
                  required
                  placeholder="Dán nội dung văn bản tiếng Việt vào đây (khuyến nghị từ 100 đến 500 từ để luyện tập hiệu quả nhất)..."
                  value={customContent}
                  onChange={e => setCustomContent(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={!customContent.trim()}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 btn-press disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Bắt Đầu Luyện Với Văn Bản Này</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
