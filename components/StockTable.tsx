import React, { useState } from 'react';
import { StockAnalysis } from '../types';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Calculator } from 'lucide-react';
import AnalysisChart from './AnalysisChart';

interface StockTableProps {
  stocks: StockAnalysis[];
  loading: boolean;
  title?: string;
  showSummary?: boolean;
  quantities?: Record<string, number>;
  onQuantityChange?: (symbol: string, qty: number) => void;
}

const StockTable: React.FC<StockTableProps> = ({ 
  stocks, 
  loading, 
  title, 
  showSummary = true,
  quantities,
  onQuantityChange
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (symbol: string) => {
    setExpandedId(expandedId === symbol ? null : symbol);
  };

  const getRecommendationBadge = (type: string) => {
    switch (type) {
      case 'BUY':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><TrendingUp className="w-3 h-3 mr-1" /> 建議加碼/買入</span>;
      case 'SELL':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800"><TrendingDown className="w-3 h-3 mr-1" /> 建議減碼/賣出</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800"><Minus className="w-3 h-3 mr-1" /> 續抱/觀望</span>;
    }
  };

  // Calculate Grand Total if quantities are provided
  const grandTotal = quantities ? stocks.reduce((sum, stock) => {
    const qty = quantities[stock.symbol] || 0;
    return sum + (stock.currentPrice * qty);
  }, 0) : 0;

  if (loading) {
    return (
      <div className="w-full p-8 flex flex-col justify-center items-center bg-white rounded-xl border border-slate-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
        <p className="text-sm text-slate-500">AI 分析運算中...</p>
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="text-center p-8 text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
        <p className="text-sm">尚無分析數據</p>
      </div>
    );
  }

  const buyList = stocks.filter(s => s.recommendation === 'BUY');
  const sellList = stocks.filter(s => s.recommendation === 'SELL');

  return (
    <div className="space-y-6">
      {title && <h3 className="text-lg font-bold text-slate-800">{title}</h3>}

      {/* Summary Cards */}
      {showSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
            <h3 className="text-base font-bold text-emerald-800 mb-2 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" /> 建議入手 / 加碼區
            </h3>
            {buyList.length > 0 ? (
              <ul className="space-y-2">
                {buyList.map(stock => (
                  <li key={stock.symbol} className="flex justify-between text-sm text-emerald-700 font-medium cursor-pointer hover:underline" onClick={() => toggleExpand(stock.symbol)}>
                    <span>{stock.name} ({stock.symbol})</span>
                    <span className="font-mono">目標: {stock.suggestBuyPrice}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-emerald-600/70 italic">此清單中無強烈買入建議</p>
            )}
          </div>

          <div className="bg-rose-50 rounded-xl p-5 border border-rose-100">
            <h3 className="text-base font-bold text-rose-800 mb-2 flex items-center">
              <TrendingDown className="w-4 h-4 mr-2" /> 建議獲利 / 減碼區
            </h3>
            {sellList.length > 0 ? (
              <ul className="space-y-2">
                {sellList.map(stock => (
                  <li key={stock.symbol} className="flex justify-between text-sm text-rose-700 font-medium cursor-pointer hover:underline" onClick={() => toggleExpand(stock.symbol)}>
                    <span>{stock.name} ({stock.symbol})</span>
                    <span className="font-mono">目標: {stock.suggestSellPrice}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-rose-600/70 italic">此清單中無強烈賣出建議</p>
            )}
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">標的</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">現價</th>
                {onQuantityChange && (
                   <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider bg-indigo-50/50">持有股數</th>
                )}
                {onQuantityChange && (
                   <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider bg-indigo-50/50">試算總值</th>
                )}
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">52週高/低</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider text-emerald-600 hidden sm:table-cell">建議買入</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider text-rose-600 hidden sm:table-cell">建議賣出</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">評級</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Expand</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {stocks.map((stock) => {
                const qty = quantities ? (quantities[stock.symbol] || 0) : 0;
                const totalVal = stock.currentPrice * qty;

                return (
                <React.Fragment key={stock.symbol}>
                  <tr 
                    onClick={(e) => {
                      // Prevent expand when clicking input
                      if ((e.target as HTMLElement).tagName !== 'INPUT') {
                        toggleExpand(stock.symbol);
                      }
                    }}
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${expandedId === stock.symbol ? 'bg-slate-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-bold text-slate-900">{stock.symbol}</div>
                          <div className="text-xs text-slate-500">{stock.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-slate-800 font-mono">
                      {stock.currentPrice}
                    </td>

                    {/* Quantity Input */}
                    {onQuantityChange && (
                      <td className="px-6 py-4 whitespace-nowrap text-right bg-indigo-50/20">
                         <input 
                           type="number" 
                           min="0"
                           placeholder="0"
                           value={qty || ''} 
                           onChange={(e) => onQuantityChange(stock.symbol, Number(e.target.value))}
                           onClick={(e) => e.stopPropagation()}
                           className="w-20 text-right p-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                         />
                      </td>
                    )}
                    {/* Total Value */}
                    {onQuantityChange && (
                      <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-sm font-medium text-slate-700 bg-indigo-50/20">
                         {totalVal > 0 ? totalVal.toLocaleString() : '-'}
                      </td>
                    )}

                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs text-slate-500 font-mono hidden lg:table-cell">
                      <span className="text-rose-600">{stock.high52Week}</span> / <span className="text-emerald-600">{stock.low52Week}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-emerald-600 font-mono hidden sm:table-cell">
                      {stock.suggestBuyPrice}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-rose-600 font-mono hidden sm:table-cell">
                      {stock.suggestSellPrice}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getRecommendationBadge(stock.recommendation)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {expandedId === stock.symbol ? (
                        <ChevronUp className="w-5 h-5 text-slate-400 inline" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 inline" />
                      )}
                    </td>
                  </tr>
                  
                  {/* Expanded Row */}
                  {expandedId === stock.symbol && (
                    <tr>
                      <td colSpan={onQuantityChange ? 10 : 8} className="px-0 py-0 border-b border-slate-200 bg-slate-50/50">
                        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
                          {/* Left: Chart */}
                          <div className="lg:col-span-1">
                            <AnalysisChart data={stock} />
                          </div>
                          
                          {/* Middle: Analysis */}
                          <div className="lg:col-span-2 space-y-4">
                             {/* Mobile Only: Show Price Details that are hidden in table */}
                             <div className="sm:hidden grid grid-cols-2 gap-2 text-sm bg-white p-3 rounded border border-slate-200">
                                <div className="flex justify-between"><span>買入目標:</span> <span className="font-mono font-bold text-emerald-600">{stock.suggestBuyPrice}</span></div>
                                <div className="flex justify-between"><span>賣出目標:</span> <span className="font-mono font-bold text-rose-600">{stock.suggestSellPrice}</span></div>
                                <div className="flex justify-between col-span-2 border-t pt-2 mt-1"><span>52W 高/低:</span> <span className="font-mono">{stock.high52Week} / {stock.low52Week}</span></div>
                             </div>

                            <div>
                              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">專業分析觀點</h4>
                              <p className="text-slate-700 leading-relaxed text-sm bg-white p-4 rounded-lg border border-slate-200">
                                {stock.analysis}
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <h5 className="text-xs font-bold text-blue-800 uppercase mb-1">長期預期年化收益</h5>
                                <p className="text-xl font-bold text-blue-700">{stock.projectedAnnualYield}</p>
                              </div>
                              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                <h5 className="text-xs font-bold text-purple-800 uppercase mb-1">操作範例</h5>
                                <p className="text-xs text-purple-900 leading-relaxed">
                                  {stock.exampleScenario}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )})}

              {/* Grand Total Row */}
              {onQuantityChange && stocks.length > 0 && (
                <tr className="bg-indigo-50 border-t-2 border-indigo-100">
                  <td colSpan={3} className="px-6 py-4 text-right font-bold text-indigo-900">
                    投資組合總市值
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-lg font-bold text-indigo-700">
                    ${grandTotal.toLocaleString()}
                  </td>
                  <td colSpan={6} className="hidden lg:table-cell"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockTable;
