import React, { useState, useEffect, useMemo } from 'react';
import { TabView, StockAnalysis } from './types';
import StockTable from './components/StockTable';
import RetirementCalc from './components/RetirementCalc';
import { analyzePortfolio, analyzeMarketTrends } from './services/geminiService';
import { LineChart, Briefcase, Plus, X, Search, Zap, KeyRound, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>(TabView.MARKET_ANALYSIS);
  
  // API Key Management
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  
  // State for My Portfolio
  const [portfolioStocks, setPortfolioStocks] = useState<StockAnalysis[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [inputSymbol, setInputSymbol] = useState('');
  
  // Stock Quantities State (Lifted up from RetirementCalc)
  const [stockQuantities, setStockQuantities] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('finance_stock_quantities');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [mySymbols, setMySymbols] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('finance_portfolio_symbols');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // State for Market Trends
  const [trendStocks, setTrendStocks] = useState<StockAnalysis[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check for API Key on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    // @ts-ignore
    const hasEnvKey = (typeof process !== 'undefined' && process.env.API_KEY) || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY);
    
    if (!storedKey && !hasEnvKey) {
      setShowApiKeyModal(true);
    } else {
      handleFetchTrends();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist symbols
  useEffect(() => {
    localStorage.setItem('finance_portfolio_symbols', JSON.stringify(mySymbols));
  }, [mySymbols]);

  // Persist quantities
  useEffect(() => {
    localStorage.setItem('finance_stock_quantities', JSON.stringify(stockQuantities));
  }, [stockQuantities]);

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      localStorage.setItem('gemini_api_key', apiKeyInput.trim());
      setShowApiKeyModal(false);
      handleFetchTrends();
    }
  };

  const handleFetchTrends = async () => {
    setErrorMsg(null);
    setTrendLoading(true);
    try {
      const data = await analyzeMarketTrends();
      setTrendStocks(data);
    } catch (err) {
      console.error(err);
      setErrorMsg("無法取得市場資訊。請確認您的 API 金鑰是否正確，或稍後再試。");
    } finally {
      setTrendLoading(false);
    }
  };

  const handleAddSymbol = () => {
    if (inputSymbol) {
      const newSymbols = inputSymbol.split(/[, ]+/).map(s => s.trim().toUpperCase()).filter(s => s.length > 0);
      const uniqueNewSymbols = newSymbols.filter(s => !mySymbols.includes(s));
      
      if (uniqueNewSymbols.length > 0) {
        setMySymbols(prev => [...prev, ...uniqueNewSymbols]);
        setInputSymbol('');
      }
    }
  };

  const handleRemoveSymbol = (symbolToRemove: string) => {
    setMySymbols(mySymbols.filter(s => s !== symbolToRemove));
    // Optional: remove quantity data for removed symbol? 
    // keeping it might be better UX in case of accidental delete
  };

  const handleQuantityChange = (symbol: string, qty: number) => {
    setStockQuantities(prev => ({
      ...prev,
      [symbol]: qty
    }));
  };

  const handleAnalyzePortfolio = async () => {
    if (mySymbols.length === 0) return;
    setErrorMsg(null);
    setPortfolioLoading(true);
    try {
      const data = await analyzePortfolio(mySymbols);
      setPortfolioStocks(data);
    } catch (err) {
      console.error(err);
      setErrorMsg("分析失敗。請確認您的 API 金鑰是否正確。");
    } finally {
      setPortfolioLoading(false);
    }
  };

  const clearApiKey = () => {
    if(confirm("確定要清除儲存的 API Key 嗎？下次使用需重新輸入。")) {
      localStorage.removeItem('gemini_api_key');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-3 text-indigo-600">
              <KeyRound className="w-8 h-8" />
              <h2 className="text-xl font-bold">設定 API 金鑰</h2>
            </div>
            <p className="text-slate-600 text-sm">
              為了使用此應用程式的 AI 分析功能，請輸入您的 Google Gemini API Key。
              <br/>您的金鑰僅會儲存在您的瀏覽器中，不會傳送至其他伺服器。
            </p>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="貼上您的 API Key (AIzaSy...)"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            <div className="flex justify-end space-x-3 pt-2">
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center"
              >
                取得 Key
              </a>
              <button
                onClick={handleSaveApiKey}
                disabled={!apiKeyInput.trim()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium shadow-sm transition-colors"
              >
                開始使用
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-indigo-200 shadow-lg">
                  <LineChart className="text-white w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 truncate">
                  理財小教室
                </h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => setActiveTab(TabView.MARKET_ANALYSIS)}
                  className={`${
                    activeTab === TabView.MARKET_ANALYSIS
                      ? 'border-indigo-500 text-slate-900'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                >
                  市場與持股分析
                </button>
                <button
                  onClick={() => setActiveTab(TabView.RETIREMENT_PLANNING)}
                  className={`${
                    activeTab === TabView.RETIREMENT_PLANNING
                      ? 'border-indigo-500 text-slate-900'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                >
                  退休金試算
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={clearApiKey}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                title="重設 API Key"
              >
                <KeyRound className="w-4 h-4" />
              </button>
              <span className="hidden md:inline text-xs text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-3 py-1 font-medium">
                Professional Edition
              </span>
            </div>
          </div>
        </div>
        
        {/* Mobile Tabs */}
        <div className="sm:hidden grid grid-cols-2 border-t border-slate-100">
           <button
              onClick={() => setActiveTab(TabView.MARKET_ANALYSIS)}
              className={`${
                activeTab === TabView.MARKET_ANALYSIS
                  ? 'text-indigo-600 bg-indigo-50/50'
                  : 'text-slate-500'
              } py-3 text-sm font-medium text-center transition-colors`}
            >
              市場分析
            </button>
            <button
              onClick={() => setActiveTab(TabView.RETIREMENT_PLANNING)}
              className={`${
                activeTab === TabView.RETIREMENT_PLANNING
                  ? 'text-indigo-600 bg-indigo-50/50'
                  : 'text-slate-500'
              } py-3 text-sm font-medium text-center transition-colors`}
            >
              退休規劃
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {errorMsg && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center animate-fadeIn">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
            <p className="text-sm">{errorMsg}</p>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === TabView.MARKET_ANALYSIS && (
          <div className="space-y-10 animate-fadeIn">
            
            {/* Section 1: My Portfolio */}
            <section className="space-y-4">
              <div className="flex items-center space-x-2 mb-2">
                 <Briefcase className="w-6 h-6 text-indigo-600" />
                 <h2 className="text-xl font-bold text-slate-800">我的持股健診</h2>
              </div>
              
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="mb-6">
                   <label className="block text-sm font-medium text-slate-700 mb-2">輸入您持有的股票代碼 (Enter加入)</label>
                   <div className="flex gap-2">
                      <div className="relative flex-grow">
                        <input
                          type="text"
                          value={inputSymbol}
                          onChange={(e) => setInputSymbol(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddSymbol()}
                          placeholder="例如: 2330, NVDA, TSLA"
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-slate-300 rounded-md p-3 border"
                        />
                        <button 
                          onClick={handleAddSymbol}
                          className="absolute right-2 top-2 p-1 bg-slate-100 rounded hover:bg-slate-200 text-slate-600"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={handleAnalyzePortfolio}
                        disabled={mySymbols.length === 0 || portfolioLoading}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {portfolioLoading ? '分析中' : '分析'}
                        <Search className="ml-2 w-4 h-4 hidden sm:inline" />
                      </button>
                   </div>
                   
                   {/* Symbol Tags */}
                   <div className="mt-4 flex flex-wrap gap-2 min-h-[2rem]">
                      {mySymbols.length === 0 && (
                        <span className="text-sm text-slate-400 italic">您的清單是空的，請新增股票以自動儲存...</span>
                      )}
                      {mySymbols.map(symbol => (
                        <span key={symbol} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {symbol}
                          <button onClick={() => handleRemoveSymbol(symbol)} className="ml-1.5 text-indigo-400 hover:text-indigo-600">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                   </div>
                </div>

                {/* Portfolio Results */}
                {portfolioStocks.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-slate-100 animate-fadeIn">
                     <StockTable 
                       stocks={portfolioStocks} 
                       loading={portfolioLoading} 
                       showSummary={true}
                       quantities={stockQuantities}
                       onQuantityChange={handleQuantityChange}
                     />
                  </div>
                )}
              </div>
            </section>

            {/* Section 2: Market Trends */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                   <div className="p-2 bg-orange-100 rounded-lg">
                      <Zap className="w-5 h-5 text-orange-600" />
                   </div>
                   <h2 className="text-xl font-bold text-slate-800">近三日台股市場熱門與話題股</h2>
                </div>
                <button 
                   onClick={handleFetchTrends}
                   disabled={trendLoading}
                   className="text-sm text-indigo-600 hover:text-indigo-800 font-medium self-end sm:self-auto"
                >
                   {trendLoading ? '掃描中...' : '重新掃描台股熱點'}
                </button>
              </div>

              <div className="bg-slate-50 p-1 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                 <StockTable 
                    stocks={trendStocks} 
                    loading={trendLoading} 
                    showSummary={true} 
                  />
              </div>
            </section>

          </div>
        )}

        {activeTab === TabView.RETIREMENT_PLANNING && (
          <div className="space-y-6 animate-fadeIn">
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
                <div className="flex items-center">
                   <div className="bg-amber-100 p-2 rounded-lg mr-4">
                      <Briefcase className="w-6 h-6 text-amber-600" />
                   </div>
                   <div>
                      <h2 className="text-lg font-bold text-slate-800">退休目標規劃師</h2>
                      <p className="text-sm text-slate-500">計算您的財務自由數字，並獲得優化建議</p>
                   </div>
                </div>
             </div>
             <RetirementCalc 
               portfolioStocks={portfolioStocks} 
               stockQuantities={stockQuantities}
               onQuantityChange={handleQuantityChange}
             />
          </div>
        )}
      </main>
      
      <footer className="bg-white border-t border-slate-200 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-xs">
          <p>© 2024 理財小教室 Finance Workshop. Data generated by AI for simulation purposes.</p>
          <p className="mt-1">投資一定有風險，基金投資有賺有賠。本工具僅供參考，不代表投資建議。</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
